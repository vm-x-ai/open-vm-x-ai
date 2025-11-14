import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsUUID } from 'class-validator';

export class ListAIConnectionDto {
  @ApiProperty({
    description: 'The workspace ID to list AI connections for',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  @IsUUID('4')
  @IsOptional()
  workspaceId?: string | null;

  @ApiProperty({
    description: 'The environment ID to list AI connections for',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  @IsUUID('4')
  @IsOptional()
  environmentId?: string | null;

  @ApiProperty({
    description: 'Whether to include users in the response',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  includesUsers?: boolean | null;

  @ApiProperty({
    description: 'Whether to decrypt the connection secrets',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  decrypt?: boolean | null;
}
