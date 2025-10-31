import { Body, Controller, Delete, Get, Post, Put } from '@nestjs/common';
import { EnvironmentService } from './environment.service';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { EnvironmentEntity } from './entities/environment.entity';
import { CreateEnvironmentDto } from './dto/create-environment.dto';
import { AuthenticatedUser } from '../auth/auth.guard';
import { UserEntity } from '../users/entities/user.entity';
import { UpdateEnvironmentDto } from './dto/update-environment.dto';
import {
  ApiEnvironmentIdParam,
  ApiIncludesUsersQuery,
  ApiWorkspaceIdParam,
  EnvironmentIdParam,
  IncludesUsersQuery,
  WorkspaceIdParam,
} from '../common/api.decorators';

@Controller('environments')
export class EnvironmentController {
  constructor(private readonly environmentService: EnvironmentService) {}

  @Get(':workspaceId')
  @ApiOkResponse({
    type: EnvironmentEntity,
    isArray: true,
    description: 'List all environments that the user is a member of',
  })
  @ApiWorkspaceIdParam()
  @ApiIncludesUsersQuery()
  @ApiOperation({
    summary: 'List all user environments',
    description:
      'Returns a list of all environments that the authenticated user is a member of. Optionally includes user details in each environment if `includesUsers` is set to true (default).',
  })
  public async getAll(
    @WorkspaceIdParam() workspaceId: string,
    @IncludesUsersQuery()
    includesUsers: boolean,
    @AuthenticatedUser() user: UserEntity
  ): Promise<EnvironmentEntity[]> {
    return this.environmentService.getAllByMemberUserId(
      workspaceId,
      user.id,
      includesUsers
    );
  }

  @Get(':workspaceId/:environmentId')
  @ApiOkResponse({
    type: EnvironmentEntity,
    description: 'Get an environment by ID',
  })
  @ApiOperation({
    summary: 'Get an environment by ID',
    description:
      'Returns an environment by its ID. Optionally includes user details in the environment if `includesUsers` is set to true (default).',
  })
  @ApiWorkspaceIdParam()
  @ApiEnvironmentIdParam()
  @ApiIncludesUsersQuery()
  public async getById(
    @WorkspaceIdParam() workspaceId: string,
    @EnvironmentIdParam() environmentId: string,
    @IncludesUsersQuery()
    includesUsers: boolean,
    @AuthenticatedUser() user: UserEntity
  ): Promise<EnvironmentEntity> {
    return this.environmentService.getByMemberUserId(
      workspaceId,
      environmentId,
      user.id,
      includesUsers
    );
  }

  @Post(':workspaceId')
  @ApiOkResponse({
    type: EnvironmentEntity,
    description: 'Create a new environment',
  })
  @ApiWorkspaceIdParam()
  @ApiOperation({
    summary: 'Create a new environment',
    description:
      'Creates a new environment. You must be a member of the workspace to create an environment.',
  })
  public async create(
    @WorkspaceIdParam() workspaceId: string,
    @Body() payload: CreateEnvironmentDto,
    @AuthenticatedUser() user: UserEntity
  ): Promise<EnvironmentEntity> {
    return this.environmentService.create(workspaceId, payload, user);
  }

  @Put(':workspaceId/:environmentId')
  @ApiWorkspaceIdParam()
  @ApiEnvironmentIdParam()
  @ApiOkResponse({
    type: EnvironmentEntity,
    description: 'Update an environment',
  })
  @ApiOperation({
    summary: 'Update an environment',
    description:
      'Updates an environment by its ID. You must be a member of the workspace to update an environment.',
  })
  public async update(
    @WorkspaceIdParam() workspaceId: string,
    @EnvironmentIdParam() environmentId: string,
    @Body() payload: UpdateEnvironmentDto,
    @AuthenticatedUser() user: UserEntity
  ): Promise<EnvironmentEntity> {
    return this.environmentService.update(
      workspaceId,
      environmentId,
      payload,
      user
    );
  }

  @Delete(':workspaceId/:environmentId')
  @ApiWorkspaceIdParam()
  @ApiOkResponse({
    description: 'Delete an environment',
  })
  @ApiOperation({
    summary: 'Delete an environment',
    description:
      'Deletes an environment by its ID. You must be a member of the workspace to delete an environment.',
  })
  public async delete(
    @WorkspaceIdParam() workspaceId: string,
    @EnvironmentIdParam() environmentId: string,
    @AuthenticatedUser() user: UserEntity
  ): Promise<void> {
    await this.environmentService.delete(workspaceId, environmentId, user);
  }
}
