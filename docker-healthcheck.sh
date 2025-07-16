#!/bin/bash

# Docker health check script for ImgLink services

set -e

SERVICE=${1:-backend}
HOST=${2:-localhost}

case "$SERVICE" in
  "backend")
    PORT=${3:-8000}
    ENDPOINT="/health"
    ;;
  "frontend")
    PORT=${3:-80}
    ENDPOINT="/health"
    ;;
  "db")
    # PostgreSQL health check
    pg_isready -h "$HOST" -U "${POSTGRES_USER:-imglink}"
    exit $?
    ;;
  "redis")
    # Redis health check
    redis-cli -h "$HOST" ping | grep -q "PONG"
    exit $?
    ;;
  "minio")
    PORT=${3:-9000}
    ENDPOINT="/minio/health/live"
    ;;
  *)
    echo "Unknown service: $SERVICE"
    echo "Usage: $0 [backend|frontend|db|redis|minio] [host] [port]"
    exit 1
    ;;
esac

# HTTP health check for web services
if [[ "$SERVICE" != "db" && "$SERVICE" != "redis" ]]; then
  curl -f "http://$HOST:$PORT$ENDPOINT" > /dev/null 2>&1
  exit $?
fi