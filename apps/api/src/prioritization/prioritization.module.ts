import { Module } from '@nestjs/common';
import { PrioritizationStorageRedisModule } from './storage/redis/prioritization-storage-redis.module';
import { AdaptiveTokenScalingStrategy } from './strategy';
import { PrioritizationService } from './prioritization.service';
import {
  RedisPrioritizationAllocationRepository,
  RedisPrioritizationMetricsRepository,
} from './storage/redis';
import {
  PRIORITIZATION_ALLOCATION_STORAGE,
  PRIORITIZATION_METRICS_STORAGE,
} from './consts';

@Module({
  imports: [PrioritizationStorageRedisModule],
  providers: [
    {
      provide: PRIORITIZATION_ALLOCATION_STORAGE,
      useClass: RedisPrioritizationAllocationRepository,
    },
    {
      provide: PRIORITIZATION_METRICS_STORAGE,
      useClass: RedisPrioritizationMetricsRepository,
    },
    AdaptiveTokenScalingStrategy,
    PrioritizationService,
  ],
  exports: [PrioritizationService],
})
export class PrioritizationModule {}
