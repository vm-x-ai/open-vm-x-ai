import { $enum } from 'ts-enum-util';
import { ApiProperty, getSchemaPath } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsArray,
  ValidateNested,
  registerDecorator,
  ValidationArguments,
  validate,
  IsDateString,
  IsString,
  IsTimeZone,
} from 'class-validator';
import { plainToInstance, Type } from 'class-transformer';
import { SchemaObjectMetadata } from '@nestjs/swagger/dist/interfaces/schema-object-metadata.interface';
import { Optional } from '@nestjs/common';

export enum GranularityUnit {
  SECOND = 'second',
  SECOND_5 = 'second_5',
  SECOND_10 = 'second_10',
  SECOND_15 = 'second_15',
  SECOND_30 = 'second_30',
  MINUTE = 'minute',
  HOUR = 'hour',
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  YEAR = 'year',
}

export const granularityUnits = $enum(GranularityUnit).getValues();

export enum AggregationType {
  SUM = 'sum',
  AVG = 'avg',
  MIN = 'min',
  MAX = 'max',
  P99 = 'p99',
  P95 = 'p95',
  P90 = 'p90',
}

export const aggregationTypes = $enum(AggregationType).getValues();

export enum OrderByDirection {
  ASC = 'asc',
  DESC = 'desc',
}

export const orderByDirections = $enum(OrderByDirection).getValues();

export enum CompletionMetrics {
  PROMPT_TOKENS = 'promptTokens',
  COMPLETION_TOKENS = 'completionTokens',
  TOTAL_TOKENS = 'totalTokens',
  TOKENS_PER_SECOND = 'tokensPerSecond',
  TIME_TO_FIRST_TOKEN = 'timeToFirstToken',
  REQUEST_COUNT = 'requestCount',
  ERROR_COUNT = 'errorCount',
  SUCCESS_COUNT = 'successCount',
  REQUEST_DURATION = 'requestDuration',
  PROVIDER_DURATION = 'providerDuration',
  GATE_DURATION = 'gateDuration',
  ROUTING_DURATION = 'routingDuration',
}

export const completionMetrics = $enum(CompletionMetrics).getValues();

export enum CompletionDimensions {
  WORKSPACE_ID = 'workspaceId',
  ENVIRONMENT_ID = 'environmentId',
  CONNECTION_ID = 'connectionId',
  RESOURCE_ID = 'resourceId',
  PROVIDER = 'provider',
  MODEL = 'model',
  REQUEST_ID = 'requestId',
  MESSAGE_ID = 'messageId',
  FAILURE_REASON = 'failureReason',
  STATUS_CODE = 'statusCode',
  CORRELATION_ID = 'correlationId',
  API_KEY_ID = 'apiKeyId',
  SOURCE_IP = 'sourceIp',
  USER_ID = 'userId',
}

export enum CompletionTimeDimension {
  TIME = 'time',
}

export const completionDimensions = $enum(CompletionDimensions).getValues();

function IsOrderByObject() {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isOrderByObject',
      target: object.constructor,
      propertyName,
      validator: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        validate(value: any) {
          if (typeof value !== 'object' || Array.isArray(value)) return false;

          return Object.entries(value).every(
            ([key, val]) =>
              [...completionDimensions, ...completionMetrics, 'time'].includes(
                key as CompletionDimensions
              ) && orderByDirections.includes(val as OrderByDirection)
          );
        },
        defaultMessage(args: ValidationArguments) {
          return `${
            args.property
          } must only be one of (${completionDimensions.join(
            ', '
          )}) and value must be one of (${orderByDirections.join(', ')})`;
        },
      },
    });
  };
}

function IsAggObject() {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isAggObject',
      target: object.constructor,
      propertyName,
      validator: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        validate(value: any) {
          if (typeof value !== 'object' || Array.isArray(value)) return false;

          return Object.entries(value).every(
            ([key, val]) =>
              completionMetrics.includes(key as CompletionMetrics) &&
              aggregationTypes.includes(val as AggregationType)
          );
        },
        defaultMessage(args: ValidationArguments) {
          return `${
            args.property
          } must only be one of (${completionMetrics.join(
            ', '
          )}) and value must be one of (${aggregationTypes.join(', ')})`;
        },
      },
    });
  };
}

function IsDimensionFilterObject() {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isDimensionFilterObject',
      target: object.constructor,
      propertyName,
      validator: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        async validate(value: any) {
          if (typeof value !== 'object' || Array.isArray(value)) return false;

          for (const [key, val] of Object.entries(value)) {
            if (
              ![...completionDimensions, ...completionMetrics].includes(
                key as CompletionDimensions | CompletionMetrics
              )
            ) {
              return false;
            }

            const instance = plainToInstance(
              CompletionUsageDimensionFilterDto,
              val
            );
            const errors = await validate(instance);
            if (errors.length > 0) {
              return false;
            }
          }

          return true;
        },
        defaultMessage(args: ValidationArguments) {
          return `${
            args.property
          } must only be one of (${completionDimensions.join(
            ', '
          )}) and value must be a valid ${
            CompletionUsageDimensionFilterDto.name
          }`;
        },
      },
    });
  };
}

export class CompletionUsageQueryDateRangeDto {
  @ApiProperty({
    type: 'string',
    format: 'date-time',
    description: 'Start date (inclusive) of the date range for the query',
    example: '2023-01-01T00:00:00.000Z',
  })
  @IsNotEmpty()
  @IsDateString()
  start: string;

