import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { EyeIcon, HeartIcon, CalendarIcon, UserIcon, PencilIcon, LockClosedIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid'
import axios from 'axios'
import { useAuthStore } from '../store/authStore'
import Comments from '../components/Comments'
import ImageViewer from '../components/ImageViewer'
import TagManager from '../components/tags/TagManager'

interface Image {
  id: number
  title?: string
  description?: string
  url: string
  thumbnail_url?: string
  views: number
  like_count: number
  privacy: string
  owner_id: number
  created_at: string
  width?: number
  height?: number
  file_size?: number
  file_type?: string
  tags: string[]
}

interface Owner {
  id: number
  username: string
  avatar_url?: string
}

export default function ImagePage() {
  const { id } = useParams<{ id: string }>()
  const { user, isAuthenticated } = useAuthStore()
  const [image, setImage] = useState<Image | null>(null)
  const [owner, setOwner] = useState<Owner | null>(null)
  const [liked, setLiked] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showViewer, setShowViewer] = useState(false)

  useEffect(() => {
    if (id) {
      fetchImage()
    }
  }, [id])

  const fetchImage = async () => {
    try {
      const response = await axios.get(`/api/v1/images/${id}`)
      setImage(response.data)
      
      // Fetch owner info
      const ownerResponse = await axios.get(`/api/v1/users/${response.data.owner_id}`)
      setOwner(ownerResponse.data)
      
      // Check if current user liked this image
      if (isAuthenticated && user) {
        try {
          const likeResponse = await axios.get(`/api/v1/images/${id}/liked`)
          setLiked(likeResponse.data.liked)
        } catch (err) {
          // If check fails, assume not liked
          setLiked(false)
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load image')
    } finally {
      setLoading(false)
    }
  }

  const toggleLike = async () => {
    if (!isAuthenticated) {
      return
    }

    try {
      if (liked) {
        await axios.delete(`/api/v1/images/${id}/like`)
        setLiked(false)
        setImage(prev => prev ? { ...prev, like_count: prev.like_count - 1 } : null)
      } else {
        await axios.post(`/api/v1/images/${id}/like`)
        setLiked(true)
        setImage(prev => prev ? { ...prev, like_count: prev.like_count + 1 } : null)
      }
    } catch (err: any) {
      console.error('Failed to toggle like:', err)
      // Show user-friendly error
      alert(err.response?.data?.detail || 'Failed to update like status')
    }
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown'
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const getPrivacyInfo = (privacy: string) => {
    switch (privacy) {
      case 'private':
        return { icon: LockClosedIcon, text: 'Private', color: 'text-red-600' }
      case 'unlisted':
        return { icon: EyeSlashIcon, text: 'Unlisted', color: 'text-yellow-600' }
      default:
        return { icon: EyeIcon, text: 'Public', color: 'text-green-600' }
    }
  }

  const isOwner = user && image && user.id === image.owner_id

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
      </div>
    )
  }

  if (error || !image) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Image not found</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{error || 'The image you\'re looking for doesn\'t exist.'}</p>
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Image */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            <img
              src={image.url}
              alt={image.title || 'Uploaded image'}
              className="w-full h-auto max-h-screen object-contain cursor-zoom-in hover:opacity-95 transition-opacity"
              onClick={() => setShowViewer(true)}
              title="Click to view full size"
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Image Info */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                {image.title && (
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{image.title}</h1>
                )}
                {/* Privacy indicator */}
                <div className={`flex items-center space-x-1 ${getPrivacyInfo(image.privacy).color} mb-2`}>
                  {(() => {
                    const PrivacyIcon = getPrivacyInfo(image.privacy).icon
                    return <PrivacyIcon className="h-4 w-4" />
                  })()}
                  <span className="text-sm font-medium">{getPrivacyInfo(image.privacy).text}</span>
                </div>
              </div>
              
              {/* Edit button for owners */}
              {isOwner && (
                <Link
                  to={`/image/${image.id}/edit`}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <PencilIcon className="h-4 w-4 mr-1" />
                  Edit
                </Link>
              )}
            </div>
            {image.description && (
              <p className="text-gray-600 dark:text-gray-400 mb-4">{image.description}</p>
            )}

            {/* Owner Info */}
            {owner && (
              <div className="flex items-center space-x-3 mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <img
                  src={owner.avatar_url || `https://ui-avatars.com/api/?name=${owner.username}&background=6366f1&color=fff`}
                  alt={owner.username}
                  className="h-10 w-10 rounded-full"
                />
                <div>
                  <Link
                    to={`/user/${owner.username}`}
                    className="font-medium text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400"
                  >
                    {owner.username}
                  </Link>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Image owner</p>
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                <EyeIcon className="h-5 w-5" />
                <span>{image.views} views</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                {liked ? (
                  <HeartIconSolid className="h-5 w-5 text-red-500" />
                ) : (
                  <HeartIcon className="h-5 w-5" />
                )}
                <span>{image.like_count} likes</span>
              </div>
            </div>

            {/* Like Button */}
            {isAuthenticated && (
              <button
                onClick={toggleLike}
                className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
                  liked
                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {liked ? 'Unlike' : 'Like'} this image
              </button>
            )}
          </div>

          {/* Tags Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Tags</h3>
            <TagManager
              imageId={image.id}
              initialTags={image.tags || []}
              editable={isOwner}
              onTagsUpdate={(newTags) => {
                setImage({ ...image, tags: newTags })
              }}
            />
          </div>

          {/* Image Details */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Details</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Uploaded</span>
                <div className="flex items-center space-x-1">
                  <CalendarIcon className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-900 dark:text-gray-300">{formatDate(image.created_at)}</span>
                </div>
              </div>
              {image.width && image.height && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Dimensions</span>
                  <span className="text-gray-900 dark:text-gray-300">{image.width} × {image.height}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">File size</span>
                <span className="text-gray-900 dark:text-gray-300">{formatFileSize(image.file_size)}</span>
              </div>
              {image.file_type && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Format</span>
                  <span className="uppercase text-gray-900 dark:text-gray-300">{image.file_type.replace('image/', '')}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Privacy</span>
                <span className="capitalize text-gray-900 dark:text-gray-300">{image.privacy}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Actions</h3>
            <div className="space-y-2">
              <button
                onClick={() => navigator.clipboard.writeText(window.location.href)}
                className="w-full text-left py-2 px-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                Copy link
              </button>
              <a
                href={image.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-left py-2 px-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                View full size
              </a>
              <a
                href={image.url}
                download
                className="block w-full text-left py-2 px-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                Download
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Comments Section */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Comments imageId={image.id} />
      </div>

      {/* Full-screen Image Viewer */}
      {showViewer && (
        <ImageViewer
          src={image.url}
          alt={image.title || 'Uploaded image'}
          onClose={() => setShowViewer(false)}
        />
      )}
    </div>
  )
}