import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PhotoIcon, ArrowUpTrayIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import axios from 'axios'
import LazyImage from '../components/LazyImage'
import { useInfiniteScroll } from '../hooks/useInfiniteScroll'
import { useAuthStore } from '../store/authStore'
import TagList from '../components/tags/TagList'
import PopularTags from '../components/tags/PopularTags'

interface Image {
  id: number
  title?: string
  description?: string
  url: string
  thumbnail_url?: string
  views: number
  like_count: number
  owner_id: number
  created_at: string
  tags: string[]
}

export default function HomePage() {
  const { isAuthenticated } = useAuthStore()
  
  const fetchImages = async (skip: number, limit: number): Promise<Image[]> => {
    const response = await axios.get(`/api/v1/images/?skip=${skip}&limit=${limit}`)
    return response.data
  }

  const {
    data: images,
    loading,
    error,
    hasMore,
    loadMore,
    refresh
  } = useInfiniteScroll({
    fetchFunction: fetchImages,
    limit: 20
  })

  if (loading && images.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
      </div>
    )
  }

  if (error && images.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Unable to load images</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {error || 'Something went wrong. Please try refreshing the page.'}
        </p>
        <div className="mt-6">
          <button
            onClick={refresh}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
          >
            <ArrowPathIcon className="-ml-1 mr-2 h-5 w-5" />
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Hero Section - Only show for non-authenticated users */}
      {!isAuthenticated && (
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
            <div className="text-center">
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
                Share Your Images
              </h1>
              <p className="text-xl text-indigo-100 mb-8 max-w-3xl mx-auto">
                Upload, share, and discover amazing images with our modern, fast, and secure platform.
              </p>
              <div className="flex justify-center space-x-4">
                <Link
                  to="/upload"
                  className="bg-white text-indigo-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition duration-200 flex items-center space-x-2"
                >
                  <ArrowUpTrayIcon className="h-5 w-5" />
                  <span>Start Uploading</span>
                </Link>
                <Link
                  to="/register"
                  className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-indigo-600 transition duration-200"
                >
                  Sign Up Free
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 ${isAuthenticated ? 'pt-8' : ''}`}>
        {images.length === 0 ? (
          // When no images, center the upload element across full width
          <div className="text-center py-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
              {isAuthenticated ? 'Community Images' : 'Recent Uploads'}
            </h2>
            <PhotoIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No images yet</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Be the first to upload an image and share it with the world!
            </p>
            <div className="mt-6">
              <Link
                to="/upload"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
              >
                <ArrowUpTrayIcon className="-ml-1 mr-2 h-5 w-5" />
                Upload Image
              </Link>
            </div>
          </div>
        ) : (
          // When images exist, use grid layout with sidebar
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Images Section - Takes up 3 columns on large screens */}
            <div className="lg:col-span-3">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
                {isAuthenticated ? 'Community Images' : 'Recent Uploads'}
              </h2>
          <div>
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
                  <div className="p-4">
                    {image.title && (
                      <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate mb-2">
                        {image.title}
                      </h3>
                    )}
                    
                    {/* Tags */}
                    {image.tags && image.tags.length > 0 && (
                      <div className="mb-2">
                        <TagList 
                          tags={image.tags.slice(0, 3)} 
                          size="sm" 
                          linkable={false}
                          className="line-clamp-1"
                        />
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                      <span>{image.views} views</span>
                      <span>{image.like_count} likes</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Loading indicator for infinite scroll */}
            {loading && images.length > 0 && (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
              </div>
            )}

            {/* Load more button (fallback for infinite scroll) */}
            {!loading && hasMore && images.length > 0 && (
              <div className="text-center py-8">
                <button
                  onClick={loadMore}
                  className="inline-flex items-center px-6 py-3 border border-gray-300 dark:border-gray-600 shadow-sm text-base font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Load More Images
                </button>
              </div>
            )}

            {/* End of results */}
            {!loading && !hasMore && images.length > 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-gray-500">You've reached the end! 🎉</p>
              </div>
            )}

            {/* Error message during infinite scroll */}
            {error && images.length > 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-red-600 mb-4">{error}</p>
                <button
                  onClick={loadMore}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                >
                  <ArrowPathIcon className="-ml-1 mr-2 h-4 w-4" />
                  Retry
                </button>
                </div>
              )}
            </div>
            </div>

            {/* Sidebar - Takes up 1 column on large screens */}
            <div className="lg:col-span-1">
              {/* Popular Tags */}
              <PopularTags limit={20} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}