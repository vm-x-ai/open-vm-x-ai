import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

/**
 * Create a new environment.
 */
export class CreateEnvironmentDto {
  @ApiProperty({
    description: 'The name of the environment',
    example: 'production',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    type: 'string',
    required: false,
    nullable: true,
    description: 'The description of the workspace',
    example: 'This is my workspace',
  })
  @IsString()
  @IsOptional()
  description?: string | null;
}
