import { Module } from '@nestjs/common';
import { CompletionService } from './completion.service';
import { WorkspaceModule } from '../workspace/workspace.module';
import { AIProviderModule } from '../ai-provider/ai-provider.module';
import { AIResourceModule } from '../ai-resource/ai-resource.module';
import { AIConnectionModule } from '../ai-connection/ai-connection.module';
import { CompletionController } from './completion.controller';
import { ApiKeyModule } from '../api-key/api-key.module';
import { CapacityModule } from '../capacity/capacity.module';
import { PrioritizationModule } from '../prioritization/prioritization.module';
import { TokenModule } from '../token/token.module';
import { ResourceRoutingService } from './routing.service';
import { GateService } from './gate.service';
import { PoolDefinitionModule } from '../pool-definition/pool-definition.module';
import { CompletionMetricsModule } from './metrics/metrics.module';
import { CompletionAuditModule } from './audit/audit.module';
import { CompletionUsageModule } from './usage/usage.module';

@Module({
  imports: [
    WorkspaceModule,
    AIProviderModule,
    AIConnectionModule,
    AIResourceModule,
    ApiKeyModule,
    CapacityModule,
    PoolDefinitionModule,
    PrioritizationModule,
    TokenModule,
    CompletionMetricsModule,
    CompletionAuditModule,
    CompletionUsageModule,
  ],
  controllers: [CompletionController],
  providers: [CompletionService, GateService, ResourceRoutingService],
  exports: [CompletionService],
})
export class CompletionModule {}
