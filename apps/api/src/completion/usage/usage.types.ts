import { CompletionUsageDto } from './dto/completion-usage.dto';

export const COMPLETION_USAGE_PROVIDER = 'COMPLETION_USAGE_PROVIDER';

export interface CompletionUsageProvider {
  push(...usage: CompletionUsageDto[]): Promise<void>;
}
