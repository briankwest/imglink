import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import axios from 'axios'

interface User {
  id: number
  username: string
  email: string
  full_name?: string
  avatar_url?: string
  bio?: string
  is_active: boolean
  is_verified: boolean
  is_superuser: boolean
}

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<void>
  register: (username: string, email: string, password: string) => Promise<void>
  logout: () => void
  refreshAccessToken: () => Promise<void>
  fetchCurrentUser: () => Promise<void>
  setTokens: (accessToken: string, refreshToken: string) => void
  requestPasswordReset: (email: string) => Promise<void>
  resetPassword: (token: string, newPassword: string) => Promise<void>
  verifyEmail: (token: string) => Promise<void>
  resendVerification: (email: string) => Promise<void>
  getOAuthUrl: (provider: 'google' | 'github') => Promise<{ auth_url: string; state: string }>
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      login: async (username: string, password: string) => {
        try {
          const response = await axios.post(`${API_URL}/api/v1/auth/login`, 
            new URLSearchParams({
              username,
              password,
            }),
            {
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
              },
            }
          )

          const { access_token, refresh_token } = response.data
          set({
            accessToken: access_token,
            refreshToken: refresh_token,
            isAuthenticated: true,
          })

          // Set axios default header
          axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`

          // Fetch user data
          await get().fetchCurrentUser()
        } catch (error) {
          throw error
        }
      },

      register: async (username: string, email: string, password: string) => {
        try {
          await axios.post(`${API_URL}/api/v1/auth/register`, {
            username,
            email,
            password,
          })

          // Try to auto login after registration
          try {
            await get().login(username, password)
          } catch (loginError: any) {
            // If login fails due to email verification, throw specific error
            if (loginError.response?.data?.detail?.includes('Email not verified')) {
              throw new Error('EMAIL_VERIFICATION_REQUIRED')
            }
            // Re-throw other login errors
            throw loginError
          }
        } catch (error) {
          throw error
        }
      },

      logout: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        })
        delete axios.defaults.headers.common['Authorization']
      },

      refreshAccessToken: async () => {
        const refreshToken = get().refreshToken
        if (!refreshToken) {
          get().logout()
          return
        }

        try {
          const response = await axios.post(`${API_URL}/api/v1/auth/refresh`, {
            refresh_token: refreshToken,
          })

          const { access_token, refresh_token } = response.data
          set({
            accessToken: access_token,
            refreshToken: refresh_token,
          })

          axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
        } catch (error) {
          get().logout()
          throw error
        }
      },

      fetchCurrentUser: async () => {
        try {
          const response = await axios.get(`${API_URL}/api/v1/users/me`)
          set({ user: response.data })
        } catch (error) {
          // If fetching current user fails, the token might be invalid
          // Don't logout here - let the interceptor handle it
          throw error
        }
      },

      setTokens: (accessToken: string, refreshToken: string) => {
        set({
          accessToken,
          refreshToken,
          isAuthenticated: true,
        })
        axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
      },

      requestPasswordReset: async (email: string) => {
        try {
          await axios.post(`${API_URL}/api/v1/auth/forgot-password`, { email })
        } catch (error) {
          throw error
        }
      },

      resetPassword: async (token: string, newPassword: string) => {
        try {
          await axios.post(`${API_URL}/api/v1/auth/reset-password`, {
            token,
            new_password: newPassword
          })
        } catch (error) {
          throw error
        }
      },

      verifyEmail: async (token: string) => {
        try {
          await axios.post(`${API_URL}/api/v1/auth/verify-email`, { token })
        } catch (error) {
          throw error
        }
      },

      resendVerification: async (email: string) => {
        try {
          await axios.post(`${API_URL}/api/v1/auth/resend-verification`, { email })
        } catch (error) {
          throw error
        }
      },

      getOAuthUrl: async (provider: 'google' | 'github') => {
        try {
          const response = await axios.get(`${API_URL}/api/v1/auth/${provider}`)
          return response.data
        } catch (error) {
          throw error
        }
      },
    }),
    {
      name: 'auth-storage',
      version: 1,
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        user: state.user,
      }),
      onRehydrateStorage: () => (state) => {
        // If we have tokens but isAuthenticated is false, fix it
        if (state && state.accessToken && state.refreshToken && !state.isAuthenticated) {
          state.isAuthenticated = true
        }
        // Set axios header if we have a token
        if (state?.accessToken) {
          axios.defaults.headers.common['Authorization'] = `Bearer ${state.accessToken}`
        }
      },
      migrate: (persistedState: any, version: number) => {
        return persistedState
      },
    }
  )
)

// Initialize axios interceptor for token refresh
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        await useAuthStore.getState().refreshAccessToken()
        return axios(originalRequest)
      } catch (refreshError) {
        useAuthStore.getState().logout()
        
        // Only redirect to login if not already on login/register pages
        const currentPath = window.location.pathname
        if (!currentPath.includes('/login') && !currentPath.includes('/register') && !currentPath.includes('/auth/')) {
          window.location.href = '/login'
        }
        
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)