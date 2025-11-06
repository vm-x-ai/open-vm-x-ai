import { Injectable } from '@nestjs/common';
import { AdaptiveTokenScalingStrategy, GateOutput } from './strategy';
import { PoolDefinitionEntity } from '../pool-definition/entities/pool-definition.entity';
import { AIConnectionEntity } from '../ai-connection/entities/ai-connection.entity';

@Injectable()
export class PrioritizationService {
  constructor(
    private readonly adaptiveTokenScalingStrategy: AdaptiveTokenScalingStrategy
  ) {}

  async gate(
    pool: PoolDefinitionEntity,
    requestTime: Date,
    requestTokens: number,
    resource: string,
    connection: AIConnectionEntity
  ): Promise<GateOutput> {
    // TODO: Implement the logic to choose the strategy based on the request
    return this.adaptiveTokenScalingStrategy.gate(
      pool,
      requestTime,
      requestTokens,
      resource,
      connection
    );
  }
}
