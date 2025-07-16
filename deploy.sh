#!/bin/bash

# ImgLink Deployment Script
# This script handles building and deploying the ImgLink application

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker-compose.yml"
COMPOSE_PROD_FILE="docker-compose.prod.yml"
ENV_FILE=".env"
ENV_PROD_FILE=".env.prod"

# Functions
print_header() {
    echo -e "${BLUE}"
    echo "=================================="
    echo "     ImgLink Deployment Script    "
    echo "=================================="
    echo -e "${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

check_requirements() {
    print_info "Checking system requirements..."
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Check if Docker daemon is running
    if ! docker info &> /dev/null; then
        print_error "Docker daemon is not running. Please start Docker first."
        exit 1
    fi
    
    print_success "All requirements met"
}

setup_environment() {
    local mode=$1
    local env_file=$2
    local env_example_file="${env_file}.example"
    
    print_info "Setting up environment for $mode mode..."
    
    if [[ ! -f "$env_file" ]]; then
        if [[ -f "$env_example_file" ]]; then
            print_warning "Environment file $env_file not found. Creating from example..."
            cp "$env_example_file" "$env_file"
            print_warning "Please edit $env_file with your configuration before proceeding."
            read -p "Press Enter to continue after editing the environment file..."
        else
            print_error "Environment example file $env_example_file not found."
            exit 1
        fi
    fi
    
    print_success "Environment configured"
}

build_images() {
    local mode=$1
    local compose_file=$2
    
    print_info "Building Docker images for $mode mode..."
    
    if [[ "$mode" == "production" ]]; then
        # Build production images
        docker-compose -f "$compose_file" build --no-cache
    else
        # Build development images
        docker-compose -f "$compose_file" build
    fi
    
    print_success "Images built successfully"
}

start_services() {
    local mode=$1
    local compose_file=$2
    
    print_info "Starting services in $mode mode..."
    
    # Start services
    docker-compose -f "$compose_file" up -d
    
    print_success "Services started"
}

stop_services() {
    local compose_file=$1
    
    print_info "Stopping services..."
    
    docker-compose -f "$compose_file" down
    
    print_success "Services stopped"
}

show_status() {
    local compose_file=$1
    
    print_info "Service status:"
    docker-compose -f "$compose_file" ps
    
    echo
    print_info "Service logs (last 20 lines):"
    docker-compose -f "$compose_file" logs --tail=20
}

wait_for_services() {
    local compose_file=$1
    
    print_info "Waiting for services to be healthy..."
    
    # Wait for backend health check
    local max_attempts=30
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        if curl -f http://localhost:8000/health &> /dev/null; then
            print_success "Backend is healthy"
            break
        fi
        
        if [[ $attempt -eq $max_attempts ]]; then
            print_error "Backend failed to start within timeout"
            docker-compose -f "$compose_file" logs backend
            exit 1
        fi
        
        print_info "Waiting for backend... (attempt $attempt/$max_attempts)"
        sleep 10
        ((attempt++))
    done
    
    # Wait for frontend (if not in production mode)
    if [[ "$compose_file" == "$COMPOSE_FILE" ]]; then
        if curl -f http://localhost:5173 &> /dev/null; then
            print_success "Frontend is healthy"
        else
            print_warning "Frontend may take a moment to start"
        fi
    else
        if curl -f http://localhost:80 &> /dev/null; then
            print_success "Frontend is healthy"
        else
            print_warning "Frontend may take a moment to start"
        fi
    fi
}

run_migrations() {
    local compose_file=$1
    
    print_info "Running database migrations..."
    
    # Run Alembic migrations
    docker-compose -f "$compose_file" exec backend alembic upgrade head
    
    print_success "Database migrations completed"
}

create_admin_user() {
    local compose_file=$1
    
    print_info "Creating admin user..."
    
    read -p "Enter admin username: " admin_username
    read -s -p "Enter admin password: " admin_password
    echo
    read -p "Enter admin email: " admin_email
    
    # Create admin user (this would need to be implemented in the backend)
    docker-compose -f "$compose_file" exec backend python -c "
from app.models.user import User
from app.core.database import SessionLocal
from app.core.security import get_password_hash

db = SessionLocal()
try:
    admin = User(
        username='$admin_username',
        email='$admin_email',
        hashed_password=get_password_hash('$admin_password'),
        is_active=True,
        is_superuser=True,
        email_verified=True
    )
    db.add(admin)
    db.commit()
    print('Admin user created successfully')
except Exception as e:
    print(f'Error creating admin user: {e}')
finally:
    db.close()
"
    
    print_success "Admin user created"
}

backup_data() {
    local compose_file=$1
    local backup_dir="backups/$(date +%Y%m%d_%H%M%S)"
    
    print_info "Creating backup in $backup_dir..."
    
    mkdir -p "$backup_dir"
    
    # Backup database
    docker-compose -f "$compose_file" exec -T db pg_dump -U imglink imglink > "$backup_dir/database.sql"
    
    # Backup uploads
    docker cp "$(docker-compose -f "$compose_file" ps -q backend)":/app/uploads "$backup_dir/"
    
    # Backup MinIO data
    docker cp "$(docker-compose -f "$compose_file" ps -q minio)":/data "$backup_dir/minio"
    
    print_success "Backup created in $backup_dir"
}

show_help() {
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo
    echo "Commands:"
    echo "  dev                 Start development environment"
    echo "  prod                Deploy production environment"
    echo "  build [dev|prod]    Build Docker images"
    echo "  start [dev|prod]    Start services"
    echo "  stop [dev|prod]     Stop services"
    echo "  restart [dev|prod]  Restart services"
    echo "  status [dev|prod]   Show service status"
    echo "  logs [dev|prod]     Show service logs"
    echo "  migrate [dev|prod]  Run database migrations"
    echo "  admin [dev|prod]    Create admin user"
    echo "  backup [dev|prod]   Backup data"
    echo "  clean               Clean up Docker resources"
    echo "  help                Show this help message"
    echo
    echo "Examples:"
    echo "  $0 dev              # Start development environment"
    echo "  $0 prod             # Deploy to production"
    echo "  $0 build prod       # Build production images"
    echo "  $0 backup prod      # Backup production data"
}

# Main script logic
main() {
    print_header
    
    case "${1:-help}" in
        "dev")
            check_requirements
            setup_environment "development" "$ENV_FILE"
            build_images "development" "$COMPOSE_FILE"
            start_services "development" "$COMPOSE_FILE"
            wait_for_services "$COMPOSE_FILE"
            print_success "Development environment is ready!"
            print_info "Frontend: http://localhost:5173"
            print_info "Backend: http://localhost:8000"
            print_info "API Docs: http://localhost:8000/docs"
            ;;
        
        "prod")
            check_requirements
            setup_environment "production" "$ENV_PROD_FILE"
            build_images "production" "$COMPOSE_PROD_FILE"
            start_services "production" "$COMPOSE_PROD_FILE"
            wait_for_services "$COMPOSE_PROD_FILE"
            run_migrations "$COMPOSE_PROD_FILE"
            print_success "Production environment is ready!"
            print_info "Application: http://localhost"
            print_warning "Don't forget to set up SSL and configure your domain"
            ;;
        
        "build")
            check_requirements
            case "${2:-dev}" in
                "dev")
                    build_images "development" "$COMPOSE_FILE"
                    ;;
                "prod")
                    build_images "production" "$COMPOSE_PROD_FILE"
                    ;;
                *)
                    print_error "Invalid build target. Use 'dev' or 'prod'"
                    exit 1
                    ;;
            esac
            ;;
        
        "start")
            case "${2:-dev}" in
                "dev")
                    start_services "development" "$COMPOSE_FILE"
                    ;;
                "prod")
                    start_services "production" "$COMPOSE_PROD_FILE"
                    ;;
                *)
                    print_error "Invalid start target. Use 'dev' or 'prod'"
                    exit 1
                    ;;
            esac
            ;;
        
        "stop")
            case "${2:-dev}" in
                "dev")
                    stop_services "$COMPOSE_FILE"
                    ;;
                "prod")
                    stop_services "$COMPOSE_PROD_FILE"
                    ;;
                *)
                    print_error "Invalid stop target. Use 'dev' or 'prod'"
                    exit 1
                    ;;
            esac
            ;;
        
        "restart")
            case "${2:-dev}" in
                "dev")
                    stop_services "$COMPOSE_FILE"
                    start_services "development" "$COMPOSE_FILE"
                    ;;
                "prod")
                    stop_services "$COMPOSE_PROD_FILE"
                    start_services "production" "$COMPOSE_PROD_FILE"
                    ;;
                *)
                    print_error "Invalid restart target. Use 'dev' or 'prod'"
                    exit 1
                    ;;
            esac
            ;;
        
        "status")
            case "${2:-dev}" in
                "dev")
                    show_status "$COMPOSE_FILE"
                    ;;
                "prod")
                    show_status "$COMPOSE_PROD_FILE"
                    ;;
                *)
                    print_error "Invalid status target. Use 'dev' or 'prod'"
                    exit 1
                    ;;
            esac
            ;;
        
        "logs")
            case "${2:-dev}" in
                "dev")
                    docker-compose -f "$COMPOSE_FILE" logs -f
                    ;;
                "prod")
                    docker-compose -f "$COMPOSE_PROD_FILE" logs -f
                    ;;
                *)
                    print_error "Invalid logs target. Use 'dev' or 'prod'"
                    exit 1
                    ;;
            esac
            ;;
        
        "migrate")
            case "${2:-dev}" in
                "dev")
                    run_migrations "$COMPOSE_FILE"
                    ;;
                "prod")
                    run_migrations "$COMPOSE_PROD_FILE"
                    ;;
                *)
                    print_error "Invalid migrate target. Use 'dev' or 'prod'"
                    exit 1
                    ;;
            esac
            ;;
        
        "admin")
            case "${2:-dev}" in
                "dev")
                    create_admin_user "$COMPOSE_FILE"
                    ;;
                "prod")
                    create_admin_user "$COMPOSE_PROD_FILE"
                    ;;
                *)
                    print_error "Invalid admin target. Use 'dev' or 'prod'"
                    exit 1
                    ;;
            esac
            ;;
        
        "backup")
            case "${2:-dev}" in
                "dev")
                    backup_data "$COMPOSE_FILE"
                    ;;
                "prod")
                    backup_data "$COMPOSE_PROD_FILE"
                    ;;
                *)
                    print_error "Invalid backup target. Use 'dev' or 'prod'"
                    exit 1
                    ;;
            esac
            ;;
        
        "clean")
            print_warning "This will remove all unused Docker resources"
            read -p "Are you sure? (y/N): " confirm
            if [[ $confirm == [yY] ]]; then
                docker system prune -af
                docker volume prune -f
                print_success "Docker resources cleaned"
            fi
            ;;
        
        "help"|*)
            show_help
            ;;
    esac
}

# Run main function with all arguments
main "$@"