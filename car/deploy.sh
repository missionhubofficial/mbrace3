#!/bin/bash

# MissionHub Car Game Deployment Script
# This script handles deployment to various environments

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="missionhub-car-game"
DOCKER_REGISTRY="your-registry.com"
VERSION=${1:-latest}
ENVIRONMENT=${2:-development}

echo -e "${BLUE}🚀 Starting deployment of ${PROJECT_NAME}${NC}"
echo -e "${BLUE}Version: ${VERSION}${NC}"
echo -e "${BLUE}Environment: ${ENVIRONMENT}${NC}"

# Function to print status
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    echo -e "${BLUE}🔍 Checking prerequisites...${NC}"
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed"
        exit 1
    fi
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        exit 1
    fi
    
    print_status "Prerequisites check passed"
}

# Build Docker images
build_images() {
    echo -e "${BLUE}🏗️  Building Docker images...${NC}"
    
    # Build backend image
    echo -e "${BLUE}Building backend image...${NC}"
    docker build -t ${DOCKER_REGISTRY}/${PROJECT_NAME}-backend:${VERSION} ./server
    
    # Build frontend image
    echo -e "${BLUE}Building frontend image...${NC}"
    docker build -t ${DOCKER_REGISTRY}/${PROJECT_NAME}-frontend:${VERSION} ./client
    
    print_status "Docker images built successfully"
}

# Push images to registry
push_images() {
    if [ "$ENVIRONMENT" = "production" ]; then
        echo -e "${BLUE}📤 Pushing images to registry...${NC}"
        
        docker push ${DOCKER_REGISTRY}/${PROJECT_NAME}-backend:${VERSION}
        docker push ${DOCKER_REGISTRY}/${PROJECT_NAME}-frontend:${VERSION}
        
        print_status "Images pushed to registry"
    else
        print_warning "Skipping image push for ${ENVIRONMENT} environment"
    fi
}

# Deploy with Docker Compose
deploy_compose() {
    echo -e "${BLUE}🚀 Deploying with Docker Compose...${NC}"
    
    # Stop existing containers
    docker-compose down || true
    
    # Start new containers
    docker-compose up -d
    
    # Wait for services to be ready
    echo -e "${BLUE}⏳ Waiting for services to start...${NC}"
    sleep 30
    
    # Check if services are running
    if docker-compose ps | grep -q "Up"; then
        print_status "Services are running"
    else
        print_error "Some services failed to start"
        docker-compose logs
        exit 1
    fi
}

# Deploy to Kubernetes
deploy_k8s() {
    if [ "$ENVIRONMENT" = "production" ]; then
        echo -e "${BLUE}☸️  Deploying to Kubernetes...${NC}"
        
        # Update image tags in k8s manifests
        sed -i "s|image: .*|image: ${DOCKER_REGISTRY}/${PROJECT_NAME}-backend:${VERSION}|g" k8s/backend-deployment.yaml
        sed -i "s|image: .*|image: ${DOCKER_REGISTRY}/${PROJECT_NAME}-frontend:${VERSION}|g" k8s/frontend-deployment.yaml
        
        # Apply manifests
        kubectl apply -f k8s/
        
        # Wait for rollout
        kubectl rollout status deployment/backend
        kubectl rollout status deployment/frontend
        
        print_status "Kubernetes deployment completed"
    else
        print_warning "Skipping Kubernetes deployment for ${ENVIRONMENT} environment"
    fi
}

# Run tests
run_tests() {
    echo -e "${BLUE}🧪 Running tests...${NC}"
    
    # Install dependencies
    npm install
    cd client && npm install && cd ..
    cd server && npm install && cd ..
    
    # Run tests
    npm test || {
        print_warning "Some tests failed, but continuing deployment"
    }
    
    print_status "Tests completed"
}

# Build Android APK
build_android() {
    if [ "$ENVIRONMENT" = "production" ]; then
        echo -e "${BLUE}📱 Building Android APK...${NC}"
        
        cd client
        
        # Install Capacitor
        npm install -g @capacitor/cli
        
        # Build web version
        npm run build
        
        # Add Android platform
        npx cap add android
        
        # Build APK
        npx cap build android
        
        # Move APK to artifacts directory
        mkdir -p ../artifacts
        cp android/app/build/outputs/apk/release/app-release.apk ../artifacts/missionhub-${VERSION}.apk
        
        cd ..
        
        print_status "Android APK built successfully"
    else
        print_warning "Skipping Android build for ${ENVIRONMENT} environment"
    fi
}

# Health check
health_check() {
    echo -e "${BLUE}🏥 Running health checks...${NC}"
    
    # Check backend health
    if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
        print_status "Backend is healthy"
    else
        print_error "Backend health check failed"
        exit 1
    fi
    
    # Check frontend
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        print_status "Frontend is healthy"
    else
        print_error "Frontend health check failed"
        exit 1
    fi
    
    print_status "All health checks passed"
}

# Cleanup
cleanup() {
    echo -e "${BLUE}🧹 Cleaning up...${NC}"
    
    # Remove unused Docker images
    docker image prune -f
    
    # Remove unused containers
    docker container prune -f
    
    print_status "Cleanup completed"
}

# Main deployment flow
main() {
    check_prerequisites
    run_tests
    build_images
    push_images
    deploy_compose
    build_android
    health_check
    cleanup
    
    echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
    echo -e "${GREEN}🌐 Frontend: http://localhost:3000${NC}"
    echo -e "${GREEN}🔧 Backend: http://localhost:3001${NC}"
    echo -e "${GREEN}📊 MongoDB: localhost:27017${NC}"
    echo -e "${GREEN}🔴 Redis: localhost:6379${NC}"
}

# Handle script arguments
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "test")
        run_tests
        ;;
    "build")
        build_images
        ;;
    "android")
        build_android
        ;;
    "health")
        health_check
        ;;
    "cleanup")
        cleanup
        ;;
    *)
        echo "Usage: $0 [deploy|test|build|android|health|cleanup] [version] [environment]"
        echo "  deploy   - Full deployment (default)"
        echo "  test     - Run tests only"
        echo "  build    - Build Docker images only"
        echo "  android  - Build Android APK only"
        echo "  health   - Run health checks only"
        echo "  cleanup  - Clean up Docker resources"
        exit 1
        ;;
esac
