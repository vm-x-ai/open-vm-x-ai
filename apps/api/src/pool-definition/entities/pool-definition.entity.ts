import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsString,
  ValidateNested,
  IsUUID,
  IsDate,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { UserRelationDto } from '../../users/dto/user.dto';

export class PoolDefinitionEntry {
  @ApiProperty({
    description: 'The name of the pool entry',
    example: 'high-priority-group',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'The rank or priority order of the entry',
    example: 1,
  })
  @IsNumber()
  rank: number;

  @ApiProperty({
    description:
      'Minimum % of the AI connection capacity that must be reserved for this entry',
    example: 50,
  })
  @IsNumber()
  minReservation: number;

  @ApiProperty({
    description:
      'Maximum % of the AI connection capacity that can be reserved for this entry',
    example: 100,
  })
  @IsNumber()
  maxReservation: number;

  @ApiProperty({
    description: 'Resource identifiers included in this entry',
    example: ['resource-1', 'resource-2'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  resources: string[];
}

export class PoolDefinitionEntity {
  @ApiProperty({
    description: 'Workspace UUID',
    example: '47ad68b7-1a09-4efb-8cfd-0f0130f6c2a5',
  })
  @IsString()
  @IsUUID()
  workspaceId: string;

  @ApiProperty({
    description: 'Environment UUID',
    example: 'f0f591bc-ef43-4a43-9125-8b16c73e4081',
  })
  @IsString()
  @IsUUID()
  environmentId: string;

  @ApiProperty({
    description: 'List of pool definition entries',
    type: [PoolDefinitionEntry],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PoolDefinitionEntry)
  definition: PoolDefinitionEntry[];

  @ApiProperty({
    description: 'Timestamp when the pool definition was created',
    example: '2024-05-01T12:34:56.789Z',
  })
  @IsDate()
  createdAt: Date;

  @ApiProperty({
    description: 'Timestamp when the pool definition was last updated',
  })
  @IsDate()
  updatedAt: Date;

  @ApiProperty({
    description: 'User ID who created the pool definition',
    example: 'user-uuid-string',
  })
  @IsUUID()
  createdBy: string;

  @ApiProperty({
    description: 'User who created the pool definition',
    example: 'user-uuid-string',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => UserRelationDto)
  createdByUser?: UserRelationDto;

  @ApiProperty({
    description: 'User ID who last updated the pool definition',
    example: 'user-uuid-string',
  })
  @IsUUID()
  updatedBy: string;  

  @ApiProperty({
    description: 'User who last updated the pool definition',
    example: 'user-uuid-string',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => UserRelationDto)
  updatedByUser?: UserRelationDto;
}
