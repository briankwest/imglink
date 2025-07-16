# ImgLink Deployment Guide

This guide covers deploying ImgLink in both development and production environments using Docker.

## 🚀 Quick Start

### Development Environment

```bash
# Clone the repository
git clone <repository-url>
cd imglink

# Start development environment
./deploy.sh dev
```

### Production Environment

```bash
# Configure production environment
cp .env.prod.example .env.prod
# Edit .env.prod with your production values

# Deploy to production
./deploy.sh prod
```

## 📋 Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- 4GB+ RAM
- 20GB+ disk space

## 🔧 Configuration

### Environment Files

#### Development (`.env`)
Created automatically from `.env.example` when running `./deploy.sh dev`

#### Production (`.env.prod`)
Copy from `.env.prod.example` and configure:

```bash
cp .env.prod.example .env.prod
```

**Critical settings to change:**
- `SECRET_KEY` - Use a strong, unique secret key
- `POSTGRES_PASSWORD` - Strong database password
- `MINIO_ROOT_PASSWORD` - Secure MinIO password
- `FRONTEND_URL` - Your domain name
- `SMTP_*` - Email configuration for notifications

### SSL/TLS Setup (Production)

For HTTPS support, use the nginx-proxy profile:

```bash
# Create SSL directory
mkdir -p ssl/

# Copy your SSL certificates
cp your-cert.pem ssl/cert.pem
cp your-key.pem ssl/key.pem

# Start with SSL support
docker-compose -f docker-compose.prod.yml --profile ssl up -d
```

## 📦 Deployment Commands

The `deploy.sh` script provides comprehensive deployment management:

### Basic Commands

```bash
# Development
./deploy.sh dev                 # Start dev environment
./deploy.sh build dev          # Build dev images
./deploy.sh stop dev           # Stop dev services

# Production
./deploy.sh prod               # Deploy production
./deploy.sh build prod         # Build production images
./deploy.sh restart prod       # Restart production
```

### Management Commands

```bash
# Service status
./deploy.sh status prod

# View logs
./deploy.sh logs prod

# Database operations
./deploy.sh migrate prod       # Run migrations
./deploy.sh admin prod         # Create admin user

# Backup
./deploy.sh backup prod        # Backup all data

# Cleanup
./deploy.sh clean             # Remove unused Docker resources
```

## 🏗️ Architecture

### Services

| Service | Purpose | Port | Health Check |
|---------|---------|------|--------------|
| frontend | React app with Nginx | 80/5173 | `/health` |
| backend | FastAPI application | 8000 | `/health` |
| db | PostgreSQL database | 5432 | `pg_isready` |
| redis | Cache and sessions | 6379 | `ping` |
| minio | Object storage | 9000 | `/minio/health/live` |

### Volumes

| Volume | Purpose | Backup Required |
|--------|---------|-----------------|
| `postgres_data` | Database files | ✅ Yes |
| `redis_data` | Cache data | ❌ Optional |
| `minio_data` | File storage | ✅ Yes |
| `uploads_data` | User uploads | ✅ Yes |
| `logs_data` | Application logs | ❌ Optional |

### Networks

- `imglink-network` - Internal service communication

## 🔍 Monitoring & Health Checks

### Health Endpoints

- Backend: `http://localhost:8000/health`
- Detailed: `http://localhost:8000/health/detailed`
- Readiness: `http://localhost:8000/ready`
- Liveness: `http://localhost:8000/live`

### Monitoring Service Status

```bash
# Check all services
docker-compose -f docker-compose.prod.yml ps

# Check specific service logs
docker-compose -f docker-compose.prod.yml logs backend

# Follow logs in real-time
./deploy.sh logs prod
```

## 🛠️ Troubleshooting

### Common Issues

#### Backend won't start
```bash
# Check backend logs
docker-compose -f docker-compose.prod.yml logs backend

# Common causes:
# - Database connection failed
# - Missing environment variables
# - Port already in use
```

