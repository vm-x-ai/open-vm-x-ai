import { Module } from '@nestjs/common';
import { CompletionAuditService } from './audit.service';
import { CompletionAuditController } from './audit.controller';
import { WorkspaceModule } from '../../workspace/workspace.module';

@Module({
  imports: [WorkspaceModule],
  controllers: [CompletionAuditController],
  providers: [CompletionAuditService],
  exports: [CompletionAuditService],
})
export class CompletionAuditModule {}
