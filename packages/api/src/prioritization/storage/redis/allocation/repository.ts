import {
  PoolWorkloadAllocation,
  PrioritizationAllocationRepository,
} from '../../base';
import { AIConnectionEntity } from '../../../../ai-connection/entities/ai-connection.entity';
import { Injectable } from '@nestjs/common';
import { RedisClient } from '../../../../cache/redis-client';

@Injectable()
export class RedisPrioritizationAllocationRepository
  implements PrioritizationAllocationRepository
{
  constructor(private readonly redis: RedisClient) {}

  async get({
    connectionId,
  }: AIConnectionEntity): Promise<PoolWorkloadAllocation | undefined> {
    const cacheKey = this.getAllocationKey(connectionId);
    const allocation = await this.redis.client.get(cacheKey);
    return allocation ? JSON.parse(allocation) : undefined;
  }

  async write(
    { connectionId }: AIConnectionEntity,
    allocation: PoolWorkloadAllocation
  ): Promise<void> {
    const cacheKey = this.getAllocationKey(connectionId);

    await this.redis.client.set(
      cacheKey,
      JSON.stringify(allocation),
      'EX',
      60 * 5
    ); // 5 minutes
  }

  private getAllocationKey(connectionId: string) {
    return `allocation:${connectionId}`;
  }
}
