import { Inject, Injectable } from '@nestjs/common';
import {
  COMPLETION_USAGE_PROVIDER,
  type CompletionUsageProvider,
} from './usage.types';
import { CompletionUsageDto } from './dto/completion-usage.dto';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PinoLogger } from 'nestjs-pino';
import {
  CompletionUsageQueryDto,
  GranularityUnit,
} from './dto/completion-query.dto';
import { CompletionUsageQueryResultDto } from './dto/completion-query-result.dto';
import {
  endOfDay,
  endOfHour,
  endOfMinute,
  endOfWeek,
  format,
  getYear,
  startOfDay,
  startOfHour,
  startOfMinute,
} from 'date-fns';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';

type BufferItem = {
  payload: CompletionUsageDto;
  attempts?: number;
};

@Injectable()
export class CompletionUsageService {
  private buffer: BufferItem[] = [];
  private flushing = false;

  constructor(
    private readonly logger: PinoLogger,
    @Inject(COMPLETION_USAGE_PROVIDER)
    private readonly completionUsageProvider: CompletionUsageProvider
  ) {}

  async query(
    query: CompletionUsageQueryDto
  ): Promise<CompletionUsageQueryResultDto[]> {
    const providerResults = await this.completionUsageProvider.query(query);
    if (query.granularity === GranularityUnit.DAY) {
      return this.normalizeResultByDay(query, providerResults);
    } else if (query.granularity === GranularityUnit.WEEK) {
      return this.normalizeResultByWeek(query, providerResults);
    } else if (query.granularity === GranularityUnit.MONTH) {
      return this.normalizeResultByMonth(query, providerResults);
    } else if (query.granularity === GranularityUnit.YEAR) {
      return this.normalizeResultByYear(query, providerResults);
    } else if (query.granularity === GranularityUnit.HOUR) {
      return this.normalizeResultByHour(query, providerResults);
    } else if (query.granularity === GranularityUnit.MINUTE) {
      return this.normalizeResultByMinute(query, providerResults);
    }

    return providerResults;
  }

