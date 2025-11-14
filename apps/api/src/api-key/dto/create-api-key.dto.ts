import { OmitType } from '@nestjs/swagger';
import { ApiKeyEntity } from '../entities/api-key.entity';

/**
 * Create a new API key.
 */
export class CreateApiKeyDto extends OmitType(ApiKeyEntity, [
  'apiKeyId',
  'workspaceId',
  'environmentId',
  'maskedKey',
  'createdAt',
  'updatedAt',
  'createdBy',
  'updatedBy',
  'createdByUser',
  'updatedByUser',
]) {}
