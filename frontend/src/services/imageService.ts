/**
 * Service for image-related API calls
 */
import { apiService } from './api'

export interface Image {
  id: number
  title?: string
  description?: string
  filename: string
  url: string
  thumbnail_url?: string
  delete_url?: string
  privacy: 'public' | 'private' | 'unlisted'
  views: number
  like_count: number
  tags: string[]
  owner?: {
    id: number
    username: string
    avatar_url?: string
  }
  created_at: string
  updated_at: string
  metadata?: {
    width: number
    height: number
    format: string
    size: number
  }
}

export interface ImageUploadData {
  files: File[]
  title?: string
  description?: string
  privacy?: 'public' | 'private' | 'unlisted'
  album_id?: number
}

export interface ImageListParams {
  skip?: number
  limit?: number
  sort_by?: 'created_at' | 'views' | 'likes'
  order?: 'asc' | 'desc'
  search?: string
}

class ImageService {
  async uploadImages(
    data: ImageUploadData,
    onProgress?: (progress: number) => void
  ): Promise<Image[]> {
    const formData = new FormData()
    
    data.files.forEach((file) => {
      formData.append('files', file)
    })
    
    if (data.title) formData.append('title', data.title)
    if (data.description) formData.append('description', data.description)
    if (data.privacy) formData.append('privacy', data.privacy)
    if (data.album_id) formData.append('album_id', data.album_id.toString())
    
    return apiService.uploadFile('/api/v1/images/', formData, onProgress)
  }

  async getPublicImages(params: ImageListParams = {}): Promise<Image[]> {
    return apiService.get('/api/v1/images/', { params })
  }

  async getUserImages(params: ImageListParams = {}): Promise<Image[]> {
    return apiService.get('/api/v1/images/me', { params })
  }

  async getImage(id: number): Promise<Image> {
    return apiService.get(`/api/v1/images/${id}`)
  }

  async updateImage(
    id: number,
    data: Partial<Pick<Image, 'title' | 'description' | 'privacy'>>
  ): Promise<Image> {
    return apiService.put(`/api/v1/images/${id}`, data)
  }

  async deleteImage(id: number): Promise<void> {
    return apiService.delete(`/api/v1/images/${id}`)
  }

  async likeImage(id: number): Promise<{ liked: boolean; like_count: number }> {
    return apiService.post(`/api/v1/images/${id}/like`)
  }

  async searchImages(query: string, params: ImageListParams = {}): Promise<Image[]> {
    return apiService.get('/api/v1/search/images', {
      params: { q: query, ...params }
    })
  }
}

export const imageService = new ImageService()