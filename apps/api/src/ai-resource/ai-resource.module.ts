import { Module } from '@nestjs/common';
import { AIResourceService } from './ai-resource.service';
import { AIResourceController } from './ai-resource.controller';
import { WorkspaceModule } from '../workspace/workspace.module';

@Module({
  imports: [WorkspaceModule],
  controllers: [AIResourceController],
  providers: [AIResourceService],
  exports: [AIResourceService],
})
export class AIResourceModule {}
