import { Logger, Module } from '@nestjs/common';
import { MetricsController } from './metrics.controller';
import { MetricsService } from './metrics.service';

@Module({
  imports: [],
  controllers: [MetricsController],
  providers: [Logger, MetricsService],
  exports: [MetricsService],
})
export class MetricsModule {}
