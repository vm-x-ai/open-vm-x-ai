import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsObject, IsOptional, IsString } from 'class-validator';
import { CapacityEntity } from '../../capacity/capacity.entity';
import { Type } from 'class-transformer';

/**
 * Update an existing AI connection.
 */
export class UpdateAIConnectionDto {
  @ApiProperty({
    description: 'The name of the AI connection',
    example: 'openai',
    required: false,
    nullable: true,
    type: 'string',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'The description of the AI connection',
    example: 'This is my OpenAI connection',
    required: false,
    nullable: true,
    type: 'string',
  })
  @IsString()
  @IsOptional()
  description?: string | null;

  @ApiProperty({
    description: 'The provider of the AI connection',
    example: 'openai',
    required: false,
    nullable: true,
    type: 'string',
  })
  @IsString()
  @IsOptional()
  provider?: string;

  @ApiProperty({
    description: 'The allowed models of the AI connection',
    example: ['gpt-4o', 'gpt-4o-mini'],
    required: false,
    nullable: true,
    type: 'array',
    items: {
      type: 'string',
      example: 'gpt-4o',
    },
  })
  @IsArray()
  @IsOptional()
  allowedModels?: string[] | null;

  @ApiProperty({
    description: 'The capacities of the AI connection (JSON array)',
    type: [CapacityEntity],
    required: false,
    nullable: true,
  })
  @IsArray()
  @Type(() => CapacityEntity)
  @IsOptional()
  capacity?: CapacityEntity[] | null;

  @ApiProperty({
    description: 'The configuration of the AI connection (JSON object)',
    type: Object,
    required: false,
    nullable: true,
  })
  @IsObject()
  @IsOptional()
  config?: Record<string, unknown> | null;
}
