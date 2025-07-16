import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { PhotoIcon, ArrowLeftIcon } from '@heroicons/react/24/outline'
import { useAuthStore } from '../store/authStore'
import LazyImage from '../components/LazyImage'
import axios from 'axios'

interface ImageForm {
  title: string
  description: string
  privacy: 'public' | 'private' | 'unlisted'
  is_nsfw: boolean
}

interface Image {
  id: number
  title?: string
  description?: string
  privacy: 'public' | 'private' | 'unlisted'
  is_nsfw: boolean
  url: string
  thumbnail_url?: string
  owner_id: number
  created_at: string
}

export default function EditImagePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [image, setImage] = useState<Image | null>(null)
  const [imageLoading, setImageLoading] = useState(true)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ImageForm>()

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    if (id) {
      fetchImage()
    }
  }, [isAuthenticated, navigate, id])

  const fetchImage = async () => {
    try {
      const response = await axios.get(`/api/v1/images/${id}`)
      const imageData = response.data
      setImage(imageData)
      
      // Check if user owns this image
      if (user && imageData.owner_id !== user.id) {
        navigate(`/image/${id}`)
        return
      }
      
      // Set form defaults
      reset({
        title: imageData.title || '',
        description: imageData.description || '',
        privacy: imageData.privacy,
        is_nsfw: imageData.is_nsfw || false,
      })
    } catch (err: any) {
      setError('Failed to load image')
      setTimeout(() => navigate('/dashboard'), 2000)
    } finally {
      setImageLoading(false)
    }
  }

  const onSubmit = async (data: ImageForm) => {
    if (!image) return
    
    setLoading(true)
    setError('')
    
    try {
      await axios.put(`/api/v1/images/${image.id}`, data)
      navigate(`/image/${image.id}`)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update image')
    } finally {
      setLoading(false)
    }
  }

  const deleteImage = async () => {
    if (!image || !confirm('Are you sure you want to delete this image? This action cannot be undone.')) {
      return
    }

    try {
      await axios.delete(`/api/v1/images/${image.id}`)
      navigate('/dashboard')
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to delete image')
    }
  }

  if (!isAuthenticated) {
    return null
  }

  if (imageLoading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
      </div>
    )
  }

  if (error && !image) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">Error loading image</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{error}</p>
      </div>
    )
  }

  if (!image) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">Image not found</h3>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <button
          onClick={() => navigate(`/image/${image.id}`)}
          className="inline-flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 mb-4"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Image
        </button>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Edit Image</h1>
        <p className="text-gray-600 dark:text-gray-400">Update your image details and privacy settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Image Preview */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Current Image</h2>
          <div className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
            <LazyImage
              src={image.url}
              thumbnailSrc={image.thumbnail_url}
              alt={image.title || 'Image'}
              className="w-full h-full object-contain"
            />
          </div>
        </div>

        {/* Edit Form */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Image Details</h2>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}

            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Title
              </label>
              <input
                {...register('title', { 
                  maxLength: { value: 255, message: 'Title cannot exceed 255 characters' }
                })}
                type="text"
                className="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Enter image title"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Description
              </label>
              <textarea
                {...register('description')}
                rows={3}
                className="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Describe your image (optional)"
              />
            </div>

            <div>
              <label htmlFor="privacy" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Privacy Setting
              </label>
              <div className="space-y-3">
                <label className={`relative flex cursor-pointer rounded-lg border dark:border-gray-600 p-4 focus:outline-none`}>
                  <input
                    {...register('privacy')}
                    type="radio"
                    value="public"
                    className="sr-only"
                  />
                  <div className="flex flex-col">
                    <span className="block text-sm font-medium text-gray-900 dark:text-white">Public</span>
                    <span className="mt-1 flex items-center text-xs text-gray-500 dark:text-gray-400">
                      Anyone can view and find in galleries
                    </span>
                  </div>
                </label>

                <label className={`relative flex cursor-pointer rounded-lg border dark:border-gray-600 p-4 focus:outline-none`}>
                  <input
                    {...register('privacy')}
                    type="radio"
                    value="unlisted"
                    className="sr-only"
                  />
                  <div className="flex flex-col">
                    <span className="block text-sm font-medium text-gray-900 dark:text-white">Unlisted</span>
                    <span className="mt-1 flex items-center text-xs text-gray-500 dark:text-gray-400">
                      Only accessible via direct link
                    </span>
                  </div>
                </label>

                <label className={`relative flex cursor-pointer rounded-lg border dark:border-gray-600 p-4 focus:outline-none`}>
                  <input
                    {...register('privacy')}
                    type="radio"
                    value="private"
                    className="sr-only"
                  />
                  <div className="flex flex-col">
                    <span className="block text-sm font-medium text-gray-900 dark:text-white">Private</span>
                    <span className="mt-1 flex items-center text-xs text-gray-500 dark:text-gray-400">
                      Only you can view this image
                    </span>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex items-center">
              <input
                {...register('is_nsfw')}
                type="checkbox"
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="is_nsfw" className="ml-2 block text-sm text-gray-900 dark:text-white">
                Mark as NSFW (Not Safe For Work)
              </label>
            </div>

            <div className="flex justify-between pt-6">
              <button
                type="button"
                onClick={deleteImage}
                className="px-4 py-2 border border-red-300 dark:border-red-700 rounded-md shadow-sm text-sm font-medium text-red-700 dark:text-red-400 bg-white dark:bg-gray-700 hover:bg-red-50 dark:hover:bg-red-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Delete Image
              </button>
              
              <div className="space-x-3">
                <button
                  type="button"
                  onClick={() => navigate(`/image/${image.id}`)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}