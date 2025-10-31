import {
  applyDecorators,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { AIResourceService } from './ai-resource.service';
import { ApiOkResponse, ApiOperation, ApiParam } from '@nestjs/swagger';
import { AIResourceEntity } from './entities/ai-resource.entity';
import { CreateAIResourceDto } from './dto/create-ai-resource.dto';
import { AuthenticatedUser } from '../auth/auth.guard';
import { UserEntity } from '../users/entities/user.entity';
import { UpdateAIResourceDto } from './dto/update-ai-resource.dto';
import {
  ApiEnvironmentIdParam,
  ApiIncludesUsersQuery,
  ApiWorkspaceIdParam,
  EnvironmentIdParam,
  IncludesUsersQuery,
  WorkspaceIdParam,
} from '../common/api.decorators';

export function ApiAIResourceIdParam() {
  return applyDecorators(
    ApiParam({
      name: 'resource',
      type: String,
      required: true,
      description: 'The unique identifier of the AI resource',
    })
  );
}

export function AIResourceIdParam() {
  return Param('resource');
}

@Controller('ai-resources')
export class AIResourceController {
  constructor(private readonly aiResourceService: AIResourceService) {}

  @Get(':workspaceId/:environmentId')
  @ApiOkResponse({
    type: AIResourceEntity,
    isArray: true,
    description: 'List all AI resources associated with an environment',
  })
  @ApiWorkspaceIdParam()
  @ApiEnvironmentIdParam()
  @ApiIncludesUsersQuery()
  @ApiOperation({
    summary: 'List all AI resources associated with an environment',
    description:
      'Returns a list of all AI resources associated with an environment. Optionally includes user details in each AI resource if `includesUsers` is set to true (default).',
  })
  public async getAll(
    @WorkspaceIdParam() workspaceId: string,
    @EnvironmentIdParam() environmentId: string,
    @IncludesUsersQuery()
    includesUsers: boolean,
    @AuthenticatedUser() user: UserEntity
  ): Promise<AIResourceEntity[]> {
    return this.aiResourceService.getAllByMemberUserId(
      workspaceId,
      environmentId,
      user.id,
      includesUsers
    );
  }

  @Get(':workspaceId/:environmentId/:resource')
  @ApiOkResponse({
    type: AIResourceEntity,
    description: 'Get an AI resource by ID',
  })
  @ApiOperation({
    summary: 'Get an AI resource by ID',
    description:
      'Returns an AI resource by its ID. Optionally includes user details in the AI resource if `includesUsers` is set to true (default).',
  })
  @ApiWorkspaceIdParam()
  @ApiEnvironmentIdParam()
  @ApiAIResourceIdParam()
  @ApiIncludesUsersQuery()
  public async getById(
    @WorkspaceIdParam() workspaceId: string,
    @EnvironmentIdParam() environmentId: string,
    @AIResourceIdParam() resource: string,
    @IncludesUsersQuery()
    includesUsers: boolean,
    @AuthenticatedUser() user: UserEntity
  ): Promise<AIResourceEntity> {
    return this.aiResourceService.getByMemberUserId(
      workspaceId,
      environmentId,
      resource,
      user.id,
      includesUsers
    );
  }

  @Post(':workspaceId/:environmentId')
  @ApiOkResponse({
    type: AIResourceEntity,
    description: 'Create a new AI resource',
  })
  @ApiWorkspaceIdParam()
  @ApiEnvironmentIdParam()
  @ApiOperation({
    summary: 'Create a new AI resource',
    description:
      'Creates a new AI resource. You must be a member of the workspace to create an AI resource.',
  })
  public async create(
    @WorkspaceIdParam() workspaceId: string,
    @EnvironmentIdParam() environmentId: string,
    @AuthenticatedUser() user: UserEntity,
    @Body() payload: CreateAIResourceDto
  ): Promise<AIResourceEntity> {
    return this.aiResourceService.create(
      workspaceId,
      environmentId,
      payload,
      user
    );
  }

  @Put(':workspaceId/:environmentId/:resource')
  @ApiWorkspaceIdParam()
  @ApiEnvironmentIdParam()
  @ApiOkResponse({
    type: AIResourceEntity,
    description: 'Update an AI resource',
  })
  @ApiOperation({
    summary: 'Update an AI resource',
    description:
      'Updates an AI resource by its ID. You must be a member of the workspace to update an AI resource.',
  })
  public async update(
    @WorkspaceIdParam() workspaceId: string,
    @EnvironmentIdParam() environmentId: string,
    @AIResourceIdParam() resource: string,
    @Body() payload: UpdateAIResourceDto,
    @AuthenticatedUser() user: UserEntity
  ): Promise<AIResourceEntity> {
    return this.aiResourceService.update(
      workspaceId,
      environmentId,
      resource,
      payload,
      user
    );
  }

  @Delete(':workspaceId/:environmentId/:resource')
  @ApiWorkspaceIdParam()
  @ApiOkResponse({
    description: 'Delete an AI resource',
  })
  @ApiOperation({
    summary: 'Delete an AI resource',
    description:
      'Deletes an AI resource by its ID. You must be a member of the workspace to delete an AI resource.',
  })
  public async delete(
    @WorkspaceIdParam() workspaceId: string,
    @EnvironmentIdParam() environmentId: string,
    @AIResourceIdParam() resource: string,
    @AuthenticatedUser() user: UserEntity
  ): Promise<void> {
    await this.aiResourceService.delete(
      workspaceId,
      environmentId,
      resource,
      user
    );
  }
}
