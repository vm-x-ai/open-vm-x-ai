import { Module } from '@nestjs/common';
import { QuestDBModule } from './questdb/questdb.module';
import { COMPLETION_USAGE_PROVIDER } from './usage.types';
import { QuestDBCompletionUsageProvider } from './questdb/questdb.provider';
import { CompletionUsageService } from './usage.service';

@Module({
  imports: [QuestDBModule],
  controllers: [],
  providers: [
    {
      provide: COMPLETION_USAGE_PROVIDER,
      useExisting: QuestDBCompletionUsageProvider,
    },
    CompletionUsageService,
  ],
  exports: [CompletionUsageService],
})
export class CompletionUsageModule {}
