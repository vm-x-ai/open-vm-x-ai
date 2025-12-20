---
sidebar_position: 1
---

# Deploying to Minikube

This guide shows you how to deploy VM-X AI to a local Minikube cluster using Helm.

## Prerequisites

Before you begin, ensure you have:

- **Minikube** installed and running
- **kubectl** configured to access your Minikube cluster
- **Helm** 3.0+ installed
- **Docker images** available:
  - `vmxai/api:latest`
  - `vmxai/ui:latest`

## Setup Minikube

### 1. Start Minikube

```bash
minikube start
```

### 2. Enable Required Add-ons

```bash
# Enable ingress (optional, for external access)
minikube addons enable ingress

# Enable metrics server (required for HPA)
minikube addons enable metrics-server
```

### 3. Configure Docker to Use Minikube

If you built images locally, configure Docker to use Minikube's Docker daemon:

```bash
eval $(minikube docker-env)
```

Then build or pull the images:

```bash
docker pull vmxai/api:latest
docker pull vmxai/ui:latest
```

Or build from source:

```bash
docker build -t vmxai/api:latest -f packages/api/Dockerfile .
docker build -t vmxai/ui:latest -f packages/ui/Dockerfile .
```

## Deploy VM-X AI

### 1. Create Namespace

```bash
kubectl create namespace vm-x-ai
```

### 2. Add Helm Repository

Add the VM-X AI Helm repository:

```bash
helm repo add vm-x-ai https://vm-x-ai.github.io/open-vm-x-ai/helm/
helm repo update
```

### 3. Install Helm Chart

Install with default values:

```bash
helm install vm-x-ai vm-x-ai/vm-x-ai --namespace vm-x-ai
```

Or use custom values:

```bash
helm install vm-x-ai vm-x-ai/vm-x-ai \
  --namespace vm-x-ai \
  -f my-values.yaml
```

### 4. Wait for Deployment

Check the deployment status:

```bash
kubectl get pods -n vm-x-ai
```

Wait for all pods to be in `Running` state:

```bash
kubectl wait --for=condition=ready pod \
  -l app.kubernetes.io/name=vm-x-ai \
  -n vm-x-ai \
  --timeout=300s
```

## Access the Application

### Option 1: Port Forwarding

Forward ports to access the services:

```bash
# Forward UI port
kubectl port-forward -n vm-x-ai svc/vm-x-ai-ui 3001:3001

# Forward API port (in another terminal)
kubectl port-forward -n vm-x-ai svc/vm-x-ai-api 3000:3000
```

Then access:
- **UI**: http://localhost:3001
- **API**: http://localhost:3000

### Option 2: Minikube Service

Expose services using Minikube:

```bash
# Expose UI
minikube service vm-x-ai-ui -n vm-x-ai

# Expose API
minikube service vm-x-ai-api -n vm-x-ai
```

### Option 3: Ingress (if enabled)

If you enabled ingress, get the ingress URL:

```bash
minikube service ingress-nginx-controller -n ingress-nginx
```

Then access the application via the ingress URL.

## Configuration

### Using Custom Values

Create a `my-values.yaml` file:

```yaml
api:
  resources:
    requests:
      cpu: 500m
      memory: 512Mi
    limits:
      cpu: 2000m
      memory: 2Gi

ui:
  resources:
    requests:
      cpu: 200m
      memory: 256Mi
    limits:
      cpu: 1000m
      memory: 1Gi

postgresql:
  persistence:
    enabled: true
    size: 10Gi

redis:
  single:
    persistence:
      enabled: true
      size: 5Gi

questdb:
  persistence:
    enabled: true
    size: 20Gi
```

Install with custom values:

```bash
helm install vm-x-ai . \
  --namespace vm-x-ai \
  -f values-minikube.yaml \
  -f my-values.yaml
```

### Image Configuration

If using images from a different registry:

```yaml
images:
  api:
    repository: your-registry/vmxai/api
    tag: latest
    pullPolicy: Always
  ui:
    repository: your-registry/vmxai/ui
    tag: latest
    pullPolicy: Always
```

## Monitoring

### View Logs

```bash
# API logs
kubectl logs -n vm-x-ai -l app.kubernetes.io/component=api --tail=100 -f

# UI logs
kubectl logs -n vm-x-ai -l app.kubernetes.io/component=ui --tail=100 -f
```

### Check Resource Usage

```bash
# Pod resource usage
kubectl top pods -n vm-x-ai

# Node resource usage
kubectl top nodes
```

### Check Service Status

```bash
# Services
kubectl get svc -n vm-x-ai

# Deployments
kubectl get deployments -n vm-x-ai

# StatefulSets
kubectl get statefulsets -n vm-x-ai
```

## Troubleshooting

### Pods Not Starting

Check pod status and events:

```bash
# Pod status
kubectl get pods -n vm-x-ai

# Pod events
kubectl describe pod <pod-name> -n vm-x-ai

# Pod logs
kubectl logs <pod-name> -n vm-x-ai
```

### Database Connection Issues

Check PostgreSQL:

```bash
# PostgreSQL pod
kubectl get pods -n vm-x-ai -l app.kubernetes.io/component=postgresql

# PostgreSQL logs
kubectl logs -n vm-x-ai -l app.kubernetes.io/component=postgresql
```

### Redis Connection Issues

Check Redis:

```bash
# Redis pod
kubectl get pods -n vm-x-ai -l app.kubernetes.io/component=redis

# Redis logs
kubectl logs -n vm-x-ai -l app.kubernetes.io/component=redis
```

### Image Pull Errors

If images can't be pulled:

1. Ensure images are available in Minikube's Docker daemon:

```bash
eval $(minikube docker-env)
docker images | grep vmxai
```

2. Or configure image pull secrets if using a registry:

```yaml
global:
  imagePullSecrets:
    - name: my-registry-secret
```

## Upgrading

To upgrade the deployment:

```bash
helm repo update
helm upgrade vm-x-ai vm-x-ai/vm-x-ai \
  --namespace vm-x-ai \
  -f my-values.yaml
```

## Uninstalling

To remove VM-X AI:

```bash
# Uninstall Helm release
helm uninstall vm-x-ai -n vm-x-ai

# Delete namespace (removes all resources)
kubectl delete namespace vm-x-ai
```

To also remove persistent volumes:

```bash
# Delete PVCs
kubectl delete pvc -n vm-x-ai --all
```

## Next Steps

- [AWS EKS Deployment](./aws-eks.md) - Deploy to AWS EKS
- [AWS ECS Deployment](./aws-ecs.md) - Deploy to AWS ECS
- [Helm Chart Documentation](../../../helm/charts/vm-x-ai/README.md) - Detailed Helm chart reference

