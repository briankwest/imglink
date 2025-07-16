# ImgLink API Documentation

## Base URL

- Development: `http://localhost:8000/api/v1`
- Production: `https://your-domain.com/api/v1`

## Authentication

ImgLink uses JWT (JSON Web Token) authentication. Include the access token in the Authorization header:

```
Authorization: Bearer <access_token>
```

## API Endpoints

### Authentication

#### Register New User

```http
POST /auth/register
Content-Type: application/json

{
  "username": "string",
  "email": "user@example.com",
  "password": "string",
  "full_name": "string (optional)"
}
```

**Response:**
```json
{
  "access_token": "string",
  "refresh_token": "string",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "username": "string",
    "email": "user@example.com",
    "is_active": true,
    "is_verified": false
  }
}
```

#### Login

```http
POST /auth/login
Content-Type: application/x-www-form-urlencoded

username=string&password=string
```

**Response:**
```json
{
  "access_token": "string",
  "refresh_token": "string",
  "token_type": "bearer"
}
```

#### Refresh Token

```http
POST /auth/refresh
Content-Type: application/json

{
  "refresh_token": "string"
}
```

#### Verify Email

```http
POST /auth/verify-email
Content-Type: application/json

{
  "token": "string"
}
```

#### Request Password Reset

```http
POST /auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

#### Reset Password

```http
POST /auth/reset-password
Content-Type: application/json

{
  "token": "string",
  "password": "newpassword"
}
```

### Users

#### Get Current User

```http
GET /users/me
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "id": 1,
  "username": "string",
  "email": "user@example.com",
  "full_name": "string",
  "bio": "string",
  "avatar_url": "string",
  "is_active": true,
  "is_verified": true,
  "created_at": "2024-01-01T00:00:00Z"
}
```

#### Update Current User

```http
PUT /users/me
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "full_name": "string",
  "bio": "string",
  "avatar_url": "string"
}
```

#### Get User by Username

```http
GET /users/{username}
```

### Images

#### Upload Image(s)

```http
POST /images/
Authorization: Bearer <access_token>
Content-Type: multipart/form-data

