import { ApiProperty } from '@nestjs/swagger';
import { CompletionBatchItemEntity } from '../entity/batch-item.entity';
import { CompletionBatchEntity } from '../entity/batch.entity';
import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OmitType } from '@nestjs/mapped-types';

export class CompletionBatchItemRelationDto extends OmitType(
  CompletionBatchItemEntity,
  ['createdAt', 'completedAt']
) {
  @ApiProperty({
    description: 'The date and time the batch item was created',
    example: '2021-01-01T00:00:00.000Z',
  })
  @IsDateString()
  @IsNotEmpty()
  createdAt: string;

  @ApiProperty({
    description: 'The date and time the batch item was completed',
    example: '2021-01-01T00:00:00.000Z',
  })
  @IsDateString()
  @IsOptional()
  completedAt?: string | null;
}

export class CompletionBatchDto extends CompletionBatchEntity {
  @ApiProperty({
    description: 'The items in the batch',
    type: [CompletionBatchItemRelationDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CompletionBatchItemRelationDto)
  items?: Array<
    CompletionBatchItemRelationDto | CompletionBatchItemEntity
  > | null;

  @ApiProperty({
    description: 'The completed percentage of the batch request',
    example: 50,
  })
  @IsOptional()
  @IsNumber()
  completedPercentage?: number | null;
}
