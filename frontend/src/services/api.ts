/**
 * API service for making HTTP requests
 */
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

class ApiService {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        // Get auth state from zustand store
        const authState = localStorage.getItem('auth-storage')
        if (authState) {
          try {
            const { state } = JSON.parse(authState)
            if (state?.accessToken) {
              config.headers.Authorization = `Bearer ${state.accessToken}`
            }
          } catch (e) {
            console.error('Failed to parse auth state:', e)
          }
        }
        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        // Log errors in development
        if (import.meta.env.DEV) {
          console.error('API Error:', error.response?.data || error.message)
        }
        return Promise.reject(error)
      }
    )
  }

  // Generic request methods
  async get<T>(url: string, config?: AxiosRequestConfig) {
    const response = await this.client.get<T>(url, config)
    return response.data
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig) {
    const response = await this.client.post<T>(url, data, config)
    return response.data
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig) {
    const response = await this.client.put<T>(url, data, config)
    return response.data
  }

  async delete<T>(url: string, config?: AxiosRequestConfig) {
    const response = await this.client.delete<T>(url, config)
    return response.data
  }

  // File upload with progress
  async uploadFile(
    url: string,
    formData: FormData,
    onProgress?: (progress: number) => void
  ) {
    const response = await this.client.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          )
          onProgress(progress)
        }
      },
    })
    return response.data
  }

  // Get axios instance for custom configurations
  getClient() {
    return this.client
  }
}

// Export singleton instance
export const apiService = new ApiService()

// Export types
export type { AxiosRequestConfig }