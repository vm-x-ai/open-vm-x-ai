import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

/**
 * Update an environment.
 */
export class UpdateEnvironmentDto {
  @ApiProperty({
    description: 'The name of the environment',
    example: 'production',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'The description of the environment',
    example: 'This is my production environment',
  })
  @IsString()
  @IsOptional()
  description?: string | null;
}
