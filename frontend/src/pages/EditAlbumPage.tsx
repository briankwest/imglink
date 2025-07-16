import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
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

interface Album {
  id: number
  title: string
  description?: string
  privacy: 'public' | 'private' | 'unlisted'
  owner_id: number
  images: Image[]
}

export default function EditAlbumPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [album, setAlbum] = useState<Album | null>(null)
  const [images, setImages] = useState<Image[]>([])
  const [selectedImages, setSelectedImages] = useState<number[]>([])
  const [imagesLoading, setImagesLoading] = useState(true)
  const [albumLoading, setAlbumLoading] = useState(true)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
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
    if (id) {
      fetchAlbum()
      fetchUserImages()
    }
  }, [isAuthenticated, navigate, id])

  const fetchAlbum = async () => {
    try {
      const response = await axios.get(`/api/v1/albums/${id}`)
      const albumData = response.data
      
      // Check if user owns the album
      if (user && albumData.owner_id !== user.id) {
        setError('You can only edit your own albums')
        return
      }
      
      setAlbum(albumData)
      
      // Set form values
      setValue('title', albumData.title)
      setValue('description', albumData.description || '')
      setValue('privacy', albumData.privacy)
      
      // Set selected images
      setSelectedImages(albumData.images.map((img: Image) => img.id))
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load album')
    } finally {
      setAlbumLoading(false)
    }
  }

  const fetchUserImages = async () => {
    try {
      const response = await axios.get('/api/v1/images/me')
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
    if (!album) return
    
    setLoading(true)
    setError('')
    
    try {
      // Update album details
      await axios.put(`/api/v1/albums/${album.id}`, data)
      
      // Handle image changes
      const currentImageIds = album.images.map(img => img.id)
      const imagesToAdd = selectedImages.filter(id => !currentImageIds.includes(id))
      const imagesToRemove = currentImageIds.filter(id => !selectedImages.includes(id))
      
      // Add new images
      for (const imageId of imagesToAdd) {
        await axios.post(`/api/v1/albums/${album.id}/images/${imageId}`)
      }
      
      // Remove images
      for (const imageId of imagesToRemove) {
        await axios.delete(`/api/v1/albums/${album.id}/images/${imageId}`)
      }
      
      navigate(`/albums/${album.id}`)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update album')
    } finally {
      setLoading(false)
    }
  }

  if (!isAuthenticated) {
    return null
  }

  if (albumLoading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (error && !album) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <h3 className="text-lg font-medium text-gray-900">Unable to load album</h3>
        <p className="mt-1 text-sm text-gray-500">{error}</p>
        <div className="mt-6">
          <button
            onClick={() => navigate('/albums')}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Back to Albums
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Edit Album</h1>
        <p className="text-gray-600">Update your album details and images</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        {/* Album Details */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Album Details</h2>
          
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Album Title *
              </label>
              <input
                {...register('title', { 
                  required: 'Album title is required',
                  maxLength: { value: 255, message: 'Title cannot exceed 255 characters' }
                })}
                type="text"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Enter album title"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                {...register('description')}
                rows={3}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Describe your album (optional)"
              />
            </div>

            <div>
              <label htmlFor="privacy" className="block text-sm font-medium text-gray-700">
                Privacy
              </label>
              <select
                {...register('privacy')}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="public">Public - Anyone can view</option>
                <option value="unlisted">Unlisted - Only those with the link can view</option>
                <option value="private">Private - Only you can view</option>
              </select>
            </div>
          </div>
        </div>

        {/* Image Selection */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">
              Select Images ({selectedImages.length} selected)
            </h2>
            {images.length > 0 && (
              <div className="space-x-2">
                <button
                  type="button"
                  onClick={selectAllImages}
                  className="text-sm text-indigo-600 hover:text-indigo-800"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={clearSelection}
                  className="text-sm text-gray-600 hover:text-gray-800"
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
              <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No images found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Upload some images first to add to your album.
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
                      ? 'border-indigo-500 ring-2 ring-indigo-200'
                      : 'border-gray-200 hover:border-gray-300'
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
                      : 'bg-white border-gray-300'
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
            onClick={() => navigate(`/albums/${album?.id}`)}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Updating...' : 'Update Album'}
          </button>
        </div>
      </form>
    </div>
  )
}