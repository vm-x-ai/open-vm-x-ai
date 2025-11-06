import dedent from 'string-dedent';
import type {
  PoolWorkloadAllocation,
  PrioritizationAllocationRepository,
  PrioritizationMetricsRepository,
} from '../storage/base';
import { BasePriorizationStrategy } from './base';
import type { GateOutput, PriorizationStrategy } from './base/types';
import { AIConnectionEntity } from '../../ai-connection/entities/ai-connection.entity';
import { CapacityPeriod } from '../../capacity/capacity.entity';
import { PoolDefinitionEntity } from '../../pool-definition/entities/pool-definition.entity';
import { Inject, Injectable } from '@nestjs/common';
import {
  PRIORITIZATION_ALLOCATION_STORAGE,
  PRIORITIZATION_METRICS_STORAGE,
} from '../consts';

/**
 * The windowSize is the amount of time to get the used tokens.
 * The scaleUp is the percentage of the current allocation to scale up.
 *
 * The algorithm will check if the current allocation is getting close to the scaleUp percentage,
 * if it is, it will check if the current allocation is not equal to the max allocation.
 *
 * If the current available capacity is already full, it will scale down the less priority pools,
 * unless the min allocation for all the pools sums to 100%.
 *
 * To scale down, there is a cooldown value to avoid scaling up and down too fast.
 *
 * The windowSize and scaleUp values must be configured according to each other.
 *
 * low windowSize and high scaleUp
 *  -> means that the algorithm will only respond well for fast peaks,
 *     because it needs a good amount of used tokens in a short period of time.
 *
 * high windowSize and low scaleUp
 *  -> means that the algorithm will scale up faster even for small peaks, since it will consider a longer period of time.
 *
 * low windowSize and low scaleUp
 *  -> this is ideal for faster scale up, but it could bad for inconstant peaks, since it only considers a short period of time.
 *
 * high windowSize and high scaleUp
 *  -> this is ideal for must scenarios, since it consider a higher period of time,
 *     so, even if the traffic goes down for a couple of seconds, it will not scale down.
 */
const cooldown = 5 * 1000; // 5s
const windowSize = 30 * 1000; // 60s window of time to get the used tokens
const scaleUp = 50; // 50% of the capacity to scale up

