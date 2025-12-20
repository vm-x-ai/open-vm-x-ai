---
sidebar_position: 2
---

# AI Resources

AI Resources are logical endpoints that your applications use to make AI requests. They define which provider/model to use, routing rules, fallback behavior, and capacity allocation.

## What is an AI Resource?

An AI Resource is the abstraction your applications interact with. It includes:

- **Primary Model**: The default provider/model to use
- **Routing Rules**: Conditions for dynamically selecting different models
- **Fallback Models**: Alternative models to use if the primary fails
- **Capacity**: Resource-level capacity limits
- **API Key Assignment**: Which API keys can access this resource

## Creating an AI Resource

### Via UI

1. Navigate to **AI Resources** in the UI
2. Click **Create Resource**
3. Fill in the resource details:
   - **Name**: A descriptive name (this is what your application uses)
   - **Description**: Optional description
   - **Primary Model**: Select provider and model
   - **Routing**: Configure routing rules (optional)
   - **Fallback**: Configure fallback models (optional)
   - **Capacity**: Define resource-level capacity (optional)
   - **API Keys**: Assign API keys that can access this resource

### Via API

```bash
curl -X POST http://localhost:3000/api/v1/workspaces/{workspaceId}/environments/{environmentId}/ai-resources \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key" \
  -d '{
    "name": "chat-completion",
    "description": "Primary chat completion resource",
    "model": {
      "provider": "openai",
      "connectionId": "connection-id",
      "model": "gpt-4o"
    },
    "useFallback": true,
    "fallbackModels": [
      {
        "provider": "bedrock",
        "connectionId": "bedrock-connection-id",
        "model": "anthropic.claude-3-5-sonnet-20241022-v2:0"
      }
    ],
    "enforceCapacity": false
  }'
```

## Dynamic Routing

Routing allows you to dynamically select different models based on request characteristics.

### Basic Routing

Route based on simple conditions:

```json
{
  "routing": {
    "enabled": true,
    "conditions": [
      {
        "description": "Use Groq for small requests",
        "if": [
          {
            "field": "requestTokens",
            "operator": "lessThan",
            "value": 100
          }
        ],
        "then": {
          "provider": "groq",
          "connectionId": "groq-connection-id",
          "model": "llama-3.1-70b-versatile"
        }
      }
    ]
  }
}
```

### Routing Based on Error Rate

Route to a different provider if error rate is high:

```json
{
  "routing": {
    "enabled": true,
    "conditions": [
      {
        "description": "Switch to Anthropic if error rate is high",
        "if": [
          {
            "field": "errorRate",
            "operator": "greaterThan",
            "value": 10,
            "window": 10
          }
        ],
        "then": {
          "provider": "anthropic",
          "connectionId": "anthropic-connection-id",
          "model": "claude-3-5-sonnet-20241022"
        }
      }
    ]
  }
}
```

### Routing Based on Tools Usage

Route to a specific model for requests with tools:

```json
{
  "routing": {
    "enabled": true,
    "conditions": [
      {
        "description": "Use GPT-4 for requests with tools",
        "if": [
          {
            "field": "hasTools",
            "operator": "equals",
            "value": true
          }
        ],
        "then": {
          "provider": "openai",
          "connectionId": "openai-connection-id",
          "model": "gpt-4o"
        }
      }
    ]
  }
}
```

### Advanced Routing with Expressions

Use advanced expressions for complex routing logic:

```json
{
  "routing": {
    "enabled": true,
    "mode": "advanced",
    "conditions": [
      {
        "description": "Complex routing logic",
        "expression": "requestTokens < 100 && errorRate(10, 'any') < 5",
        "then": {
          "provider": "groq",
          "connectionId": "groq-connection-id",
          "model": "llama-3.1-70b-versatile",
          "traffic": 50
        }
      }
    ]
  }
}
```

### Available Routing Fields

- **requestTokens**: Number of input tokens in the request
- **errorRate**: Error rate percentage (requires window parameter)
- **hasTools**: Boolean indicating if request includes tools
- **model**: The requested model name
- **provider**: The requested provider name

### Available Operators

- **equals**: Field equals value
- **notEquals**: Field does not equal value
- **greaterThan**: Field is greater than value
- **lessThan**: Field is less than value
- **greaterThanOrEqual**: Field is greater than or equal to value
- **lessThanOrEqual**: Field is less than or equal to value
- **contains**: Field contains value (for arrays/strings)
- **notContains**: Field does not contain value

### Traffic Splitting

Use traffic splitting for A/B testing or gradual rollouts:

```json
{
  "routing": {
    "enabled": true,
    "conditions": [
      {
        "description": "50% traffic to new model",
        "if": [
          {
            "field": "requestTokens",
            "operator": "lessThan",
            "value": 100
          }
        ],
        "then": {
          "provider": "groq",
          "connectionId": "groq-connection-id",
          "model": "llama-3.1-70b-versatile",
          "traffic": 50
        }
      }
    ]
  }
}
```

