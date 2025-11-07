import { HttpStatus, Injectable } from '@nestjs/common';
import { AIConnectionService } from '../ai-connection/ai-connection.service';
import { AIProviderService } from '../ai-provider/ai-provider.service';
import { AIResourceService } from '../ai-resource/ai-resource.service';
import { UserEntity } from '../users/entities/user.entity';
import { throwServiceError } from '../error';
import { ErrorCode } from '../error-code';
import { defer, Observable, Subject } from 'rxjs';
import { CompletionObservableData } from '../ai-provider/ai-provider.types';
import { CompletionUsageService } from './usage/usage.service';
import { CompletionMetricsService } from './metrics/metrics.service';
import { CompletionAuditService } from './audit/audit.service';
import { CompletionRequestDto } from './dto/completion-request.dto';
import { AIResourceEntity } from '../ai-resource/entities/ai-resource.entity';
import { ApiKeyEntity } from '../api-key/entities/api-key.entity';
import { CreateAIResourceDto } from '../ai-resource/dto/create-ai-resource.dto';
import { ResourceRoutingService } from './routing.service';
import { TokenService } from '../token/token.service';
import { PinoLogger } from 'nestjs-pino';
import { EvaluatedCapacity, GateService } from './gate.service';
import { FastifyRequest } from 'fastify';
import { getSourceIpFromRequest } from '../utils/http';
import { v4 as uuidv4 } from 'uuid';
import { PublicCompletionAuditType } from '../storage/entities.generated';
import {
  CompletionAuditEventEntity,
  CompletionAuditEventType,
} from './audit/entities/audit.entity';
import { CompletionError } from './completion.types';
import { AIResourceModelConfigEntity } from '../ai-resource/common/model.entity';

@Injectable()
export class CompletionService {
  constructor(
    private readonly logger: PinoLogger,
    private readonly aiProviderService: AIProviderService,
    private readonly aiConnectionService: AIConnectionService,
    private readonly aiResourceService: AIResourceService,
    private readonly resourceRoutingService: ResourceRoutingService,
    private readonly gateService: GateService,
    private readonly completionUsageService: CompletionUsageService,
    private readonly completionMetricsService: CompletionMetricsService,
    private readonly completionAuditService: CompletionAuditService,
    private readonly tokenService: TokenService
  ) {}

