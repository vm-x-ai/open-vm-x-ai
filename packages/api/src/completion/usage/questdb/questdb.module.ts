import { Module } from '@nestjs/common';
import { QuestDBDatabaseService } from './storage/database.service';
import { QuestDBMigrationsModule } from './migrations/migrations.module';
import { QuestDBMigrationsService } from './migrations/migrations.service';
import { QuestDBCompletionUsageProvider } from './questdb.provider';

@Module({
  imports: [QuestDBMigrationsModule],
  controllers: [],
  providers: [
    QuestDBDatabaseService,
    QuestDBMigrationsService,
    QuestDBCompletionUsageProvider,
  ],
  exports: [
    QuestDBDatabaseService,
    QuestDBCompletionUsageProvider,
    QuestDBMigrationsService,
  ],
})
export class QuestDBModule {}
