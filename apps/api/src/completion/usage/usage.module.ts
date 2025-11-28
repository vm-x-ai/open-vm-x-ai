import { Module } from '@nestjs/common';
import { QuestDBModule } from './questdb/questdb.module';
import { COMPLETION_USAGE_PROVIDER } from './usage.types';
import { QuestDBCompletionUsageProvider } from './questdb/questdb.provider';
import { CompletionUsageService } from './usage.service';
import { CompletionUsageController } from './usage.controller';
import { WorkspaceModule } from '../../workspace/workspace.module';
import { AIConnectionModule } from '../../ai-connection/ai-connection.module';
import { AIProviderModule } from '../../ai-provider/ai-provider.module';
import { ApiKeyModule } from '../../api-key/api-key.module';
import { EnvironmentModule } from '../../environment/environment.module';
import { AIResourceModule } from '../../ai-resource/ai-resource.module';
import { UsersModule } from '../../users/users.module';

@Module({
  imports: [
    QuestDBModule,
    WorkspaceModule,
    EnvironmentModule,
    AIResourceModule,
    AIConnectionModule,
    AIProviderModule,
    ApiKeyModule,
    UsersModule,
  ],
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
