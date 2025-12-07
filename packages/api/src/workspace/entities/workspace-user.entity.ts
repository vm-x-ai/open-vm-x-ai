import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNotEmpty } from 'class-validator';
import { UserEntity } from '../../users/entities/user.entity';
import { PublicWorkspaceUserRole } from '../../storage/entities.generated';
import { WorkspaceEntity } from './workspace.entity';

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
  user: UserEntity;

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
  })
  @IsNotEmpty()
  addedBy: UserEntity;
}
