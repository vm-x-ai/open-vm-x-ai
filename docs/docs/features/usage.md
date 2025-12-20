---
sidebar_position: 4
---

# Usage and Analytics

VM-X AI provides comprehensive usage tracking and analytics through audit logs and time-series metrics. This guide explains how to access and use this data.

## Overview

VM-X AI tracks:

- **Audit Logs**: Complete record of every request
- **Usage Metrics**: Time-series data for capacity planning
- **Performance Metrics**: Latency, throughput, error rates
- **Cost Metrics**: Token usage and provider costs

## Audit Logs

Audit logs provide a complete record of every AI request made through VM-X AI.

### What's Logged

Each audit log entry includes:

- **Request Details**: Model, provider, messages, parameters
- **Response Details**: Response content, tokens used, latency
- **Routing Information**: Which model was used, routing decisions
- **Fallback Information**: Fallback attempts and results
- **Capacity Information**: Capacity checks and prioritization decisions
- **Metadata**: Request ID, correlation ID, API key, user, timestamp

### Accessing Audit Logs

#### Via UI

1. Navigate to **Audit** in the UI
2. Use filters to find specific requests:
   - Date range
   - Resource
   - Provider
   - Model
   - Status code
   - API key
   - User

3. Click on a request to view details:
   - Request payload
   - Response data
   - Routing events
   - Capacity events
   - Error information

#### Via API

```bash
curl "http://localhost:3000/api/v1/workspaces/{workspaceId}/environments/{environmentId}/completion-audit?limit=100&offset=0" \
  -H "Authorization: Bearer your-api-key"
```

### Audit Log Fields

- **id**: Unique request ID
- **timestamp**: Request timestamp
- **workspaceId**: Workspace ID
- **environmentId**: Environment ID
- **resourceId**: AI Resource ID
- **connectionId**: AI Connection ID
- **provider**: Provider name
- **model**: Model name
- **statusCode**: HTTP status code
- **duration**: Request duration in milliseconds
- **requestPayload**: Complete request payload
- **responseData**: Response data
- **events**: Array of events (routing, capacity, etc.)
- **apiKeyId**: API key used
- **userId**: User who made the request
- **sourceIp**: Source IP address
- **errorMessage**: Error message (if any)
- **failureReason**: Failure reason (if any)

### Exporting Audit Logs

Audit logs can be exported for:
- Compliance requirements
- Analysis in external tools
- Backup and archival

## Usage Metrics

Usage metrics are stored in a time-series database (QuestDB or AWS Timestream) for efficient querying and analysis.

### Metrics Tracked

- **Request Count**: Number of requests per time period
- **Token Usage**: Prompt tokens, completion tokens, total tokens
- **Latency**: Request duration, time to first token
- **Error Rates**: Error counts and percentages
- **Capacity Usage**: RPM and TPM utilization
- **Provider Metrics**: Per-provider statistics

### Accessing Usage Metrics

#### Via UI

Navigate to **Usage** in the UI to view:
- Usage charts and graphs
- Token usage over time
- Request counts
- Error rates
- Capacity utilization

#### Via API

Query usage metrics:

```bash
curl "http://localhost:3000/api/v1/workspaces/{workspaceId}/environments/{environmentId}/usage?startTime=2024-01-01T00:00:00Z&endTime=2024-01-02T00:00:00Z" \
  -H "Authorization: Bearer your-api-key"
```

### Time-Series Queries

Query usage metrics directly from the time-series database:

#### QuestDB

```sql
SELECT 
  timestamp,
  resourceId,
  provider,
  model,
  SUM(promptTokens) as totalPromptTokens,
  SUM(completionTokens) as totalCompletionTokens,
  SUM(totalTokens) as totalTokens,
  COUNT(*) as requestCount
FROM completion_usage
WHERE timestamp >= '2024-01-01T00:00:00Z'
  AND timestamp < '2024-01-02T00:00:00Z'
  AND workspaceId = 'workspace-id'
  AND environmentId = 'environment-id'
SAMPLE BY 1h
ORDER BY timestamp;
```

