import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Alert from '@mui/material/Alert';
import React from 'react';
import type { DateRangePickerValue } from '../../DateRangePicker/types';
import { Top10TokenPerSecondTable } from './Top10TokenPerSecondTable';
import { Top10TTFTTable } from './Top10TTFTTable';
import { parseDateRangePickerValueToAPIFilter } from './utils';
import {
  CompletionDimensions,
  CompletionUsageDimensionFilterDto,
  CompletionUsageDimensionOperator,
  CompletionUsageQueryDto,
  getCompletionUsage,
} from '@/clients/api';

export type LLMTokenGraphProps = {
  workspaceId: string;
  environmentId: string;
  datePickerValue: DateRangePickerValue;
  filters: Record<string, string[]>;
  autoRefresh: boolean;
  autoRefreshInterval?: number;
};

function getTTFTUsageBody(
  dimensions: CompletionDimensions[],
  datePickerValue: DateRangePickerValue,
  dimensionFilters: Record<
    CompletionDimensions,
    CompletionUsageDimensionFilterDto
  >
): CompletionUsageQueryDto {
  return {
    dimensions,
    agg: {
      timeToFirstToken: 'avg',
    },
    filter: {
      dateRange: parseDateRangePickerValueToAPIFilter(datePickerValue),
      fields: {
        ...dimensionFilters,
        timeToFirstToken: {
          operator: CompletionUsageDimensionOperator.IS_NOT,
          value: null,
        },
      },
    },
    orderBy: {
      timeToFirstToken: 'asc',
    },
    limit: 10,
  };
}

function getTokenPerSecondUsageBody(
  dimensions: CompletionDimensions[],
  datePickerValue: DateRangePickerValue,
  dimensionFilters: Record<
    CompletionDimensions,
    CompletionUsageDimensionFilterDto
  >
): CompletionUsageQueryDto {
  return {
    dimensions,
    agg: {
      tokensPerSecond: 'avg',
    },
    filter: {
      dateRange: parseDateRangePickerValueToAPIFilter(datePickerValue),
      fields: {
        ...dimensionFilters,
        tokensPerSecond: {
          operator: CompletionUsageDimensionOperator.IS_NOT,
          value: null,
        },
      },
    },
    orderBy: {
      tokensPerSecond: 'desc',
    },
    limit: 10,
  };
}

export async function TopTables({
  workspaceId,
  environmentId,
  filters,
  datePickerValue,
  autoRefresh,
  autoRefreshInterval,
}: LLMTokenGraphProps) {
  const dimensions = [
    CompletionDimensions.PROVIDER,
    CompletionDimensions.MODEL,
  ];
  const dimensionFilters = Object.entries(filters || {}).reduce(
    (acc, [key, value]) => {
      if (value.length > 0) {
        acc[key as CompletionDimensions] = {
          operator: CompletionUsageDimensionOperator.IN,
          value: value,
        };
      }
      return acc;
    },
    {} as Record<CompletionDimensions, CompletionUsageDimensionFilterDto>
  );
  const ttftData = await getCompletionUsage({
    path: {
      workspaceId,
      environmentId,
    },
    body: getTTFTUsageBody(dimensions, datePickerValue, dimensionFilters),
  });

  const tokenPerSecondData = await getCompletionUsage({
    path: {
      workspaceId,
      environmentId,
    },
    body: getTokenPerSecondUsageBody(
      dimensions,
      datePickerValue,
      dimensionFilters
    ),
  });

  return (
    <>
      <Accordion
        slotProps={{ transition: { unmountOnExit: true } }}
        defaultExpanded
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          sx={{
            fontWeight: 'bold',
          }}
        >
          Top 10 - Time To First Token
        </AccordionSummary>
        <AccordionDetails>
          {ttftData.data && (
            <Top10TTFTTable
              data={ttftData.data}
              autoRefresh={autoRefresh}
              autoRefreshInterval={autoRefreshInterval}
              autoRefreshAction={async () => {
                'use server';

                const result = await getCompletionUsage({
                  path: {
                    workspaceId,
                    environmentId,
                  },
                  body: getTTFTUsageBody(
                    dimensions,
                    datePickerValue,
                    dimensionFilters
                  ),
                });
                if (result.error) {
                  return undefined;
                }

                return result.data;
              }}
            />
          )}
          {ttftData.error && (
            <Alert variant="filled" severity="error">
              Failed to load table data: {ttftData.error?.errorMessage}
            </Alert>
          )}
        </AccordionDetails>
      </Accordion>
      <Accordion slotProps={{ transition: { unmountOnExit: true } }}>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          sx={{
            fontWeight: 'bold',
          }}
        >
          Top 10 - Token Per Second
        </AccordionSummary>
        <AccordionDetails>
          {tokenPerSecondData.data && (
            <Top10TokenPerSecondTable
              data={tokenPerSecondData.data}
              autoRefresh={autoRefresh}
              autoRefreshInterval={autoRefreshInterval}
              autoRefreshAction={async () => {
                'use server';

                const result = await getCompletionUsage({
                  path: {
                    workspaceId,
                    environmentId,
                  },
                  body: getTokenPerSecondUsageBody(
                    dimensions,
                    datePickerValue,
                    dimensionFilters
                  ),
                });
                if (result.error) {
                  return undefined;
                }

                return result.data;
              }}
            />
          )}
          {tokenPerSecondData.error && (
            <Alert variant="filled" severity="error">
              Failed to load table data:{' '}
              {tokenPerSecondData.error?.errorMessage}
            </Alert>
          )}
        </AccordionDetails>
      </Accordion>
    </>
  );
}
