import { UserEntity } from '../entities/user.entity';
import { ApiProperty, OmitType } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty } from 'class-validator';

export class UserRelationDto extends OmitType(UserEntity, [
  'createdAt',
  'updatedAt',
]) {
  @ApiProperty({
    description: 'The date and time the user was created',
    example: '2021-01-01T00:00:00.000Z',
    format: 'date-time',
  })
  @IsDateString()
  @IsNotEmpty()
  createdAt: string;

  @ApiProperty({
    description: 'The date and time the user was last updated',
    example: '2021-01-01T00:00:00.000Z',
    format: 'date-time',
  })
  @IsDateString()
  @IsNotEmpty()
  updatedAt: string;
}
