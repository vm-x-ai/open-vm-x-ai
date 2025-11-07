import { Inject, Injectable } from '@nestjs/common';
import {
  COMPLETION_USAGE_PROVIDER,
  type CompletionUsageProvider,
} from './usage.types';
import { CompletionUsageDto } from './dto/completion-usage.dto';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PinoLogger } from 'nestjs-pino';

type BufferItem = {
  payload: CompletionUsageDto;
  attempts?: number;
};

@Injectable()
export class CompletionUsageService {
  private buffer: BufferItem[] = [];
  private flushing = false;

  constructor(
    private readonly logger: PinoLogger,
    @Inject(COMPLETION_USAGE_PROVIDER)
    private readonly completionUsageProvider: CompletionUsageProvider
  ) {}

  push(payload: CompletionUsageDto): void {
    this.buffer.push({ payload });
    if (this.buffer.length >= 100) {
      this.flush();
    }
  }

  @Cron(CronExpression.EVERY_10_SECONDS, { name: 'completion-usage-flush' })
  public async flush() {
    if (this.buffer.length === 0 || this.flushing) {
      return;
    }
    const bufferLength = this.buffer.length;
    const transit = [...this.buffer];
    this.flushing = true;
    try {
      await this.completionUsageProvider.push(
        ...transit.map(({ payload }) => payload)
      );

      this.logger.info(`Flushed ${transit.length} items`);
      this.buffer.splice(0, bufferLength);
    } catch (error) {
      this.logger.error(`Failed to flush completion usage: ${error}`);
      this.buffer.splice(0, bufferLength);
      const dropItems = transit.filter(
        (item) => item.attempts && item.attempts > 3
      );
      this.logger.error(`Dropped ${dropItems.length} items`);
      const retryItems = transit.filter(
        (item) => item.attempts && item.attempts <= 3
      );
      this.buffer.push(
        ...retryItems.map((item) => ({
          ...item,
          attempts: (item.attempts || 0) + 1,
        }))
      );
      this.logger.error(`Pushed ${retryItems.length} items back to buffer`);
      this.logger.error(`Buffer now has ${this.buffer.length} items`);
    } finally {
      this.flushing = false;
    }
  }
}
