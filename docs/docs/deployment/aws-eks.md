---
sidebar_position: 2
---

# Deploying to AWS EKS

This guide shows you how to deploy VM-X AI to Amazon EKS (Elastic Kubernetes Service) using AWS CDK and the provided example stack.

## Overview

The AWS EKS example provides a complete production-ready infrastructure including:

- **EKS Cluster** with managed node groups
- **VPC** with multi-AZ networking
- **Aurora PostgreSQL** for the primary database
- **AWS Timestream** for time-series metrics
- **Istio Service Mesh** for advanced traffic management
- **OpenTelemetry** observability stack
- **AWS KMS** for encryption
- **External Secrets Operator** for secret management

## Prerequisites

Before you begin, ensure you have:

- **AWS CLI** configured with appropriate credentials
- **AWS CDK CLI** installed (`npm install -g aws-cdk`)
- **Node.js** 18+ and **pnpm** (or npm/yarn)
- **kubectl** installed
- **Helm** 3.0+ installed (optional)
- **AWS Permissions** to create:
  - EKS clusters and node groups
  - VPCs, subnets, and networking resources
  - RDS Aurora clusters
  - Timestream databases
  - KMS keys
  - IAM roles and policies
  - Security groups
  - Load balancers

## Quick Start

### 1. Navigate to EKS Example

```bash
cd examples/aws-cdk-eks
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Configure Admin Role

**Important**: Update the admin role ARN in `lib/eks-stack.ts`:

```typescript
const adminRoleArn = `arn:aws:iam::${this.account}:role/your-admin-role`;
```

Replace with your IAM role ARN that should have admin access to the cluster.

### 4. Bootstrap CDK (First Time Only)

If this is your first time using CDK in this AWS account/region:

```bash
pnpm cdk bootstrap
```

### 5. Deploy the Stack

```bash
pnpm cdk deploy --all
```

This will:
- Create the VPC and networking infrastructure
- Provision the EKS cluster with all add-ons
- Create the Aurora PostgreSQL database
- Create the Timestream database
- Create the KMS encryption key
- Deploy the VM-X AI Helm chart from the published repository
- Configure all IAM roles and service accounts

The stack uses the published Helm chart from `https://vm-x-ai.github.io/open-vm-x-ai/helm/`.

**Deployment typically takes 15-30 minutes.**

### 6. Get Application URL

After deployment, retrieve the application URL:

```bash
aws cloudformation describe-stacks \
  --stack-name vm-x-ai-eks-cluster \
  --query 'Stacks[0].Outputs[?OutputKey==`ApplicationUrl`].OutputValue' \
  --output text
```

### 7. Configure kubectl

Configure kubectl to connect to your EKS cluster:

```bash
aws eks update-kubeconfig --name vm-x-ai-eks-cluster --region <your-region>
```

Verify the connection:

```bash
kubectl get nodes
kubectl get pods -n vm-x-ai
```

## Architecture

The stack creates:

```
┌─────────────────────────────────────────────────────────────┐
│                        Internet                              │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              AWS Network Load Balancer (NLB)                 │
│              (Istio Ingress Gateway)                        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    EKS Cluster                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Istio Service Mesh                                  │  │
│  │  ┌──────────────┐  ┌──────────────┐                │  │
│  │  │  VM-X AI UI  │  │  VM-X AI API │                │  │
│  │  └──────────────┘  └──────────────┘                │  │
│  │  ┌──────────────┐  ┌──────────────┐                │  │
│  │  │   Redis      │  │  OTEL Stack  │                │  │
│  │  │   Cluster    │  │              │                │  │
│  │  └──────────────┘  └──────────────┘                │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
         ▼               ▼               ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│   Aurora     │ │  Timestream  │ │     KMS      │
│  PostgreSQL  │ │   Database   │ │     Key      │
└──────────────┘ └──────────────┘ └──────────────┘
```

## Configuration

### Resource Sizing

The stack is configured with minimal resources for cost optimization. Adjust in `lib/eks-stack.ts`:

```typescript
api: {
  resources: {
    requests: { cpu: '200m', memory: '256Mi' },
    limits: { cpu: '1000m', memory: '1Gi' },
  },
}
```

### Database Configuration

Modify Aurora cluster configuration:

