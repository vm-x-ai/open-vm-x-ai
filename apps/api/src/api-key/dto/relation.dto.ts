import { ApiKeyEntity } from '../entities/api-key.entity';
import { ApiProperty, OmitType } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty } from 'class-validator';

export class ApiKeyRelationDto extends OmitType(ApiKeyEntity, [
  'createdAt',
  'updatedAt',
]) {
  @ApiProperty({
    description: 'The date and time the API key was created',
    example: '2021-01-01T00:00:00.000Z',
  })
  @IsDateString()
  @IsNotEmpty()
  createdAt: string;

  @ApiProperty({
    description: 'The date and time the API key was last updated',
    example: '2021-01-01T00:00:00.000Z',
  })
  @IsDateString()
  @IsNotEmpty()
  updatedAt: string;
}
