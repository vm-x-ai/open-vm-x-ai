import { HttpStatus, Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { RedisClient } from '../cache/redis-client';
import { PoolDefinitionService } from '../pool-definition/pool-definition.service';
import { CapacityService } from '../capacity/capacity.service';
import { PrioritizationService } from '../prioritization/prioritization.service';
import {
  CapacityDimension,
  CapacityEntity,
  CapacityPeriod,
} from '../capacity/capacity.entity';
import { FastifyRequest } from 'fastify';
import { AIResourceEntity } from '../ai-resource/entities/ai-resource.entity';
import { AIResourceModelConfigEntity } from '../ai-resource/common/model.entity';
import { AIConnectionEntity } from '../ai-connection/entities/ai-connection.entity';
import { CompletionObservableData, CompletionProvider } from '../ai-provider/ai-provider.types';
import { ApiKeyEntity } from '../api-key/entities/api-key.entity';
import { ChatCompletionCreateParams } from 'openai/resources/index.js';
import { TokenService } from '../token/token.service';
import { CompletionError } from './completion.types';

export type EvaluatedCapacity = {
  period: CapacityPeriod;
  keyPrefix: string;
};

@Injectable()
export class GateService {
  constructor(
    private readonly logger: PinoLogger,
    private readonly redisClient: RedisClient,
    private readonly poolDefinitionService: PoolDefinitionService,
    private readonly capacityService: CapacityService,
    private readonly prioritizationService: PrioritizationService,
    private readonly tokenService: TokenService
  ) {}

  public async requestGate(
    request: FastifyRequest,
    workspaceId: string,
    environmentId: string,
    payload: ChatCompletionCreateParams,
    resource: AIResourceEntity,
    model: AIResourceModelConfigEntity,
    aiConnection: AIConnectionEntity,
    provider: CompletionProvider,
    apiKey?: ApiKeyEntity
  ): Promise<EvaluatedCapacity[]> {
    const requestTokens = await this.tokenService.getRequestTokens(payload);
    const requestTime = new Date();

    this.logger.debug('Resource config', {
      resource,
      model,
    });

    const { enabledCapacities, connectionCapacities } =
      this.capacityService.resolve(
        workspaceId,
        environmentId,
        aiConnection,
        resource,
        request,
        apiKey
      );

    const startCheckCapacity = Date.now();
    const [poolDefinition, usageMetricsMap] = await Promise.all([
      this.poolDefinitionService.getById(
        workspaceId,
        environmentId,
        false
      ),
      this.capacityService.getUsage(requestTime, enabledCapacities),
    ]);

    const uniqPeriods = [
      ...new Set(
        enabledCapacities.map(
          ({ capacity, keyPrefix }) => `${capacity.period}##${keyPrefix}`
        )
      ),
    ].map((key) => ({
      period: key.split('##')[0] as CapacityPeriod,
      keyPrefix: key.split('##')[1],
    }));

    enabledCapacities.forEach(({ capacity, source, dimensionValue }) =>
      this.checkRequestCapacity(
        capacity,
        source,
        usageMetricsMap[capacity.period].totalRequests,
        usageMetricsMap[capacity.period].usedTokens,
        requestTokens,
        usageMetricsMap[capacity.period].remainingSeconds,
        dimensionValue
      )
    );
    this.logger.info(
      {
        duration: Date.now() - startCheckCapacity,
      },
      'Check capacity duration'
    );

    const pool = poolDefinition?.definition?.find((pool) =>
      pool.resources.includes(resource.resource)
    );
    const connectionMinuteCapacity = connectionCapacities.find(
      (capacity) =>
        capacity.period === CapacityPeriod.MINUTE && capacity.enabled
    );

    if (pool && connectionMinuteCapacity) {
      const prioritizationStartAt = Date.now();
      this.logger.info(
        {
          request,
          prioritizationAlgorithm: 'adaptive-token-scaling',
        },
        'Checking prioritization gate'
      );

      const { allowed, reason } = await this.prioritizationService.gate(
        poolDefinition,
        requestTime,
        requestTokens,
        resource.resource,
        aiConnection
      );
      this.logger.info(
        {
          duration: Date.now() - prioritizationStartAt,
        },
        'Prioritization gate duration'
      );

      if (!allowed) {
        throw new CompletionError({
          rate: true,
          message: reason,
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          retryable: true,
          failureReason: 'Denied by prioritization gate',
          openAICompatibleError: {
            code: 'prioritization_gate_denied',
          },
        });
      }
    } else {
      this.logger.info(
        {
          request,
          pool,
          connectionMinuteCapacity,
        },
        'No prioritization gate for the request'
      );
    }

    const increaseRpmTpmCountersStartAt = Date.now();

    const discoveredCapacity =
      aiConnection.discoveredCapacity?.models[model.model];

    const capacities = [
      ...uniqPeriods,
      ...(discoveredCapacity?.capacity?.map((capacity) => ({
        period: capacity.period,
        source: 'discovered',
        keyPrefix: this.capacityService.getResourceKeyPrefix(
          workspaceId,
          environmentId,
          resource.resource,
          aiConnection.connectionId
        ),
      })) ?? []),
    ];

    await Promise.all([
      capacities.map(async ({ period, keyPrefix }) => {
        const key = `${keyPrefix}${period}`;
        await this.increaseRpmTpmCounters(
          key,
          usageMetricsMap[period].remainingSeconds,
          requestTokens
        );
      }),
    ]);

    this.logger.info(
      {
        duration: Date.now() - increaseRpmTpmCountersStartAt,
      },
      'Increase RPM TPM counters duration'
    );

    return capacities;
  }

  public async increaseTokenResponseUsage(
    evaluatedCapacities: EvaluatedCapacity[],
    response: CompletionObservableData,
  ) {
    await Promise.all(
      evaluatedCapacities.map(async ({ keyPrefix, period }) => {
        const key = `${keyPrefix}${period}`;
        const completionTokens = response.data.usage?.completion_tokens ?? 0;
        if (completionTokens === 0) {
          return;
        }
        await this.redisClient.client.incrby(`${key}:tokens`, completionTokens);
      })
    );
  }

  private async increaseRpmTpmCounters(
    keyPrefix: string,
    remainingSeconds: number,
    tokens: number
  ) {
    // TODO: add local counter to avoid write throughput issue
    const operation = this.redisClient.client
      .multi()
      .incr(`${keyPrefix}:requests`)
      .incrby(`${keyPrefix}:tokens`, tokens);

    if (remainingSeconds > 0) {
      operation
        .expire(`${keyPrefix}:requests`, remainingSeconds - 1)
        .expire(`${keyPrefix}:tokens`, remainingSeconds - 1);
    }

    console.log('operation', keyPrefix, tokens);

    await operation.exec();
  }

  private checkRequestCapacity(
    capacity: CapacityEntity,
    capacityResource: string,
    totalRequests: number,
    usedTokens: number,
    requestTokens: number,
    remainingSeconds: number,
    capacityDimensionValue?: string
  ) {
    let prefixMessage = 'Resource';
    if (capacity.dimension && capacityDimensionValue) {
      switch (capacity.dimension) {
        case CapacityDimension.SOURCE_IP:
          prefixMessage = `Source IP ${capacityDimensionValue}`;
          break;
      }
    }

    const capacityRequests = capacity.requests ?? 0;
    if (capacityRequests > 0 && totalRequests > capacityRequests) {
      throw new CompletionError({
        rate: true,
        message: `${prefixMessage} has reached the limit of requests, limit: ${capacity.requests} at ${capacityResource} level by ${capacity.period}`,
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        retryable: true,
        retryDelay: remainingSeconds > 0 ? remainingSeconds * 1000 : undefined,
        failureReason: `${capacityResource}: Resource has reached the limit of requests`,
        openAICompatibleError: {
          code: 'resource_exhausted',
        },
      });
    }

    const totalTokens = usedTokens + requestTokens;
    const capacityTokens = capacity.tokens ?? 0;
    if (capacityTokens > 0 && totalTokens > capacityTokens) {
      throw new CompletionError({
        rate: true,
        message: `${prefixMessage} has reached the limit of tokens, limit: ${capacity.tokens} at ${capacityResource} level by ${capacity.period}`,
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        retryable: true,
        retryDelay: remainingSeconds > 0 ? remainingSeconds * 1000 : undefined,
        failureReason: `${capacityResource}: Resource has reached the limit of tokens`,
        openAICompatibleError: {
          code: 'resource_exhausted',
        },
      });
    }

    this.logger.info(
      {
        totalRequests,
        totalTokens,
      },
      'Resource usage'
    );
  }
}