files: (binary)
title: string (optional)
description: string (optional)
privacy: public|private|unlisted (default: public)
album_id: integer (optional)
```

**Response:**
```json
[
  {
    "id": 1,
    "title": "string",
    "description": "string",
    "filename": "string",
    "url": "string",
    "thumbnail_url": "string",
    "delete_url": "string",
    "privacy": "public",
    "views": 0,
    "like_count": 0,
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

#### List Public Images

```http
GET /images/?skip=0&limit=20&sort_by=created_at&order=desc
```

**Query Parameters:**
- `skip`: Offset for pagination (default: 0)
- `limit`: Number of items to return (default: 20, max: 100)
- `sort_by`: Sort field (created_at, views, likes)
- `order`: Sort order (asc, desc)
- `search`: Search in title and description

#### Get User's Images

```http
GET /images/me
Authorization: Bearer <access_token>
```

#### Get Image Details

```http
GET /images/{id}
```

**Response:**
```json
{
  "id": 1,
  "title": "string",
  "description": "string",
  "filename": "string",
  "url": "string",
  "thumbnail_url": "string",
  "privacy": "public",
  "views": 100,
  "like_count": 10,
  "owner": {
    "id": 1,
    "username": "string",
    "avatar_url": "string"
  },
  "created_at": "2024-01-01T00:00:00Z",
  "metadata": {
    "width": 1920,
    "height": 1080,
    "format": "jpeg",
    "size": 1024000
  }
}
```

#### Update Image

```http
PUT /images/{id}
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "title": "string",
  "description": "string",
  "privacy": "public|private|unlisted"
}
```

#### Delete Image

```http
DELETE /images/{id}
Authorization: Bearer <access_token>
```

### Albums

#### Create Album

```http
POST /albums/
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "title": "string",
  "description": "string",
  "privacy": "public|private|unlisted"
}
```

#### List Albums

```http
GET /albums/?skip=0&limit=20
```

#### Get Album Details

```http
GET /albums/{id}
```

**Response:**
```json
{
  "id": 1,
  "title": "string",
  "description": "string",
  "privacy": "public",
  "owner": {
    "id": 1,
    "username": "string"
  },
  "images": [
    {
      "id": 1,
      "title": "string",
      "thumbnail_url": "string",
      "order": 0
    }
  ],
  "created_at": "2024-01-01T00:00:00Z"
}
```

#### Update Album

```http
PUT /albums/{id}
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "title": "string",
  "description": "string",
  "privacy": "public|private|unlisted"
}
```

#### Add Images to Album

```http
POST /albums/{id}/images
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "image_ids": [1, 2, 3]
}
```

#### Remove Image from Album

```http
DELETE /albums/{album_id}/images/{image_id}
Authorization: Bearer <access_token>
```

#### Reorder Album Images

```http
PUT /albums/{id}/reorder
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "image_orders": [
    {"image_id": 1, "order": 0},
    {"image_id": 2, "order": 1}
  ]
}
```

### Social Features

#### Add Comment

```http
POST /images/{id}/comments
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "content": "string",
  "parent_id": null
}
```

#### Get Comments

```http
GET /images/{id}/comments?skip=0&limit=20
```

**Response:**
```json
[
  {
    "id": 1,
    "content": "string",
    "author": {
      "id": 1,
      "username": "string",
      "avatar_url": "string"
    },
    "created_at": "2024-01-01T00:00:00Z",
    "replies": []
  }
]
```

#### Like/Unlike Image

```http
POST /images/{id}/like
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "liked": true,
  "like_count": 11
}
```

#### Get Activity Feed

```http
GET /activity/?skip=0&limit=20
Authorization: Bearer <access_token>
```

### Search

#### Search Images

```http
GET /search/images?q=query&privacy=public&sort_by=relevance
```

**Query Parameters:**
- `q`: Search query
- `privacy`: Filter by privacy (public, all)
- `sort_by`: Sort results (relevance, created_at, views, likes)
- `skip`: Pagination offset
- `limit`: Results per page

### Admin Endpoints

#### Get Platform Statistics

```http
GET /admin/stats
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "total_users": 1000,
  "total_images": 5000,
  "total_public_images": 3000,
  "total_private_images": 1500,
  "total_unlisted_images": 500,
  "total_comments": 10000,
  "total_likes": 25000,
  "top_uploaders": [
    {
      "username": "string",
      "image_count": 100
    }
  ],
  "recent_activity": {
    "new_users": 10,
    "new_images": 50,
    "new_comments": 100
  }
}
```

#### List All Users

```http
GET /admin/users?skip=0&limit=100&search=query
Authorization: Bearer <access_token>
```

#### Toggle User Active Status

```http
PUT /admin/users/{id}/toggle-active
Authorization: Bearer <access_token>
```

#### Toggle User Verified Status

```http
PUT /admin/users/{id}/toggle-verified
Authorization: Bearer <access_token>
```

#### Delete User

```http
DELETE /admin/users/{id}
Authorization: Bearer <access_token>
```

#### List All Images

```http
GET /admin/images?skip=0&limit=100&privacy=all
Authorization: Bearer <access_token>
```

#### Delete Image (Admin)

```http
DELETE /admin/images/{id}
Authorization: Bearer <access_token>
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "detail": "Error message"
}
```

Common HTTP status codes:
- `400`: Bad Request - Invalid input
- `401`: Unauthorized - Missing or invalid token
- `403`: Forbidden - Insufficient permissions
- `404`: Not Found - Resource not found
- `422`: Unprocessable Entity - Validation error
- `500`: Internal Server Error

## Rate Limiting

API endpoints are rate-limited to prevent abuse:
- Anonymous users: 100 requests per hour
- Authenticated users: 1000 requests per hour
- File uploads: 50 per hour

Rate limit information is included in response headers:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Requests remaining
- `X-RateLimit-Reset`: Unix timestamp when limit resets

## Pagination

List endpoints support pagination using `skip` and `limit` parameters:
- `skip`: Number of items to skip (default: 0)
- `limit`: Number of items to return (default: 20, max: 100)

Response includes pagination metadata in headers:
- `X-Total-Count`: Total number of items
- `X-Page-Count`: Total number of pages

## File Upload Limits

- Maximum file size: 20MB per image
- Supported formats: JPEG, PNG, GIF, WebP
- Maximum batch upload: 10 images at once

## CORS

The API supports Cross-Origin Resource Sharing (CORS) for browser-based applications. Configure allowed origins in production settings.

## WebSocket Events (Future)

Real-time notifications planned for:
- New comments on your images
- New likes on your images
- New followers
- System notifications