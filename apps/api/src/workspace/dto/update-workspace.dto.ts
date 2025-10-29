import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

/**
 * Update a workspace.
 */
export class UpdateWorkspaceDto {
  @ApiProperty({
    description: 'The name of the workspace',
    example: 'My Workspace',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'The description of the workspace',
    example: 'This is my workspace',
  })
  @IsString()
  @IsOptional()
  description?: string | null;
}