#### Database connection errors
```bash
# Check database status
docker-compose -f docker-compose.prod.yml ps db

# Connect to database directly
docker-compose -f docker-compose.prod.yml exec db psql -U imglink -d imglink
```

#### File upload issues
```bash
# Check MinIO status
docker-compose -f docker-compose.prod.yml ps minio

# Check uploads directory permissions
docker-compose -f docker-compose.prod.yml exec backend ls -la /app/uploads
```

### Performance Issues

#### High memory usage
```bash
# Check resource usage
docker stats

# Scale down if needed (production)
docker-compose -f docker-compose.prod.yml up -d --scale backend=2
```

#### Slow image loading
```bash
# Check if Redis is running
docker-compose -f docker-compose.prod.yml ps redis

# Clear cache if needed
docker-compose -f docker-compose.prod.yml exec redis redis-cli FLUSHALL
```

## 📊 Production Optimization

### Resource Limits

The production compose file includes resource limits:
- Backend: 1GB limit, 512MB reserved
- Database: 512MB limit, 256MB reserved
- Redis: 256MB limit, 128MB reserved
- Frontend: 256MB limit, 128MB reserved

### Scaling

```bash
# Scale backend horizontally
docker-compose -f docker-compose.prod.yml up -d --scale backend=3

# Scale with load balancer (requires additional nginx config)
```

### Security Hardening

1. **Change default passwords** in `.env.prod`
2. **Use strong SSL certificates**
3. **Configure firewall** to only expose necessary ports
4. **Regular updates** of base images
5. **Monitor logs** for suspicious activity

### Backup Strategy

```bash
# Automated daily backups
echo "0 2 * * * cd /path/to/imglink && ./deploy.sh backup prod" | crontab -

# Manual backup before updates
./deploy.sh backup prod
```

## 🔄 Updates & Maintenance

### Application Updates

```bash
# 1. Backup current state
./deploy.sh backup prod

# 2. Pull latest code
git pull origin main

# 3. Rebuild and restart
./deploy.sh build prod
./deploy.sh restart prod

# 4. Run migrations if needed
./deploy.sh migrate prod
```

### Database Migrations

```bash
# Check migration status
docker-compose -f docker-compose.prod.yml exec backend alembic current

# Run pending migrations
./deploy.sh migrate prod

# Rollback if needed (backup first!)
docker-compose -f docker-compose.prod.yml exec backend alembic downgrade -1
```

## 📈 Performance Monitoring

### Metrics Collection

Consider adding monitoring stack:
- Prometheus for metrics
- Grafana for dashboards
- AlertManager for notifications

### Log Management

```bash
# Configure log rotation
# Add to /etc/logrotate.d/docker-containers

# View aggregated logs
docker-compose -f docker-compose.prod.yml logs --tail=100 -f
```

## 🌐 Domain & DNS Setup

1. **Point your domain** to the server IP
2. **Configure environment** with your domain:
   ```bash
   FRONTEND_URL=https://yourdomain.com
   BACKEND_URL=https://api.yourdomain.com
   ```
3. **Set up SSL certificates** (Let's Encrypt recommended)
4. **Configure reverse proxy** for production

## 🚨 Emergency Procedures

### Complete System Recovery

```bash
# 1. Stop all services
./deploy.sh stop prod

# 2. Restore from backup
# Restore database: psql -U imglink -d imglink < backup/database.sql
# Restore uploads: Copy uploads directory back

# 3. Start services
./deploy.sh start prod
```

### Quick Restart
```bash
./deploy.sh restart prod
```

### Database Recovery
```bash
# If database is corrupted
docker volume rm imglink_postgres_data
# Restore from backup and run migrations
```

## 📞 Support

For deployment issues:
1. Check the troubleshooting section above
2. Review service logs: `./deploy.sh logs prod`
3. Check resource usage: `docker stats`
4. Verify configuration: `./deploy.sh status prod`