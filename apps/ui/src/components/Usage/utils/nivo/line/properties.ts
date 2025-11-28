import { GranularityUnit } from '@/clients/api';
import type { LineSeries, LineSvgProps } from '@nivo/line';

export const linePropsByTimeUnit = (
  granularity: GranularityUnit
): Partial<LineSvgProps<LineSeries>> => {
  switch (granularity) {
    case GranularityUnit.SECOND:
    case GranularityUnit.SECOND_5:
    case GranularityUnit.SECOND_10:
    case GranularityUnit.SECOND_15:
    case GranularityUnit.SECOND_30:
      return {
        xFormat: 'time:%Y-%m-%d %H:%M:%S',
        axisBottom: {
          format: '%H:%M',
          tickValues: 'every 15 seconds',
        },
        xScale: {
          format: '%Y-%m-%d %H:%M:%S',
          precision: 'second',
          type: 'time',
          useUTC: false,
        },
      };
    case GranularityUnit.MINUTE:
      return {
        xFormat: 'time:%Y-%m-%d %H:%M:%S',
        axisBottom: {
          format: '%H:%M',
          tickValues: 'every 15 minutes',
        },
        xScale: {
          format: '%Y-%m-%d %H:%M:%S',
          precision: 'minute',
          type: 'time',
          useUTC: false,
        },
      };
    case GranularityUnit.HOUR:
      return {
        xFormat: 'time:%Y-%m-%d %H:%M:%S',
        axisBottom: {
          format: '%b %d %H:%M',
          tickValues: 'every 4 hours',
        },
        xScale: {
          format: '%Y-%m-%d %H:%M:%S',
          precision: 'hour',
          type: 'time',
          useUTC: false,
        },
      };
    case GranularityUnit.DAY:
      return {
        xFormat: 'time:%Y-%m-%d',
        axisBottom: {
          format: '%b %d',
          tickValues: 'every 4 days',
        },
        xScale: {
          format: '%Y-%m-%d',
          precision: 'day',
          type: 'time',
          useUTC: false,
        },
      };
    case GranularityUnit.WEEK:
      return {
        xFormat: 'time:%Y-%W',
        axisBottom: {
          format: '%Y %W',
          tickValues: 'every 7 days',
        },
        xScale: {
          format: '%Y-%W',
          precision: 'day',
          type: 'time',
          useUTC: false,
        },
      };
    case GranularityUnit.MONTH:
      return {
        xFormat: 'time:%Y-%m',
        axisBottom: {
          format: '%b',
          tickValues: 'every 1 months',
        },
        xScale: {
          format: '%Y-%m',
          precision: 'month',
          type: 'time',
          useUTC: false,
        },
      };
    case GranularityUnit.YEAR:
      return {
        xFormat: 'time:%Y',
        axisBottom: {
          format: '%Y',
          tickValues: 'every 1 years',
        },
        xScale: {
          format: '%Y',
          precision: 'year',
          type: 'time',
          useUTC: false,
        },
      };
  }
};
