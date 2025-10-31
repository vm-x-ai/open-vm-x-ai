import {
  applyDecorators,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
} from '@nestjs/common';
import { AIConnectionService } from './ai-connection.service';
import { ApiOkResponse, ApiOperation, ApiParam } from '@nestjs/swagger';
import { AIConnectionEntity } from './entities/ai-connection.entity';
import { CreateAIConnectionDto } from './dto/create-ai-connection.dto';
import { AuthenticatedUser } from '../auth/auth.guard';
import { UserEntity } from '../users/entities/user.entity';
import { UpdateAIConnectionDto } from './dto/update-ai-connection.dto';
import {
  ApiEnvironmentIdParam,
  ApiIncludesUsersQuery,
  ApiWorkspaceIdParam,
  EnvironmentIdParam,
  IncludesUsersQuery,
  WorkspaceIdParam,
} from '../common/api.decorators';

export function ApiAIConnectionIdParam() {
  return applyDecorators(
    ApiParam({
      name: 'connectionId',
      type: String,
      required: true,
      description: 'The ID of the AI connection',
    })
  );
}

export function AIConnectionIdParam() {
  return Param('connectionId', new ParseUUIDPipe({ version: '4' }));
}

@Controller('ai-connections')
export class AIConnectionController {
  constructor(private readonly aiConnectionService: AIConnectionService) {}

  @Get(':workspaceId/:environmentId')
  @ApiOkResponse({
    type: AIConnectionEntity,
    isArray: true,
    description: 'List all AI connections associated with an environment',
  })
  @ApiWorkspaceIdParam()
  @ApiEnvironmentIdParam()
  @ApiIncludesUsersQuery()
  @ApiOperation({
    summary: 'List all AI connections associated with an environment',
    description:
      'Returns a list of all AI connections associated with an environment. Optionally includes user details in each AI connection if `includesUsers` is set to true (default).',
  })
  public async getAll(
    @WorkspaceIdParam() workspaceId: string,
    @EnvironmentIdParam() environmentId: string,
    @IncludesUsersQuery()
    includesUsers: boolean,
    @AuthenticatedUser() user: UserEntity
  ): Promise<AIConnectionEntity[]> {
    return this.aiConnectionService.getAllByMemberUserId(
      workspaceId,
      environmentId,
      user.id,
      includesUsers
    );
  }

  @Get(':workspaceId/:environmentId/:connectionId')
  @ApiOkResponse({
    type: AIConnectionEntity,
    description: 'Get an AI connection by ID',
  })
  @ApiOperation({
    summary: 'Get an AI connection by ID',
    description:
      'Returns an AI connection by its ID. Optionally includes user details in the AI connection if `includesUsers` is set to true (default).',
  })
  @ApiWorkspaceIdParam()
  @ApiEnvironmentIdParam()
  @ApiAIConnectionIdParam()
  @ApiIncludesUsersQuery()
  public async getById(
    @WorkspaceIdParam() workspaceId: string,
    @EnvironmentIdParam() environmentId: string,
    @AIConnectionIdParam() connectionId: string,
    @IncludesUsersQuery()
    includesUsers: boolean,
    @AuthenticatedUser() user: UserEntity
  ): Promise<AIConnectionEntity> {
    return this.aiConnectionService.getByMemberUserId(
      workspaceId,
      environmentId,
      connectionId,
      user.id,
      includesUsers
    );
  }

  @Post(':workspaceId/:environmentId')
  @ApiOkResponse({
    type: AIConnectionEntity,
    description: 'Create a new AI connection',
  })
  @ApiWorkspaceIdParam()
  @ApiEnvironmentIdParam()
  @ApiOperation({
    summary: 'Create a new AI connection',
    description:
      'Creates a new AI connection. You must be a member of the workspace to create an AI connection.',
  })
  public async create(
    @WorkspaceIdParam() workspaceId: string,
    @EnvironmentIdParam() environmentId: string,
    @AuthenticatedUser() user: UserEntity,
    @Body() payload: CreateAIConnectionDto
  ): Promise<AIConnectionEntity> {
    return this.aiConnectionService.create(
      workspaceId,
      environmentId,
      payload,
      user
    );
  }

  @Put(':workspaceId/:environmentId/:connectionId')
  @ApiWorkspaceIdParam()
  @ApiEnvironmentIdParam()
  @ApiOkResponse({
    type: AIConnectionEntity,
    description: 'Update an AI connection',
  })
  @ApiOperation({
    summary: 'Update an AI connection',
    description:
      'Updates an AI connection by its ID. You must be a member of the workspace to update an AI connection.',
  })
  public async update(
    @WorkspaceIdParam() workspaceId: string,
    @EnvironmentIdParam() environmentId: string,
    @AIConnectionIdParam() connectionId: string,
    @Body() payload: UpdateAIConnectionDto,
    @AuthenticatedUser() user: UserEntity
  ): Promise<AIConnectionEntity> {
    return this.aiConnectionService.update(
      workspaceId,
      environmentId,
      connectionId,
      payload,
      user
    );
  }

  @Delete(':workspaceId/:environmentId/:connectionId')
  @ApiWorkspaceIdParam()
  @ApiOkResponse({
    description: 'Delete an AI connection',
  })
  @ApiOperation({
    summary: 'Delete an AI connection',
    description:
      'Deletes an AI connection by its ID. You must be a member of the workspace to delete an AI connection.',
  })
  public async delete(
    @WorkspaceIdParam() workspaceId: string,
    @EnvironmentIdParam() environmentId: string,
    @AIConnectionIdParam() connectionId: string,
    @AuthenticatedUser() user: UserEntity
  ): Promise<void> {
    await this.aiConnectionService.delete(
      workspaceId,
      environmentId,
      connectionId,
      user
    );
  }
}
