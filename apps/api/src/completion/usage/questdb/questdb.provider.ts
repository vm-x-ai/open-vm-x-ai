import 'reflect-metadata';

import { Injectable } from '@nestjs/common';
import { CompletionUsageProvider } from '../usage.types';
import { QuestDBDatabaseService } from './storage/database.service';
import { CompletionUsageDto } from '../dto/completion-usage.dto';
import { plainToInstance } from 'class-transformer';
import { replaceUndefinedWithNull } from '../../../utils/object';
import {
  CompletionUsageDimensionOperator,
  CompletionUsageQueryDto,
  GranularityUnit,
} from '../dto/completion-query.dto';
import { sql } from 'kysely';
import { CompletionUsageQueryResultDto } from '../dto/completion-query-result.dto';
import { toZonedTime } from 'date-fns-tz';

const OPERATOR_MAP = {
  [CompletionUsageDimensionOperator.EQ]: '=',
  [CompletionUsageDimensionOperator.NEQ]: '!=',
  [CompletionUsageDimensionOperator.IN]: 'in',
  [CompletionUsageDimensionOperator.NIN]: 'not in',
  [CompletionUsageDimensionOperator.GT]: '>',
  [CompletionUsageDimensionOperator.GTE]: '>=',
  [CompletionUsageDimensionOperator.LT]: '<',
  [CompletionUsageDimensionOperator.LTE]: '<=',
} as const;

@Injectable()
export class QuestDBCompletionUsageProvider implements CompletionUsageProvider {
  constructor(private readonly db: QuestDBDatabaseService) {}

  async query(
    query: CompletionUsageQueryDto
  ): Promise<CompletionUsageQueryResultDto[]> {
    let dbQuery = this.db.instance.selectFrom('completions').limit(query.limit);

    let timeExpression = sql`ts as time`;

    switch (query.granularity) {
      case GranularityUnit.SECOND:
      case GranularityUnit.SECOND_5:
      case GranularityUnit.SECOND_10:
      case GranularityUnit.SECOND_15:
      case GranularityUnit.SECOND_30: {
        const secondInterval = parseInt(query.granularity.split('_')[1]);
        timeExpression = sql`timestamp_floor('${sql.lit(
          secondInterval
        )}s', ts)`;
        break;
      }
      case GranularityUnit.MINUTE:
        timeExpression = sql`date_trunc('minute', ts)`;
        break;
      case GranularityUnit.HOUR:
        timeExpression = sql`date_trunc('hour', ts)`;
        break;
      case GranularityUnit.DAY:
        timeExpression = sql`date_trunc('day', ts)`;
        break;
      case GranularityUnit.WEEK:
        timeExpression = sql`date_trunc('week', ts)`;
        break;
      case GranularityUnit.MONTH:
        timeExpression = sql`date_trunc('month', ts)`;
        break;
      case GranularityUnit.YEAR:
        timeExpression = sql`date_trunc('year', ts)`;
        break;
    }

    dbQuery = dbQuery.select([timeExpression.as('time'), ...query.dimensions]);

    for (const [metric, agg] of Object.entries(query.agg)) {
      const approxPercentileMatch = /p(\d+)/g.exec(agg);

      if (approxPercentileMatch) {
        const percentile = parseInt(approxPercentileMatch[1]);
        dbQuery = dbQuery.select(
          sql`cast(approx_percentile(${sql.lit(metric)}, ${sql.lit(
            percentile
          )}) as double)`.as(metric)
        );
      } else {
        dbQuery = dbQuery.select(
          sql<number>`cast(${sql.raw(agg)}(${sql.ref(metric)}) as double)`.as(
            metric
          )
        );
      }
    }

    for (const [dimension, orderBy] of Object.entries(query.orderBy ?? {})) {
      dbQuery = dbQuery.orderBy(sql.ref(dimension), orderBy);
    }

    dbQuery = dbQuery
      .where('ts', '>=', toZonedTime(query.filter.dateRange.start, 'UTC'))
      .where('ts', '<', toZonedTime(query.filter.dateRange.end, 'UTC'));

    for (const [dimension, filter] of Object.entries(
      query.filter.dimensions ?? {}
    )) {
      dbQuery = dbQuery.where(
        sql.ref(dimension),
        OPERATOR_MAP[filter.operator],
        filter.value
      );
    }

    dbQuery = dbQuery.groupBy([timeExpression, ...query.dimensions]);
    return (await dbQuery.execute()) as CompletionUsageQueryResultDto[];
  }

  async push(...usage: CompletionUsageDto[]): Promise<void> {
    const values = usage.map((item) => {
      const value = plainToInstance(
        CompletionUsageDto,
        replaceUndefinedWithNull(item)
      );
      const { timestamp, error, ...rest } = value;
      return {
        ...rest,
        ts: item.timestamp,
        requestCount: 1,
        errorCount: item.error ? 1 : 0,
        successCount: item.error ? 0 : 1,
      };
    });
    await this.db.instance.insertInto('completions').values(values).execute();
  }
}
