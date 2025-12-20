import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNotEmpty, IsUUID } from 'class-validator';
import { PublicWorkspaceUserRole } from '../../storage/entities.generated';

export class WorkspaceUserEntity {
  @ApiProperty({
    description: 'The unique identifier for the workspace (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  @IsNotEmpty()
  @IsUUID('4')
  workspaceId: string;

  @ApiProperty({
    description: 'The user who is a member of the workspace (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  @IsNotEmpty()
  @IsUUID('4')
  userId: string;

  @ApiProperty({
    description: 'The role of the user in the workspace',
    enumName: 'WorkspaceUserRole',
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
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  @IsNotEmpty()
  @IsUUID('4')
  addedBy: string;
}
