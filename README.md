# ImgLink - Modern Image Sharing Platform

<div align="center">
  <h3>A production-ready image hosting and sharing platform built with modern web technologies</h3>
  <p>
    <a href="#-features">Features</a> •
    <a href="#-quick-start">Quick Start</a> •
    <a href="#-documentation">Documentation</a> •
    <a href="#-api-reference">API</a> •
    <a href="#-deployment">Deployment</a>
  </p>
</div>

---

## 📌 Overview

ImgLink is a full-featured image sharing platform inspired by Imgur, built with a modern tech stack focusing on performance, scalability, and user experience. It provides a complete solution for image hosting with social features, privacy controls, and administrative capabilities.

### Key Highlights
- **🚀 Production-Ready**: Fully containerized with Docker, includes health checks, monitoring, and backup strategies
- **🔒 Secure**: JWT authentication, OAuth integration, privacy controls, and input validation
- **⚡ High Performance**: Async FastAPI backend, optimized image processing, Redis caching
- **🎨 Modern UI**: Responsive React frontend with TypeScript, Tailwind CSS, and dark mode
- **📊 Admin Panel**: Complete platform management with user and content moderation tools
- **🔔 Real-time Updates**: WebSocket-based notifications for instant user interactions
- **🔍 Advanced Search**: Full-text search with comprehensive filtering and sorting options
- **🔧 Developer Friendly**: Well-documented API, clean architecture, comprehensive testing

## 🌟 Features

### User Features
- **Authentication & Profiles**
  - Email/password registration with verification
  - OAuth login (Google, GitHub)
  - Password recovery
  - Customizable user profiles with avatars
  
- **Image Management**
  - Drag-and-drop multi-file upload
  - Support for JPEG, PNG, GIF, WebP
  - Automatic thumbnail generation (multiple sizes)
  - Privacy controls (public/private/unlisted)
  - Direct shareable links
  - Image metadata extraction
  
- **Albums & Organization**
  - Create and manage image collections
  - Drag-and-drop reordering
  - Album privacy settings
  - Bulk operations
  
- **Social Features**
  - Threaded comment system
  - Like/favorite functionality
  - User activity feed
  - Real-time notifications (comments, likes, follows)
  - Following/follower system
  
- **Search & Discovery**
  - Advanced search with filters
  - Search by title, description, username
  - Filter by date range, image type, privacy
  - Sort by relevance, date, or popularity

### Admin Features
- **Dashboard Analytics**
  - Platform statistics
  - User growth metrics
  - Content overview
  - Top uploaders
  
- **User Management**
  - View all users
  - Toggle user active status
  - Toggle verification status
  - Delete users (with cascade)
  
- **Content Moderation**
  - View all images
  - Delete inappropriate content
  - Monitor recent activity

## 🛠️ Technology Stack

### Backend
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) - High-performance async Python framework
- **Database**: PostgreSQL 15 with SQLAlchemy ORM
- **Caching**: Redis 7 for sessions and performance
- **File Storage**: MinIO (S3-compatible) for scalable storage
- **Authentication**: JWT with refresh tokens
- **Image Processing**: Pillow for thumbnails and optimization
- **Task Queue**: Celery for background jobs
- **WebSocket**: Real-time notifications and messaging
- **Search**: PostgreSQL full-text search with GIN indexes
- **API Documentation**: Auto-generated OpenAPI/Swagger

### Frontend
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS + Headless UI
- **State Management**: Zustand
- **HTTP Client**: Axios with interceptors
- **Routing**: React Router v6
- **File Upload**: React Dropzone
- **Build Tool**: Vite

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Reverse Proxy**: Nginx
- **Database Migrations**: Alembic
- **Environment Management**: python-dotenv
- **Monitoring**: Health check endpoints

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose (recommended)
- OR: Python 3.11+, Node.js 18+, PostgreSQL 14+, Redis 7+

### Using Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/briankwest/imglink.git
cd imglink

# Copy environment file
cp .env.example .env

# Start the application
docker-compose up -d

# Access the application
# Frontend: http://localhost:5173
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

**Default Admin Credentials:**
- Email: admin@example.com
- Username: admin
- Password: AdminPass123

