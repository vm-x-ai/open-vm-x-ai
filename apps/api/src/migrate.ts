import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { configSchema } from './config/schema';
import { MigrationsModule } from './migrations/migrations.module';
import { MigrationsService } from './migrations/migrations.service';
import { AppLoggerModule } from './logger/logger.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: configSchema,
    }),
    AppLoggerModule,
    MigrationsModule,
  ],
})
class MigrationModule {}

async function runMigration() {
  const app = await NestFactory.createApplicationContext(MigrationModule);
  const migrationsService = app.get(MigrationsService);

  const argv = await yargs(hideBin(process.argv))
    .option('reset', {
      type: 'boolean',
      description: 'Reset the database migrations',
    })
    .option('target', {
      type: 'string',
      description: 'Target migration to reset to (e.g. 01, 02, 03, etc.)',
    })
    .parse();

  try {
    if (argv.reset) {
      console.log('Resetting database migrations...');
      await migrationsService.resetMigrations(argv.target);
      console.log('Migration reset completed successfully');
    } else {
      console.log('Running database migrations...');
      await migrationsService.migrate();
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
