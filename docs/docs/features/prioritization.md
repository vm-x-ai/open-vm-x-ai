---
sidebar_position: 3
---

# Prioritization

Prioritization allows you to allocate capacity across multiple AI resources, ensuring fair distribution and optimal resource utilization. This guide explains how prioritization works and how to configure it.

## What is Prioritization?

Prioritization is a system that:

- **Allocates Capacity**: Distributes available capacity across multiple resources
- **Ensures Fairness**: Prevents one resource from consuming all capacity
- **Adapts Dynamically**: Adjusts allocation based on usage patterns
- **Supports Multiple Strategies**: Uses sophisticated algorithms for allocation

## How It Works

### Pool Definition

A **Pool Definition** groups resources together and defines how capacity should be allocated:

```json
{
  "definition": [
    {
      "name": "high-priority",
      "resources": ["resource-1", "resource-2"],
      "minReservation": 50,
      "maxReservation": 100
    },
    {
      "name": "low-priority",
      "resources": ["resource-3", "resource-4"],
      "minReservation": 0,
      "maxReservation": 50
    }
  ]
}
```

### Allocation Strategy

VM-X AI uses an **Adaptive Token Scaling** strategy that:

1. **Tracks Usage**: Monitors token usage per resource and pool
2. **Calculates Available Capacity**: Determines how much capacity is available
3. **Allocates Dynamically**: Adjusts allocation based on demand
4. **Enforces Limits**: Ensures resources don't exceed their allocation

### Capacity Gates

When a request is made:

1. **Connection Capacity Check**: Verify connection has available capacity
2. **Resource Capacity Check**: Verify resource has available capacity
3. **Prioritization Gate**: Check if request should proceed based on prioritization
4. **Request Processing**: If all gates pass, process the request

## Configuring Prioritization

### Via UI

1. Navigate to **Prioritization** in the UI
2. Click **Edit Pool Definition**
3. Configure pools:
   - **Pool Name**: Name for the pool
   - **Resources**: Resources assigned to this pool
   - **Min Reservation**: Minimum percentage of capacity reserved
   - **Max Reservation**: Maximum percentage of capacity available

### Via API

```bash
curl -X PUT http://localhost:3000/api/v1/workspaces/{workspaceId}/environments/{environmentId}/pool-definition \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key" \
  -d '{
    "definition": [
      {
        "name": "high-priority",
        "resources": ["resource-1", "resource-2"],
        "minReservation": 50,
        "maxReservation": 100
      },
      {
        "name": "low-priority",
        "resources": ["resource-3"],
        "minReservation": 0,
        "maxReservation": 50
      }
    ]
  }'
```

## Pool Configuration

### Pool Properties

- **name**: Unique name for the pool
- **resources**: Array of resource IDs assigned to this pool
- **minReservation**: Minimum percentage (0-100) of capacity reserved for this pool
- **maxReservation**: Maximum percentage (0-100) of capacity available to this pool

### Example Configuration

```json
{
  "definition": [
    {
      "name": "production",
      "resources": ["prod-chat", "prod-embeddings"],
      "minReservation": 70,
      "maxReservation": 100
    },
    {
      "name": "development",
      "resources": ["dev-chat", "dev-testing"],
      "minReservation": 0,
      "maxReservation": 30
    }
  ]
}
```

This configuration:
- Reserves 70% of capacity for production resources
- Allows production to use up to 100% if available
- Allows development to use up to 30% if available
- Development gets 0% minimum (can be starved if production uses all capacity)

## Allocation Algorithm

### Adaptive Token Scaling

The algorithm:

1. **Calculate Available Capacity**: Total capacity minus current usage
2. **Check Pool Reservations**: Ensure each pool has at least its minimum reservation
3. **Allocate Excess Capacity**: Distribute excess capacity based on demand
4. **Scale Up/Down**: Adjust allocation based on usage patterns

### Example Scenario

Given:
- Total capacity: 100,000 TPM
- Production pool: min 70%, max 100%
- Development pool: min 0%, max 30%

Allocation:
- Production guaranteed: 70,000 TPM (70%)
- Development guaranteed: 0 TPM (0%)
- If production uses 60,000 TPM:
  - Production can scale up to 100,000 TPM (100%)
  - Development can use up to 30,000 TPM (30%)
- If production uses 80,000 TPM:
  - Production uses 80,000 TPM (80%)
  - Development can use up to 20,000 TPM (20%)

## Best Practices

### 1. Define Clear Pools

Group resources logically:
- By environment (production, staging, development)
- By priority (high, medium, low)
- By team or project
- By cost tier

### 2. Set Realistic Reservations

- **Min Reservation**: Set based on guaranteed needs
- **Max Reservation**: Set based on maximum acceptable usage
- **Balance**: Ensure total min reservations don't exceed 100%

### 3. Monitor Allocation

Regularly review:
- Actual allocation vs. configured reservations
- Resource usage patterns
- Capacity utilization
- Rejection rates

### 4. Adjust Based on Usage

Update pool definitions based on:
- Actual usage patterns
- Business priorities
- Cost considerations
- Performance requirements

### 5. Test Changes

Before deploying:
- Test pool definition changes
- Verify allocation works as expected
- Monitor for issues

## Troubleshooting

### Requests Being Rejected

If requests are being rejected by prioritization:

1. **Check Pool Definition**: Verify resources are in correct pools
2. **Review Reservations**: Check if min/max reservations are appropriate
3. **Monitor Usage**: Review actual usage vs. capacity
4. **Adjust Reservations**: Increase reservations if needed

### Uneven Allocation

If allocation seems uneven:

1. **Review Algorithm**: Understand how adaptive token scaling works
2. **Check Usage Patterns**: Review usage patterns per resource
3. **Adjust Reservations**: Fine-tune min/max reservations
4. **Monitor Metrics**: Use metrics to understand allocation decisions

### Capacity Not Available

If capacity is not available:

1. **Check Connection Capacity**: Verify connection has capacity
2. **Review Pool Allocation**: Check if pools are using all capacity
3. **Monitor Usage**: Review actual usage patterns
4. **Increase Capacity**: Increase connection capacity if needed

## Viewing Prioritization Status

### Via UI

Navigate to **Prioritization** to view:
- Pool definitions
- Resource assignments
- Current allocation
- Usage statistics

### Via API

```bash
curl http://localhost:3000/api/v1/workspaces/{workspaceId}/environments/{environmentId}/pool-definition \
  -H "Authorization: Bearer your-api-key"
```

## Next Steps

- [AI Resources](./ai-resources.md) - Learn about AI Resources
- [Usage](./usage.md) - Monitor usage and metrics
- [AI Connections](./ai-connections.md) - Understand AI Connections