⚠️ **Important**: Change these credentials after first login!

For detailed setup instructions, see [SETUP.md](SETUP.md).

### Manual Setup

<details>
<summary>Click to expand manual setup instructions</summary>

#### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Setup database
createdb imglink
alembic upgrade head

# Run the backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

#### Required Services
- PostgreSQL: `docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=password postgres:15`
- Redis: `docker run -d -p 6379:6379 redis:7-alpine`
- MinIO: `docker run -d -p 9000:9000 -p 9001:9001 minio/minio server /data --console-address ":9001"`

</details>

## 📋 Configuration

### Environment Variables

Create `.env` files based on the provided examples:

#### Backend Configuration (`backend/.env`)
```env
# Database
DATABASE_URL=postgresql://imglink:password@localhost:5432/imglink

# Security
SECRET_KEY=your-secret-key-min-32-chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Storage
S3_ENDPOINT_URL=http://localhost:9000
S3_ACCESS_KEY_ID=minioadmin
S3_SECRET_ACCESS_KEY=minioadmin
S3_BUCKET_NAME=imglink-uploads

# Redis
REDIS_URL=redis://localhost:6379

# Email (Optional - for email verification)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAILS_FROM_EMAIL=noreply@imglink.com

# OAuth (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

#### Frontend Configuration (`frontend/.env`)
```env
VITE_API_URL=http://localhost:8000
VITE_GOOGLE_CLIENT_ID=your-google-client-id
VITE_GITHUB_CLIENT_ID=your-github-client-id
```

## 📚 Documentation

### Project Structure
```
imglink/
├── backend/
│   ├── app/
│   │   ├── api/           # API endpoints
│   │   │   └── api_v1/
│   │   │       └── endpoints/
│   │   ├── core/          # Core configuration
│   │   ├── models/        # SQLAlchemy models
│   │   ├── schemas/       # Pydantic schemas
│   │   ├── services/      # Business logic
│   │   └── utils/         # Helper functions
│   ├── migrations/        # Alembic migrations
│   ├── tests/            # Test suite
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/        # Page components
│   │   ├── store/        # State management
│   │   ├── services/     # API services
│   │   └── utils/        # Utilities
│   ├── public/           # Static assets
│   └── package.json
├── docker/               # Docker configurations
├── nginx/               # Nginx configs
├── docs/                # Additional documentation
├── docker-compose.yml   # Development compose
├── docker-compose.prod.yml # Production compose
└── deploy.sh           # Deployment script
```

### Additional Documentation
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Comprehensive deployment guide
- **[CLAUDE.md](./CLAUDE.md)** - Development guidelines and architecture details
- **[docs/mailgun-setup.md](./docs/mailgun-setup.md)** - Email service configuration

## 🔌 API Reference

### Authentication Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | User registration |
| POST | `/api/v1/auth/login` | User login |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| POST | `/api/v1/auth/verify-email` | Verify email address |
| POST | `/api/v1/auth/forgot-password` | Request password reset |
| POST | `/api/v1/auth/reset-password` | Reset password |
| GET | `/api/v1/auth/{provider}` | OAuth login |

### Image Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/images/` | Upload image(s) |
| GET | `/api/v1/images/` | List public images |
| GET | `/api/v1/images/me` | User's images |
| GET | `/api/v1/images/{id}` | Get image details |
| PUT | `/api/v1/images/{id}` | Update image |
| DELETE | `/api/v1/images/{id}` | Delete image |

### Album Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/albums/` | Create album |
| GET | `/api/v1/albums/` | List public albums |
| GET | `/api/v1/albums/me` | User's albums |
| GET | `/api/v1/albums/{id}` | Get album details |
| PUT | `/api/v1/albums/{id}` | Update album |
| DELETE | `/api/v1/albums/{id}` | Delete album |
| POST | `/api/v1/albums/{id}/images` | Add images to album |

### Social Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/images/{id}/comments` | Add comment |
| GET | `/api/v1/images/{id}/comments` | Get comments |
| POST | `/api/v1/images/{id}/like` | Like/unlike image |
| GET | `/api/v1/activity/` | Get activity feed |
| POST | `/api/v1/users/{id}/follow` | Follow user |
| DELETE | `/api/v1/users/{id}/unfollow` | Unfollow user |
| GET | `/api/v1/users/{id}/followers` | Get user followers |
| GET | `/api/v1/users/{id}/following` | Get user following |

