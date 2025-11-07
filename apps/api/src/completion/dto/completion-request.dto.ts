import { ApiProperty } from '@nestjs/swagger';
import {
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ChatCompletionCreateParams } from 'openai/resources/index.js';
import { CreateAIResourceDto } from '../../ai-resource/dto/create-ai-resource.dto';
import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';

export class ExtraCompletionRequestDto {
  @ApiProperty({
    description: 'The correlation ID for tracing requests',
    example: 'corr-abc-123',
  })
  @IsString()
  @IsOptional()
  correlationId?: string | null;

  @ApiProperty({
    description: 'The index of the secondary model to use',
    example: 0,
  })
  @IsNumber()
  @IsOptional()
  secondaryModelIndex?: number | null;

  @ApiProperty({
    description: 'The resource config overrides',
    example: {
      model: {
        provider: 'openai',
        model: 'gpt-4o',
        connectionId: 'conn-abc-123',
      },
    },
  })
  @ValidateNested()
  @Type(() => PartialType(CreateAIResourceDto))
  resourceConfigOverrides?: Partial<CreateAIResourceDto> | null;
}

export class CompletionRequestPayloadDto {
  @ApiProperty({
    description: 'The extra request data',
    type: ExtraCompletionRequestDto,
  })
  @ValidateNested()
  @Type(() => ExtraCompletionRequestDto)
  @IsOptional()
  extra?: ExtraCompletionRequestDto | null;
}

export type CompletionRequestDto = ChatCompletionCreateParams &
  CompletionRequestPayloadDto;
