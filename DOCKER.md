# Docker Configuration Files

This directory contains supplementary Docker configuration files and documentation for the ImgLink project.

## Docker Structure

The actual Dockerfiles are located in their respective application directories to maintain proper build contexts:

```
imglink/
├── backend/
│   ├── Dockerfile          # Development backend Dockerfile
│   └── Dockerfile.prod     # Production backend Dockerfile
├── frontend/
│   ├── Dockerfile          # Development frontend Dockerfile
│   └── Dockerfile.prod     # Production frontend Dockerfile
└── docker/                 # This directory (for additional Docker configs)
    └── README.md
```

## Why Dockerfiles are in Application Directories

Docker requires the Dockerfile to have access to the application code during the build process. The build context is determined by the directory specified in the `docker-compose.yml` file. By keeping Dockerfiles in the `backend/` and `frontend/` directories, we ensure:

1. The build context includes all necessary application files
2. COPY commands in the Dockerfile can access the source code
3. The structure remains intuitive and follows Docker best practices

## Docker Compose Files

The project uses two main Docker Compose files in the root directory:
- `docker-compose.yml` - Development environment
- `docker-compose.prod.yml` - Production environment

## Additional Docker Resources

This directory can be used for:
- Docker Compose override files
- Additional Docker configurations
- Docker-related scripts
- Environment-specific configurations