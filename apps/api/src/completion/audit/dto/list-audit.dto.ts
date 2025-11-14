import { ApiProperty } from '@nestjs/swagger';
import { PublicCompletionAuditType } from '../../../storage/entities.generated';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { completionAuditTypes } from '../entities/audit.entity';
import { Type } from 'class-transformer';

export class ListAuditQueryDto {
  @ApiProperty({
    name: 'type',
    enumName: 'CompletionAuditType',
    enum: completionAuditTypes,
    description: 'The type of audit to list',
    example: PublicCompletionAuditType.COMPLETION,
  })
  @IsEnum(PublicCompletionAuditType)
  @IsOptional()
  type?: PublicCompletionAuditType | null;

  @ApiProperty({
    type: 'string',
    required: false,
    description: 'The connection ID to list audits for',
    example: 'connection-identifier',
    format: 'uuid'
  })
  @IsUUID('4')
  @IsOptional()
  connectionId?: string | null;

  @ApiProperty({
    type: 'string',
    required: false,
    description: 'The resource to list audits for',
    example: 'resource-identifier',
  })
  @IsString()
  @IsOptional()
  resource?: string | null;

  @ApiProperty({
    type: 'string',
    required: false,
    description: 'The model to list audits for',
    example: 'gpt-4o',
  })
  @IsString()
  @IsOptional()
  model?: string | null;

  @ApiProperty({
    type: 'number',
    required: false,
    description: 'The status code to list audits for',
    example: 200,
  })
  @IsNumber()
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  statusCode?: number | null;

  @ApiProperty({
    type: 'string',
    required: false,
    format: 'date-time',
    description: 'The start date to list audits for',
    example: '2021-01-01',
  })
  @IsDateString()
  @IsOptional()
  startDate?: Date | null;

  @ApiProperty({
    type: 'string',
    required: false,
    format: 'date-time',
    description: 'The end date to list audits for',
    example: '2021-01-01',
  })
  @IsDateString()
  @IsOptional()
  endDate?: Date | null;
}
