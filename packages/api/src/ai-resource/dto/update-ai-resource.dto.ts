import { PartialType } from '@nestjs/swagger';
import { CreateAIResourceDto } from './create-ai-resource.dto';

/**
 * Update an existing AI resource.
 */
export class UpdateAIResourceDto extends PartialType(CreateAIResourceDto) {}
