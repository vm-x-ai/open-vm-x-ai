import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { PublicWorkspaceUserRole } from '../../storage/entities.generated';
import { UserRelationDto } from '../../users/dto/user.dto';

export class WorkspaceEntity {
  @ApiProperty({
    description: 'The unique identifier for the workspace (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4')
  @IsNotEmpty()
  workspaceId: string;

  @ApiProperty({
    description: 'The name of the workspace',
    example: 'My Workspace',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'The description of the workspace',
    example: 'This is my workspace',
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
  createdBy: UserRelationDto | string;

  @ApiProperty({
    description: 'The user who last updated the workspace',
  })
  @IsNotEmpty()
  updatedBy: UserRelationDto | string;
}

export class WorkspaceUserEntity {
  @ApiProperty({
    description: 'The workspace that the user is a member of',
  })
  @IsNotEmpty()
  workspace: WorkspaceEntity;

  @ApiProperty({
    description: 'The user who is a member of the workspace',
  })
  @IsNotEmpty()
  user: UserRelationDto;

  @ApiProperty({
    description: 'The role of the user in the workspace',
    enum: PublicWorkspaceUserRole,
    example: PublicWorkspaceUserRole.OWNER,
  })
  @IsEnum(PublicWorkspaceUserRole)
  @IsNotEmpty()
  role: PublicWorkspaceUserRole;

  @ApiProperty({
    description: 'The date and time the user was added to the workspace',
    example: '2021-01-01T00:00:00.000Z',
  })
  @IsDateString()
  @IsNotEmpty()
  addedAt: Date;

  @ApiProperty({
    description: 'The user who added the user to the workspace',
  })
  @IsNotEmpty()
  addedBy: UserRelationDto | string;
}
