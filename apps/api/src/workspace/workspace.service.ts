import { HttpStatus, Injectable } from '@nestjs/common';
import { DatabaseService } from '../storage/database.service';
import { WorkspaceEntity } from './entities/workspace.entity';
import { Expression } from 'kysely';
import { jsonObjectFrom } from 'kysely/helpers/postgres';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UserEntity } from '../users/entities/user.entity';
import { PublicWorkspaceUserRole } from '../storage/entities.generated';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { throwServiceError } from '../error';
import { ErrorCode } from '../error-code';

@Injectable()
export class WorkspaceService {
  constructor(private readonly db: DatabaseService) {}

  public async getAll(includesUsers = false): Promise<WorkspaceEntity[]> {
    return await this.db.reader
      .selectFrom('workspaces')
      .selectAll('workspaces')
      .$if(includesUsers, (qb) =>
        qb.select(({ ref }) => [
          this.withUser(ref('workspaces.createdBy'), 'createdBy')
            .$notNull()
            .as('createdBy'),
          this.withUser(ref('workspaces.updatedBy'), 'updatedBy')
            .$notNull()
            .as('updatedBy'),
        ])
      )
      .orderBy('createdAt', 'desc')
      .execute();
  }

  public async getById(
    workspaceId: string,
    includesUser: boolean
  ): Promise<WorkspaceEntity>;

  public async getById<T extends false>(
    workspaceId: string,
    includesUser: boolean,
    throwOnNotFound: T
  ): Promise<WorkspaceEntity | undefined>;

  public async getById<T extends true>(
    workspaceId: string,
    includesUser: boolean,
    throwOnNotFound: T
  ): Promise<WorkspaceEntity>;

  public async getById(
    workspaceId: string,
    includesUser = false,
    throwOnNotFound = true
  ): Promise<WorkspaceEntity | undefined> {
    const workspace = await this.db.reader
      .selectFrom('workspaces')
      .selectAll('workspaces')
      .$if(includesUser, (qb) =>
        qb.select(({ ref }) => [
          this.withUser(ref('workspaces.createdBy'), 'createdBy')
            .$notNull()
            .as('createdBy'),
          this.withUser(ref('workspaces.updatedBy'), 'updatedBy')
            .$notNull()
            .as('updatedBy'),
        ])
      )
      .where('workspaceId', '=', workspaceId)
      .executeTakeFirst();

    if (throwOnNotFound && !workspace) {
      throwServiceError(HttpStatus.NOT_FOUND, ErrorCode.WORKSPACE_NOT_FOUND, {
        workspaceId,
      });
    }

    return workspace;
  }

  public async getAllByMemberUserId(
    userId: string,
    includesUser = false
  ): Promise<WorkspaceEntity[]> {
    return await this.db.reader
      .selectFrom('workspaces')
      .selectAll('workspaces')
      .$if(includesUser, (qb) =>
        qb.select(({ ref }) => [
          this.withUser(ref('workspaces.createdBy'), 'createdBy')
            .$notNull()
            .as('createdBy'),
          this.withUser(ref('workspaces.updatedBy'), 'updatedBy')
            .$notNull()
            .as('updatedBy'),
        ])
      )
      .innerJoin(
        'workspaceUsers',
        'workspaces.workspaceId',
        'workspaceUsers.workspaceId'
      )
      .where('workspaceUsers.userId', '=', userId)
      .execute();
  }

  public async getByMemberUserId(
    workspaceId: string,
    userId: string,
    includesUser: boolean
  ): Promise<WorkspaceEntity>;

  public async getByMemberUserId<T extends false>(
    workspaceId: string,
    userId: string,
    includesUser: boolean,
    throwOnNotFound: T
  ): Promise<WorkspaceEntity | undefined>;

  public async getByMemberUserId<T extends true>(
    workspaceId: string,
    userId: string,
    includesUser: boolean,
    throwOnNotFound: T
  ): Promise<WorkspaceEntity>;

