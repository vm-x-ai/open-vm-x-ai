---
sidebar_position: 3
---

# Deploying to AWS ECS

This guide shows you how to deploy VM-X AI to Amazon ECS (Elastic Container Service) using AWS CDK with Fargate.

## Overview

The AWS ECS example provides a complete production-ready infrastructure including:

- **ECS Fargate Cluster** for container orchestration
- **VPC** with multi-AZ networking
- **Aurora PostgreSQL** for the primary database
- **AWS Timestream** for time-series metrics
- **ElastiCache Serverless (Valkey)** for Redis-compatible caching
- **Application Load Balancers** for API and UI services
- **OpenTelemetry Collector** for observability
- **AWS KMS** for encryption
- **CloudWatch Logs** for centralized logging

## Prerequisites

Before you begin, ensure you have:

- **AWS CLI** configured with appropriate credentials
- **AWS CDK CLI** installed (`npm install -g aws-cdk`)
- **Node.js** 18+ and **pnpm** (or npm/yarn)
- **AWS Permissions** to create:
  - ECS clusters and services
  - VPCs, subnets, and networking resources
  - RDS Aurora clusters
  - Timestream databases
  - ElastiCache serverless caches
  - KMS keys
  - IAM roles and policies
  - Security groups
  - Application Load Balancers
  - CloudWatch Log Groups
  - SSM Parameters

## Quick Start

### 1. Navigate to ECS Example

```bash
cd examples/aws-cdk-ecs
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Bootstrap CDK (First Time Only)

If this is your first time using CDK in this AWS account/region:

```bash
pnpm cdk bootstrap
```

### 4. Deploy the Stack

```bash
pnpm cdk deploy
```

This will:
- Create the VPC and networking infrastructure
- Provision the ECS Fargate cluster
- Create the Aurora PostgreSQL database
- Create the Timestream database
- Create the ElastiCache serverless cache
- Create the KMS encryption key
- Deploy the API and UI services
- Configure all IAM roles and policies
- Set up Application Load Balancers

**Deployment typically takes 15-30 minutes.**

### 5. Get Application URLs

After deployment, retrieve the application URLs:

```bash
aws cloudformation describe-stacks \
  --stack-name vm-x-ai-ecs-example \
  --query 'Stacks[0].Outputs' \
  --output table
```

Or check the AWS Console for the Load Balancer DNS names:
- **ApiUrl**: API Load Balancer DNS name
- **UiUrl**: UI Load Balancer DNS name

## Architecture

The stack creates:

```
┌─────────────────────────────────────────────────────────────┐
│                        Internet                              │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
         ▼               ▼               ▼
┌──────────────┐ ┌──────────────┐
│  API ALB     │ │   UI ALB     │
│  (Port 80)   │ │  (Port 80)   │
└──────┬───────┘ └──────┬───────┘
       │                │
       ▼                ▼
┌──────────────────────────────────────────────────────┐
│              ECS Fargate Cluster                     │
│  ┌──────────────────────────────────────────────┐  │
│  │  API Service                                  │  │
│  │  ┌──────────────┐  ┌──────────────┐         │  │
│  │  │  API         │  │  OTEL        │         │  │
│  │  │  Container   │  │  Collector   │         │  │
│  │  └──────────────┘  └──────────────┘         │  │
│  └──────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────┐  │
│  │  UI Service                                   │  │
│  │  ┌──────────────┐  ┌──────────────┐         │  │
│  │  │  UI          │  │  OTEL        │         │  │
│  │  │  Container   │  │  Collector   │         │  │
│  │  └──────────────┘  └──────────────┘         │  │
│  └──────────────────────────────────────────────┘  │
└────────────────────────┬─────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
         ▼               ▼               ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│   Aurora     │ │  ElastiCache │ │  Timestream  │
│  PostgreSQL  │ │  (Valkey)    │ │   Database   │
└──────────────┘ └──────────────┘ └──────────────┘
```

## Configuration

### Task Resources

Default task configuration:

- **API Task**: 1024 MiB memory, 512 CPU units
- **UI Task**: 1024 MiB memory, 512 CPU units
- **OTEL Collector**: 512 MiB memory, 256 CPU units

Modify in `lib/ecs-stack.ts`:

```typescript
const apiTaskDefinition = new FargateTaskDefinition(this, 'API/TaskDef', {
  memoryLimitMiB: 2048,  // Increase memory
  cpu: 1024,              // Increase CPU
  family: 'vm-x-ai-api-task-definition',
});
```

### Service Desired Count

Default is 1 task per service. Modify:

```typescript
const apiService = new FargateService(this, 'API/Service', {
  // ...
  desiredCount: 2,  // Scale to 2 tasks
});
```

### OpenTelemetry Configuration

The OpenTelemetry collector configuration is stored in `ecs-otel-config.yaml` and uploaded to SSM Parameter Store. Customize by editing the file.

## Accessing Services

### Application

Access the application at the Load Balancer DNS names:
- **UI**: `http://<ui-alb-dns-name>`
- **API**: `http://<api-alb-dns-name>`

Default credentials:
- **Username**: `admin`
- **Password**: `admin`

### CloudWatch Logs

View logs for all services:

```bash
# API logs
aws logs tail /aws/ecs/vm-x-ai-api --follow

# UI logs
aws logs tail /aws/ecs/vm-x-ai-ui --follow

# Collector logs
aws logs tail /aws/ecs/vm-x-ai-collector --follow
```

### AWS X-Ray

Traces are automatically sent to AWS X-Ray. View them in the AWS X-Ray console or via CLI:

```bash
aws xray get-trace-summaries \
  --start-time $(date -u -d '1 hour ago' +%s) \
  --end-time $(date -u +%s)
```

## Secrets Management

