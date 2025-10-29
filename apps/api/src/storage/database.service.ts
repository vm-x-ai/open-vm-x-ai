import {
  Injectable,
  OnApplicationShutdown,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CamelCasePlugin, Kysely, PostgresDialect } from 'kysely';
import { SERVICE_NAME } from '../consts';
import { Pool } from 'pg';
import { MigrationsService } from '../migrations/migrations.service';
import { DB } from './entities.generated';

@Injectable()
export class DatabaseService implements OnModuleInit, OnApplicationShutdown {
  private writerInstance: Kysely<DB>;
  private readerInstance: Kysely<DB>;
  private rawWriterInstance: Kysely<DB>;
  private rawReaderInstance: Kysely<DB>;

  constructor(
    private readonly configService: ConfigService,
    private readonly migrationsService: MigrationsService
  ) {
    const writerDialect = new PostgresDialect({
      pool: new Pool({
        connectionString: this.configService.getOrThrow('DATABASE_URL'),
        connectionTimeoutMillis: 10_000,
        max: this.configService.get('DATABASE_WRITER_POOL_MAX'),
      }),
    });

    const camelCasePlugin = new CamelCasePlugin();

    this.writerInstance = new Kysely<DB>({
      dialect: writerDialect,
      plugins: [camelCasePlugin],
    }).withSchema(SERVICE_NAME.toLowerCase());

    this.rawWriterInstance = new Kysely<DB>({
      dialect: writerDialect,
    }).withSchema(SERVICE_NAME.toLowerCase());

    const readerDialect = new PostgresDialect({
      pool: new Pool({
        connectionString: this.configService.getOrThrow('DATABASE_RO_URL'),
        connectionTimeoutMillis: 10_000,
        max: this.configService.get('DATABASE_READER_POOL_MAX'),
      }),
    });

    this.readerInstance = new Kysely<DB>({
      dialect: readerDialect,
      plugins: [camelCasePlugin],
    }).withSchema(SERVICE_NAME.toLowerCase());

    this.rawReaderInstance = new Kysely<DB>({
      dialect: readerDialect,
    }).withSchema(SERVICE_NAME.toLowerCase());
  }

  get writer() {
    return this.writerInstance;
  }

  get reader() {
    return this.readerInstance;
  }

  get rawWriter() {
    return this.rawWriterInstance;
  }

  get rawReader() {
    return this.rawReaderInstance;
  }

  async onApplicationShutdown() {
    await this.writerInstance.destroy();
    await this.readerInstance.destroy();
  }

  async onModuleInit() {
    await this.migrationsService.migrate();
  }
}