#### AWS Timestream

Use AWS Timestream Query API or console to query metrics.

## OpenTelemetry Integration

VM-X AI exports metrics and traces to OpenTelemetry-compatible backends.

### Metrics Exported

- **completion.requests.total**: Total completion requests
- **completion.requests.success**: Successful requests
- **completion.requests.error**: Failed requests
- **completion.tokens.total**: Total tokens used
- **completion.tokens.prompt**: Prompt tokens
- **completion.tokens.completion**: Completion tokens
- **completion.duration**: Request duration
- **completion.routing.duration**: Routing evaluation duration
- **completion.gate.duration**: Capacity gate duration

### Traces Exported

- **Request Lifecycle**: Full request lifecycle
- **Provider Calls**: Individual provider requests
- **Routing Decisions**: Routing condition evaluation
- **Capacity Checks**: Capacity and prioritization gates

### Configuring OpenTelemetry

Set environment variables:

```bash
OTEL_ENABLED=true
OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4318
```

### Supported Backends

- **Datadog**: Via OpenTelemetry collector
- **Prometheus**: Via OpenTelemetry collector
- **Jaeger**: Direct OTLP export
- **AWS X-Ray**: Via OpenTelemetry collector
- **Any OpenTelemetry-compatible backend**

## Dashboard Examples

### Request Volume

Track request volume over time:
- Requests per hour/day
- Requests by resource
- Requests by provider

### Token Usage

Monitor token usage:
- Total tokens per period
- Prompt vs. completion tokens
- Token usage by resource
- Token usage by provider

### Error Rates

Monitor error rates:
- Error rate over time
- Errors by provider
- Errors by resource
- Error types

### Capacity Utilization

Track capacity usage:
- RPM utilization
- TPM utilization
- Capacity by resource
- Capacity by connection

### Cost Analysis

Estimate costs:
- Token usage by provider
- Request counts by provider
- Estimated costs (if provider pricing is known)

## Best Practices

### 1. Regular Monitoring

- Review usage metrics regularly
- Set up alerts for anomalies
- Monitor capacity utilization
- Track error rates

### 2. Capacity Planning

- Use historical data for capacity planning
- Identify usage patterns
- Plan for peak usage
- Adjust capacity based on trends

### 3. Cost Optimization

- Analyze token usage by provider
- Identify expensive operations
- Optimize routing based on costs
- Monitor cost trends

### 4. Performance Optimization

- Monitor latency metrics
- Identify slow operations
- Optimize routing based on performance
- Track provider performance

### 5. Compliance

- Retain audit logs as required
- Export logs for compliance
- Monitor access patterns
- Track user activity

## Exporting Data

### Audit Logs

Export audit logs for:
- Compliance requirements
- External analysis
- Backup and archival

### Usage Metrics

Export usage metrics to:
- Business intelligence tools
- Cost analysis tools
- Custom dashboards

## Troubleshooting

### Missing Metrics

If metrics are missing:

1. **Check Time-Series Database**: Verify database is running
2. **Check Configuration**: Verify time-series provider is configured
3. **Review Logs**: Check for errors in metric export
4. **Verify Queries**: Ensure queries are correct

### Slow Queries

If queries are slow:

1. **Add Indexes**: Ensure proper indexes exist
2. **Optimize Queries**: Use appropriate time ranges
3. **Use Aggregations**: Aggregate data when possible
4. **Consider Sampling**: Use sampling for large time ranges

### Missing Audit Logs

If audit logs are missing:

1. **Check Database**: Verify PostgreSQL is running
2. **Review Logs**: Check for errors in audit logging
3. **Verify Configuration**: Ensure audit logging is enabled
4. **Check Filters**: Verify filters are not excluding logs

## Next Steps

- [AI Resources](./ai-resources.md) - Learn about AI Resources
- [Prioritization](./prioritization.md) - Understand capacity prioritization
- [AI Connections](./ai-connections.md) - Understand AI Connections

