import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

/**
 * Update a workspace.
 */
export class UpdateWorkspaceDto {
  @ApiProperty({
    type: 'string',
    description: 'The name of the workspace',
    example: 'My Workspace',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    type: 'string',
    nullable: true,
    description: 'The description of the workspace',
    example: 'This is my workspace',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string | null;
}
