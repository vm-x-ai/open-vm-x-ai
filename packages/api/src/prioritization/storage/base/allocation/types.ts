import { AIConnectionEntity } from '../../../../ai-connection/entities/ai-connection.entity';

export type PoolWorkloadAllocation = {
  [pool: string]: {
    min: number;
    max: number;
    current: number;
    scaleAction?: 'up' | 'down';
    scaleActionAt?: number;
    scaleDescription?: string;
  };
};

export interface PrioritizationAllocationRepository {
  get(
    connection: AIConnectionEntity
  ): Promise<PoolWorkloadAllocation | undefined>;
  write(
    connection: AIConnectionEntity,
    allocation: PoolWorkloadAllocation
  ): Promise<void>;
}
