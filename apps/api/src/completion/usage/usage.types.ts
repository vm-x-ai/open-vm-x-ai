import { CompletionUsageQueryResultDto } from './dto/completion-query-result.dto';
import { CompletionUsageQueryDto } from './dto/completion-query.dto';
import { CompletionUsageDto } from './dto/completion-usage.dto';

export const COMPLETION_USAGE_PROVIDER = 'COMPLETION_USAGE_PROVIDER';

export interface CompletionUsageProvider {
  push(...usage: CompletionUsageDto[]): Promise<void>;
  query(
    query: CompletionUsageQueryDto
  ): Promise<CompletionUsageQueryResultDto[]>;
}
