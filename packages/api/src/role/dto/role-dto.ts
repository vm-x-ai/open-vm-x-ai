import { IsArray, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { RoleEntity } from '../entities/role.entity';
import { ApiProperty } from '@nestjs/swagger';
import { UserRoleDto } from './user-role.dto';

export class RoleDto extends RoleEntity {
  @ApiProperty({
    description: 'The number of members in the role',
    example: 10,
  })
  @IsNumber()
  @IsNotEmpty()
  membersCount?: number;

  @ApiProperty({
    description: 'The members of the role',
    type: [UserRoleDto],
    required: false,
    nullable: true,
  })
  @IsArray()
  @IsOptional()
  members?: UserRoleDto[];
}
