import { Module } from '@nestjs/common';
import { QuestDBMigrationsService } from './migrations.service';

@Module({
  imports: [],
  providers: [QuestDBMigrationsService],
  exports: [QuestDBMigrationsService],
})
export class QuestDBMigrationsModule {}
