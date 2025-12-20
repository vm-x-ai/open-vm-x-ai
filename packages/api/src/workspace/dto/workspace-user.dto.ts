import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { UserRelationDto } from '../../users/dto/user.dto';
import { WorkspaceRelationDto } from './workspace.dto';
import { WorkspaceUserEntity } from '../entities/workspace-user.entity';

export class WorkspaceUserDto extends WorkspaceUserEntity {
  @ApiProperty({
    description: 'The workspace that the user is a member of',
    nullable: true,
    required: false,
    type: WorkspaceRelationDto,
  })
  @IsOptional()
  workspace?: WorkspaceRelationDto | null;

  @ApiProperty({
    description: 'The user who is a member of the workspace',
    nullable: true,
    required: false,
    type: UserRelationDto,
  })
  @IsOptional()
  user?: UserRelationDto | null;

  @ApiProperty({
    description: 'The user who added the user to the workspace',
    nullable: true,
    required: false,
    type: UserRelationDto,
  })
  @IsOptional()
  addedByUser?: UserRelationDto | null;
}
