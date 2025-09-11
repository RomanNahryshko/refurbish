#!/bin/bash

# Local development script for Docker
# Usage: ./run-local.sh [up|down|logs|build]

export COMPOSE_FILE=./docker/local/compose-files/docker-compose.local.yml

# Load environment variables
if [ -f "./docker/local/local.env" ]; then
    export $(cat ./docker/local/local.env | grep -v '^#' | xargs)
fi

case "$1" in
    "up")
        echo "Starting local development environment..."
        docker-compose -f $COMPOSE_FILE up --build
        ;;
    "up-d")
        echo "Starting local development environment in background..."
        docker-compose -f $COMPOSE_FILE up -d --build
        ;;
    "down")
        echo "Stopping local development environment..."
        docker-compose -f $COMPOSE_FILE down
        ;;
    "logs")
        echo "Showing logs..."
        docker-compose -f $COMPOSE_FILE logs -f
        ;;
    "build")
        echo "Building application..."
        docker-compose -f $COMPOSE_FILE build --no-cache
        ;;
    "clean")
        echo "Cleaning up containers and volumes..."
        docker-compose -f $COMPOSE_FILE down -v
        docker system prune -f
        ;;
    *)
        echo "Usage: $0 {up|up-d|down|logs|build|clean}"
        echo ""
        echo "Commands:"
        echo "  up      - Start application in foreground"
        echo "  up-d    - Start application in background"
        echo "  down    - Stop application"
        echo "  logs    - Show application logs"
        echo "  build   - Build application without cache"
        echo "  clean   - Clean up containers and volumes"
        exit 1
        ;;
esac
