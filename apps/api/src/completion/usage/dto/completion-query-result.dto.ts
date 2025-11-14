import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CompletionUsageQueryResultDto {
  @ApiProperty({
    type: 'string',
    description: 'Time bucket truncated to the granularity unit',
    example: '2021-01-01',
  })
  @IsString()
  @IsNotEmpty()
  time: string;

  @ApiProperty({
    description: 'Completion input tokens',
    example: 100,
    nullable: true,
    required: false,
    type: 'number',
  })
  @IsOptional()
  @IsNumber()
  promptTokens?: number | null;

  @ApiProperty({
    description: 'Completion output tokens',
    example: 100,
    nullable: true,
    required: false,
    type: 'number',
  })
  @IsOptional()
  @IsNumber()
  completionTokens?: number | null;

  @ApiProperty({
    description: 'Total number of tokens',
    example: 200,
    nullable: true,
    required: false,
    type: 'number',
  })
  @IsOptional()
  @IsNumber()
  totalTokens?: number | null;

  @ApiProperty({
    description: 'Tokens generated per second',
    nullable: true,
    required: false,
    type: 'number',
  })
  @IsOptional()
  @IsNumber()
  tokensPerSecond?: number | null;

  @ApiProperty({
    description: 'Time to generate the first token (milliseconds)',
    example: 100,
    nullable: true,
    required: false,
    type: 'number',
  })
  @IsOptional()
  @IsNumber()
  timeToFirstToken?: number | null;

  @ApiProperty({
    description: 'Total number of requests',
    example: 100,
    nullable: true,
    required: false,
    type: 'number',
  })
  @IsOptional()
  @IsNumber()
  requestCount?: number | null;

  @ApiProperty({
    description: 'Total number of errors',
    example: 100,
    nullable: true,
    required: false,
    type: 'number',
  })
  @IsOptional()
  @IsNumber()
  errorCount?: number | null;

  @ApiProperty({
    description: 'Total number of successes',
    example: 100,
    nullable: true,
    required: false,
    type: 'number',
  })
  @IsOptional()
  @IsNumber()
  successCount?: number | null;

  @ApiProperty({
    description: 'Total request duration (milliseconds)',
    example: 100,
    nullable: true,
    required: false,
    type: 'number',
  })
  @IsOptional()
  @IsNumber()
  requestDuration?: number | null;

  @ApiProperty({
    description: 'Time spent in the AI provider API (milliseconds)',
    example: 100,
    nullable: true,
    required: false,
    type: 'number',
  })
  @IsOptional()
  @IsNumber()
  providerDuration?: number | null;

  @ApiProperty({
    description: 'Time spent in the gate service (milliseconds)',
    example: 100,
    nullable: true,
    required: false,
    type: 'number',
  })
  @IsOptional()
  @IsNumber()
  gateDuration?: number | null;

  @ApiProperty({
    description: 'Time spent in routing (milliseconds)',
    example: 100,
    nullable: true,
    required: false,
    type: 'number',
  })
  @IsOptional()
  @IsNumber()
  routingDuration?: number | null;

  @ApiProperty({
    description: 'Workspace Identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
    nullable: true,
    required: false,
    type: 'string',
  })
  @IsOptional()
  @IsUUID('4')
  workspaceId?: string | null;

  @ApiProperty({
    description: 'Environment Identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
    nullable: true,
    required: false,
    type: 'string',
  })
  @IsOptional()
  @IsUUID('4')
  environmentId?: string | null;

  @ApiProperty({
    description: 'AI Connection Identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
    nullable: true,
    required: false,
    type: 'string',
  })
  @IsOptional()
  @IsUUID('4')
  connectionId?: string | null;

  @ApiProperty({
    description: 'AI Resource Identifier',
    example: 'resource-id-string',
    nullable: true,
    required: false,
    type: 'string',
  })
  @IsOptional()
  @IsString()
  resource?: string | null;

  @ApiProperty({
    description: 'Provider name',
    example: 'openai',
    nullable: true,
    required: false,
    type: 'string',
  })
  @IsOptional()
  @IsString()
  provider?: string | null;

  @ApiProperty({
    description: 'Model name',
    example: 'gpt-4o',
    nullable: true,
    required: false,
    type: 'string',
  })
  @IsOptional()
  @IsString()
  model?: string | null;

  @ApiProperty({
    description: 'Unique identifier for the request',
    example: 'req_123e4567-e89b-12d3-a456-426614174000',
    nullable: true,
    required: false,
    type: 'string',
  })
  @IsOptional()
  @IsString()
  requestId?: string | null;

  @ApiProperty({
    description: 'Unique identifier for the message',
    example: 'msg_123e4567-e89b-12d3-a456-426614174000',
    nullable: true,
    required: false,
    type: 'string',
  })
  @IsOptional()
  @IsString()
  messageId?: string | null;

  @ApiProperty({
    description: 'Reason for failure, if applicable',
    example: 'Rate limit exceeded',
    nullable: true,
    required: false,
    type: 'string',
  })
  @IsOptional()
  @IsString()
  failureReason?: string | null;

  @ApiProperty({
    description: 'HTTP status code of the response',
    example: 429,
    nullable: true,
    required: false,
    type: 'number',
  })
  @IsOptional()
  @IsInt()
  statusCode?: number | null;

  @ApiProperty({
    description: 'Correlation ID for tracing requests',
    example: 'corr-abc-123',
    nullable: true,
    required: false,
    type: 'string',
  })
  @IsOptional()
  @IsString()
  correlationId?: string | null;

  @ApiProperty({
    description: 'API key identifier used for the request',
    example: 'api_key_123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
    nullable: true,
    required: false,
    type: 'string',
  })
  @IsOptional()
  @IsUUID('4')
  apiKeyId?: string | null;

  @ApiProperty({
    description: 'Source IP address of the request',
    example: '192.168.1.1',
    nullable: true,
    required: false,
    type: 'string',
  })
  @IsString()
  @IsOptional()
  sourceIp?: string | null;
}