  public completion(
    request: FastifyRequest,
    workspaceId: string,
    environmentId: string,
    resource: string,
    payload: CompletionRequestDto,
    user?: UserEntity,
    apiKey?: ApiKeyEntity
  ): Observable<CompletionObservableData> {
    const subject = new Subject<CompletionObservableData>();
    const observable = subject.asObservable();
    const sourceIp = getSourceIpFromRequest(request);
    let modelConfig: AIResourceModelConfigEntity | null = null;
    let requestAt: Date = new Date();
    let routingDuration: number | null = null;
    let gateDuration: number | null = null;
    let providerDuration: number | null = null;
    let providerStartAt: number | null = null;
    let timeToFirstToken: number | null = null;
    let tokensPerSecond: number | null = null;
    let messageId: string | null = null;
    const auditEvents: CompletionAuditEventEntity[] = [];
    const auditData: CompletionObservableData[] = [];
    const requestId = uuidv4();

    defer(async () => {
      const aiResource = await this.getAIResource(
        workspaceId,
        environmentId,
        resource,
        payload.extra?.resourceConfigOverrides
      );

      const usePrimaryModel =
        payload.extra?.secondaryModelIndex == undefined ||
        payload.extra?.secondaryModelIndex === null;
      const useSecondaryModel =
        payload.extra?.secondaryModelIndex !== undefined ||
        payload.extra?.secondaryModelIndex !== null;

      modelConfig = usePrimaryModel
        ? aiResource.model
        : useSecondaryModel &&
          payload.extra?.secondaryModelIndex &&
          aiResource.secondaryModels?.[payload.extra?.secondaryModelIndex]
        ? aiResource.secondaryModels?.[payload.extra?.secondaryModelIndex]
        : throwServiceError(
            HttpStatus.BAD_REQUEST,
            ErrorCode.COMPLETION_SECONDARY_MODEL_NOT_FOUND,
            {
              secondaryModelIndex: payload.extra?.secondaryModelIndex,
            }
          );

      const requestTokens = this.tokenService.getRequestTokens(payload);

      const shouldRoute = usePrimaryModel && aiResource.routing?.enabled;
      if (shouldRoute) {
        const routingStartAt = Date.now();
        try {
          const routeModel =
            await this.resourceRoutingService.evaluateRoutingConditions(
              workspaceId,
              environmentId,
              payload,
              requestTokens,
              aiResource
            );
          if (routeModel) {
            auditEvents.push({
              timestamp: new Date(),
              type: CompletionAuditEventType.ROUTING,
              data: {
                originalModel: modelConfig,
                routedModel: routeModel,
              },
            });
            modelConfig = routeModel;
          }
        } finally {
          routingDuration = Date.now() - routingStartAt;
        }
      }

      subject.subscribe((item) => {
        auditData.push(item);
        messageId = item.data.id;

        if (payload.stream && !timeToFirstToken && providerStartAt) {
          timeToFirstToken = Date.now() - providerStartAt;
        }
      });

      const models = [modelConfig, ...(aiResource.fallbackModels ?? [])];
      for (let i = 0; i < models.length; i++) {
        modelConfig = models[i];
        if (i > 0) {
          requestAt = new Date();
          this.logger.info(
            `Fallback to ${modelConfig.provider} - ${modelConfig.model} provider, attempt ${i}`
          );
        }

        const baseProps = {
          workspaceId,
          environmentId,
          resource,
          model: modelConfig.model,
          timestamp: requestAt,
          requestId,
          sourceIp,
          apiKeyId: apiKey?.apiKeyId,
          correlationId: payload.extra?.correlationId,
          connectionId: modelConfig.connectionId,
        };

        try {
          const aiConnection = await this.aiConnectionService.getById(
            workspaceId,
            environmentId,
            modelConfig.connectionId,
            false,
            true,
            true
          );

          const provider = this.aiProviderService.get(aiConnection.provider);
          if (!provider) {
            throwServiceError(
              HttpStatus.BAD_REQUEST,
              ErrorCode.AI_PROVIDER_NOT_FOUND,
              {
                id: aiConnection.provider,
              }
            );
          }

          const gateStartAt = Date.now();
          let evaluatedCapacities: EvaluatedCapacity[] = [];
          try {
            evaluatedCapacities = await this.gateService.requestGate(
              request,
              requestAt,
              requestTokens,
              workspaceId,
              environmentId,
              aiResource,
              modelConfig,
              aiConnection,
              apiKey
            );
          } finally {
            gateDuration = Date.now() - gateStartAt;
          }

          const { extra, ...rawPayload } = payload;
          providerStartAt = Date.now();
          const completionUsage = await provider.completion(
            rawPayload,
            aiConnection,
            modelConfig,
            subject
          );
          const requestDuration = Date.now() - requestAt.getTime();
          providerDuration = Date.now() - providerStartAt;
          if (completionUsage) {
            tokensPerSecond =
              completionUsage.total_tokens /
              ((Date.now() - providerStartAt) / 1000);
          }

          if (completionUsage) {
            await this.gateService.increaseTokenResponseUsage(
              evaluatedCapacities,
              completionUsage
            );
          }

          this.completionUsageService.push({
            ...baseProps,
            statusCode: HttpStatus.OK,
            provider: modelConfig.provider,
            messageId,
            gateDuration,
            providerDuration,
            routingDuration,
            timeToFirstToken,
            tokensPerSecond,
            requestDuration,
            completionTokens: completionUsage?.completion_tokens,
            promptTokens: completionUsage?.prompt_tokens,
            totalTokens: completionUsage?.total_tokens,
          });
          this.completionMetricsService.push({
            ...baseProps,
            statusCode: HttpStatus.OK,
          });
          this.completionAuditService.push({
            ...baseProps,
            statusCode: HttpStatus.OK,
            type: PublicCompletionAuditType.COMPLETION,
            events: auditEvents,
            data: auditData,
            duration: requestDuration,
          });
          break;
        } catch (error) {
          this.logger.error(
            `Error execution completion for provider ${modelConfig.provider}`,
            error
          );

          if (i === models.length - 1) {
            this.logger.error('All providers failed to execute completion');
            throw error;
          }

          const { failureReason, statusCode, errorMessage } =
            this.parseProviderError(error);

          auditEvents.push({
            timestamp: new Date(),
            type: CompletionAuditEventType.FALLBACK,
            data: {
              ...modelConfig,
              failureReason,
              statusCode,
              errorMessage,
            },
          });

          this.completionUsageService.push({
            ...baseProps,
            statusCode,
            provider: modelConfig.provider,
            messageId,
            gateDuration,
            routingDuration,
            timeToFirstToken,
            tokensPerSecond,
            requestDuration: Date.now() - requestAt.getTime(),
            error: true,
            failureReason,
          });
          this.completionMetricsService.push({
            ...baseProps,
            statusCode,
          });
        }
      }
    }).subscribe({
      complete: () => {
        subject.complete();
      },
      error: (err) => {
        const { failureReason, statusCode, errorMessage } =
          this.parseProviderError(err);

        const baseProps = {
          workspaceId,
          environmentId,
          resource,
          model: modelConfig?.model,
          timestamp: requestAt,
          requestId,
          sourceIp,
          apiKeyId: apiKey?.apiKeyId,
          correlationId: payload.extra?.correlationId,
          connectionId: modelConfig?.connectionId,
        };
        const requestDuration = Date.now() - requestAt.getTime();

        this.completionUsageService.push({
          ...baseProps,
          failureReason,
          statusCode,
          provider: modelConfig?.provider,
          messageId,
          gateDuration,
          providerDuration,
          routingDuration,
          timeToFirstToken,
          tokensPerSecond,
          requestDuration,
          error: true,
        });
        if (modelConfig) {
          this.completionMetricsService.push({
            ...baseProps,
            connectionId: modelConfig.connectionId,
            model: modelConfig.model,
            statusCode,
          });
        }
        this.completionAuditService.push({
          ...baseProps,
          statusCode,
          type: PublicCompletionAuditType.COMPLETION,
          events: auditEvents,
          data: auditData,
          duration: requestDuration,
          errorMessage,
          failureReason,
        });

        subject.error(err);
      },
    });

    return observable;
  }

  private parseProviderError(err: unknown) {
    let failureReason = 'Internal server error';
    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorMessage = 'Internal server error';
    if (err instanceof CompletionError) {
      statusCode = err.data.statusCode;
      failureReason = err.data.failureReason ?? failureReason;
      errorMessage = err.data.message;
    } else if (err instanceof Error) {
      errorMessage = err.message;
    }

    return { failureReason, statusCode, errorMessage };
  }

  private async getAIResource(
    workspaceId: string,
    environmentId: string,
    resource: string,
    resourceConfigOverrides?: Partial<CreateAIResourceDto> | null
  ): Promise<AIResourceEntity> {
    const aiResourceEntity = await this.aiResourceService.getById(
      workspaceId,
      environmentId,
      resource,
      false,
      /**
       * If the resource config overrides provides the minimum,
       * we don't need to throw an error if the resource is not found.
       */
      !resourceConfigOverrides?.model
    );

    return {
      ...(aiResourceEntity || {}),
      ...(resourceConfigOverrides || {}),
    } as AIResourceEntity;
  }
}
