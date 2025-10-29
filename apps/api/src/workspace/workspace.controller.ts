import {
  applyDecorators,
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseBoolPipe,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { WorkspaceService } from './workspace.service';
import {
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { WorkspaceEntity } from './entities/workspace.entity';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { AuthenticatedUser } from '../auth/auth.guard';
import { UserEntity } from '../users/entities/user.entity';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';

function ApiIncludesUsersQuery() {
  return applyDecorators(
    ApiQuery({
      name: 'includesUsers',
      type: Boolean,
      required: false,
      description: 'Whether to include users in the response',
    })
  );
}

function ApiWorkspaceIdParam() {
  return applyDecorators(
    ApiParam({
      name: 'workspaceId',
      type: String,
      required: true,
      description: 'The ID of the workspace',
    })
  );
}

function IncludesUsersQuery() {
  return Query(
    'includesUsers',
    new DefaultValuePipe(true),
    new ParseBoolPipe({ optional: true })
  );
}

function WorkspaceIdParam() {
  return Param('workspaceId', new ParseUUIDPipe({ version: '4' }));
}

@Controller('workspaces')
export class WorkspaceController {
  constructor(private readonly workspaceService: WorkspaceService) {}

  @Get()
  @ApiOkResponse({
    type: WorkspaceEntity,
    isArray: true,
    description: 'List all workspaces that the user is a member of',
  })
  @ApiIncludesUsersQuery()
  @ApiOperation({
    summary: 'List all user workspaces',
    description:
      'Returns a list of all workspaces that the authenticated user is a member of. Optionally includes user details in each workspace if `includesUsers` is set to true (default).',
  })
  public async getAll(
    @IncludesUsersQuery()
    includesUsers: boolean,
    @AuthenticatedUser() user: UserEntity
  ): Promise<WorkspaceEntity[]> {
    return this.workspaceService.getAllByMemberUserId(user.id, includesUsers);
  }

  @Get(':workspaceId')
  @ApiOkResponse({
    type: WorkspaceEntity,
    description: 'Get a workspace by ID',
  })
  @ApiOperation({
    summary: 'Get a workspace by ID',
    description:
      'Returns a workspace by its ID. Optionally includes user details in the workspace if `includesUsers` is set to true (default).',
  })
  @ApiWorkspaceIdParam()
  @ApiIncludesUsersQuery()
  public async getById(
    @WorkspaceIdParam() workspaceId: string,
    @IncludesUsersQuery()
    includesUsers: boolean,
    @AuthenticatedUser() user: UserEntity
  ): Promise<WorkspaceEntity> {
    return this.workspaceService.getByMemberUserId(
      workspaceId,
      user.id,
      includesUsers
    );
  }

  @Post()
  @ApiOkResponse({
    type: WorkspaceEntity,
    description: 'Create a new workspace',
  })
  @ApiOperation({
    summary: 'Create a new workspace',
    description: 'Creates a new workspace. The authenticated user is automatically added as the owner of the workspace.',
  })
  public async create(
    @Body() payload: CreateWorkspaceDto,
    @AuthenticatedUser() user: UserEntity
  ): Promise<WorkspaceEntity> {
    return this.workspaceService.create(payload, user);
  }

  @Put(':workspaceId')
  @ApiWorkspaceIdParam()
  @ApiOkResponse({
    type: WorkspaceEntity,
    description: 'Update a workspace',
  })
  @ApiOperation({
    summary: 'Update a workspace',
    description: 'Updates a workspace by its ID. The authenticated user must be a member of the workspace and have the owner role.',
  })
  public async update(
    @WorkspaceIdParam() workspaceId: string,
    @Body() payload: UpdateWorkspaceDto,
    @AuthenticatedUser() user: UserEntity
  ): Promise<WorkspaceEntity> {
    return this.workspaceService.update(workspaceId, payload, user);
  }

  @Delete(':workspaceId')
  @ApiWorkspaceIdParam()
  @ApiOkResponse({
    description: 'Delete a workspace',
  })
  @ApiOperation({
    summary: 'Delete a workspace',
    description: 'Deletes a workspace by its ID. The authenticated user must be a member of the workspace and have the owner role.',
  })
  public async delete(@WorkspaceIdParam() workspaceId: string): Promise<void> {
    await this.workspaceService.delete(workspaceId);
  }
}
