import { Kysely, Migration, sql } from 'kysely';
import { DB } from '../storage/entities.generated';

export const migration: Migration = {
  async up(db: Kysely<DB>): Promise<void> {
    await db.schema
      .createTable('workspaces')
      .addColumn('workspace_id', 'uuid', (col) =>
        col.primaryKey().defaultTo(sql`gen_random_uuid()`)
      )
      .addColumn('name', 'text', (col) => col.notNull())
      .addColumn('description', 'text')
      .addColumn('created_at', 'timestamp', (col) =>
        col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull()
      )
      .addColumn('created_by', 'uuid', (col) =>
        col.notNull().references('users.id')
      )
      .addColumn('updated_at', 'timestamp', (col) =>
        col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull()
      )
      .addColumn('updated_by', 'uuid', (col) =>
        col.notNull().references('users.id')
      )
      .execute();

    await db.schema
      .createIndex('idx_workspaces_created_by')
      .on('workspaces')
      .column('created_by')
      .execute();

    await db.schema
      .createIndex('idx_workspaces_updated_by')
      .on('workspaces')
      .column('updated_by')
      .execute();
  },

  async down(db: Kysely<unknown>): Promise<void> {
    // Drop indexes first
    await db.schema.dropIndex('idx_workspaces_created_by').execute();
    await db.schema.dropIndex('idx_workspaces_updated_by').execute();
    await db.schema.dropTable('workspaces').execute();
  },
};
