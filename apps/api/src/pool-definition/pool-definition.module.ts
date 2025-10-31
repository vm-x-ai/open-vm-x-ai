import { Module } from '@nestjs/common';
import { PoolDefinitionService } from './pool-definition.service';
import { PoolDefinitionController } from './pool-definition.controller';
import { WorkspaceModule } from '../workspace/workspace.module';

@Module({
  imports: [WorkspaceModule],
  controllers: [PoolDefinitionController],
  providers: [PoolDefinitionService],
  exports: [PoolDefinitionService],
})
export class PoolDefinitionModule {}
