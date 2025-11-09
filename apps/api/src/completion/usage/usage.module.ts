import { Module } from '@nestjs/common';
import { QuestDBModule } from './questdb/questdb.module';
import { COMPLETION_USAGE_PROVIDER } from './usage.types';
import { QuestDBCompletionUsageProvider } from './questdb/questdb.provider';
import { CompletionUsageService } from './usage.service';
import { CompletionUsageController } from './usage.controller';
import { WorkspaceModule } from '../../workspace/workspace.module';

@Module({
  imports: [QuestDBModule, WorkspaceModule],
  controllers: [CompletionUsageController],
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
