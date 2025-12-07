import { CamelCasePlugin } from 'kysely';
import { DatabaseService } from '../../storage/database.service';
import { Adapter, AdapterPayload } from 'oidc-provider';
import { Inject } from '@nestjs/common';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';

const DEFAULT_TTL = 1 * 60 * 60 * 1000; // 1 hour in milliseconds

export class KyselyAdapter implements Adapter {
  private camelCasePlugin = new CamelCasePlugin({
    maintainNestedObjectKeys: true,
  });

  constructor(
    public modelName: string,
    public db: DatabaseService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache
  ) {}

  private get writer() {
    return this.db.rawWriter.withPlugin(this.camelCasePlugin);
  }

  private get reader() {
    return this.db.rawReader.withPlugin(this.camelCasePlugin);
  }

  async upsert(
    id: string,
    payload: AdapterPayload,
    expiresIn: number
  ): Promise<void> {
    const expiresAt = expiresIn
      ? new Date(Date.now() + expiresIn * 1000)
      : null;
    const grantId = payload.grantId || null;

    await this.writer
      .insertInto('oidcProvider')
      .values({
        id,
        payload: JSON.stringify(payload),
        grantId,
        expiresAt,
        uid: payload.uid || null,
        userCode: payload.userCode || null,
        consumed: false,
      })
      .onConflict((oc) =>
        oc.column('id').doUpdateSet({
          payload: JSON.stringify(payload),
          grantId,
          expiresAt,
        })
      )
      .execute();

    await this.cache.mdel([
      this.getOidcProviderCacheKey(id),
      this.getOidcProviderByUserCodeCacheKey(payload.userCode || ''),
      this.getOidcProviderByUidCacheKey(payload.uid || ''),
    ]);
  }

  async find(id: string): Promise<void | AdapterPayload> {
    const row = await this.cache.wrap(
      this.getOidcProviderCacheKey(id),
      () =>
        this.reader
          .selectFrom('oidcProvider')
          .select(['payload', 'expiresAt'])
          .where('id', '=', id)
          .executeTakeFirst(),
      { ttl: DEFAULT_TTL }
    );
    if (!row) return undefined;
    if (row.expiresAt && new Date(row.expiresAt) < new Date()) {
      await this.destroy(id);
      return undefined;
    }
    return row.payload as AdapterPayload;
  }

  async findByUserCode(userCode: string): Promise<void | AdapterPayload> {
    const row = await this.cache.wrap(
      this.getOidcProviderByUserCodeCacheKey(userCode),
      () =>
        this.reader
          .selectFrom('oidcProvider')
          .select(['payload', 'expiresAt', 'id'])
          .where('userCode', '=', userCode)
          .executeTakeFirst(),
      { ttl: DEFAULT_TTL }
    );

    if (!row) return undefined;
    if (row.expiresAt && new Date(row.expiresAt) < new Date()) {
      await this.destroy(row.id);
      return undefined;
    }
    return row.payload as AdapterPayload;
  }

  async findByUid(uid: string): Promise<void | AdapterPayload> {
    const row = await this.cache.wrap(
      this.getOidcProviderByUidCacheKey(uid),
      () =>
        this.reader
          .selectFrom('oidcProvider')
          .select(['payload', 'expiresAt', 'id'])
          .where('uid', '=', uid)
          .executeTakeFirst(),
      { ttl: DEFAULT_TTL }
    );
    if (!row) return undefined;
    if (row.expiresAt && new Date(row.expiresAt) < new Date()) {
      await this.destroy(row.id);
      return undefined;
    }

    return row.payload as AdapterPayload;
  }

  async consume(id: string): Promise<void> {
    await this.writer
      .updateTable('oidcProvider')
      .set({ consumed: true })
      .where('id', '=', id)
      .execute();
  }

  async destroy(id: string): Promise<void> {
    await this.writer.deleteFrom('oidcProvider').where('id', '=', id).execute();
  }

  async revokeByGrantId(grantId: string): Promise<void> {
    await this.writer
      .deleteFrom('oidcProvider')
      .where('grantId', '=', grantId)
      .execute();
  }

  private getOidcProviderCacheKey(id: string) {
    return `oidc:provider:${id}`;
  }

  private getOidcProviderByUserCodeCacheKey(userCode: string) {
    return `oidc:provider:userCode:${userCode}`;
  }

  private getOidcProviderByUidCacheKey(uid: string) {
    return `oidc:provider:uid:${uid}`;
  }
}
