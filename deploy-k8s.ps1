# Deploy to Kubernetes
Write-Host "=== Deploying Relentless Agent to Kubernetes ===" -ForegroundColor Cyan

# Apply namespace
Write-Host "Creating namespace..." -ForegroundColor Yellow
kubectl apply -f k8s/namespace.yaml

# Apply ConfigMap
Write-Host "Creating ConfigMap..." -ForegroundColor Yellow
kubectl apply -f k8s/configmap.yaml

# Apply Secrets
Write-Host "Creating Secrets..." -ForegroundColor Yellow
kubectl apply -f k8s/secret.yaml

# Apply PostgreSQL
Write-Host "Deploying PostgreSQL..." -ForegroundColor Yellow
kubectl apply -f k8s/postgres-deployment.yaml

# Apply Redis
Write-Host "Deploying Redis..." -ForegroundColor Yellow
kubectl apply -f k8s/redis-deployment.yaml

# Wait for database to be ready
Write-Host "Waiting for databases to be ready..." -ForegroundColor Yellow
kubectl wait --for=condition=ready pod -l app=postgres -n relentless-agent --timeout=300s
kubectl wait --for=condition=ready pod -l app=redis -n relentless-agent --timeout=300s

# Apply Job Manager
Write-Host "Deploying Job Manager..." -ForegroundColor Yellow
kubectl apply -f k8s/job-manager-deployment.yaml

# Apply Dashboard
Write-Host "Deploying Dashboard..." -ForegroundColor Yellow
kubectl apply -f k8s/dashboard-deployment.yaml

# Apply Agent
Write-Host "Deploying Agent..." -ForegroundColor Yellow
kubectl apply -f k8s/agent-deployment.yaml

# Apply Ingress
Write-Host "Configuring Ingress..." -ForegroundColor Yellow
kubectl apply -f k8s/ingress.yaml

# Wait for deployments to be ready
Write-Host "Waiting for deployments to be ready..." -ForegroundColor Yellow
kubectl wait --for=condition=available deployment/job-manager -n relentless-agent --timeout=300s
kubectl wait --for=condition=available deployment/dashboard -n relentless-agent --timeout=300s
kubectl wait --for=condition=available deployment/agent -n relentless-agent --timeout=300s

Write-Host ""
Write-Host "=== Deployment Complete ===" -ForegroundColor Green
Write-Host "Services deployed to namespace: relentless-agent" -ForegroundColor White
Write-Host ""
Write-Host "To check status:" -ForegroundColor Cyan
Write-Host "  kubectl get pods -n relentless-agent" -ForegroundColor White
Write-Host "  kubectl get services -n relentless-agent" -ForegroundColor White
Write-Host ""
Write-Host "To view logs:" -ForegroundColor Cyan
Write-Host "  kubectl logs -f deployment/agent -n relentless-agent" -ForegroundColor White
Write-Host "  kubectl logs -f deployment/job-manager -n relentless-agent" -ForegroundColor White
Write-Host "  kubectl logs -f deployment/dashboard -n relentless-agent" -ForegroundColor White
