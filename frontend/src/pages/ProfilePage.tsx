import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { PhotoIcon, CalendarIcon } from '@heroicons/react/24/outline'
import axios from 'axios'
import LazyImage from '../components/LazyImage'

interface User {
  id: number
  username: string
  email: string
  full_name?: string
  avatar_url?: string
  bio?: string
  created_at: string
}

interface Image {
  id: number
  title?: string
  url: string
  thumbnail_url?: string
  views: number
  like_count: number
  created_at: string
}

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>()
  const [user, setUser] = useState<User | null>(null)
  const [images, setImages] = useState<Image[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (username) {
      setError('') // Clear any previous errors before fetching
      fetchUserProfile()
    }
  }, [username])

  const fetchUserProfile = async () => {
    try {
      // Fetch user info
      const userResponse = await axios.get(`/api/v1/users/username/${username}`)
      setUser(userResponse.data)

      // Fetch user's public images
      const imagesResponse = await axios.get(`/api/v1/users/username/${username}/images`)
      setImages(imagesResponse.data)
      setError('') // Clear any previous errors on successful load
    } catch (err: any) {
      if (!err.response) {
        // Network error
        console.warn('Network error loading profile:', err.message)
        setError('Unable to connect. Please check your connection and try again.')
      } else if (err.response.status === 404) {
        setError('User not found')
      } else if (err.response.status >= 500) {
        setError('Server temporarily unavailable. Please try again later.')
      } else {
        setError(err.response?.data?.detail || 'Failed to load profile')
      }
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
    })
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">User not found</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{error || 'The user you\'re looking for doesn\'t exist.'}</p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Back to Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Profile Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
        <div className="flex items-start space-x-6">
          <img
            src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.username}&background=6366f1&color=fff&size=128`}
            alt={user.username}
            className="h-24 w-24 rounded-full"
          />
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{user.full_name || user.username}</h1>
            <p className="text-gray-600 dark:text-gray-400">@{user.username}</p>
            {user.bio && (
              <p className="mt-2 text-gray-700 dark:text-gray-300">{user.bio}</p>
            )}
            <div className="flex items-center space-x-1 mt-2 text-sm text-gray-500 dark:text-gray-400">
              <CalendarIcon className="h-4 w-4" />
              <span>Joined {formatDate(user.created_at)}</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-6 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{images.length}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Images</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {images.reduce((total, image) => total + image.views, 0)}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Total Views</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {images.reduce((total, image) => total + image.like_count, 0)}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Total Likes</div>
          </div>
        </div>
      </div>

      {/* Images Grid */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          {user.username}'s Images
        </h2>

        {images.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
            <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No images yet</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {user.username} hasn't uploaded any public images yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {images.map((image) => (
              <Link
                key={image.id}
                to={`/image/${image.id}`}
                className="group relative bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200"
              >
                <LazyImage
                  src={image.url}
                  thumbnailSrc={image.thumbnail_url}
                  alt={image.title || 'Uploaded image'}
                  aspectRatio="square"
                  className="group-hover:scale-105 transition-transform duration-200"
                />
                {image.title && (
                  <div className="p-4">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {image.title}
                    </h3>
                    <div className="flex justify-between items-center mt-2 text-xs text-gray-500 dark:text-gray-400">
                      <span>{image.views} views</span>
                      <span>{image.like_count} likes</span>
                    </div>
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}