The stack uses **AWS Secrets Manager** and **SSM Parameter Store**:

- **Database Credentials**: Stored in Secrets Manager (`vm-x-ai-database-secret`)
  - Automatically generated when Aurora cluster is created
  - Contains: `host`, `port`, `dbname`, `username`, `password`
- **UI Auth Secret**: Stored in Secrets Manager (`vm-x-ai-ui-auth-secret`)
  - Auto-generated 32-character secret
- **OpenTelemetry Config**: Stored in SSM Parameter Store (`vm-x-ai-otel-config`)
  - Contains collector configuration from `ecs-otel-config.yaml`
- **KMS Key**: Referenced by ARN (no secret needed)

## Monitoring and Observability

The stack includes:

- **CloudWatch Logs**: All container logs
- **AWS X-Ray**: Distributed tracing for API requests
- **CloudWatch Metrics**: Custom metrics via OpenTelemetry EMF exporter
- **Health Checks**: ALB health checks on `/healthcheck` endpoints

### Viewing Metrics

Metrics are exported to CloudWatch under namespace `ECS/OTEL/VM-X-AI`:

```bash
aws cloudwatch list-metrics --namespace ECS/OTEL/VM-X-AI
```

## Cost Considerations

Estimated monthly costs for minimal production setup:

- **ECS Fargate**: ~$30-50/month (0.04/vCPU-hour + 0.004/GB-hour)
- **Application Load Balancers**: ~$32/month (2 ALBs × $0.0225/hour)
- **Aurora PostgreSQL**: $100-200/month (db.t3.medium)
- **ElastiCache Serverless**: $10-30/month (pay-per-use)
- **Timestream**: $10-50/month (pay-per-use)
- **Data Transfer**: ~$0.09/GB for outbound
- **CloudWatch Logs**: ~$0.50/GB ingested, $0.03/GB stored

**Total**: $200-400/month

To reduce costs:
- Use smaller task sizes (reduce CPU/memory)
- Reduce desired count to 0 when not in use
- Use Aurora Serverless v2 for variable workloads
- Disable optional components
- Use single-AZ deployment (not recommended for production)

## Troubleshooting

### Check Task Status

```bash
# List tasks
aws ecs list-tasks --cluster vm-x-ai-cluster --service-name vm-x-ai-api

# Describe task
aws ecs describe-tasks --cluster vm-x-ai-cluster --tasks <task-arn>

# Task logs
aws logs tail /aws/ecs/vm-x-ai-api --follow
```

### Check Service Status

```bash
# Describe service
aws ecs describe-services \
  --cluster vm-x-ai-cluster \
  --services vm-x-ai-api vm-x-ai-ui
```

### Check Load Balancer

```bash
# Describe load balancer
aws elbv2 describe-load-balancers --names vm-x-ai-api vm-x-ai-ui

# Check target health
aws elbv2 describe-target-health \
  --target-group-arn <target-group-arn>
```

### Common Issues

1. **Tasks stuck in Pending**: Check security group rules and VPC configuration
2. **Tasks failing health checks**: Verify health check path and container configuration
3. **Database connection failures**: Check security group rules and VPC configuration
4. **Secrets not accessible**: Verify IAM role permissions for Secrets Manager

## Cleanup

To destroy all resources:

```bash
pnpm cdk destroy
```

**Warning**: This will delete all resources including databases and caches. Make sure you have backups if needed.

**Note**: Some resources may need to be deleted manually:
- ElastiCache serverless cache (may take time to delete)
- Timestream database (must be empty before deletion)

## Customization

### Add Auto Scaling

Add Application Auto Scaling to automatically scale services:

```typescript
import { ScalableTarget, ServiceNamespace, MetricType } from 'aws-cdk-lib/aws-applicationautoscaling';

const scalableTarget = apiService.autoScaleTaskCount({
  minCapacity: 1,
  maxCapacity: 10,
});

scalableTarget.scaleOnCpuUtilization('CpuScaling', {
  targetUtilizationPercent: 70,
});
```

### Use Private Subnets (Production)

For production, move resources to private subnets:

```typescript
vpcSubnets: {
  subnetType: SubnetType.PRIVATE_WITH_EGRESS,  // Instead of PUBLIC
},
assignPublicIp: false,  // Instead of true
```

## Security Best Practices

For production deployments:

1. **Private Subnets**: Move all resources to private subnets with NAT Gateway
2. **Security Groups**: Implement least-privilege security group rules
3. **Secrets Rotation**: Enable automatic secret rotation in Secrets Manager
4. **Encryption**: Ensure all data at rest is encrypted
5. **Backup**: Enable automated backups for Aurora
6. **Monitoring**: Set up CloudWatch alarms for service health
7. **Access Control**: Use least-privilege IAM policies
8. **HTTPS**: Configure SSL/TLS certificates for load balancers
9. **VPC Endpoints**: Use VPC endpoints for AWS services
10. **Network ACLs**: Implement network ACLs for additional security

## Production Checklist

Before deploying to production:

- [ ] Move database to private subnets
- [ ] Move ElastiCache to private subnets
- [ ] Disable public IP assignment for tasks
- [ ] Configure HTTPS/TLS on load balancers
- [ ] Set up custom domain names
- [ ] Enable database backups
- [ ] Configure auto-scaling
- [ ] Set up CloudWatch alarms
- [ ] Review and tighten IAM policies
- [ ] Enable VPC Flow Logs
- [ ] Configure WAF on load balancers
- [ ] Set up disaster recovery plan

## Next Steps

- [AWS EKS Deployment](./aws-eks.md) - Alternative AWS deployment option
- [Minikube Deployment](./minikube.md) - Local Kubernetes deployment
- [ECS Example README](../../../examples/aws-cdk-ecs/README.md) - Detailed example documentation