@Injectable()
export class AdaptiveTokenScalingStrategy
  extends BasePriorizationStrategy
  implements PriorizationStrategy
{
  constructor(
    @Inject(PRIORITIZATION_METRICS_STORAGE)
    private readonly metricsRepo: PrioritizationMetricsRepository,
    @Inject(PRIORITIZATION_ALLOCATION_STORAGE)
    private readonly allocationRepo: PrioritizationAllocationRepository
  ) {
    super();
  }

  override async gate(
    pool: PoolDefinitionEntity,
    requestTime: Date,
    requestTokens: number,
    resource: string,
    connection: AIConnectionEntity
  ): Promise<GateOutput> {
    const resourcePool = this.getResourcePool(pool, resource);
    if (!resourcePool) {
      throw new Error('No resource pool found');
    }

    const [minuteTokensByPool, resourceWindowTokens, rawAllocation] =
      await Promise.all([
        this.metricsRepo.getMinuteMetricByPool(
          requestTime,
          connection.connectionId,
          resourcePool
        ),
        this.metricsRepo.getResourceMetricByWindow(
          requestTime,
          connection.connectionId,
          windowSize,
          pool
        ),
        this.allocationRepo.get(connection),
      ]);

    const allocation =
      rawAllocation ||
      pool.definition.reduce((acc, pool) => {
        acc[pool.name] = {
          min: pool.minReservation,
          max: pool.maxReservation,
          current: pool.minReservation,
        };

        return acc;
      }, {} as PoolWorkloadAllocation);

    const poolsRank = pool.definition.map((pool) => pool.name);
    const availableCapacity = this.getAvailableCapacity(allocation);
    const capacityPlan = connection.capacity?.find(
      (capacity) => capacity.period === CapacityPeriod.MINUTE
    );
    if (!capacityPlan) {
      throw new Error('No capacity plan found');
    }

    for (const poolName of poolsRank) {
      const allocationPool = allocation[poolName];
      const windowTokens = resourceWindowTokens[poolName];

      const consumedTokens =
        (capacityPlan.tokens ?? 0) * (allocationPool.current / 100);
      const scaleUpThreshold = consumedTokens * (scaleUp / 100);
      if (windowTokens > scaleUpThreshold) {
        const windowPercent = (windowTokens / (capacityPlan.tokens ?? 0)) * 100;
        const scaleUpValue = Math.min(
          windowPercent,
          allocationPool.max - allocationPool.current
        );

        if (scaleUpValue > 0) {
          if (scaleUpValue > availableCapacity) {
            for (const pool of poolsRank.slice(
              poolsRank.indexOf(poolName) + 1
            )) {
              if (allocation[pool].current > allocation[pool].min) {
                const scaleDownValue = Math.max(
                  allocation[pool].min,
                  allocation[pool].current - (scaleUpValue - availableCapacity)
                );

                allocation[pool].current = scaleDownValue;
                allocation[pool].scaleAction = 'down';
                allocation[pool].scaleActionAt = requestTime.getTime();
                allocation[
                  pool
                ].scaleDescription = `Pool ${poolName} is scaling up`;
              }
            }
          }

          const scaleUpAvailableValue = Math.min(
            scaleUpValue,
            this.getAvailableCapacity(allocation)
          );
          if (scaleUpAvailableValue > 0) {
            allocationPool.current += scaleUpAvailableValue;
            allocationPool.scaleActionAt = requestTime.getTime();
            allocationPool.scaleAction = 'up';
            allocationPool.scaleDescription = `Window tokens: ${windowTokens}, Scale up threshold: ${scaleUpThreshold}, consumed ${consumedTokens}, added ${scaleUpAvailableValue}%`;
          }
        }
      }

      const shouldScaleDown =
        (capacityPlan.tokens ?? 0) * (allocationPool.current / 100) >
          windowTokens &&
        allocationPool.current > allocationPool.min &&
        allocationPool.scaleAction === 'up' &&
        requestTime.getTime() - (allocationPool.scaleActionAt || 0) > cooldown;

      if (shouldScaleDown) {
        const windowPercent = (windowTokens / (capacityPlan.tokens ?? 0)) * 100;

        const scaleDownValue = Math.max(
          windowPercent > allocationPool.max ? 0 : windowPercent,
          allocationPool.min
        );

        allocationPool.current = scaleDownValue;
        allocationPool.scaleActionAt = requestTime.getTime();
        allocationPool.scaleAction = 'down';
        allocationPool.scaleDescription = `Not using enough tokens, window tokens: ${windowTokens}, consumed ${
          (capacityPlan.tokens ?? 0) * (allocationPool.current / 100)
        }`;
      }
    }

    if (
      minuteTokensByPool >
      (capacityPlan.tokens ?? 0) * (allocation[resourcePool.name].current / 100)
    ) {
      return {
        allowed: false,
        allocation,
        reason: dedent`
        Resource is configured to ${
          resourcePool.name
        } pool and it can't go over ${
          allocation[resourcePool.name].current
        }% (${capacityPlan.tokens} tokens)

        Current allocation:
        ${Object.entries(allocation)
          .map(
            ([poolName, pool]) =>
              `${poolName}: Min - ${pool.min}%, Current - ${pool.current}%, Max - ${pool.max}%` +
              (poolName === resourcePool.name ? " <- Resource's pool" : '')
          )
          .join('\n')}
        `,
      };
    }

    await Promise.all([
      this.metricsRepo.write(
        requestTime,
        requestTokens,
        connection.connectionId,
        resourcePool
      ),
      this.allocationRepo.write(connection, allocation),
    ]);

    return { allowed: true, allocation };
  }

  private getAvailableCapacity(allocation: PoolWorkloadAllocation) {
    return (
      100 -
      Object.values(allocation).reduce((acc, pool) => acc + pool.current, 0)
    );
  }
}
