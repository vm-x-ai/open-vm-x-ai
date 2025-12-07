import { Kysely, Migration, sql } from 'kysely';
import { DB } from '../storage/entities.generated';

export const migration: Migration = {
  async up(db: Kysely<DB>): Promise<void> {
    await sql`CREATE TYPE WORKSPACE_USER_ROLE AS ENUM ('OWNER', 'MEMBER')`.execute(
      db
    );

    await db.schema
      .createTable('workspace_users')
      .addColumn('workspace_id', 'uuid', (col) =>
        col.notNull().references('workspaces.workspace_id').onDelete('cascade')
      )
      .addColumn('user_id', 'uuid', (col) =>
        col.notNull().references('users.id')
      )
      .addColumn('role', sql`WORKSPACE_USER_ROLE`, (col) => col.notNull())
      .addColumn('added_at', 'timestamp', (col) =>
        col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull()
      )
      .addColumn('added_by', 'uuid', (col) =>
        col.notNull().references('users.id')
      )
      .addPrimaryKeyConstraint('pk_workspace_users', [
        'workspace_id',
        'user_id',
      ])
      .execute();

    await db.schema
      .createIndex('idx_workspace_users_added_by')
      .on('workspace_users')
      .column('added_by')
      .execute();

    await db.schema
      .createIndex('idx_workspace_users_workspace_id')
      .on('workspace_users')
      .column('workspace_id')
      .execute();

    await db.schema
      .createIndex('idx_workspace_users_user_id')
      .on('workspace_users')
      .column('user_id')
      .execute();

    await db.schema
      .createIndex('idx_workspace_users_role')
      .on('workspace_users')
      .column('role')
      .execute();
  },

  async down(db: Kysely<unknown>): Promise<void> {
    // Drop indexes first
    await db.schema.dropIndex('idx_workspace_users_added_by').execute();
    await db.schema.dropIndex('idx_workspace_users_workspace_id').execute();
    await db.schema.dropIndex('idx_workspace_users_user_id').execute();
    await db.schema.dropIndex('idx_workspace_users_role').execute();
    await db.schema.dropTable('workspace_users').execute();
    await sql`DROP TYPE IF EXISTS WORKSPACE_USER_ROLE`.execute(db);
  },
};
