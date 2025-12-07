import { CompletionUsageQueryDateRangeDto } from '@/clients/api';
import type { DateRangePickerValue } from '../../DateRangePicker/types';
import { parseDateRangePickerValue } from '../../DateRangePicker/utils';

function parseDate(date?: Date): string {
  const value = date || new Date();
  return value.toISOString();
}

export function parseDateRangePickerValueToAPIFilter(
  value: DateRangePickerValue
): CompletionUsageQueryDateRangeDto {
  const { start, end } = parseDateRangePickerValue(value, parseDate);

  return {
    start: start,
    end: end,
  };
}
