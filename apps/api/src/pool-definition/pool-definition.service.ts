import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { DatabaseService } from '../storage/database.service';
import { WorkspaceService } from '../workspace/workspace.service';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { PoolDefinitionEntity } from './entities/pool-definition.entity';
import { ErrorCode } from '../error-code';
import { throwServiceError } from '../error';
import { UserEntity } from '../users/entities/user.entity';
import { UpsertPoolDefinitionDto } from './dto/upsert-pool-definition.dto';

@Injectable()
export class PoolDefinitionService {
  constructor(
    private readonly db: DatabaseService,
    private readonly workspaceService: WorkspaceService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache
  ) {}

  public async getAll(includesUsers = false): Promise<PoolDefinitionEntity[]> {
    return await this.db.reader
      .selectFrom('poolDefinitions')
      .selectAll('poolDefinitions')
      .$if(includesUsers, this.db.includeEntityControlUsers('poolDefinitions'))
      .orderBy('createdAt', 'desc')
      .execute();
  }

  public async getById(
    workspaceId: string,
    environmentId: string,
    includesUser: boolean
  ): Promise<PoolDefinitionEntity>;

  public async getById<T extends false>(
    workspaceId: string,
    environmentId: string,
    includesUser: boolean,
    throwOnNotFound: T
  ): Promise<PoolDefinitionEntity | undefined>;

  public async getById<T extends true>(
    workspaceId: string,
    environmentId: string,
    includesUser: boolean,
    throwOnNotFound: T
  ): Promise<PoolDefinitionEntity>;

  public async getById(
    workspaceId: string,
    environmentId: string,
    includesUser = false,
    throwOnNotFound = false
  ): Promise<PoolDefinitionEntity | undefined> {
    const poolDefinition = await this.cache.wrap(
      this.getPoolDefinitionCacheKey(workspaceId, environmentId, includesUser),
      () =>
        this.db.reader
          .selectFrom('poolDefinitions')
          .selectAll('poolDefinitions')
          .$if(
            includesUser,
            this.db.includeEntityControlUsers('poolDefinitions')
          )
          .where('workspaceId', '=', workspaceId)
          .where('environmentId', '=', environmentId)
          .executeTakeFirst()
    );

    if (throwOnNotFound && !poolDefinition) {
      throwServiceError(
        HttpStatus.NOT_FOUND,
        ErrorCode.POOL_DEFINITION_NOT_FOUND,
        {
          workspaceId,
          environmentId,
        }
      );
    }

    return poolDefinition;
  }

  public async getByMemberUserId(
    workspaceId: string,
    environmentId: string,
    userId: string,
    includesUser: boolean
  ): Promise<PoolDefinitionEntity>;

  public async getByMemberUserId<T extends false>(
    workspaceId: string,
    environmentId: string,
    userId: string,
    includesUser: boolean,
    throwOnNotFound: T
  ): Promise<PoolDefinitionEntity | undefined>;

  public async getByMemberUserId<T extends true>(
    workspaceId: string,
    environmentId: string,
    userId: string,
    includesUser: boolean,
    throwOnNotFound: T
  ): Promise<PoolDefinitionEntity>;

  public async getByMemberUserId(
    workspaceId: string,
    environmentId: string,
    userId: string,
    includesUser: boolean,
    throwOnNotFound = true
  ): Promise<PoolDefinitionEntity | undefined> {
    const poolDefinition = await this.db.reader
      .selectFrom('poolDefinitions')
      .selectAll('poolDefinitions')
      .innerJoin(
        'workspaceUsers',
        'poolDefinitions.workspaceId',
        'workspaceUsers.workspaceId'
      )
      .where('workspaceUsers.userId', '=', userId)
      .where('poolDefinitions.workspaceId', '=', workspaceId)
      .where('poolDefinitions.environmentId', '=', environmentId)
      .$if(includesUser, this.db.includeEntityControlUsers('poolDefinitions'))
      .executeTakeFirst();

    if (throwOnNotFound && !poolDefinition) {
      throwServiceError(
        HttpStatus.NOT_FOUND,
        ErrorCode.POOL_DEFINITION_NOT_FOUND,
        {
          workspaceId,
          environmentId,
        }
      );
    }

    return poolDefinition;
  }

  public async upsert(
    workspaceId: string,
    environmentId: string,
    payload: UpsertPoolDefinitionDto,
    user: UserEntity
  ): Promise<PoolDefinitionEntity> {
    await this.workspaceService.throwIfNotWorkspaceMember(workspaceId, user.id);

    const poolDefinition = await this.db.writer
      .insertInto('poolDefinitions')
      .values({
        ...payload,
        workspaceId,
        environmentId,
        definition: JSON.stringify(payload.definition),
        createdBy: user.id,
        updatedBy: user.id,
      })
      .returningAll()
      .onConflict((oc) =>
        oc
          .column('workspaceId')
          .column('environmentId')
          .doUpdateSet({
            definition: JSON.stringify(payload.definition),
            updatedBy: user.id,
            updatedAt: new Date(),
          })
      )
      .executeTakeFirstOrThrow();

    await this.cache.mdel([
      this.getPoolDefinitionCacheKey(workspaceId, environmentId, true),
      this.getPoolDefinitionCacheKey(workspaceId, environmentId, false),
    ]);

    return poolDefinition;
  }

  public async delete(
    workspaceId: string,
    environmentId: string,
    user: UserEntity
  ): Promise<void> {
    await this.workspaceService.throwIfNotWorkspaceMember(workspaceId, user.id);
    await this.db.writer
      .deleteFrom('poolDefinitions')
      .where('workspaceId', '=', workspaceId)
      .where('environmentId', '=', environmentId)
      .execute();

    await this.cache.mdel([
      this.getPoolDefinitionCacheKey(workspaceId, environmentId, true),
      this.getPoolDefinitionCacheKey(workspaceId, environmentId, false),
    ]);
  }

  private getPoolDefinitionCacheKey(
    workspaceId: string,
    environmentId: string,
    includesUser: boolean
  ) {
    return `pool-definition:${workspaceId}:${environmentId}${
      includesUser ? ':includesUser' : ''
    }`;
  }
}
