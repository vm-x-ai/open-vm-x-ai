import {
  PoolDefinitionEntity,
  PoolDefinitionEntry,
} from '../../../../pool-definition/entities/pool-definition.entity';

export interface PrioritizationMetricsRepository {
  getMinuteMetricByPool(
    requestTime: Date,
    connectionId: string,
    pool: PoolDefinitionEntry
  ): Promise<number>;
  getMinuteMetric(
    requestTime: Date,
    connectionId: string,
    pool: PoolDefinitionEntry
  ): Promise<number>;
  getMetricByWindow(
    requestTime: Date,
    connectionId: string,
    window: number,
    pool: PoolDefinitionEntry
  ): Promise<number>;
  getResourceMetricByWindow(
    requestTime: Date,
    connectionId: string,
    window: number,
    pool: PoolDefinitionEntity
  ): Promise<Record<string, number>>;
  write(
    requestTime: Date,
    requestTokens: number,
    connectionId: string,
    pool: PoolDefinitionEntry
  ): Promise<void>;
}