The `traffic` field specifies the percentage (0-100) of matching requests that should use this route.

## Automatic Fallback

Fallback models are automatically used if the primary model fails.

### Configuring Fallback

```json
{
  "useFallback": true,
  "fallbackModels": [
    {
      "provider": "bedrock",
      "connectionId": "bedrock-connection-id",
      "model": "anthropic.claude-3-5-sonnet-20241022-v2:0"
    },
    {
      "provider": "openai",
      "connectionId": "openai-connection-id",
      "model": "gpt-4o-mini"
    }
  ]
}
```

### When Fallback Triggers

Fallback is triggered on:
- **Provider Errors**: 5xx status codes
- **Rate Limit Errors**: 429 status codes
- **Timeout Errors**: Request timeouts
- **Network Failures**: Connection failures

### Fallback Chain

Fallback models are tried in order:
1. Primary model fails
2. Try first fallback model
3. If that fails, try second fallback model
4. Continue until a model succeeds or all fail

## Resource-Level Capacity

Define capacity limits specific to a resource:

```json
{
  "capacity": [
    {
      "period": "minute",
      "requests": 50,
      "tokens": 50000
    },
    {
      "period": "hour",
      "requests": 2000,
      "tokens": 2000000
    }
  ],
  "enforceCapacity": true
}
```

### Capacity Enforcement

When `enforceCapacity` is `true`:
- Resource-level capacity is checked before connection-level capacity
- Requests exceeding resource capacity are rejected
- Useful for:
  - Limiting usage per resource independently
  - Controlling costs by resource
  - Implementing tiered access levels

## API Key Assignment

Assign API keys to resources to control access:

```json
{
  "assignApiKeys": [
    "api-key-id-1",
    "api-key-id-2"
  ]
}
```

Only requests with assigned API keys can access the resource. If no API keys are assigned, all API keys can access the resource.

## Using an AI Resource

### With OpenAI SDK

```python
from openai import OpenAI

client = OpenAI(
    api_key="your-vmx-api-key",
    base_url="http://localhost:3000/api/v1"
)

# Use the resource name as the model
response = client.chat.completions.create(
    model="chat-completion",  # Your AI Resource name
    messages=[
        {"role": "user", "content": "Hello!"}
    ]
)
```

### With cURL

```bash
curl http://localhost:3000/api/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-vmx-api-key" \
  -d '{
    "model": "chat-completion",
    "messages": [
      {"role": "user", "content": "Hello!"}
    ]
  }'
```

## Best Practices

### 1. Start Simple

Begin with:
- A single primary model
- No routing (or simple routing)
- At least one fallback model

Add complexity as needed.

### 2. Test Routing Conditions

Before deploying:
- Test routing conditions with sample requests
- Verify routing logic works as expected
- Monitor routing decisions in audit logs

### 3. Configure Fallback Chains

Always have:
- At least one fallback model for critical resources
- Fallback models from different providers
- Fallback models with different cost profiles

### 4. Set Resource Capacity

Use resource-level capacity to:
- Control costs per resource
- Ensure fair usage across resources
- Implement tiered access levels

### 5. Use API Keys for Access Control

Assign API keys to resources to:
- Control who can access which resources
- Implement multi-tenant access
- Track usage by API key

## Updating an AI Resource

### Via UI

1. Navigate to the resource
2. Click **Edit**
3. Update the desired fields
4. Click **Save**

### Via API

```bash
curl -X PATCH http://localhost:3000/api/v1/workspaces/{workspaceId}/environments/{environmentId}/ai-resources/{resourceId} \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key" \
  -d '{
    "routing": {
      "enabled": true,
      "conditions": [...]
    }
  }'
```

## Troubleshooting

### Routing Not Working

1. **Check Routing Enabled**: Ensure routing is enabled
2. **Verify Conditions**: Check routing conditions are correct
3. **Review Logs**: Check audit logs for routing decisions
4. **Test Conditions**: Test routing conditions with sample requests

### Fallback Not Triggering

1. **Check Fallback Enabled**: Ensure `useFallback` is `true`
2. **Verify Fallback Models**: Check fallback models are configured
3. **Review Error Types**: Verify errors trigger fallback
4. **Check Logs**: Review logs for fallback attempts

### Capacity Limits Too Restrictive

1. **Review Capacity Configuration**: Check if limits are too low
2. **Monitor Usage**: Review actual usage patterns
3. **Adjust Limits**: Increase capacity limits as needed
4. **Consider Prioritization**: Use prioritization to allocate capacity fairly

## Next Steps

- [AI Connections](./ai-connections.md) - Learn about AI Connections
- [Prioritization](./prioritization.md) - Understand capacity prioritization
- [Usage](./usage.md) - Monitor usage and metrics

