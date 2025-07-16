import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PlusIcon, PhotoIcon, EyeIcon, LockClosedIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import { useAuthStore } from '../store/authStore'
import LazyImage from '../components/LazyImage'
import axios from 'axios'

interface Album {
  id: number
  title: string
  description?: string
  privacy: 'public' | 'private' | 'unlisted'
  views: number
  image_count: number
  cover_image_id?: number
  created_at: string
  images: Array<{
    id: number
    url: string
    thumbnail_url?: string
    title?: string
  }>
}

export default function AlbumsPage() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  const [albums, setAlbums] = useState<Album[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    setError('') // Clear any previous errors before fetching
    fetchAlbums()
  }, [isAuthenticated, navigate])

  const fetchAlbums = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/v1/albums/me')
      setAlbums(response.data)
      setError('') // Clear any previous errors on successful load
    } catch (err: any) {
      // Only show error for actual server errors, not authentication issues
      if (!err.response) {
        // Network error - likely during startup
        console.warn('Network error loading albums:', err.message)
        setError('')
        return
      }
      if (err.response.status === 401) {
        // User needs to login, redirect handled by auth check above
        return
      }
      setError(err.response?.data?.detail || 'Unable to load albums. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const deleteAlbum = async (albumId: number) => {
    if (!confirm('Are you sure you want to delete this album? This action cannot be undone.')) {
      return
    }

    try {
      await axios.delete(`/api/v1/albums/${albumId}`)
      setAlbums(prev => prev.filter(album => album.id !== albumId))
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to delete album')
    }
  }

  const getPrivacyIcon = (privacy: string) => {
    switch (privacy) {
      case 'private':
        return <LockClosedIcon className="h-4 w-4 text-red-500" />
      case 'unlisted':
        return <EyeSlashIcon className="h-4 w-4 text-yellow-500" />
      default:
        return <EyeIcon className="h-4 w-4 text-green-500" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  if (!isAuthenticated) {
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Albums</h1>
          <p className="text-gray-600 dark:text-gray-400">Organize your images into collections</p>
        </div>
        <Link
          to="/albums/create"
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
          Create Album
        </Link>
      </div>

      {error && albums.length === 0 && !loading && (
        <div className="mb-6 rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      {albums.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
          <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No albums yet</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Create your first album to organize your images.
          </p>
          <div className="mt-6">
            <Link
              to="/albums/create"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
              Create Album
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {albums.map((album) => (
            <div
              key={album.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200"
            >
              {/* Album Cover */}
              <Link to={`/albums/${album.id}`} className="block">
                <div className="aspect-video bg-gray-200 dark:bg-gray-700 relative">
                  {album.images.length > 0 ? (
                    <div className="grid grid-cols-2 gap-1 h-full">
                      {album.images.slice(0, 4).map((image, index) => (
                        <div key={image.id} className={`relative ${index === 0 && album.images.length === 1 ? 'col-span-2' : ''}`}>
                          <LazyImage
                            src={image.url}
                            thumbnailSrc={image.thumbnail_url}
                            alt={image.title || 'Album image'}
                            className="w-full h-full"
                            loading="lazy"
                          />
                        </div>
                      ))}
                      {album.images.length > 4 && (
                        <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                          +{album.images.length - 4} more
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <PhotoIcon className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                  
                  {/* Privacy indicator */}
                  <div className="absolute top-2 left-2">
                    {getPrivacyIcon(album.privacy)}
                  </div>
                </div>
              </Link>

              {/* Album Info */}
              <div className="p-4">
                <Link to={`/albums/${album.id}`}>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                    {album.title}
                  </h3>
                </Link>
                {album.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                    {album.description}
                  </p>
                )}
                
                <div className="flex justify-between items-center mt-3 text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center space-x-4">
                    <span>{album.image_count} images</span>
                    <span>{album.views} views</span>
                  </div>
                  <span>{formatDate(album.created_at)}</span>
                </div>

                {/* Actions */}
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex space-x-2 text-sm">
                    <Link
                      to={`/albums/${album.id}`}
                      className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
                    >
                      View
                    </Link>
                    <Link
                      to={`/albums/${album.id}/edit`}
                      className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300"
                    >
                      Edit
                    </Link>
                  </div>
                  <button
                    onClick={() => deleteAlbum(album.id)}
                    className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}