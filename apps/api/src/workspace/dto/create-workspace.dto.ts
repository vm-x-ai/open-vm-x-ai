import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

/**
 * Create a new workspace.
 */
export class CreateWorkspaceDto {
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
}
