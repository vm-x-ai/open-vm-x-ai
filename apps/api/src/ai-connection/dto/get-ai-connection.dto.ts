import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class GetAIConnectionDto {
  @ApiProperty({
    description: 'The workspace ID to list AI connections for',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  @IsUUID('4')
  @IsNotEmpty()
  workspaceId: string;

  @ApiProperty({
    description: 'The environment ID to list AI connections for',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  @IsUUID('4')
  @IsNotEmpty()
  environmentId: string;

  @ApiProperty({
    description: 'The connection ID to get AI connection for',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  @IsUUID('4')
  @IsNotEmpty()
  connectionId: string;

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

  @ApiProperty({
    description: 'Whether to hide the secret fields in the response',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  hideSecretFields?: boolean | null;
}