### Search Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/search/images` | Search images with filters |
| GET | `/api/v1/search/users` | Search users |
| GET | `/api/v1/search/albums` | Search albums |
| GET | `/api/v1/search/all` | Combined search |

### Notification Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/notifications/` | Get notifications |
| PUT | `/api/v1/notifications/{id}/read` | Mark as read |
| PUT | `/api/v1/notifications/read-all` | Mark all as read |
| GET | `/api/v1/notifications/ws` | WebSocket connection |

### Admin Endpoints (Requires Admin Role)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/admin/stats` | Platform statistics |
| GET | `/api/v1/admin/users` | List all users |
| PUT | `/api/v1/admin/users/{id}/toggle-active` | Toggle user active |
| PUT | `/api/v1/admin/users/{id}/toggle-verified` | Toggle user verified |
| DELETE | `/api/v1/admin/users/{id}` | Delete user |
| GET | `/api/v1/admin/images` | List all images |
| DELETE | `/api/v1/admin/images/{id}` | Delete image |

Full API documentation available at `/docs` when running the backend.

## 🚢 Deployment

### Production Deployment with Docker

```bash
# Configure production environment
cp .env.prod.example .env.prod
# Edit .env.prod with your production values

# Deploy to production
./deploy.sh prod

# With SSL/TLS (requires certificates in ssl/ directory)
docker-compose -f docker-compose.prod.yml --profile ssl up -d
```

### Deployment Features
- **Health Checks**: All services include health check endpoints
- **Auto-restart**: Services automatically restart on failure
- **Resource Limits**: Configurable memory and CPU limits
- **Volume Persistence**: Data persists across container restarts
- **Log Rotation**: Automatic log management
- **Backup Support**: Built-in backup commands

### Scaling
```bash
# Scale backend workers
docker-compose -f docker-compose.prod.yml up -d --scale backend=3
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest
# With coverage
pytest --cov=app tests/
```

### Frontend Tests
```bash
cd frontend
npm test
# E2E tests
npm run test:e2e
```

## 🔧 Development

### Code Style
- Backend: Black, isort, flake8
- Frontend: ESLint, Prettier

### Pre-commit Hooks
```bash
# Install pre-commit
pip install pre-commit
pre-commit install
```

### Database Migrations
```bash
# Create new migration
cd backend
alembic revision --autogenerate -m "Description"

# Apply migrations
alembic upgrade head
```

## 📈 Performance Considerations

- **Image Optimization**: Automatic compression and multiple thumbnail sizes
- **Lazy Loading**: Images load as needed with intersection observer
- **Caching**: Redis caching for frequently accessed data
- **Database Indexes**: Optimized queries with proper indexing
- **CDN Ready**: Static assets can be served via CDN
- **Async Operations**: Non-blocking I/O for better concurrency

## 🔒 Security Features

- **Authentication**: JWT with secure refresh token rotation
- **Input Validation**: Comprehensive validation on all inputs
- **File Type Verification**: Magic number validation for uploads
- **SQL Injection Protection**: Parameterized queries via SQLAlchemy
- **XSS Prevention**: React's built-in protections
- **CORS Configuration**: Proper cross-origin resource sharing
- **Rate Limiting**: Configurable rate limits on API endpoints
- **Privacy Controls**: Granular privacy settings for content

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure:
- All tests pass
- Code follows the project style guide
- Documentation is updated
- Commit messages are descriptive

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by [Imgur](https://imgur.com)'s simplicity and functionality
- Built with amazing open-source technologies
- Thanks to all contributors and the open-source community

## 📞 Support

- **Documentation**: Check the [docs](./docs) directory
- **Issues**: [GitHub Issues](https://github.com/briankwest/imglink/issues)
- **Discussions**: [GitHub Discussions](https://github.com/briankwest/imglink/discussions)

---

<div align="center">
  <p>Made with ❤️ by the ImgLink team</p>
  <p>
    <a href="#imglink---modern-image-sharing-platform">Back to top ↑</a>
  </p>
</div>