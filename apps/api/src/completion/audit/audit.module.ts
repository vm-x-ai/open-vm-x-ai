import { Module } from '@nestjs/common';
import { CompletionAuditService } from './audit.service';
import { CompletionAuditController } from './audit.controller';

@Module({
  imports: [],
  controllers: [CompletionAuditController],
  providers: [CompletionAuditService],
  exports: [CompletionAuditService],
})
export class CompletionAuditModule {}
