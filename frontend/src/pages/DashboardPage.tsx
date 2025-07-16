import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PhotoIcon, PlusIcon, EyeIcon, HeartIcon, PencilIcon, LockClosedIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import { useAuthStore } from '../store/authStore'
import axios from 'axios'
import LazyImage from '../components/LazyImage'

interface Image {
  id: number
  title?: string
  description?: string
  url: string
  thumbnail_url?: string
  views: number
  like_count: number
  privacy: string
  created_at: string
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuthStore()
  const [images, setImages] = useState<Image[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    setError('') // Clear any previous errors before fetching
    fetchUserImages()
  }, [isAuthenticated, navigate])

  const fetchUserImages = async () => {
    try {
      const response = await axios.get('/api/v1/images/me')
      setImages(response.data)
      setError('') // Clear any previous errors on successful load
    } catch (err: any) {
      // Only show error for actual server errors, not authentication issues
      if (!err.response) {
        // Network error - likely during startup
        console.warn('Network error loading dashboard:', err.message)
        setError('')
        return
      }
      if (err.response.status === 401) {
        // User needs to login, redirect handled by auth check above
        return
      }
      setError(err.response?.data?.detail || 'Unable to load your images. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const deleteImage = async (imageId: number) => {
    if (!confirm('Are you sure you want to delete this image?')) {
      return
    }

    try {
      await axios.delete(`/api/v1/images/${imageId}`)
      setImages(prev => prev.filter(img => img.id !== imageId))
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to delete image')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const getPrivacyIcon = (privacy: string) => {
    switch (privacy) {
      case 'private':
        return <LockClosedIcon className="h-4 w-4 text-red-600" />
      case 'unlisted':
        return <EyeSlashIcon className="h-4 w-4 text-yellow-600" />
      default:
        return <EyeIcon className="h-4 w-4 text-green-600" />
    }
  }

  if (!isAuthenticated || !user) {
    return null
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Welcome back, {user.username}!</p>
        </div>
        <Link
          to="/upload"
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
          Upload Image
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <PhotoIcon className="h-8 w-8 text-indigo-600" />
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{images.length}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Total Images</div>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <EyeIcon className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {images.reduce((total, image) => total + image.views, 0)}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Total Views</div>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <HeartIcon className="h-8 w-8 text-red-600" />
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {images.reduce((total, image) => total + image.like_count, 0)}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Total Likes</div>
            </div>
          </div>
        </div>
      </div>

      {/* Images List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">Your Images</h2>
        </div>

        {error && images.length === 0 && !loading && (
          <div className="p-6 bg-red-50 border-l-4 border-red-400">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        {images.length === 0 ? (
          <div className="text-center py-12">
            <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No images yet</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Upload your first image to get started.
            </p>
            <div className="mt-6">
              <Link
                to="/upload"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                Upload Image
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Image
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Privacy
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Stats
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Uploaded
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {images.map((image) => (
                  <tr key={image.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link to={`/image/${image.id}`}>
                        <LazyImage
                          src={image.url}
                          thumbnailSrc={image.thumbnail_url}
                          alt={image.title || 'Image'}
                          className="h-12 w-12 rounded object-cover"
                          loading="eager"
                        />
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        to={`/image/${image.id}`}
                        className="text-sm font-medium text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400"
                      >
                        {image.title || 'Untitled'}
                      </Link>
                      {image.description && (
                        <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                          {image.description}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getPrivacyIcon(image.privacy)}
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          image.privacy === 'public' 
                            ? 'bg-green-100 text-green-800'
                            : image.privacy === 'private'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {image.privacy}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      <div>{image.views} views</div>
                      <div>{image.like_count} likes</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(image.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Link
                          to={`/image/${image.id}`}
                          className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300"
                        >
                          View
                        </Link>
                        <Link
                          to={`/image/${image.id}/edit`}
                          className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300"
                          title="Edit image"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => navigator.clipboard.writeText(`${window.location.origin}/image/${image.id}`)}
                          className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300"
                          title="Copy link"
                        >
                          Copy Link
                        </button>
                        <button
                          onClick={() => deleteImage(image.id)}
                          className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                          title="Delete image"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}