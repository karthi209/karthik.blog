#!/bin/bash

# Usage:
# Set these environment variables before running:
# SSH_USER, SSH_IP, SSH_KEY, DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_NAME, ADMIN_PASSWORD, ALLOWED_ORIGINS
# Example:
# export SSH_USER=youruser
# export SSH_IP=your.server.ip
# export SSH_KEY=/path/to/id_rsa


set -euo pipefail
trap 'cleanup' EXIT

cleanup() {
  # Remove local tarballs if they exist
  rm -f "$(dirname "$0")/../zerosandones-frontend-"*.tar
  rm -f "$(dirname "$0")/../zerosandones-backend-"*.tar
}

# Configurable flags
BUILD_FRONTEND=${BUILD_FRONTEND:-false}
BUILD_BACKEND=${BUILD_BACKEND:-false}
DEPLOY_FRONTEND=${DEPLOY_FRONTEND:-false}
DEPLOY_BACKEND=${DEPLOY_BACKEND:-false}
FRONTEND_VERSION_INPUT=${FRONTEND_VERSION:-}
BACKEND_VERSION_INPUT=${BACKEND_VERSION:-}

# Read current versions
FRONTEND_VERSION=$(grep "frontend=" "$(dirname "$0")/../VERSION.txt" | cut -d '=' -f 2)
BACKEND_VERSION=$(grep "backend=" "$(dirname "$0")/../VERSION.txt" | cut -d '=' -f 2)

# Increment versions if needed
if [ "$BUILD_FRONTEND" = "true" ]; then
  FRONTEND_VERSION_NO_V=$(echo $FRONTEND_VERSION | sed 's/^v//')
  FRONTEND_NEW_VERSION="v$(echo $FRONTEND_VERSION_NO_V | cut -d'.' -f1).$(echo $FRONTEND_VERSION_NO_V | cut -d'.' -f2).$(($(echo $FRONTEND_VERSION_NO_V | cut -d'.' -f3) + 1))"
else
  FRONTEND_NEW_VERSION="$FRONTEND_VERSION"
fi

if [ "$BUILD_BACKEND" = "true" ]; then
  BACKEND_VERSION_NO_V=$(echo $BACKEND_VERSION | sed 's/^v//')
  BACKEND_NEW_VERSION="v$(echo $BACKEND_VERSION_NO_V | cut -d'.' -f1).$(echo $BACKEND_VERSION_NO_V | cut -d'.' -f2).$(($(echo $BACKEND_VERSION_NO_V | cut -d'.' -f3) + 1))"
else
  BACKEND_NEW_VERSION="$BACKEND_VERSION"
fi

# Build and push images

if [ "$BUILD_FRONTEND" = "true" ]; then
  echo "[INFO] Building frontend Docker image..."
  docker build -t zerosandones-frontend:${FRONTEND_NEW_VERSION} -f "$(dirname "$0")/../frontend/Dockerfile" "$(dirname "$0")/../frontend"
  echo "[INFO] Saving frontend image as tarball..."
  docker save -o "$(dirname "$0")/../zerosandones-frontend-${FRONTEND_NEW_VERSION}.tar" zerosandones-frontend:${FRONTEND_NEW_VERSION}
  echo "[INFO] Transferring frontend tarball to server..."
  scp -i "$SSH_KEY" "$(dirname "$0")/../zerosandones-frontend-${FRONTEND_NEW_VERSION}.tar" $SSH_USER@$SSH_IP:/tmp/
  echo "[INFO] Updating frontend version in VERSION.txt..."
  sed -i "s/frontend=.*/frontend=${FRONTEND_NEW_VERSION}/" "$(dirname "$0")/../VERSION.txt"
fi

if [ "$BUILD_BACKEND" = "true" ]; then
  echo "[INFO] Building backend Docker image..."
  docker build -t zerosandones-backend:${BACKEND_NEW_VERSION} -f "$(dirname "$0")/../backend/Dockerfile" "$(dirname "$0")/../backend"
  echo "[INFO] Saving backend image as tarball..."
  docker save -o "$(dirname "$0")/../zerosandones-backend-${BACKEND_NEW_VERSION}.tar" zerosandones-backend:${BACKEND_NEW_VERSION}
  echo "[INFO] Transferring backend tarball to server..."
  scp -i "$SSH_KEY" "$(dirname "$0")/../zerosandones-backend-${BACKEND_NEW_VERSION}.tar" $SSH_USER@$SSH_IP:/tmp/
  echo "[INFO] Updating backend version in VERSION.txt..."
  sed -i "s/backend=.*/backend=${BACKEND_NEW_VERSION}/" "$(dirname "$0")/../VERSION.txt"