  @ApiProperty({
    type: 'string',
    format: 'date-time',
    description: 'End date (exclusive) of the date range for the query',
    example: '2023-01-02T00:00:00.000Z',
  })
  @IsNotEmpty()
  @IsDateString()
  end: string;
}

export enum CompletionUsageDimensionOperator {
  EQ = 'eq',
  NEQ = 'neq',
  IN = 'in',
  NIN = 'nin',
  GT = 'gt',
  GTE = 'gte',
  LT = 'lt',
  LTE = 'lte',
  IS_NOT = 'is_not',
}

export const completionUsageDimensionOperators = $enum(
  CompletionUsageDimensionOperator
).getValues();

export class CompletionUsageDimensionFilterDto {
  @ApiProperty({
    enum: CompletionUsageDimensionOperator,
    enumName: 'CompletionUsageDimensionOperator',
    description: 'Operator for the filter',
    example: CompletionUsageDimensionOperator.EQ,
  })
  @IsEnum(CompletionUsageDimensionOperator)
  operator: CompletionUsageDimensionOperator;

  @ApiProperty({
    description: 'Value or values to compare against',
    oneOf: [
      { type: 'string' },
      { type: 'array', items: { type: 'string' } },
      { type: 'null' },
    ],
    example: 'abc',
    nullable: true,
    required: false,
  })
  @IsOptional()
  value?: string | string[] | null;
}

export class CompletionUsageQueryFilterDto {
  @ApiProperty({
    type: CompletionUsageQueryDateRangeDto,
    description: 'Date range to filter the usage data',
  })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => CompletionUsageQueryDateRangeDto)
  dateRange: CompletionUsageQueryDateRangeDto;

  @ApiProperty({
    type: 'object',
    description: 'Dimensions and their filters',
    properties: [...completionDimensions, ...completionMetrics].reduce(
      (acc, dimension) => {
        acc[dimension] = {
          $ref: getSchemaPath(CompletionUsageDimensionFilterDto),
        } as SchemaObjectMetadata;
        return acc;
      },
      {
        time: {
          $ref: getSchemaPath(CompletionUsageDimensionFilterDto),
        } as SchemaObjectMetadata,
      } as Record<string, SchemaObjectMetadata>
    ),
  })
  @Optional()
  @IsDimensionFilterObject()
  fields?: Partial<
    Record<
      CompletionDimensions | CompletionTimeDimension.TIME | CompletionMetrics,
      CompletionUsageDimensionFilterDto
    >
  >;
}

export class CompletionUsageQueryDto {
  @ApiProperty({
    enum: GranularityUnit,
    enumName: 'GranularityUnit',
    description: 'Granularity unit for aggregation (time bucket size)',
    example: GranularityUnit.MINUTE,
    nullable: true,
    required: false,
  })
  @IsEnum(GranularityUnit)
  @IsOptional()
  granularity?: GranularityUnit | null;

  @ApiProperty({
    description: 'Time zone to use for the query (defaults to UTC)',
    example: 'UTC',
    nullable: true,
    required: false,
    type: 'string',
  })
  @IsString()
  @IsOptional()
  @IsTimeZone()
  timeZone?: string | null;

  @ApiProperty({
    type: 'object',
    description: 'Metrics and their aggregation types',
    properties: completionMetrics.reduce((acc, metric) => {
      acc[metric] = {
        type: 'string',
        enum: aggregationTypes,
        example: AggregationType.SUM,
      };
      return acc;
    }, {} as Record<string, SchemaObjectMetadata>),
  })
  @IsNotEmpty()
  @IsAggObject()
  agg: Partial<Record<CompletionMetrics, AggregationType>>;

  @ApiProperty({
    isArray: true,
    enum: CompletionDimensions,
    enumName: 'CompletionDimensions',
    description: 'Dimensions to group results by',
    example: [CompletionDimensions.WORKSPACE_ID, CompletionDimensions.MODEL],
    required: true,
  })
  @IsArray()
  @IsEnum(CompletionDimensions, { each: true })
  @IsNotEmpty()
  dimensions: CompletionDimensions[];

  @ApiProperty({
    type: Number,
    description: 'Maximum number of records to return',
    example: 100,
    required: false,
    nullable: true,
  })
  @IsInt()
  @IsOptional()
  limit?: number | null;

  @ApiProperty({
    type: CompletionUsageQueryFilterDto,
    description: 'Filter for the query',
    example: {
      dateRange: {
        start: '2023-01-01T00:00:00.000Z',
        end: '2023-01-02T00:00:00.000Z',
      },
      dimensions: {
        provider: {
          operator: CompletionUsageDimensionOperator.EQ,
          value: 'openai',
        },
      },
    },
  })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => CompletionUsageQueryFilterDto)
  filter: CompletionUsageQueryFilterDto;

  @ApiProperty({
    description: 'Order by the query',
    example: {
      provider: OrderByDirection.ASC,
    },
    type: 'object',
    nullable: true,
    selfRequired: false,
    properties: [...completionDimensions, ...completionMetrics].reduce(
      (acc, dimension) => {
        acc[dimension] = {
          type: 'string',
          enum: orderByDirections,
          example: OrderByDirection.ASC,
        };
        return acc;
      },
      {
        time: {
          type: 'string',
          enum: orderByDirections,
          example: OrderByDirection.ASC,
        },
      } as Record<string, SchemaObjectMetadata>
    ),
  })
  @IsOptional()
  @IsOrderByObject()
  orderBy?: Partial<
    Record<
      CompletionDimensions | CompletionMetrics | CompletionTimeDimension.TIME,
      OrderByDirection
    >
  > | null;
}
