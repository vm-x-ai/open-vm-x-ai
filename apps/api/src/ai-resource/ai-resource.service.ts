import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { DatabaseService } from '../storage/database.service';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { AIResourceEntity } from './entities/ai-resource.entity';
import { throwServiceError } from '../error';
import { ErrorCode } from '../error-code';
import { CreateAIResourceDto } from './dto/create-ai-resource.dto';
import { UserEntity } from '../users/entities/user.entity';
import { UpdateAIResourceDto } from './dto/update-ai-resource.dto';
import { ListAIResourceDto } from './dto/list-ai-resource.dto';
import { GetAIResourceDto } from './dto/get-ai-resource.dto';
import { sql } from 'kysely';
import { PoolDefinitionEntry } from '../pool-definition/entities/pool-definition.entity';
import { ApiKeyService } from '../api-key/api-key.service';
import { DatabaseError } from 'pg';
import { PoolDefinitionService } from '../pool-definition/pool-definition.service';

@Injectable()
export class AIResourceService {
  constructor(
    private readonly db: DatabaseService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
    private readonly apiKeyService: ApiKeyService,
    private readonly poolDefinitionService: PoolDefinitionService
  ) {}

  public async getAll({
    workspaceId,
    environmentId,
    includesUsers = false,
    connectionId,
  }: ListAIResourceDto): Promise<AIResourceEntity[]> {
    return await this.db.reader
      .selectFrom('aiResources')
      .selectAll('aiResources')
      .$if(!!includesUsers, this.db.includeEntityControlUsers('aiResources'))
      .$if(!!workspaceId, (qb) =>
        qb.where('aiResources.workspaceId', '=', workspaceId as string)
      )
      .$if(!!environmentId, (qb) =>
        qb.where('aiResources.environmentId', '=', environmentId as string)
      )
      .$if(!!connectionId, (qb) =>
        qb.where((eb) =>
          eb.or([
            eb(sql`COALESCE(model::text, '')`, 'like', `%${connectionId}%`),
            eb(
              sql`COALESCE(fallback_models::text, '')`,
              'like',
              `%${connectionId}%`
            ),
            eb(
              sql`COALESCE(secondary_models::text, '')`,
              'like',
              `%${connectionId}%`
            ),
            eb(sql`COALESCE(routing::text, '')`, 'like', `%${connectionId}%`),
          ])
        )
      )
      .orderBy('createdAt', 'desc')
      .execute();
  }

  public async getById(payload: GetAIResourceDto): Promise<AIResourceEntity>;

  public async getById<T extends false>(
    payload: GetAIResourceDto,
    throwOnNotFound: T
  ): Promise<AIResourceEntity | undefined>;

  public async getById<T extends true>(
    payload: GetAIResourceDto,
    throwOnNotFound: T
  ): Promise<AIResourceEntity>;

  public async getById(
    payload: GetAIResourceDto,
    throwOnNotFound: boolean
  ): Promise<AIResourceEntity | undefined>;

  public async getById(
    { workspaceId, environmentId, resourceId, includesUsers }: GetAIResourceDto,
    throwOnNotFound = true
  ): Promise<AIResourceEntity | undefined> {
    const aiResource = await this.cache.wrap(
      this.getAIResourceCacheKey(
        workspaceId,
        environmentId,
        resourceId,
        !!includesUsers
      ),
      () =>
        this.db.reader
          .selectFrom('aiResources')
          .selectAll('aiResources')
          .$if(
            !!includesUsers,
            this.db.includeEntityControlUsers('aiResources')
          )
          .where('workspaceId', '=', workspaceId)
          .where('environmentId', '=', environmentId)
          .where('resourceId', '=', resourceId)
          .executeTakeFirst()
    );

    if (throwOnNotFound && !aiResource) {
      throwServiceError(HttpStatus.NOT_FOUND, ErrorCode.AI_RESOURCE_NOT_FOUND, {
        resource: resourceId,
      });
    }

    return aiResource;
  }

  public async getByName(
    workspaceId: string,
    environmentId: string,
    resourceName: string
  ): Promise<AIResourceEntity>;

  public async getByName<T extends false>(
    workspaceId: string,
    environmentId: string,
    resourceName: string,
    throwOnNotFound: T
  ): Promise<AIResourceEntity | undefined>;

  public async getByName<T extends true>(
    workspaceId: string,
    environmentId: string,
    resourceName: string,
    throwOnNotFound: T
  ): Promise<AIResourceEntity>;

  public async getByName<T extends boolean>(
    workspaceId: string,
    environmentId: string,
    resourceName: string,
    throwOnNotFound: T
  ): Promise<AIResourceEntity | undefined>;

  public async getByName(
    workspaceId: string,
    environmentId: string,
    resourceName: string,
    throwOnNotFound = true
  ): Promise<AIResourceEntity | undefined> {
    const aiResource = await this.cache.wrap(
      this.getAIResourceByNameCacheKey(
        workspaceId,
        environmentId,
        resourceName
      ),
      () =>
        this.db.reader
          .selectFrom('aiResources')
          .selectAll('aiResources')
          .where('workspaceId', '=', workspaceId)
          .where('environmentId', '=', environmentId)
          .where('name', '=', resourceName)
          .executeTakeFirst()
    );

    if (throwOnNotFound && !aiResource) {
      throwServiceError(HttpStatus.NOT_FOUND, ErrorCode.AI_RESOURCE_NOT_FOUND, {
        resource: resourceName,
      });
    }

    return aiResource;
  }

  public async getByIds(resourceIds: string[]): Promise<AIResourceEntity[]> {
    if (resourceIds.length === 0) return [];
    return await this.db.reader
      .selectFrom('aiResources')
      .selectAll('aiResources')
      .where('resourceId', 'in', resourceIds)
      .execute();
  }

