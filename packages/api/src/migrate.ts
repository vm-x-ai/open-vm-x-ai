import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { configSchema } from './config/schema';
import { MigrationsModule } from './migrations/migrations.module';
import { MigrationsService } from './migrations/migrations.service';
import { AppLoggerModule } from './logger/logger.module';
import { QuestDBMigrationsModule } from './completion/usage/questdb/migrations/migrations.module';
import { QuestDBMigrationsService } from './completion/usage/questdb/migrations/migrations.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: configSchema,
    }),
    AppLoggerModule,
    MigrationsModule,
    QuestDBMigrationsModule,
  ],
})
class MigrationModule {}

async function runMigration() {
  const app = await NestFactory.createApplicationContext(MigrationModule);
  const migrationsService = app.get(MigrationsService);
  const questdbMigrationsService = app.get(QuestDBMigrationsService);

  const argv = await yargs(hideBin(process.argv))
    .option('reset', {
      type: 'boolean',
      description: 'Reset the database migrations',
    })
    .option('questdb', {
      type: 'boolean',
      description: 'Run QuestDB migrations',
      default: false,
    })
    .option('target', {
      type: 'string',
      description: 'Target migration to reset to (e.g. 01, 02, 03, etc.)',
    })
    .parse();

  const migrator = argv.questdb ? questdbMigrationsService : migrationsService;

  try {
    if (argv.reset) {
      console.log('Resetting database migrations...');
      await migrator.resetMigrations(argv.target);
      console.log('Migration reset completed successfully');
    } else {
      console.log('Running database migrations...');
      await migrator.migrate();
      console.log('Migration completed successfully');
    }
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

runMigration().catch(console.error);
