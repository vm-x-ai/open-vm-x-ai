import { Module } from '@nestjs/common';
import { VaultModule } from '../vault/vault.module';
import { WorkspaceModule } from '../workspace/workspace.module';
import { AIConnectionService } from './ai-connection.service';
import { AIConnectionController } from './ai-connection.controller';

@Module({
  imports: [VaultModule, WorkspaceModule],
  controllers: [AIConnectionController],
  providers: [AIConnectionService],
  exports: [AIConnectionService],
})
export class AIConnectionModule {}
