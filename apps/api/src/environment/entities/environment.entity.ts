import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { UserRelationDto } from '../../users/dto/user.dto';
import { Type } from 'class-transformer';

export class EnvironmentEntity {
  @ApiProperty({
    description: 'The unique identifier for the environment (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4')
  @IsNotEmpty()
  environmentId: string;

  @ApiProperty({
    description: 'The workspace that the environment is associated with',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4')
  @IsNotEmpty()
  workspaceId: string;

  @ApiProperty({
    description: 'The name of the environment',
    example: 'production',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'The description of the environment',
    example: 'This is my production environment',
  })
  @IsString()
  @IsOptional()
  description?: string | null;

  @ApiProperty({
    description: 'The date and time the workspace was created',
    example: '2021-01-01T00:00:00.000Z',
  })
  @IsDateString()
  @IsNotEmpty()
  createdAt: Date;

  @ApiProperty({
    description: 'The date and time the workspace was last updated',
    example: '2021-01-01T00:00:00.000Z',
  })
  @IsDateString()
  @IsNotEmpty()
  updatedAt: Date;

  @ApiProperty({
    description: 'The user who created the workspace',
  })
  @IsNotEmpty()
  createdBy: string;

  @ApiProperty({
    description: 'The user who created the workspace',
  })
  @IsOptional()
  @Type(() => UserRelationDto)
  createdByUser?: UserRelationDto;

  @ApiProperty({
    description: 'The user who last updated the workspace',
  })
  @IsNotEmpty()
  updatedBy: string;

  @ApiProperty({
    description: 'The user who last updated the workspace',
  })
  @IsOptional()
  @Type(() => UserRelationDto)
  updatedByUser?: UserRelationDto;
}