  private normalizeResultByDay(
    query: CompletionUsageQueryDto,
    result: CompletionUsageQueryResultDto[]
  ) {
    const normalizedResult: CompletionUsageQueryResultDto[] = [];

    const dateMap = result.reduce((acc, row) => {
      const date = fromZonedTime(row.time, 'UTC').getTime();
      console.log(row.time, date);

      if (!acc[date]) {
        acc[date] = [];
      }

      acc[date].push(row);
      return acc;
    }, {} as Record<number, CompletionUsageQueryResultDto[]>);
    const startDate = startOfDay(
      toZonedTime(query.filter.dateRange.start, 'UTC')
    ).getTime();
    const endDate = endOfDay(
      toZonedTime(query.filter.dateRange.end, 'UTC')
    ).getTime();
    console.log(
      startOfDay(toZonedTime(query.filter.dateRange.start, 'UTC')),
      endOfDay(toZonedTime(query.filter.dateRange.end, 'UTC'))
    );

    const currentDate = new Date(startDate);
    while (currentDate.getTime() < endDate) {
      const key = currentDate.getTime();
      if (dateMap[key]) {
        normalizedResult.push(
          ...dateMap[key].map((item) => ({
            ...item,
            time: format(currentDate, 'yyyy-MM-dd'),
          }))
        );
      } else {
        const item: CompletionUsageQueryResultDto = {
          time: currentDate.toISOString().split('T')[0],
        };

        normalizedResult.push(item);
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return normalizedResult;
  }

  private normalizeResultByWeek(
    query: CompletionUsageQueryDto,
    result: CompletionUsageQueryResultDto[]
  ) {
    const normalizedResult: CompletionUsageQueryResultDto[] = [];
    const weekMap = result.reduce((acc, row) => {
      const date = fromZonedTime(row.time, 'UTC');
      const week = format(date, 'yyyy-ww');
      if (!acc[week]) {
        acc[week] = [];
      }
      acc[week].push(row);
      return acc;
    }, {} as Record<string, CompletionUsageQueryResultDto[]>);

    const startWeek = parseInt(
      format(toZonedTime(query.filter.dateRange.start, 'UTC'), 'yyyyww')
    );
    const endWeek = parseInt(
      format(
        endOfWeek(toZonedTime(query.filter.dateRange.end, 'UTC')),
        'yyyyww'
      )
    );

    let currentWeek = startWeek;
    while (currentWeek <= endWeek) {
      const weekStr = currentWeek.toString();
      const yearStr = weekStr.substring(0, weekStr.length - 2);
      const yearWeekStr = weekStr
        .substring(weekStr.length - 2)
        .padStart(2, '0');
      const week = `${yearStr}-${yearWeekStr}`;
      if (weekMap[week]) {
        normalizedResult.push(
          ...weekMap[week].map((item) => ({
            ...item,
            time: week,
          }))
        );
      } else {
        const item: CompletionUsageQueryResultDto = {
          time: week,
        };

        normalizedResult.push(item);
      }

      if (yearWeekStr === '52') {
        currentWeek = parseInt(`${parseInt(yearStr) + 1}01`);
      } else {
        currentWeek++;
      }
    }

    return normalizedResult;
  }

  private normalizeResultByMonth(
    query: CompletionUsageQueryDto,
    result: CompletionUsageQueryResultDto[]
  ) {
    const normalizedResult: CompletionUsageQueryResultDto[] = [];
    const monthMap = result.reduce((acc, row) => {
      const date = fromZonedTime(row.time, 'UTC');
      const month = format(date, 'yyyy-MM');
      if (!acc[month]) {
        acc[month] = [];
      }
      acc[month].push(row);
      return acc;
    }, {} as Record<string, CompletionUsageQueryResultDto[]>);

    const startMonth = parseInt(
      format(toZonedTime(query.filter.dateRange.start, 'UTC'), 'yyyyMM')
    );
    const endMonth = parseInt(
      format(toZonedTime(query.filter.dateRange.end, 'UTC'), 'yyyyMM')
    );

    let currentMonth = startMonth;
    while (currentMonth <= endMonth) {
      const monthStr = currentMonth.toString();
      const yearStr = monthStr.substring(0, monthStr.length - 2);
      const yearMonthStr = monthStr
        .substring(monthStr.length - 2)
        .padStart(2, '0');
      const month = `${yearStr}-${yearMonthStr}`;
      if (monthMap[month]) {
        normalizedResult.push(
          ...monthMap[month].map((item) => ({
            ...item,
            time: month,
          }))
        );
      } else {
        const item: CompletionUsageQueryResultDto = {
          time: month,
        };

        normalizedResult.push(item);
      }

      if (yearMonthStr === '12') {
        currentMonth = parseInt(`${parseInt(yearStr) + 1}01`);
      } else {
        currentMonth++;
      }
    }

    return normalizedResult;
  }

  private normalizeResultByYear(
    query: CompletionUsageQueryDto,
    result: CompletionUsageQueryResultDto[]
  ) {
    const normalizedResult: CompletionUsageQueryResultDto[] = [];
    const yearMap = result.reduce((acc, row) => {
      const date = fromZonedTime(row.time, 'UTC');
      const year = getYear(date);
      if (!acc[year]) {
        acc[year] = [];
      }
      acc[year].push(row);
      return acc;
    }, {} as Record<number, CompletionUsageQueryResultDto[]>);

    const startYear = getYear(toZonedTime(query.filter.dateRange.start, 'UTC'));
    const endYear = getYear(toZonedTime(query.filter.dateRange.end, 'UTC'));

    let currentYear = startYear;
    while (currentYear <= endYear) {
      if (yearMap[currentYear]) {
        normalizedResult.push(
          ...yearMap[currentYear].map((item) => ({
            ...item,
            time: currentYear.toString(),
          }))
        );
      } else {
        const item: CompletionUsageQueryResultDto = {
          time: currentYear.toString(),
        };

        normalizedResult.push(item);
      }
      currentYear++;
    }

    return normalizedResult;
  }

  private normalizeResultByHour(
    query: CompletionUsageQueryDto,
    result: CompletionUsageQueryResultDto[]
  ) {
    const normalizedResult: CompletionUsageQueryResultDto[] = [];
    const dateMap = result.reduce((acc, row) => {
      const date = fromZonedTime(row.time, 'UTC').getTime();

      if (!acc[date]) {
        acc[date] = [];
      }

      acc[date].push(row);
      return acc;
    }, {} as Record<number, CompletionUsageQueryResultDto[]>);

    const startDate = startOfHour(
      toZonedTime(query.filter.dateRange.start, 'UTC')
    ).getTime();
    const endDate = endOfHour(
      toZonedTime(query.filter.dateRange.end, 'UTC')
    ).getTime();

    const currentDate = new Date(startDate);
    while (currentDate.getTime() < endDate) {
      const key = currentDate.getTime();
      if (dateMap[key]) {
        normalizedResult.push(
          ...dateMap[key].map((item) => ({
            ...item,
            time: format(currentDate, 'yyyy-MM-dd HH:mm:ss'),
          }))
        );
      } else {
        const item: CompletionUsageQueryResultDto = {
          time: format(currentDate, 'yyyy-MM-dd HH:mm:ss'),
        };

        normalizedResult.push(item);
      }
      currentDate.setHours(currentDate.getHours() + 1);
    }

    return normalizedResult;
  }

  private normalizeResultByMinute(
    query: CompletionUsageQueryDto,
    result: CompletionUsageQueryResultDto[]
  ) {
    const normalizedResult: CompletionUsageQueryResultDto[] = [];
    const dateMap = result.reduce((acc, row) => {
      const date = fromZonedTime(row.time, 'UTC').getTime();
      if (!acc[date]) {
        acc[date] = [];
      }

      acc[date].push(row);
      return acc;
    }, {} as Record<number, CompletionUsageQueryResultDto[]>);
    const startDate = startOfMinute(
      toZonedTime(query.filter.dateRange.start, 'UTC')
    ).getTime();
    const endDate = endOfMinute(
      toZonedTime(query.filter.dateRange.end, 'UTC')
    ).getTime();

    const currentDate = new Date(startDate);
    while (currentDate.getTime() < endDate) {
      const key = currentDate.getTime();
      if (dateMap[key]) {
        normalizedResult.push(
          ...dateMap[key].map((item) => ({
            ...item,
            time: format(currentDate, 'yyyy-MM-dd HH:mm:ss'),
          }))
        );
      } else {
        const item: CompletionUsageQueryResultDto = {
          time: format(currentDate, 'yyyy-MM-dd HH:mm:ss'),
        };

        normalizedResult.push(item);
      }
      currentDate.setMinutes(currentDate.getMinutes() + 1);
    }

    return normalizedResult;
  }

  push(payload: CompletionUsageDto): void {
    this.buffer.push({ payload });
    if (this.buffer.length >= 100) {
      this.flush();
    }
  }

  @Cron(CronExpression.EVERY_10_SECONDS, { name: 'completion-usage-flush' })
  public async flush() {
    if (this.buffer.length === 0 || this.flushing) {
      return;
    }
    const bufferLength = this.buffer.length;
    const transit = [...this.buffer];
    this.flushing = true;
    try {
      await this.completionUsageProvider.push(
        ...transit.map(({ payload }) => payload)
      );

      this.logger.info(`Flushed ${transit.length} items`);
      this.buffer.splice(0, bufferLength);
    } catch (error) {
      this.logger.error(`Failed to flush completion usage: ${error}`);
      this.buffer.splice(0, bufferLength);
      const dropItems = transit.filter(
        (item) => item.attempts && item.attempts > 3
      );
      this.logger.error(`Dropped ${dropItems.length} items`);
      const retryItems = transit.filter(
        (item) => item.attempts && item.attempts <= 3
      );
      this.buffer.push(
        ...retryItems.map((item) => ({
          ...item,
          attempts: (item.attempts || 0) + 1,
        }))
      );
      this.logger.error(`Pushed ${retryItems.length} items back to buffer`);
      this.logger.error(`Buffer now has ${this.buffer.length} items`);
    } finally {
      this.flushing = false;
    }
  }
}
