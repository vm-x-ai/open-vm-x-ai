import {
  CompiledQuery,
  DatabaseIntrospector,
  DatabaseMetadataOptions,
  DEFAULT_MIGRATION_LOCK_TABLE,
  DEFAULT_MIGRATION_TABLE,
  DialectAdapter,
  Kysely,
  MigrationLockOptions,
  PostgresAdapter,
  PostgresDialect,
  PostgresIntrospector,
  SchemaMetadata,
  sql,
  TableMetadata,
} from 'kysely';

export class QuestDBIntrospector extends PostgresIntrospector {
  private readonly db: Kysely<unknown>;

  constructor(db: Kysely<unknown>) {
    super(db);
    this.db = db;
  }

  override async getSchemas(): Promise<SchemaMetadata[]> {
    return [
      {
        name: 'public',
      },
    ];
  }

  override async getTables(
    options?: DatabaseMetadataOptions
  ): Promise<TableMetadata[]> {
    const result = await this.db.executeQuery<{ table_name: string }>(
      CompiledQuery.raw('SHOW TABLES')
    );
    let rows = result.rows;
    if (!options?.withInternalKyselyTables) {
      rows = result.rows.filter(
        (row) =>
          row.table_name !== DEFAULT_MIGRATION_TABLE &&
          row.table_name !== DEFAULT_MIGRATION_LOCK_TABLE
      );
    }

    return rows.map((row) => ({
      name: row.table_name,
      isView: false,
      columns: [],
      schema: 'public',
    }));
  }
}

// Random id for our transaction lock.
const LOCK_ID = BigInt('3853314791062309107');

export class QuestDBAdapter extends PostgresAdapter {
  override async acquireMigrationLock(
    db: Kysely<unknown>,
    opt: MigrationLockOptions
  ): Promise<void> {
    const lockTable = opt.lockTable ?? DEFAULT_MIGRATION_LOCK_TABLE;
    const lockRowId = opt.lockRowId ?? LOCK_ID;
    await sql`INSERT INTO ${sql.ref(
      lockTable
    )} (id, is_locked) VALUES (${sql.lit(lockRowId)}, 1)`.execute(db);
  }

  override async releaseMigrationLock(
    db: Kysely<unknown>,
    opt: MigrationLockOptions
  ): Promise<void> {
    const lockTable = opt.lockTable ?? DEFAULT_MIGRATION_LOCK_TABLE;
    await sql`TRUNCATE TABLE ${sql.ref(lockTable)}`.execute(db);
  }
}

export class QuestDBDialect extends PostgresDialect {
  override createIntrospector(db: Kysely<unknown>): DatabaseIntrospector {
    return new QuestDBIntrospector(db);
  }

  override createAdapter(): DialectAdapter {
    return new QuestDBAdapter();
  }
}