fi

# Deploy frontend
if [ "$DEPLOY_FRONTEND" = "true" ]; then
  FRONTEND_VERSION_TO_DEPLOY=${FRONTEND_VERSION_INPUT:-$FRONTEND_NEW_VERSION}
  echo "[INFO] Deploying frontend on remote server..."
  ssh -o StrictHostKeyChecking=no -i "$SSH_KEY" $SSH_USER@$SSH_IP << EOF
    set -e
    echo "[REMOTE] Cleaning up old frontend tarballs..."
    find /tmp -maxdepth 1 -type f -name 'zerosandones-frontend-*.tar' ! -name 'zerosandones-frontend-${FRONTEND_VERSION_TO_DEPLOY}.tar' -exec rm -f {} +
    echo "[REMOTE] Stopping and removing old frontend container..."
    docker stop frontend-zerosandones || true
    docker rm frontend-zerosandones || true
    docker network inspect network-zerosandones > /dev/null 2>&1 || docker network create network-zerosandones
    echo "[REMOTE] Loading new frontend image..."
    docker load -i /tmp/zerosandones-frontend-${FRONTEND_VERSION_TO_DEPLOY}.tar
    echo "[REMOTE] Running new frontend container..."
    docker run -d --name frontend-zerosandones -p 5173:5173 --network network-zerosandones zerosandones-frontend:${FRONTEND_VERSION_TO_DEPLOY}
    docker update --restart unless-stopped frontend-zerosandones
EOF
fi

# Deploy backend
if [ "$DEPLOY_BACKEND" = "true" ]; then
  BACKEND_VERSION_TO_DEPLOY=${BACKEND_VERSION_INPUT:-$BACKEND_NEW_VERSION}
  echo "[INFO] Deploying backend on remote server..."
  ssh -o StrictHostKeyChecking=no -i "$SSH_KEY" $SSH_USER@$SSH_IP << EOF
    set -e
    echo "[REMOTE] Cleaning up old backend tarballs..."
    find /tmp -maxdepth 1 -type f -name 'zerosandones-backend-*.tar' ! -name 'zerosandones-backend-${BACKEND_VERSION_TO_DEPLOY}.tar' -exec rm -f {} +
    echo "[REMOTE] Stopping and removing old backend container..."
    docker stop backend-zerosandones || true
    docker rm backend-zerosandones || true
    docker network inspect network-zerosandones > /dev/null 2>&1 || docker network create network-zerosandones
    echo "[REMOTE] Loading new backend image..."
    docker load -i /tmp/zerosandones-backend-${BACKEND_VERSION_TO_DEPLOY}.tar
    echo "[REMOTE] Creating uploads directory on host if it doesn't exist..."
    mkdir -p ~/zerosandones-data/uploads/covers ~/zerosandones-data/uploads/images
    echo "[REMOTE] Setting ownership for container user (UID 1001) using Docker..."
    docker run --rm -v ~/zerosandones-data/uploads:/uploads alpine chown -R 1001:1001 /uploads
    echo "[REMOTE] Running new backend container..."
    docker run -d --name backend-zerosandones --network network-zerosandones -p 3000:3000 \
      -v ~/zerosandones-data/uploads:/app/uploads \
      -e DB_USER="$DB_USER" \
      -e DB_PASSWORD="$DB_PASSWORD" \
      -e DB_HOST="$DB_HOST" \
      -e DB_PORT="$DB_PORT" \
      -e DB_NAME="$DB_NAME" \
      -e ADMIN_PASSWORD="$ADMIN_PASSWORD" \
      -e ALLOWED_ORIGINS="$ALLOWED_ORIGINS" \
      zerosandones-backend:${BACKEND_VERSION_TO_DEPLOY}
    docker update --restart unless-stopped backend-zerosandones
    
    echo "[REMOTE] Cleaning up old Docker images (keeping last 2 versions)..."
    # Remove all frontend images except the 2 most recent
    docker images zerosandones-frontend:* --format "{{.Repository}}:{{.Tag}}" | sort -V | head -n -2 | xargs -r docker rmi -f || true
    # Remove all backend images except the 2 most recent
    docker images zerosandones-backend:* --format "{{.Repository}}:{{.Tag}}" | sort -V | head -n -2 | xargs -r docker rmi -f || true
    
    echo "[REMOTE] Listing remaining images..."
    docker images | grep zerosandones
EOF
fi

echo "[INFO] Build and deployment script completed."
echo "[INFO] Note: Old Docker images cleaned up (kept last 2 versions of each)."