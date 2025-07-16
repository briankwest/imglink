# Nginx Configuration

This directory contains Nginx configuration files for the ImgLink project.

## Files

- `nginx.conf` - Main Nginx configuration for serving the frontend application

## Configuration Details

The nginx.conf file configures:
- Static file serving for the React frontend
- SPA (Single Page Application) routing with fallback to index.html
- Proxy configuration for API requests to the backend
- GZIP compression for better performance
- Security headers
- Cache control headers

## Usage

This configuration is used in the frontend Docker container to serve the production build of the React application.

For development, the Vite dev server is used instead of Nginx.

## SSL/TLS

For production deployments with SSL/TLS:
1. Place your certificates in the `ssl/` directory
2. Use the SSL-enabled docker-compose profile
3. Update the configuration to include SSL directives

See the deployment documentation for more details.