import { AIConnectionEntity } from '../../../ai-connection/entities/ai-connection.entity';
import {
  PoolDefinitionEntity,
  PoolDefinitionEntry,
} from '../../../pool-definition/entities/pool-definition.entity';
import type { PoolWorkloadAllocation } from '../../storage/base';
import type { GateOutput, PriorizationStrategy } from './types';

export class BasePriorizationStrategy implements PriorizationStrategy {
  protected getResourcePool(
    pool: PoolDefinitionEntity,
    resource: string
  ): PoolDefinitionEntry | undefined {
    return pool.definition.find((pool) => pool.resources.includes(resource));
  }

  async gate(
    pool: PoolDefinitionEntity,
    requestTime: Date,
    requestTokens: number,
    resource: string,
    connection: AIConnectionEntity,
    allocation: PoolWorkloadAllocation
  ): Promise<GateOutput> {
    return { allowed: true, allocation };
  }
}
