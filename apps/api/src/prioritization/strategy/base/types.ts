import { AIConnectionEntity } from '../../../ai-connection/entities/ai-connection.entity';
import { PoolDefinitionEntity } from '../../../pool-definition/entities/pool-definition.entity';
import type { PoolWorkloadAllocation } from '../../storage/base';

export type GateOutput =
  | {
      allowed: true;
      allocation: PoolWorkloadAllocation;
      reason?: string;
    }
  | {
      allowed: false;
      allocation: PoolWorkloadAllocation;
      reason: string;
    };

export interface PriorizationStrategy {
  gate(
    pool: PoolDefinitionEntity,
    requestTime: Date,
    requestTokens: number,
    resource: string,
    connection: AIConnectionEntity,
    allocation?: PoolWorkloadAllocation
  ): Promise<GateOutput>;
}
