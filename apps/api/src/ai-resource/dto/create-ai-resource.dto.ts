import { OmitType } from '@nestjs/swagger';
import { AIResourceEntity } from '../entities/ai-resource.entity';

/**
 * Create a new AI resource.
 */
export class CreateAIResourceDto extends OmitType(AIResourceEntity, [
  'workspaceId',
  'environmentId',
  'createdAt',
  'updatedAt',
  'createdBy',
  'createdByUser',
  'updatedBy',
  'updatedByUser',
]) {}
