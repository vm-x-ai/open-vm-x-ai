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
  UseGuards,
} from '@nestjs/common';
import { RoleService } from './role.service';
import {
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { RoleEntity } from './entities/role.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { AuthenticatedUser } from '../auth/auth.guard';
import { UserEntity } from '../users/entities/user.entity';
import { UpdateRoleDto } from './dto/update-role.dto';
import {
  ApiIncludesUsersQuery,
  IncludesUsersQuery,
} from '../common/api.decorators';
import { ServiceError } from '../types';
import { AssignRoleDto } from './dto/assign-role.dto';
import {
  ROLE_BASE_RESOURCE,
  ROLE_RESOURCE_ITEM,
  RoleActions,
} from './permissions/actions';
import { RoleGuard } from './role.guard';
import { PermissionsDto } from './dto/permissions.dto';
import { UnassignRoleDto } from './dto/unassign-role.dto';
import { RoleDto } from './dto/role-dto';
import { UserRoleDto } from './dto/user-role.dto';

export function ApiRoleIdParam() {
  return applyDecorators(
    ApiParam({
      name: 'roleId',
      type: String,
      required: true,
      description: 'The ID of the role',
    })
  );
}

export function RoleIdParam() {
  return Param('roleId', new ParseUUIDPipe({ version: '4' }));
}

@Controller('role')
@ApiInternalServerErrorResponse({
  type: ServiceError,
  description: 'Server Error',
})
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Get('permissions')
  @ApiOkResponse({
    type: PermissionsDto,
    description: 'List all available actions for each module',
  })
  @ApiOperation({
    operationId: 'getPermissions',
    summary: 'List all available actions for each module',
    description: 'Returns a list of all available actions for each module.',
  })
  public async getPermissions(): Promise<PermissionsDto> {
    return this.roleService.getModulePermissions();
  }

  @Get()
  @UseGuards(RoleGuard(RoleActions.LIST, ROLE_BASE_RESOURCE))
  @ApiOkResponse({
    type: RoleDto,
    isArray: true,
    description: 'List all roles',
  })
  @ApiIncludesUsersQuery()
  @ApiOperation({
    operationId: 'getRoles',
    summary: 'List all roles',
    description: 'Returns a list of all roles.',
  })
  public async getAll(
    @IncludesUsersQuery()
    includesUsers: boolean
  ): Promise<RoleDto[]> {
    return this.roleService.getAll(includesUsers);
  }

  @Get(':roleId')
  @UseGuards(RoleGuard(RoleActions.GET, ROLE_RESOURCE_ITEM))
  @ApiOkResponse({
    type: RoleDto,
    description: 'Get a role by ID',
  })
  @ApiOperation({
    operationId: 'getRoleById',
    summary: 'Get a role by ID',
    description:
      'Returns a role by its ID. Optionally includes user details in the role if `includesUsers` is set to true (default).',
  })
  @ApiRoleIdParam()
  @ApiIncludesUsersQuery()
  @ApiQuery({
    name: 'includesMembers',
    type: Boolean,
    required: false,
    description: 'Whether to include members in the response',
  })
  public async getById(
    @RoleIdParam() roleId: string,
    @IncludesUsersQuery()
    includesUsers: boolean,
    @Query(
      'includesMembers',
      new DefaultValuePipe(true),
      new ParseBoolPipe({ optional: true })
    )
    includesMembers: boolean
  ): Promise<RoleDto> {
    return this.roleService.getById(roleId, includesUsers, includesMembers);
  }

  @Get(':roleId/members')
  @UseGuards(RoleGuard(RoleActions.GET_MEMBERS, ROLE_RESOURCE_ITEM))
  @ApiOkResponse({
    type: UserRoleDto,
    isArray: true,
    description: 'List all members of a role',
  })
  @ApiOperation({
    operationId: 'getRoleMembers',
    summary: 'List all members of a role',
    description: 'Returns a list of all members of a role.',
  })
  @ApiRoleIdParam()
  public async getRoleMembers(
    @RoleIdParam() roleId: string
  ): Promise<UserRoleDto[]> {
    return this.roleService.getRoleMembers(roleId);
  }

  @Post()
  @UseGuards(RoleGuard(RoleActions.CREATE, ROLE_BASE_RESOURCE))
  @ApiOkResponse({
    type: RoleEntity,
    description: 'Create a new role',
  })
  @ApiOperation({
    operationId: 'createRole',
    summary: 'Create a new role',
    description: 'Creates a new role.',
  })
  public async create(
    @Body() payload: CreateRoleDto,
    @AuthenticatedUser() user: UserEntity
  ): Promise<RoleEntity> {
    return this.roleService.create(payload, user);
  }

  @Post(':roleId/assign')
  @UseGuards(RoleGuard(RoleActions.ASSIGN, ROLE_RESOURCE_ITEM))
  @ApiOkResponse({
    description: 'Assign a role to users',
  })
  @ApiRoleIdParam()
  @ApiOperation({
    operationId: 'assignUsersToRole',
    summary: 'Assign a role to users',
    description: 'Assigns a role to users by their IDs.',
  })
  public async assignUsersToRole(
    @RoleIdParam() roleId: string,
    @Body() payload: AssignRoleDto,
    @AuthenticatedUser() user: UserEntity
  ): Promise<void> {
    await this.roleService.assignUsersToRole(roleId, payload, user);
  }

  @Post(':roleId/unassign')
  @UseGuards(RoleGuard(RoleActions.UNASSIGN, ROLE_RESOURCE_ITEM))
  @ApiRoleIdParam()
  @ApiOkResponse({
    description: 'Unassign users from a role',
  })
  @ApiOperation({
    operationId: 'unassignUsersFromRole',
    summary: 'Unassign users from a role',
    description: 'Unassigns users from a role by their IDs.',
  })
  public async unassignUsersFromRole(
    @RoleIdParam() roleId: string,
    @Body() payload: UnassignRoleDto
  ): Promise<void> {
    await this.roleService.unassignUsersFromRole(roleId, payload);
  }

  @Put(':roleId')
  @UseGuards(RoleGuard(RoleActions.UPDATE, ROLE_RESOURCE_ITEM))
  @ApiRoleIdParam()
  @ApiOkResponse({
    type: RoleEntity,
    description: 'Update a role',
  })
  @ApiOperation({
    operationId: 'updateRole',
    summary: 'Update a role',
    description: 'Updates a role by its ID.',
  })
  public async update(
    @RoleIdParam() roleId: string,
    @Body() payload: UpdateRoleDto,
    @AuthenticatedUser() user: UserEntity
  ): Promise<RoleEntity> {
    return this.roleService.update(roleId, payload, user);
  }

  @Delete(':roleId')
  @UseGuards(RoleGuard(RoleActions.DELETE, ROLE_RESOURCE_ITEM))
  @ApiRoleIdParam()
  @ApiOkResponse({
    description: 'Delete a role',
  })
  @ApiOperation({
    operationId: 'deleteRole',
    summary: 'Delete a role',
    description: 'Deletes a role by its ID.',
  })
  public async delete(@RoleIdParam() roleId: string): Promise<void> {
    await this.roleService.delete(roleId);
  }
}
