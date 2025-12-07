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
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UserEntity } from './entities/user.entity';
import {
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
} from '@nestjs/swagger';
import { ServiceError } from '../types';
import { RoleGuard } from '../role/role.guard';
import {
  USER_BASE_RESOURCE,
  USER_RESOURCE_ITEM,
  UserActions,
} from './permissions/actions';
import { CreateUserDto } from './dto/create-user.dto';
import { AuthenticatedUser } from '../auth/auth.guard';
import { UpdateUserDto } from './dto/update-user.dto';

export function ApiUserIdParam() {
  return applyDecorators(
    ApiParam({
      name: 'userId',
      type: String,
      required: true,
      format: 'uuid',
      description: 'The unique identifier of the user',
    })
  );
}

export function UserIdParam() {
  return Param('userId', new ParseUUIDPipe({ version: '4' }));
}

@Controller('user')
@ApiInternalServerErrorResponse({
  type: ServiceError,
  description: 'Server Error',
})
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @UseGuards(RoleGuard(UserActions.LIST, USER_BASE_RESOURCE))
  @ApiOperation({
    operationId: 'getUsers',
    summary: 'List all users',
    description: 'Returns a list of all users.',
  })
  @ApiOkResponse({
    type: UserEntity,
    isArray: true,
    description: 'List all users',
  })
  public async getAll(): Promise<UserEntity[]> {
    return this.usersService.getAll();
  }

  @Get(':userId')
  @UseGuards(RoleGuard(UserActions.GET, USER_RESOURCE_ITEM))
  @ApiOperation({
    operationId: 'getUserById',
    summary: 'Get a user by ID',
    description: 'Returns a user by ID.',
  })
  @ApiUserIdParam()
  @ApiOkResponse({
    type: UserEntity,
    description: 'Get a user by ID',
  })
  public async getById(@UserIdParam() userId: string): Promise<UserEntity> {
    const { passwordHash, ...user } = await this.usersService.getById(
      userId,
      true
    );
    return user;
  }

  @Post()
  @UseGuards(RoleGuard(UserActions.CREATE, USER_BASE_RESOURCE))
  @ApiOperation({
    operationId: 'createUser',
    summary: 'Create a new user',
    description: 'Creates a new user.',
  })
  @ApiOkResponse({
    type: UserEntity,
    description: 'Create a new user',
  })
  public async create(
    @Body() createUserDto: CreateUserDto,
    @AuthenticatedUser() user: UserEntity
  ): Promise<UserEntity> {
    return this.usersService.create(createUserDto, user);
  }

  @Put(':userId')
  @UseGuards(RoleGuard(UserActions.UPDATE, USER_RESOURCE_ITEM))
  @ApiOperation({
    operationId: 'updateUser',
    summary: 'Update a user',
    description: 'Updates a user by its ID.',
  })
  @ApiUserIdParam()
  @ApiOkResponse({
    type: UserEntity,
    description: 'Update a user',
  })
  public async update(
    @UserIdParam() userId: string,
    @Body() updateUserDto: UpdateUserDto,
    @AuthenticatedUser() user: UserEntity
  ): Promise<UserEntity> {
    return this.usersService.update(userId, updateUserDto, user);
  }

  @Delete(':userId')
  @UseGuards(RoleGuard(UserActions.DELETE, USER_RESOURCE_ITEM))
  @ApiOperation({
    operationId: 'deleteUser',
    summary: 'Delete a user',
    description: 'Deletes a user by its ID.',
  })
  @ApiUserIdParam()
  @ApiOkResponse({
    description: 'Delete a user',
  })
  public async delete(@UserIdParam() userId: string): Promise<void> {
    await this.usersService.delete(userId);
  }
}
