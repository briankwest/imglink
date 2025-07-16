import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { EyeIcon, CalendarIcon, UserIcon, LockClosedIcon, EyeSlashIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
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
  owner_id: number
  created_at: string
  images: Array<{
    id: number
    title?: string
    url: string
    thumbnail_url?: string
    views: number
    like_count: number
    created_at: string
  }>
}

interface Owner {
  id: number
  username: string
  avatar_url?: string
}

export default function AlbumDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuthStore()
  const [album, setAlbum] = useState<Album | null>(null)
  const [owner, setOwner] = useState<Owner | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (id) {
      fetchAlbum()
    }
  }, [id])

  const fetchAlbum = async () => {
    try {
      const response = await axios.get(`/api/v1/albums/${id}`)
      setAlbum(response.data)

      // Fetch owner info
      const ownerResponse = await axios.get(`/api/v1/users/${response.data.owner_id}`)
      setOwner(ownerResponse.data)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load album')
    } finally {
      setLoading(false)
    }
  }

  const deleteAlbum = async () => {
    if (!album || !confirm('Are you sure you want to delete this album? This action cannot be undone.')) {
      return
    }

    try {
      await axios.delete(`/api/v1/albums/${album.id}`)
      navigate('/albums')
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to delete album')
    }
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const isOwner = user && album && user.id === album.owner_id

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (error || !album) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <h3 className="text-lg font-medium text-gray-900">Album not found</h3>
        <p className="mt-1 text-sm text-gray-500">{error || 'The album you\'re looking for doesn\'t exist.'}</p>
        <div className="mt-6">
          <Link
            to="/albums"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Browse Albums
          </Link>
        </div>
      </div>
    )
  }

  const privacyInfo = getPrivacyInfo(album.privacy)
  const PrivacyIcon = privacyInfo.icon

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Album Header */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">{album.title}</h1>
              <div className={`flex items-center space-x-1 ${privacyInfo.color}`}>
                <PrivacyIcon className="h-5 w-5" />
                <span className="text-sm font-medium">{privacyInfo.text}</span>
              </div>
            </div>
            
            {album.description && (
              <p className="text-gray-600 mb-4">{album.description}</p>
            )}

            {/* Owner Info */}
            {owner && (
              <div className="flex items-center space-x-3 mb-4 p-3 bg-gray-50 rounded-lg">
                <img
                  src={owner.avatar_url || `https://ui-avatars.com/api/?name=${owner.username}&background=6366f1&color=fff`}
                  alt={owner.username}
                  className="h-10 w-10 rounded-full"
                />
                <div>
                  <Link
                    to={`/user/${owner.username}`}
                    className="font-medium text-gray-900 hover:text-indigo-600"
                  >
                    {owner.username}
                  </Link>
                  <p className="text-sm text-gray-500">Album creator</p>
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{album.image_count}</div>
                <div className="text-sm text-gray-500">Images</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{album.views}</div>
                <div className="text-sm text-gray-500">Views</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {album.images.reduce((total, img) => total + img.like_count, 0)}
                </div>
                <div className="text-sm text-gray-500">Total Likes</div>
              </div>
            </div>

            <div className="flex items-center space-x-1 text-sm text-gray-500">
              <CalendarIcon className="h-4 w-4" />
              <span>Created {formatDate(album.created_at)}</span>
            </div>
          </div>

          {/* Actions */}
          {isOwner && (
            <div className="flex space-x-2">
              <Link
                to={`/albums/${album.id}/edit`}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <PencilIcon className="h-4 w-4 mr-1" />
                Edit
              </Link>
              <button
                onClick={deleteAlbum}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <TrashIcon className="h-4 w-4 mr-1" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Images Grid */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Images in this album
        </h2>

        {album.images.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <div className="text-center text-gray-400">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No images in this album</h3>
              <p className="mt-1 text-sm text-gray-500">
                This album is empty.
              </p>
              {isOwner && (
                <div className="mt-6">
                  <Link
                    to={`/albums/${album.id}/edit`}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    Add Images
                  </Link>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {album.images.map((image) => (
              <Link
                key={image.id}
                to={`/image/${image.id}`}
                className="group relative bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200"
              >
                <LazyImage
                  src={image.url}
                  thumbnailSrc={image.thumbnail_url}
                  alt={image.title || 'Album image'}
                  aspectRatio="square"
                  className="group-hover:scale-105 transition-transform duration-200"
                />
                {image.title && (
                  <div className="p-4">
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {image.title}
                    </h3>
                    <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
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