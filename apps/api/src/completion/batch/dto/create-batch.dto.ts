import { ApiProperty } from '@nestjs/swagger';
import { completionBatchRequestTypeValues } from '../entity/batch.entity';
import { PublicCompletionBatchRequestType } from '../../../storage/entities.generated';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { CompletionBatchCallbackOptionsDto } from './callback-options.dto';
import { Type } from 'class-transformer';
import { CapacityEntity } from '../../../capacity/capacity.entity';
import type { CompletionRequestDto } from '../../dto/completion-request.dto';

export class CreateCompletionBatchItemDto {
  @ApiProperty({
    description: 'The name of the resource this item references',
    example: 'openai-gpt4',
  })
  @IsString()
  @IsNotEmpty()
  resource: string;

  @ApiProperty({
    description:
      'The completion request payload (openai chat completion request payload)',
    type: Object,
  })
  @IsNotEmpty()
  request: CompletionRequestDto;
}

export class CreateCompletionBatchDto {
  @ApiProperty({
    description: 'The type of the batch request',
    enumName: 'CompletionBatchRequestType',
    enum: completionBatchRequestTypeValues,
    example: PublicCompletionBatchRequestType.ASYNC,
  })
  @IsEnum(PublicCompletionBatchRequestType)
  @IsNotEmpty()
  type: PublicCompletionBatchRequestType;

  @ApiProperty({
    description: 'The callback options for the batch request',
    type: CompletionBatchCallbackOptionsDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CompletionBatchCallbackOptionsDto)
  callbackOptions?: CompletionBatchCallbackOptionsDto | null;

  @ApiProperty({
    description: 'The capacities of the batch request',
    type: [CapacityEntity],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CapacityEntity)
  @IsOptional()
  capacity?: CapacityEntity[] | null;

  @ApiProperty({
    description: 'The items to create in the batch',
    type: [CreateCompletionBatchItemDto],
  })
  @ArrayMinSize(1)
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateCompletionBatchItemDto)
  items: CreateCompletionBatchItemDto[];
}