  public async getByMemberUserId(
    workspaceId: string,
    userId: string,
    includesUser: boolean,
    throwOnNotFound = true
  ): Promise<WorkspaceEntity | undefined> {
    const workspace = await this.db.reader
      .selectFrom('workspaces')
      .selectAll('workspaces')
      .innerJoin(
        'workspaceUsers',
        'workspaces.workspaceId',
        'workspaceUsers.workspaceId'
      )
      .where('workspaceUsers.userId', '=', userId)
      .where('workspaces.workspaceId', '=', workspaceId)
      .$if(includesUser, (qb) =>
        qb.select(({ ref }) => [
          this.withUser(ref('workspaces.createdBy'), 'createdBy')
            .$notNull()
            .as('createdBy'),
          this.withUser(ref('workspaces.updatedBy'), 'updatedBy')
            .$notNull()
            .as('updatedBy'),
        ])
      )
      .executeTakeFirst();

    if (throwOnNotFound && !workspace) {
      throwServiceError(HttpStatus.NOT_FOUND, ErrorCode.WORKSPACE_NOT_FOUND, {
        workspaceId,
      });
    }

    return workspace;
  }

  public async create(
    payload: CreateWorkspaceDto,
    user: UserEntity
  ): Promise<WorkspaceEntity> {
    return this.db.writer.transaction().execute(async (tx) => {
      const workspace = await tx
        .insertInto('workspaces')
        .values({ ...payload, createdBy: user.id, updatedBy: user.id })
        .returningAll()
        .executeTakeFirstOrThrow();

      await tx
        .insertInto('workspaceUsers')
        .values({
          workspaceId: workspace.workspaceId,
          userId: user.id,
          addedBy: user.id,
          role: PublicWorkspaceUserRole.OWNER,
        })
        .execute();

      return workspace;
    });
  }

  public async update(
    workspaceId: string,
    payload: UpdateWorkspaceDto,
    user: UserEntity
  ): Promise<WorkspaceEntity> {
    return this.db.writer.transaction().execute(async (tx) => {
      const workspaceUser = await tx
        .selectFrom('workspaceUsers')
        .where('workspaceId', '=', workspaceId)
        .where('userId', '=', user.id)
        .executeTakeFirst();

      if (!workspaceUser) {
        throwServiceError(
          HttpStatus.BAD_REQUEST,
          ErrorCode.WORKSPACE_NOT_MEMBER
        );
      }

      const workspace = await tx
        .updateTable('workspaces')
        .set({
          ...payload,
          updatedBy: user.id,
          updatedAt: new Date(),
        })
        .where('workspaceId', '=', workspaceId)
        .returningAll()
        .executeTakeFirstOrThrow();

      return workspace;
    });
  }

  public async delete(workspaceId: string): Promise<void> {
    await this.db.writer.transaction().execute(async (tx) => {
      const workspaceUser = await tx
        .selectFrom('workspaceUsers')
        .select('role')
        .where('workspaceId', '=', workspaceId)
        .executeTakeFirst();

      if (!workspaceUser) {
        throwServiceError(
          HttpStatus.BAD_REQUEST,
          ErrorCode.WORKSPACE_NOT_MEMBER
        );
      }

      if (workspaceUser.role !== PublicWorkspaceUserRole.OWNER) {
        throwServiceError(
          HttpStatus.BAD_REQUEST,
          ErrorCode.WORKSPACE_DELETE_NOT_ALLOWED,
          { workspaceId }
        );
      }

      await tx
        .deleteFrom('workspaceUsers')
        .where('workspaceId', '=', workspaceId)
        .execute();
      await tx
        .deleteFrom('workspaces')
        .where('workspaceId', '=', workspaceId)
        .execute();
    });
  }

  private withUser(userId: Expression<string>, alias: string) {
    return jsonObjectFrom(
      this.db.reader
        .selectFrom(`users as ${alias}`)
        .select([
          'id',
          'name',
          'firstName',
          'lastName',
          'username',
          'email',
          'emailVerified',
          'pictureUrl',
          'providerType',
          'providerId',
          'providerMetadata',
          'createdAt',
          'updatedAt',
        ])
        .where(`${alias}.id`, '=', userId)
    );
  }
}
