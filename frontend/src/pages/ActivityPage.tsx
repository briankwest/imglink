import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PhotoIcon, HeartIcon, EyeIcon, ClockIcon } from '@heroicons/react/24/outline'
import axios from 'axios'
import LazyImage from '../components/LazyImage'
import { useAuthStore } from '../store/authStore'

interface Image {
  id: number
  title?: string
  url: string
  thumbnail_url?: string
  views: number
  like_count: number
  created_at: string
  owner_id: number
}

interface User {
  id: number
  username: string
  avatar_url?: string
}

interface ActivityItem {
  id: string
  type: 'image_upload' | 'image_like'
  image: Image
  user: User
  created_at: string
}

export default function ActivityPage() {
  const { isAuthenticated } = useAuthStore()
  const [recentImages, setRecentImages] = useState<Image[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setError('') // Clear any previous errors before fetching
    fetchRecentActivity()
  }, [])

  const fetchRecentActivity = async () => {
    try {
      // For now, just get recent public images as activity
      const response = await axios.get('/api/v1/images/?limit=20')
      setRecentImages(response.data)
      setError('') // Clear any previous errors on successful load
    } catch (err: any) {
      // For public activity, handle errors gracefully
      if (!err.response) {
        // Network error - don't show error for empty public data
        console.warn('Network error loading activity:', err.message)
        setError('')
      } else if (err.response.status >= 500) {
        setError('Server temporarily unavailable. Please try again later.')
      } else {
        setError('Unable to load recent activity. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
      return diffInMinutes <= 1 ? 'Just now' : `${diffInMinutes} minutes ago`
    } else if (diffInHours < 24) {
      return `${diffInHours} hours ago`
    } else {
      const diffInDays = Math.floor(diffInHours / 24)
      return `${diffInDays} days ago`
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Recent Activity</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Discover the latest images and activity from the ImgLink community
        </p>
      </div>

      {error && recentImages.length === 0 && !loading && (
        <div className="rounded-md bg-red-50 p-4 mb-6">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      {/* Activity Feed */}
      <div className="space-y-6">
        {recentImages.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
            <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No recent activity</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Check back later for new uploads and activity.
            </p>
          </div>
        ) : (
          recentImages.map((image) => (
            <div key={image.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex space-x-4">
                {/* Image Thumbnail */}
                <Link
                  to={`/image/${image.id}`}
                  className="flex-shrink-0"
                >
                  <LazyImage
                    src={image.url}
                    thumbnailSrc={image.thumbnail_url}
                    alt={image.title || 'Recent image'}
                    className="w-20 h-20 rounded-lg object-cover hover:opacity-90 transition-opacity"
                    loading="lazy"
                  />
                </Link>

                {/* Activity Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <PhotoIcon className="h-4 w-4 text-indigo-600" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">New image uploaded</span>
                        <div className="flex items-center space-x-1 text-xs text-gray-400 dark:text-gray-500">
                          <ClockIcon className="h-3 w-3" />
                          <span>{formatTimeAgo(image.created_at)}</span>
                        </div>
                      </div>
                      
                      <Link
                        to={`/image/${image.id}`}
                        className="block"
                      >
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                          {image.title || 'Untitled Image'}
                        </h3>
                      </Link>

                      {/* Stats */}
                      <div className="flex items-center space-x-4 mt-3">
                        <div className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400">
                          <EyeIcon className="h-4 w-4" />
                          <span>{image.views} views</span>
                        </div>
                        <div className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400">
                          <HeartIcon className="h-4 w-4" />
                          <span>{image.like_count} likes</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Load More */}
      {recentImages.length > 0 && (
        <div className="text-center mt-8">
          <button
            onClick={fetchRecentActivity}
            className="inline-flex items-center px-6 py-3 border border-gray-300 dark:border-gray-600 shadow-sm text-base font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Load More Activity
          </button>
        </div>
      )}

      {/* Call to Action for Non-Authenticated Users */}
      {!isAuthenticated && (
        <div className="mt-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            Join the ImgLink Community
          </h2>
          <p className="text-indigo-100 mb-6">
            Sign up to upload your own images, like and comment on others, and be part of the activity!
          </p>
          <div className="space-x-4">
            <Link
              to="/register"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-gray-50"
            >
              Sign Up Free
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center px-6 py-3 border-2 border-white text-base font-medium rounded-md text-white hover:bg-white hover:text-indigo-600 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}