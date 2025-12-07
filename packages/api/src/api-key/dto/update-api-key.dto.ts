import { PartialType } from '@nestjs/swagger';
import { CreateApiKeyDto } from './create-api-key.dto';

/**
 * Update an existing API key.
 */
export class UpdateApiKeyDto extends PartialType(CreateApiKeyDto) {}
