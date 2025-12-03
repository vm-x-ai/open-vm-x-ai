import { IsNotEmpty, IsNumber } from 'class-validator';
import { RoleEntity } from '../entities/role.entity';
import { ApiProperty } from '@nestjs/swagger';

export class RoleDto extends RoleEntity {
  @ApiProperty({
    description: 'The number of members in the role',
    example: 10,
  })
  @IsNumber()
  @IsNotEmpty()
  membersCount: number;
}
