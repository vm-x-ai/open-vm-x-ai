import 'reflect-metadata';

import { Injectable } from '@nestjs/common';
import { CompletionUsageProvider } from '../usage.types';
import { QuestDBDatabaseService } from './storage/database.service';
import { CompletionUsageDto } from '../dto/completion-usage.dto';
import { plainToInstance } from 'class-transformer';
import { replaceUndefinedWithNull } from '../../../utils/object';

@Injectable()
export class QuestDBCompletionUsageProvider implements CompletionUsageProvider {
  constructor(private readonly db: QuestDBDatabaseService) {}

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
