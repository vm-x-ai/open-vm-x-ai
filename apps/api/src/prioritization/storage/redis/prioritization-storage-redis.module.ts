import { Module } from '@nestjs/common';
import { RedisPrioritizationAllocationRepository } from './allocation/repository';
import { RedisPrioritizationMetricsRepository } from './metrics/repository';

@Module({
  imports: [],
  providers: [
    RedisPrioritizationAllocationRepository,
    RedisPrioritizationMetricsRepository,
  ],
  exports: [
    RedisPrioritizationAllocationRepository,
    RedisPrioritizationMetricsRepository,
  ],
})
export class PrioritizationStorageRedisModule {}
