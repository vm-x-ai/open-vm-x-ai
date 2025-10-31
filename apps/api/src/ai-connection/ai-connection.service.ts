import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { DatabaseService } from '../storage/database.service';
import { WorkspaceService } from '../workspace/workspace.service';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { AIConnectionEntity } from './entities/ai-connection.entity';
import { throwServiceError } from '../error';
import { ErrorCode } from '../error-code';
import { CreateAIConnectionDto } from './dto/create-ai-connection.dto';
import { UserEntity } from '../users/entities/user.entity';
import { UpdateAIConnectionDto } from './dto/update-ai-connection.dto';
import { sql } from 'kysely';

@Injectable()
export class AIConnectionService {
  constructor(
    private readonly db: DatabaseService,
    private readonly workspaceService: WorkspaceService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache
  ) {}

  public async getAll(includesUsers = false): Promise<AIConnectionEntity[]> {
    return await this.db.reader
      .selectFrom('aiConnections')
      .selectAll('aiConnections')
      .$if(includesUsers, this.db.includeEntityControlUsers('aiConnections'))
      .orderBy('createdAt', 'desc')
      .execute();
  }

  public async getById(
    workspaceId: string,
    environmentId: string,
    connectionId: string,
    includesUser: boolean
  ): Promise<AIConnectionEntity>;

  public async getById<T extends false>(
    workspaceId: string,
    environmentId: string,
    connectionId: string,
    includesUser: boolean,
    throwOnNotFound: T
  ): Promise<AIConnectionEntity | undefined>;

  public async getById<T extends true>(
    workspaceId: string,
    environmentId: string,
    connectionId: string,
    includesUser: boolean,
    throwOnNotFound: T
  ): Promise<AIConnectionEntity>;

  public async getById(
    workspaceId: string,
    environmentId: string,
    connectionId: string,
    includesUser = false,
    throwOnNotFound = true
  ): Promise<AIConnectionEntity | undefined> {
    const aiConnection = await this.cache.wrap(
      this.getAIConnectionCacheKey(
        workspaceId,
        environmentId,
        connectionId,
        includesUser
      ),
      () =>
        this.db.reader
          .selectFrom('aiConnections')
          .selectAll('aiConnections')
          .$if(includesUser, this.db.includeEntityControlUsers('aiConnections'))
          .where('workspaceId', '=', workspaceId)
          .where('environmentId', '=', environmentId)
          .where('connectionId', '=', connectionId)
          .executeTakeFirst()
    );

    if (throwOnNotFound && !aiConnection) {
      throwServiceError(
        HttpStatus.NOT_FOUND,
        ErrorCode.AI_CONNECTION_NOT_FOUND,
        {
          connectionId,
        }
      );
    }

    return aiConnection;
  }

  public async getAllByMemberUserId(
    workspaceId: string,
    environmentId: string,
    userId: string,
    includesUser = false
  ): Promise<AIConnectionEntity[]> {
    return await this.db.reader
      .selectFrom('aiConnections')
      .selectAll('aiConnections')
      .$if(includesUser, this.db.includeEntityControlUsers('aiConnections'))
      .innerJoin(
        'workspaceUsers',
        'aiConnections.workspaceId',
        'workspaceUsers.workspaceId'
      )
      .where('aiConnections.workspaceId', '=', workspaceId)
      .where('aiConnections.environmentId', '=', environmentId)
      .where('workspaceUsers.userId', '=', userId)
      .execute();
  }

  public async getByMemberUserId(
    workspaceId: string,
    environmentId: string,
    connectionId: string,
    userId: string,
    includesUser: boolean
  ): Promise<AIConnectionEntity>;

  public async getByMemberUserId<T extends false>(
    workspaceId: string,
    environmentId: string,
    connectionId: string,
    userId: string,
    includesUser: boolean,
    throwOnNotFound: T
  ): Promise<AIConnectionEntity | undefined>;

  public async getByMemberUserId<T extends true>(
    workspaceId: string,
    environmentId: string,
    connectionId: string,
    userId: string,
    includesUser: boolean,
    throwOnNotFound: T
  ): Promise<AIConnectionEntity>;

