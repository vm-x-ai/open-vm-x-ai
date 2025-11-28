import { Kysely, Migration, sql } from 'kysely';
import { DB } from '../storage/entities';

export const migration = (db: Kysely<DB>): Migration => ({
  async up(): Promise<void> {
    await sql`
    CREATE TABLE IF NOT EXISTS completions (
      ts TIMESTAMP,
      prompt_tokens LONG,
      completion_tokens LONG,
      tokens_per_second DOUBLE,
      total_tokens LONG,
      time_to_first_token LONG,
      
      request_count LONG,
      error_count LONG,
      success_count LONG,
      
      request_duration LONG,
      provider_duration LONG,
      gate_duration LONG,
      routing_duration LONG,
      
      workspace_id SYMBOL,
      environment_id SYMBOL,
      connection_id SYMBOL,
      resource_id SYMBOL,
      provider SYMBOL,
      model SYMBOL,
      request_id STRING,
      message_id STRING,
      failure_reason SYMBOL,
      status_code INT,
      correlation_id STRING,
      api_key_id SYMBOL,
      source_ip STRING,
      user_id SYMBOL
    ) TIMESTAMP(ts)
    PARTITION BY DAY;
    `.execute(db);
  },

  async down(): Promise<void> {
    await db.schema.dropTable('completions').execute();
  },
});
