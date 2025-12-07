import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { PoolDefinitionEntry } from '../entities/pool-definition.entity';

/**
 * Upsert a pool definition.
 */
export class UpsertPoolDefinitionDto {
  @ApiProperty({
    description: 'List of pool definition entries',
    type: [PoolDefinitionEntry],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PoolDefinitionEntry)
  definition: PoolDefinitionEntry[];
}
