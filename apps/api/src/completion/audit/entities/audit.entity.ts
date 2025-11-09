import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PublicCompletionAuditType } from '../../../storage/entities.generated';
import { $enum } from 'ts-enum-util';
import type {
  CompletionHeaders,
  CompletionResponseData,
} from '../../../ai-provider/ai-provider.types';

export const completionAuditTypes = $enum(PublicCompletionAuditType).getKeys();

export enum CompletionAuditEventType {
  FALLBACK = 'fallback',
  ROUTING = 'routing',
}

export const completionAuditEventTypes = $enum(
  CompletionAuditEventType
).getKeys();

export class CompletionAuditEventEntity {
  @ApiProperty({
    enumName: 'CompletionAuditEventType',
    enum: completionAuditEventTypes,
    description: 'The event type of the Audit event',
    example: 'fallback',
  })
  @IsEnum(CompletionAuditEventType)
  @IsNotEmpty()
  type: CompletionAuditEventType;

  @ApiProperty({
    description: 'The timestamp of the Audit event',
    example: '2021-01-01T00:00:00.000Z',
  })
  @IsDateString()
  @IsNotEmpty()
  timestamp: Date;

  @ApiProperty({
    description: 'The data of the Audit event',
  })
  @IsNotEmpty()
  @IsObject()
  data: unknown;
}

export class CompletionAuditDataEntity {
  @ApiProperty({
    description: 'The response of the completion audit data',
  })
  @IsArray()
  response: CompletionResponseData[];

  @ApiProperty({
    description: 'The headers of the completion audit data',
  })
  @IsObject()
  headers: CompletionHeaders;
}

export class CompletionAuditEntity {
  @ApiProperty({
    description: 'The unique identifier for the completion audit event (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4')
  @IsNotEmpty()
  id: string;

  @ApiProperty({
    description: 'The timestamp of the completion audit event',
    example: '2021-01-01T00:00:00.000Z',
  })
  @IsDateString()
  @IsNotEmpty()
  timestamp: Date;

  @ApiProperty({
    description:
      'The workspace that the completion audit event is associated with',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4')
  @IsNotEmpty()
  workspaceId: string;

  @ApiProperty({
    description:
      'The environment that the completion audit event is associated with',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4')
  @IsNotEmpty()
  environmentId: string;

  @ApiProperty({
    description:
      'The AI connection that the completion audit event is associated with',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4')
  @IsOptional()
  connectionId?: string | null;

  @ApiProperty({
    enumName: 'CompletionAuditType',
    enum: completionAuditTypes,
    description: 'The type of the completion audit event',
    example: PublicCompletionAuditType.COMPLETION,
  })
  @IsEnum(PublicCompletionAuditType)
  @IsNotEmpty()
  type: PublicCompletionAuditType;

  @ApiProperty({
    description: 'The status code of the completion audit event',
    example: 200,
  })
  @IsNumber()
  @IsNotEmpty()
  statusCode: number;

  @ApiProperty({
    description: 'The duration of the completion audit event in milliseconds',
    example: 1000,
  })
  @IsNumber()
  @IsNotEmpty()
  duration: number;

  @ApiProperty({
    description: 'The request ID of the completion audit event',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4')
  @IsNotEmpty()
  requestId: string;

  @ApiProperty({
    description: 'The events of the completion audit event (JSON array)',
    type: [CompletionAuditEventEntity],
  })
  @IsArray()
  @Type(() => CompletionAuditEventEntity)
  @IsOptional()
  events?: CompletionAuditEventEntity[] | null;

  @ApiProperty({
    description: 'The batch ID of the completion audit event (if applicable)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4')
  @IsOptional()
  batchId?: string | null;

  @ApiProperty({
    description:
      'The correlation ID for correlating logs and events (if applicable)',
    example: 'corr-abc-123',
  })
  @IsString()
  @IsOptional()
  correlationId?: string | null;

  @ApiProperty({
    description:
      'The associated resource of the completion audit event (if applicable)',
    example: 'resource-identifier',
  })
  @IsString()
  @IsOptional()
  resource?: string | null;

  @ApiProperty({
    description:
      'The model involved in the completion audit event (if applicable)',
    example: 'gpt-4o',
  })
  @IsString()
  @IsOptional()
  model?: string | null;

  @ApiProperty({
    description:
      'The source IP address associated with the completion audit event (if applicable)',
    example: '192.168.1.1',
  })
  @IsString()
  @IsOptional()
  sourceIp?: string | null;

  @ApiProperty({
    description:
      'The error message if the completion audit event resulted in an error',
    example: 'Rate limit exceeded',
  })
  @IsString()
  @IsOptional()
  errorMessage?: string | null;

  @ApiProperty({
    description: 'The failure reason if the completion audit event failed',
    example: 'INVALID_REQUEST',
  })
  @IsString()
  @IsOptional()
  failureReason?: string | null;

  @ApiProperty({
    description:
      'API Key ID related to the completion audit event (if applicable)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4')
  @IsOptional()
  apiKeyId?: string | null;

  @ApiProperty({
    description:
      'Additional data associated with the completion audit event (JSON object, if any)',
  })
  @IsOptional()
  data?: CompletionAuditDataEntity | null;
}
