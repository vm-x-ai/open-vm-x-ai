export class CompletionPayloadMetricDto {
  workspaceId: string;
  environmentId: string;
  resource: string;
  aiConnectionId: string;
  model: string;
  requestTimestamp: Date;
  statusCode: number;
}
