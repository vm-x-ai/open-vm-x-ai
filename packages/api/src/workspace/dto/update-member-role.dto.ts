import { PublicWorkspaceUserRole } from '../../storage/entities.generated';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateMemberRoleDto {
  @ApiProperty({
    description: 'The role to assign to the user',
    enumName: 'WorkspaceUserRole',
    enum: PublicWorkspaceUserRole,
  })
  @IsEnum(PublicWorkspaceUserRole)
  @IsNotEmpty()
  role: PublicWorkspaceUserRole;
}
