import { IsNotEmpty, IsObject } from 'class-validator';
import { UserRelationDto } from '../../users/dto/user.dto';
import { UserRoleEntity } from '../entities/user-role.entity';
import { ApiProperty } from '@nestjs/swagger';

export class UserRoleDto extends UserRoleEntity {
  @ApiProperty({
    description: 'The user who is assigned the role',
  })
  @IsObject()
  @IsNotEmpty()
  user: UserRelationDto;
}
