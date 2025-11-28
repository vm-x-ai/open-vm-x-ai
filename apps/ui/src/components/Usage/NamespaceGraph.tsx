'use client';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import type { DatumValue } from '@nivo/core';
import type { LineSvgProps, LineSeries } from '@nivo/line';
import type { ScaleValue } from '@nivo/scales';
import { bytesToHumanReadable } from '@/utils/file';
import { formatDuration, toUtc } from '@/utils/time';
import dynamic from 'next/dynamic';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { MetricDefinition, MetricFormat } from './types';

type ValueFormatter<Value extends ScaleValue> = (
  value: Value
) => Value | string;

type NivoMetricFormat = {
  yFormat?: string | ValueFormatter<string>;
  axisLeftLegend?: string;
  axisLeftFormat: string | ValueFormatter<number>;
};

const LineChart = dynamic(() => import('@/components/Usage/Charts/Line/Line'), {
  ssr: false,
});

const ContainerChart = dynamic(
  () => import('@/components/Usage/Charts/Container'),
  {
    ssr: false,
  }
);

export type NamespaceGraphProps = {
  data: LineSvgProps<LineSeries>;
  metrics: MetricDefinition[];
  agg: Record<string, string>;
  xLegend: string;
  yLegend: string;
  autoRefresh?: boolean;
  autoRefreshInterval?: number;
  autoRefreshAction?: () => Promise<LineSvgProps<LineSeries> | undefined>;
};

export function NamespaceGraph({
  data: rawData,
  metrics,
  agg,
  xLegend,
  yLegend,
  autoRefresh,
  autoRefreshInterval,
  autoRefreshAction,
}: NamespaceGraphProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [data, setData] = useState<LineSvgProps<LineSeries>>(rawData);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    setData(rawData);
  }, [rawData]);

  useEffect(() => {
    if (autoRefresh && autoRefreshInterval && autoRefreshAction) {
      const interval = setInterval(async () => {
        if (loading) {
          return;
        }

        setLoading(true);
        try {
          const newData = await autoRefreshAction();
          if (newData) {
            setData(newData);
          }
        } finally {
          setLoading(false);
        }
      }, autoRefreshInterval);

      return () => {
        clearInterval(interval);
      };
    }

    return () => {
      // do nothing
    };
  }, [autoRefresh, autoRefreshInterval, autoRefreshAction, loading]);

  const getMetricFormat = useCallback(() => {
    const config: NivoMetricFormat = {
      yFormat: undefined,
      axisLeftLegend: undefined,
      axisLeftFormat: '.2s',
    };

    if (metrics) {
      const metricsMap = metrics.reduce((acc, metric) => {
        acc[metric.name] = metric;
        return acc;
      }, {} as Record<string, MetricDefinition>);

      const formats = Object.keys(agg)
        .map<MetricDefinition>((metric) => metricsMap[metric])
        .filter((metric) => !!metric)
        .map((metric) => metric.format || MetricFormat.NUMBER);

      if (formats.length === 1 && formats[0] === MetricFormat.BYTES) {
        config.axisLeftFormat = bytesToHumanReadable;
        config.yFormat = (value: DatumValue): string => {
          if (typeof value === 'number') {
            return bytesToHumanReadable(value);
          }
          return value as string;
        };
        config.axisLeftLegend = 'bytes';
      } else if (
        formats.length === 1 &&
        formats[0] === MetricFormat.MILLISECONDS
      ) {
        config.axisLeftFormat = (value: number): string => {
          if (value < 1000) {
            return `${value}ms`;
          } else if (value < 60000) {
            return `${value / 1000}s`;
          } else if (value < 3600000) {
            return `${Math.floor(value / 60000)}m`;
          } else {
            return `${Math.floor(value / 3600000)}h`;
          }
        };
        config.yFormat = (value: DatumValue): string => {
          if (typeof value === 'number') {
            return formatDuration(value);
          }
          return value as string;
        };
      }
    }

    return config;
  }, [agg, metrics]);

  const lineProps = useMemo<LineSvgProps<LineSeries> | null>(() => {
    if (!data) {
      return null;
    }

    const formatOptions = getMetricFormat();

    const config: LineSvgProps<LineSeries> = {
      ...data,
      axisBottom: {
        ...(data.axisBottom || {}),
        legend: xLegend,
      },
      axisLeft: {
        ...((data && data.axisLeft) || {}),
        legend: formatOptions.axisLeftLegend || yLegend,
        format: formatOptions.axisLeftFormat,
      },
      yFormat: formatOptions.yFormat as LineSvgProps<LineSeries>['yFormat'],
    };

    return config;
  }, [getMetricFormat, data, xLegend, yLegend]);

  return (
    <Grid container>
      <Grid size={12}>
        <ContainerChart>
          <Box
            sx={{
              height: '35vh',
              width: '100%',
            }}
          >
            <LineChart
              {...lineProps}
              data={(lineProps?.data || []) as LineSeries[]}
              onRangeSelected={(start, end) => {
                const params = new URLSearchParams(searchParams?.toString());
                params.set('start', toUtc(start).toISOString());
                params.set('end', toUtc(end).toISOString());
                params.set('dateType', 'absolute');
                router.push(pathname + '?' + params.toString());
              }}
            />
          </Box>
        </ContainerChart>
      </Grid>
    </Grid>
  );
}
