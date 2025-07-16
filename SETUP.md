# ImgLink Setup Guide

This guide will help you set up ImgLink for the first time.

## Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/imglink.git
   cd imglink
   ```

2. **Copy environment file**
   ```bash
   cp .env.example .env
   ```

3. **Start the application**
   ```bash
   docker-compose up -d
   ```

4. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

## Default Admin Credentials

By default, an admin user is created automatically:
- **Email**: admin@example.com
- **Username**: admin
- **Password**: AdminPass123

⚠️ **Important**: Change these credentials after first login!

## Customizing Admin Credentials

You can set custom admin credentials before first startup:

```bash
# Set environment variables
export ADMIN_EMAIL="your-email@example.com"
export ADMIN_USERNAME="youradmin"
export ADMIN_PASSWORD="YourSecurePassword123"

# Start the application
docker-compose up -d
```

Or add them to your `.env` file:
```env
ADMIN_EMAIL=your-email@example.com
ADMIN_USERNAME=youradmin
ADMIN_PASSWORD=YourSecurePassword123
```

## Database Initialization

The database is automatically initialized on first startup:
1. Database migrations are applied
2. Admin user is created
3. Rate limits are configured
4. Initial setup is verified

## Manual Admin User Creation

If you need to create additional admin users:

```bash
# Interactive mode
docker exec -it imglink-backend python create_admin.py

# Or with parameters
docker exec imglink-backend python create_admin.py email@example.com username password
```

## Resetting the Database

To completely reset the database:

```bash
# Stop the application
docker-compose down

# Remove volumes (WARNING: This deletes all data!)
docker-compose down -v

# Start fresh
docker-compose up -d
```

## Configuration

### Rate Limiting
- Default rate limits are configured automatically
- Admins can modify limits at `/api/v1/admin/rate-limits`
- Three tiers: anonymous, standard, premium

### Storage (MinIO)
- MinIO is used for image storage
- Default credentials: minioadmin/minioadmin
- Access MinIO console at http://localhost:9001

### Email (Optional)
Configure email settings in `.env`:
```env
MAILGUN_API_KEY=your-api-key
MAILGUN_DOMAIN=your-domain
MAILGUN_FROM_EMAIL=noreply@your-domain
```

## Production Deployment

For production:
1. Use strong passwords
2. Set proper environment variables
3. Use HTTPS
4. Configure proper backup strategies
5. Monitor logs and metrics

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed production setup.