  public async create(
    workspaceId: string,
    environmentId: string,
    payload: CreateAIResourceDto,
    user: UserEntity
  ): Promise<AIResourceEntity> {
    try {
      return await this.db.writer.transaction().execute(async (tx) => {
        const { assignApiKeys, ...rest } = payload;
        const aiResource = await tx
          .insertInto('aiResources')
          .values({
            ...rest,
            workspaceId,
            environmentId,
            model: JSON.stringify(payload.model),
            routing: payload.routing ? JSON.stringify(payload.routing) : null,
            secondaryModels: payload.secondaryModels
              ? JSON.stringify(payload.secondaryModels)
              : null,
            fallbackModels: payload.fallbackModels
              ? JSON.stringify(payload.fallbackModels)
              : null,
            capacity: payload.capacity
              ? JSON.stringify(payload.capacity)
              : null,
            enforceCapacity: payload.enforceCapacity,
            createdBy: user.id,
            updatedBy: user.id,
          })
          .returningAll()
          .executeTakeFirstOrThrow();

        if (payload.assignApiKeys && payload.assignApiKeys.length > 0) {
          await this.apiKeyService.appendResource(
            workspaceId,
            environmentId,
            payload.assignApiKeys,
            aiResource.resourceId,
            tx
          );
        }

        return aiResource;
      });
    } catch (error) {
      if (error instanceof DatabaseError && error.code === '23505') {
        throwServiceError(
          HttpStatus.BAD_REQUEST,
          ErrorCode.AI_RESOURCE_ALREADY_EXISTS,
          {
            resource: payload.name,
          }
        );
      }
      throw error;
    }
  }

  public async update(
    workspaceId: string,
    environmentId: string,
    resourceId: string,
    payload: UpdateAIResourceDto,
    user: UserEntity
  ): Promise<AIResourceEntity> {
    const { updated, old } = await this.db.writer
      .transaction()
      .execute(async (tx) => {
        const existingAiResource = await tx
          .selectFrom('aiResources')
          .select('name')
          .where('workspaceId', '=', workspaceId)
          .where('environmentId', '=', environmentId)
          .where('resourceId', '=', resourceId)
          .executeTakeFirst();

        if (!existingAiResource) {
          throwServiceError(
            HttpStatus.NOT_FOUND,
            ErrorCode.AI_RESOURCE_NOT_FOUND,
            {
              resource: resourceId,
            }
          );
        }

        const aiResource = await tx
          .updateTable('aiResources')
          .set({
            ...payload,
            model: payload.model ? JSON.stringify(payload.model) : undefined,
            routing: payload.routing
              ? JSON.stringify(payload.routing)
              : undefined,
            secondaryModels: payload.secondaryModels
              ? JSON.stringify(payload.secondaryModels)
              : undefined,
            fallbackModels: payload.fallbackModels
              ? JSON.stringify(payload.fallbackModels)
              : undefined,
            capacity: payload.capacity
              ? JSON.stringify(payload.capacity)
              : undefined,
            updatedBy: user.id,
            updatedAt: new Date(),
          })
          .where('workspaceId', '=', workspaceId)
          .where('environmentId', '=', environmentId)
          .where('resourceId', '=', resourceId)
          .returningAll()
          .executeTakeFirstOrThrow();

        return { updated: aiResource, old: existingAiResource };
      });

    await this.cache.mdel([
      this.getAIResourceCacheKey(workspaceId, environmentId, resourceId, true),
      this.getAIResourceCacheKey(workspaceId, environmentId, resourceId, false),
      this.getAIResourceByNameCacheKey(workspaceId, environmentId, old.name),
    ]);

    return updated;
  }

  public async delete(
    workspaceId: string,
    environmentId: string,
    resourceId: string,
    user: UserEntity
  ): Promise<void> {
    await this.db.writer.transaction().execute(async (tx) => {
      await tx
        .deleteFrom('aiResources')
        .where('workspaceId', '=', workspaceId)
        .where('environmentId', '=', environmentId)
        .where('resourceId', '=', resourceId)
        .execute();

      const poolDefinition = await this.poolDefinitionService.getById(
        {
          workspaceId,
          environmentId,
        },
        false
      );

      if (
        poolDefinition &&
        poolDefinition.definition.some((pool) =>
          pool.resources.includes(resourceId)
        )
      ) {
        const newDefinition = poolDefinition.definition
          .map((pool: PoolDefinitionEntry) => ({
            ...pool,
            resources: pool.resources.filter(
              (resource) => resource !== resourceId
            ),
          }))
          .filter((pool) => pool.resources.length > 0);

        await this.poolDefinitionService.upsert(
          workspaceId,
          environmentId,
          {
            definition: newDefinition,
          },
          user,
          tx
        );
      }

      await this.apiKeyService.deleteResourceFromApiKeys(
        workspaceId,
        environmentId,
        resourceId,
        tx
      );
    });

    await this.cache.mdel([
      this.getAIResourceCacheKey(workspaceId, environmentId, resourceId, true),
      this.getAIResourceCacheKey(workspaceId, environmentId, resourceId, false),
    ]);
  }

  private getAIResourceCacheKey(
    workspaceId: string,
    environmentId: string,
    resourceId: string,
    includesUser: boolean
  ) {
    return `ai-resource:${workspaceId}:${environmentId}:${resourceId}${
      includesUser ? ':includesUser' : ''
    }`;
  }

  private getAIResourceByNameCacheKey(
    workspaceId: string,
    environmentId: string,
    resourceName: string
  ) {
    return `ai-resource:${workspaceId}:${environmentId}:name:${resourceName}`;
  }
}