  public async getByMemberUserId(
    workspaceId: string,
    environmentId: string,
    connectionId: string,
    userId: string,
    includesUser: boolean,
    throwOnNotFound = true
  ): Promise<AIConnectionEntity | undefined> {
    const aiConnection = await this.db.reader
      .selectFrom('aiConnections')
      .selectAll('aiConnections')
      .innerJoin(
        'workspaceUsers',
        'aiConnections.workspaceId',
        'workspaceUsers.workspaceId'
      )
      .where('workspaceUsers.userId', '=', userId)
      .where('aiConnections.workspaceId', '=', workspaceId)
      .where('aiConnections.environmentId', '=', environmentId)
      .where('aiConnections.connectionId', '=', connectionId)
      .$if(includesUser, this.db.includeEntityControlUsers('aiConnections'))
      .executeTakeFirst();

    if (throwOnNotFound && !aiConnection) {
      throwServiceError(
        HttpStatus.NOT_FOUND,
        ErrorCode.AI_CONNECTION_NOT_FOUND,
        {
          connectionId,
        }
      );
    }

    return aiConnection;
  }

  public async create(
    workspaceId: string,
    environmentId: string,
    payload: CreateAIConnectionDto,
    user: UserEntity
  ): Promise<AIConnectionEntity> {
    await this.workspaceService.throwIfNotWorkspaceMember(workspaceId, user.id);

    // TODO: Validate config/encrypt secrets based on provider
    return await this.db.writer
      .insertInto('aiConnections')
      .values({
        ...payload,
        workspaceId,
        environmentId,
        config: payload.config ? JSON.stringify(payload.config) : null,
        capacity: payload.capacity ? JSON.stringify(payload.capacity) : null,
        allowedModels: payload.allowedModels
          ? JSON.stringify(payload.allowedModels)
          : null,
        createdBy: user.id,
        updatedBy: user.id,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  public async update(
    workspaceId: string,
    environmentId: string,
    connectionId: string,
    payload: UpdateAIConnectionDto,
    user: UserEntity
  ): Promise<AIConnectionEntity> {
    await this.workspaceService.throwIfNotWorkspaceMember(workspaceId, user.id);

    const aiConnection = await this.db.writer
      .updateTable('aiConnections')
      .set({
        ...payload,
        allowedModels: payload.allowedModels
          ? JSON.stringify(payload.allowedModels)
          : undefined,
        capacity: payload.capacity
          ? JSON.stringify(payload.capacity)
          : undefined,
        config: payload.config ? JSON.stringify(payload.config) : undefined,
        updatedBy: user.id,
        updatedAt: new Date(),
      })
      .where('workspaceId', '=', workspaceId)
      .where('environmentId', '=', environmentId)
      .where('connectionId', '=', connectionId)
      .returningAll()
      .executeTakeFirstOrThrow();

    await this.cache.mdel([
      this.getAIConnectionCacheKey(
        workspaceId,
        environmentId,
        connectionId,
        true
      ),
      this.getAIConnectionCacheKey(
        workspaceId,
        environmentId,
        connectionId,
        false
      ),
    ]);

    return aiConnection;
  }

  public async delete(
    workspaceId: string,
    environmentId: string,
    connectionId: string,
    user: UserEntity
  ): Promise<void> {
    await this.workspaceService.throwIfNotWorkspaceMember(workspaceId, user.id);
    await this.db.writer.transaction().execute(async (tx) => {
      const connectionIdPattern = `%${connectionId}%`;
      await tx
        .deleteFrom('aiResources')
        .where('workspaceId', '=', workspaceId)
        .where('environmentId', '=', environmentId)
        .where((eb) =>
          eb.or([
            eb(sql`COALESCE(model::text, '')`, 'like', connectionIdPattern),
            eb(
              sql`COALESCE(fallback_models::text, '')`,
              'like',
              connectionIdPattern
            ),
            eb(
              sql`COALESCE(secondary_models::text, '')`,
              'like',
              connectionIdPattern
            ),
            eb(sql`COALESCE(routing::text, '')`, 'like', connectionIdPattern),
          ])
        )
        .execute();

      await tx
        .deleteFrom('aiConnections')
        .where('workspaceId', '=', workspaceId)
        .where('environmentId', '=', environmentId)
        .where('connectionId', '=', connectionId)
        .execute();
    });

    await this.cache.mdel([
      this.getAIConnectionCacheKey(
        workspaceId,
        environmentId,
        connectionId,
        true
      ),
      this.getAIConnectionCacheKey(
        workspaceId,
        environmentId,
        connectionId,
        false
      ),
    ]);
  }

  private getAIConnectionCacheKey(
    workspaceId: string,
    environmentId: string,
    connectionId: string,
    includesUser: boolean
  ) {
    return `ai-connection:${workspaceId}:${environmentId}:${connectionId}${
      includesUser ? ':includesUser' : ''
    }`;
  }
}
