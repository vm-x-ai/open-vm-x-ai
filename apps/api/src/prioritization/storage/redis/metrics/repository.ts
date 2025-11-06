import { format, subMilliseconds, addMinutes } from 'date-fns';
import { PrioritizationMetricsRepository } from '../../base';
import {
  PoolDefinitionEntity,
  PoolDefinitionEntry,
} from '../../../../pool-definition/entities/pool-definition.entity';
import { RedisClient } from '../../../../cache/redis-client';
import { Injectable } from '@nestjs/common';

@Injectable()
export class RedisPrioritizationMetricsRepository
  implements PrioritizationMetricsRepository
{
  constructor(private readonly redis: RedisClient) {}

  async getMinuteMetricByPool(
    requestTime: Date,
    connectionId: string,
    pool: PoolDefinitionEntry
  ): Promise<number> {
    const cacheKey = this.getConnectionUsageKey(connectionId, requestTime);
    const poolKey = `${cacheKey}:${pool.name}`;

    const totalTokens = await this.redis.client.get(`${poolKey}:tokens`);
    return totalTokens ? parseInt(totalTokens) : 0;
  }

  async getMinuteMetric(
    requestTime: Date,
    connectionId: string
  ): Promise<number> {
    const cacheKey = this.getConnectionUsageKey(connectionId, requestTime);
    const totalTokens = await this.redis.client.get(`${cacheKey}:tokens`);
    return totalTokens ? parseInt(totalTokens) : 0;
  }

  async getMetricByWindow(
    requestTime: Date,
    connectionId: string,
    window: number,
    pool: PoolDefinitionEntry
  ): Promise<number> {
    const begin = subMilliseconds(new Date(requestTime), window);
    const cacheKeys: string[] = [];

    let current = new Date(begin);
    while (
      format(current, 'yyyy-MM-dd-HH-mm') !==
      format(requestTime, 'yyyy-MM-dd-HH-mm')
    ) {
      cacheKeys.push(
        `${this.getConnectionUsageKey(connectionId, begin)}:${pool.name}`
      );
      current = addMinutes(begin, 1);
    }
    cacheKeys.push(
      `${this.getConnectionUsageKey(connectionId, requestTime)}:${pool.name}`
    );

    const results = await Promise.all(
      cacheKeys.map((key) =>
        this.redis.client.zrangebyscore(key, begin.getTime(), Date.now())
      )
    );

    return results
      .flat()
      .reduce((acc, metric) => acc + parseInt(metric.split('#')[1]), 0);
  }

  async getResourceMetricByWindow(
    requestTime: Date,
    connectionId: string,
    window: number,
    pool: PoolDefinitionEntity
  ): Promise<Record<string, number>> {
    const begin = subMilliseconds(requestTime, window);
    const cacheKeys: string[] = [];

    let current = new Date(begin);
    while (
      format(current, 'yyyy-MM-dd-HH-mm') !==
      format(requestTime, 'yyyy-MM-dd-HH-mm')
    ) {
      cacheKeys.push(
        `${this.getConnectionUsageKey(connectionId, begin)}:allpools`
      );
      current = addMinutes(begin, 1);
    }
    cacheKeys.push(
      `${this.getConnectionUsageKey(connectionId, requestTime)}:allpools`
    );

    const results = await Promise.all(
      cacheKeys.map((key) =>
        this.redis.client.zrangebyscore(key, begin.getTime(), Date.now())
      )
    );

    return results.flat().reduce(
      (acc, metric) => {
        const [pool, , tokens] = metric.split('#');
        acc[pool] = (acc[pool] || 0) + parseInt(tokens);
        return acc;
      },
      pool.definition.reduce((acc, pool) => {
        acc[pool.name] = 0;
        return acc;
      }, {} as Record<string, number>)
    );
  }

  async write(
    requestTime: Date,
    requestTokens: number,
    connectionId: string,
    pool: PoolDefinitionEntry
  ): Promise<void> {
    const connectionUsageKey = this.getConnectionUsageKey(
      connectionId,
      requestTime
    );
    const poolKey = `${connectionUsageKey}:${pool.name}`;
    const expireIn = 60 * 5;

    await Promise.all([
      this.redis.client
        .multi()
        .zadd(
          poolKey,
          requestTime.getTime(),
          `${requestTime.getTime()}#${requestTokens}`
        )
        .expire(poolKey, expireIn)
        .exec(),
      this.redis.client
        .multi()
        .zadd(
          connectionUsageKey,
          requestTime.getTime(),
          `${requestTime.getTime()}#${requestTokens}`
        )
        .expire(connectionUsageKey, expireIn)
        .exec(),
      this.redis.client
        .multi()
        .zadd(
          `${connectionUsageKey}:allpools`,
          requestTime.getTime(),
          `${pool.name}#${requestTime.getTime()}#${requestTokens}`
        )
        .expire(`${connectionUsageKey}:allpools`, expireIn)
        .exec(),
      this.redis.client
        .multi()
        .incrby(`${connectionUsageKey}:tokens`, requestTokens)
        .expire(`${connectionUsageKey}:tokens`, expireIn)
        .exec(),
      this.redis.client
        .multi()
        .incrby(`${poolKey}:tokens`, requestTokens)
        .expire(`${poolKey}:tokens`, expireIn)
        .exec(),
    ]);
  }

  private getConnectionUsageKey(connectionId: string, time: Date) {
    return `ai-connection-usage:${connectionId}:${format(
      time,
      'yyyy-MM-dd-HH-mm'
    )}`;
  }
}
