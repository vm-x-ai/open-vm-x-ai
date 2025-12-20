---
sidebar_position: 1
---

# AI Connections

AI Connections represent connections to specific AI providers with their credentials and capacity configuration. This guide covers everything you need to know about creating and managing AI Connections.

## What is an AI Connection?

An AI Connection encapsulates:

- **Provider**: The AI provider (OpenAI, Anthropic, Google Gemini, Groq, AWS Bedrock)
- **Credentials**: Encrypted API keys or authentication tokens
- **Capacity**: Custom capacity limits (e.g., 100 RPM, 100,000 TPM)
- **Allowed Models**: Optional list of models that can be used through this connection
- **Discovered Capacity**: Automatically discovered rate limits from the provider

## Creating an AI Connection

### Via UI

1. Navigate to **AI Connections** in the UI
2. Click **Create Connection**
3. Fill in the connection details:
   - **Name**: A descriptive name for the connection
   - **Description**: Optional description
   - **Provider**: Select the AI provider
   - **Configuration**: Provider-specific configuration (API keys, region, etc.)
   - **Capacity**: Define capacity limits (optional)
   - **Allowed Models**: Restrict which models can be used (optional)

### Via API

```bash
curl -X POST http://localhost:3000/api/v1/workspaces/{workspaceId}/environments/{environmentId}/ai-connections \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key" \
  -d '{
    "name": "OpenAI Production",
    "description": "OpenAI connection for production workloads",
    "provider": "openai",
    "config": {
      "apiKey": "sk-..."
    },
    "capacity": [
      {
        "period": "minute",
        "requests": 100,
        "tokens": 100000
      },
      {
        "period": "hour",
        "requests": 5000,
        "tokens": 5000000
      }
    ]
  }'
```

## Provider-Specific Configuration

### OpenAI

```json
{
  "provider": "openai",
  "config": {
    "apiKey": "sk-..."
  }
}
```

### Anthropic

```json
{
  "provider": "anthropic",
  "config": {
    "apiKey": "sk-ant-..."
  }
}
```

### Google Gemini

```json
{
  "provider": "google",
  "config": {
    "apiKey": "..."
  }
}
```

### Groq

```json
{
  "provider": "groq",
  "config": {
    "apiKey": "..."
  }
}
```

### AWS Bedrock

```json
{
  "provider": "aws-bedrock",
  "config": {
    "region": "us-east-1",
    "accessKeyId": "...",
    "secretAccessKey": "...",
    "sessionToken": "..." // Optional, for temporary credentials
  }
}
```

## Capacity Configuration

Capacity limits control how many requests and tokens can be used within a time period.

### Capacity Periods

Supported periods:
- **minute**: Requests/tokens per minute
- **hour**: Requests/tokens per hour
- **day**: Requests/tokens per day

### Example Configuration

```json
{
  "capacity": [
    {
      "period": "minute",
      "requests": 100,
      "tokens": 100000
    },
    {
      "period": "hour",
      "requests": 5000,
      "tokens": 5000000
    },
    {
      "period": "day",
      "requests": 100000,
      "tokens": 100000000
    }
  ]
}
```

### Capacity Enforcement

Capacity is enforced at the connection level. When a request exceeds capacity:
- The request is rejected with a `429 Too Many Requests` status
- An error message indicates which limit was exceeded
- The client should retry after the rate limit window resets

## Allowed Models

Restrict which models can be used through a connection:

```json
{
  "allowedModels": [
    "gpt-4o",
    "gpt-4o-mini"
  ]
}
```

If `allowedModels` is specified:
- Only listed models can be used through this connection
- Requests for other models will be rejected
- Useful for cost control and preventing accidental use of expensive models

## Discovered Capacity

VM-X AI automatically discovers rate limits from provider responses:

- **X-RateLimit-Limit-Requests**: Maximum requests per window
- **X-RateLimit-Limit-Tokens**: Maximum tokens per window

Discovered capacity is stored in the connection and can be viewed in the UI. This helps you:
- Understand actual provider limits
- Optimize your capacity configuration
- Monitor provider rate limit changes

## Credential Security

### Encryption

Credentials are encrypted at rest using:
- **AWS KMS**: For production environments (recommended)
- **Libsodium**: For local development and small deployments

### Credential Storage

- Credentials are stored encrypted in PostgreSQL
- Decryption happens in-memory only
- Credentials are never exposed in:
  - API responses
  - Logs
  - Error messages

### Credential Rotation

To rotate credentials:

1. Update the connection configuration with new credentials
2. The old credentials are immediately replaced
3. No downtime required - existing requests continue with old credentials until new ones are used

## Best Practices

### 1. One Connection Per Provider Account

Create separate connections for:
- Different provider accounts
- Different regions (for AWS Bedrock)
- Different environments (development, staging, production)

### 2. Set Realistic Capacity

Base capacity limits on:
- Provider quotas
- Your usage patterns
- Cost considerations

Monitor discovered capacity to understand actual provider limits.

### 3. Use Model Restrictions

Use `allowedModels` to:
- Prevent accidental use of expensive models
- Control costs
- Enforce model usage policies

### 4. Monitor Usage

Regularly review:
- Capacity utilization
- Discovered capacity changes
- Error rates

### 5. Secure Credentials

- Use AWS KMS for production
- Rotate credentials regularly
- Never commit credentials to version control
- Use least-privilege access for AWS KMS keys

## Updating an AI Connection

### Via UI

1. Navigate to the connection
2. Click **Edit**
3. Update the desired fields
4. Click **Save**

### Via API

```bash
curl -X PATCH http://localhost:3000/api/v1/workspaces/{workspaceId}/environments/{environmentId}/ai-connections/{connectionId} \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key" \
  -d '{
    "capacity": [
      {
        "period": "minute",
        "requests": 200,
        "tokens": 200000
      }
    ]
  }'
```

## Viewing Connection Details

### Via UI

Navigate to **AI Connections** and click on a connection to view:
- Connection details
- Capacity configuration
- Discovered capacity
- Allowed models
- Usage statistics

### Via API

```bash
curl http://localhost:3000/api/v1/workspaces/{workspaceId}/environments/{environmentId}/ai-connections/{connectionId} \
  -H "Authorization: Bearer your-api-key"
```

## Troubleshooting

### Connection Not Working

1. **Verify Credentials**: Ensure API keys are correct and valid
2. **Check Provider Status**: Verify the provider service is operational
3. **Review Logs**: Check API logs for error messages
4. **Test Connection**: Use the provider's API directly to verify credentials

### Capacity Limits Too Restrictive

1. **Review Capacity Configuration**: Check if limits are too low
2. **Monitor Usage**: Review actual usage patterns
3. **Adjust Limits**: Increase capacity limits as needed
4. **Consider Prioritization**: Use prioritization to allocate capacity fairly

### Discovered Capacity Not Updating

1. **Make Requests**: Discovered capacity is updated when requests are made
2. **Check Provider Headers**: Verify provider returns rate limit headers
3. **Review Logs**: Check for errors in capacity discovery

## Next Steps

- [AI Resources](./ai-resources.md) - Learn about AI Resources
- [Prioritization](./prioritization.md) - Understand capacity prioritization
- [Usage](./usage.md) - Monitor usage and metrics

