import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

/**
 * Update an environment.
 */
export class UpdateEnvironmentDto {
  @ApiProperty({
    type: 'string',
    required: false,
    description: 'The name of the environment',
    example: 'production',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    type: 'string',
    nullable: true,
    required: false,
    description: 'The description of the environment',
    example: 'This is my production environment',
  })
  @IsString()
  @IsOptional()
  description?: string | null;
}