```typescript
const database = new DatabaseCluster(this, 'Database', {
  engine: DatabaseClusterEngine.auroraPostgres({
    version: AuroraPostgresEngineVersion.VER_15_4,
  }),
  writer: ClusterInstance.provisioned('writer', {
    instanceType: InstanceType.of(InstanceClass.BURSTABLE3, InstanceSize.MEDIUM),
  }),
});
```

### Encryption

The stack creates a KMS key for encryption. The key ARN is automatically configured in the Helm chart values.

## Accessing Services

### Application

Access the main application at the URL provided in stack outputs.

### Grafana

Grafana is accessible via Istio ingress. Check the ingress configuration:

```bash
kubectl get virtualservice -n vm-x-ai
kubectl get gateway -n istio-system
```

### Jaeger

Jaeger UI is also accessible via Istio ingress.

## Secrets Management

The stack uses **External Secrets Operator** to manage secrets:

- **Database Credentials**: Retrieved from AWS Secrets Manager (`vm-x-ai-database-secret`)
- **UI Auth Secret**: Auto-generated by the Helm chart
- **KMS Key**: Referenced by ARN (no secret needed)

The database secret is automatically created by CDK when the Aurora cluster is provisioned.

## Monitoring and Observability

The stack includes:

- **Prometheus**: Scrapes metrics from all services
- **Loki**: Aggregates logs from all pods
- **Grafana**: Pre-configured dashboards
- **Jaeger**: Distributed tracing
- **OpenTelemetry**: Automatic instrumentation via Istio

## Cost Considerations

Estimated monthly costs for minimal production setup:

- **EKS Cluster**: ~$73/month
- **EKS Node Groups**: $50-200/month (depends on instance types)
- **Aurora PostgreSQL**: $100-200/month (db.t3.medium)
- **Timestream**: $10-50/month (pay-per-use)
- **NLB**: ~$16/month
- **NAT Gateway**: ~$32/month
- **EBS Volumes**: ~$0.10/GB/month

**Total**: $300-500/month

To reduce costs:
- Use smaller instance types
- Disable optional components (Grafana, Jaeger)
- Use single-AZ deployment (not recommended for production)
- Use Aurora Serverless v2 for variable workloads

## Troubleshooting

### Check Pod Status

```bash
kubectl get pods -n vm-x-ai
kubectl describe pod <pod-name> -n vm-x-ai
kubectl logs <pod-name> -n vm-x-ai
```

### Check Service Account

```bash
kubectl get serviceaccount -n vm-x-ai
kubectl describe serviceaccount vm-x-ai-api -n vm-x-ai
```

### Check External Secrets

```bash
kubectl get externalsecret -n vm-x-ai
kubectl describe externalsecret <secret-name> -n vm-x-ai
```

### Check Istio Configuration

```bash
kubectl get virtualservice -n vm-x-ai
kubectl get gateway -n istio-system
kubectl get destinationrule -n vm-x-ai
```

### Check Database Connectivity

```bash
kubectl exec -it <api-pod> -n vm-x-ai -- env | grep DATABASE
```

## Cleanup

To destroy all resources:

```bash
pnpm cdk destroy --all
```

**Warning**: This will delete all resources including databases and persistent volumes. Make sure you have backups if needed.

## Customization

### Modify Resource Limits

Edit the Helm chart values in `lib/eks-stack.ts`:

```typescript
api: {
  resources: {
    requests: { cpu: '200m', memory: '256Mi' },
    limits: { cpu: '1000m', memory: '1Gi' },
  },
}
```

### Add Additional Services

You can add more Helm charts or Kubernetes manifests by extending the `EKSStack` class.

## Security Best Practices

For production deployments:

1. **Private Database**: Move Aurora to private subnets
2. **Network Policies**: Implement Kubernetes network policies
3. **Pod Security Standards**: Enable Pod Security Standards
4. **Secrets Rotation**: Enable automatic secret rotation
5. **Encryption**: Ensure all EBS volumes are encrypted
6. **Backup**: Enable automated backups for Aurora
7. **Monitoring**: Set up CloudWatch alarms
8. **Access Control**: Use least-privilege IAM policies

## Next Steps

- [AWS ECS Deployment](./aws-ecs.md) - Alternative AWS deployment option
- [Minikube Deployment](./minikube.md) - Local Kubernetes deployment
- [EKS Example README](../../../examples/aws-cdk-eks/README.md) - Detailed example documentation

