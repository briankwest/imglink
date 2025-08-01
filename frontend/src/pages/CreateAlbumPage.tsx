import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { PhotoIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useAuthStore } from '../store/authStore'
import LazyImage from '../components/LazyImage'
import axios from 'axios'

interface AlbumForm {
  title: string
  description: string
  privacy: 'public' | 'private' | 'unlisted'
}

interface Image {
  id: number
  title?: string
  url: string
  thumbnail_url?: string
  created_at: string
}

export default function CreateAlbumPage() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [images, setImages] = useState<Image[]>([])
  const [selectedImages, setSelectedImages] = useState<number[]>([])
  const [imagesLoading, setImagesLoading] = useState(true)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AlbumForm>({
    defaultValues: {
      privacy: 'public'
    }
  })

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    fetchUserImages()
  }, [isAuthenticated, navigate])

  const fetchUserImages = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/v1/images/me')
      setImages(response.data)
    } catch (err: any) {
      setError('Failed to load your images')
    } finally {
      setImagesLoading(false)
    }
  }

  const toggleImageSelection = (imageId: number) => {
    setSelectedImages(prev => 
      prev.includes(imageId) 
        ? prev.filter(id => id !== imageId)
        : [...prev, imageId]
    )
  }

  const selectAllImages = () => {
    setSelectedImages(images.map(img => img.id))
  }

  const clearSelection = () => {
    setSelectedImages([])
  }

  const onSubmit = async (data: AlbumForm) => {
    setLoading(true)
    setError('')
    
    try {
      const response = await axios.post('http://localhost:8000/api/v1/albums/', {
        ...data,
        image_ids: selectedImages
      })
      navigate(`/albums/${response.data.id}`)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create album')
    } finally {
      setLoading(false)
    }
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create New Album</h1>
        <p className="text-gray-600 dark:text-gray-300">Organize your images into a collection</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {error && (
          <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
            <div className="text-sm text-red-700 dark:text-red-300">{error}</div>
          </div>
        )}

        {/* Album Details */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Album Details</h2>
          
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Album Title *
              </label>
              <input
                {...register('title', { 
                  required: 'Album title is required',
                  maxLength: { value: 255, message: 'Title cannot exceed 255 characters' }
                })}
                type="text"
                className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Enter album title"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Description
              </label>
              <textarea
                {...register('description')}
                rows={3}
                className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Describe your album (optional)"
              />
            </div>

            <div>
              <label htmlFor="privacy" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Privacy
              </label>
              <select
                {...register('privacy')}
                className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="public">Public - Anyone can view</option>
                <option value="unlisted">Unlisted - Only those with the link can view</option>
                <option value="private">Private - Only you can view</option>
              </select>
            </div>
          </div>
        </div>

        {/* Image Selection */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">
              Select Images ({selectedImages.length} selected)
            </h2>
            {images.length > 0 && (
              <div className="space-x-2">
                <button
                  type="button"
                  onClick={selectAllImages}
                  className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={clearSelection}
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  Clear All
                </button>
              </div>
            )}
          </div>

          {imagesLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : images.length === 0 ? (
            <div className="text-center py-8">
              <PhotoIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No images found</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Upload some images first to create an album.
              </p>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => navigate('/upload')}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                  Upload Images
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {images.map((image) => (
                <div
                  key={image.id}
                  className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                    selectedImages.includes(image.id)
                      ? 'border-indigo-500 ring-2 ring-indigo-200 dark:ring-indigo-800'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                  onClick={() => toggleImageSelection(image.id)}
                >
                  <LazyImage
                    src={image.url}
                    thumbnailSrc={image.thumbnail_url}
                    alt={image.title || 'User image'}
                    aspectRatio="square"
                    className="w-full h-full"
                    loading="lazy"
                  />
                  
                  {/* Selection indicator */}
                  <div className={`absolute top-2 right-2 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    selectedImages.includes(image.id)
                      ? 'bg-indigo-500 border-indigo-500'
                      : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600'
                  }`}>
                    {selectedImages.includes(image.id) && (
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>

                  {/* Overlay */}
                  {selectedImages.includes(image.id) && (
                    <div className="absolute inset-0 bg-indigo-500 bg-opacity-20"></div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-between">
          <button
            type="button"
            onClick={() => navigate('/albums')}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={loading || !images.length}
            className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed dark:focus:ring-offset-gray-800"
          >
            {loading ? 'Creating...' : 'Create Album'}
          </button>
        </div>
      </form>
    </div>
  )
}