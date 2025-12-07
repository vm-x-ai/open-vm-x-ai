import { Kysely, Migration, sql } from 'kysely';
import { DB } from '../storage/entities.generated';

export const migration: Migration = {
  async up(db: Kysely<DB>): Promise<void> {
    await db.schema
      .createTable('environments')
      .addColumn('workspace_id', 'uuid', (col) =>
        col.notNull().references('workspaces.workspace_id').onDelete('cascade')
      )
      .addColumn('environment_id', 'uuid', (col) =>
        col.notNull().defaultTo(sql`gen_random_uuid()`)
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
      .addPrimaryKeyConstraint('pk_environments', [
        'environment_id',
        'workspace_id',
      ])
      .execute();

    await db.schema
      .createIndex('idx_environments_workspace_id')
      .on('environments')
      .column('workspace_id')
      .execute();

    await db.schema
      .createIndex('idx_environments_created_by')
      .on('environments')
      .column('created_by')
      .execute();

    await db.schema
      .createIndex('idx_environments_updated_by')
      .on('environments')
      .column('updated_by')
      .execute();
  },

  async down(db: Kysely<unknown>): Promise<void> {
    // Drop indexes first
    await db.schema.dropIndex('idx_environments_workspace_id').execute();
    await db.schema.dropIndex('idx_environments_created_by').execute();
    await db.schema.dropIndex('idx_environments_updated_by').execute();
    await db.schema.dropTable('environments').execute();
  },
};
