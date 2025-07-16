import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { PhotoIcon, TagIcon } from '@heroicons/react/24/outline'
import { apiService } from '../services/api'
import LazyImage from '../components/LazyImage'
import TagList from '../components/tags/TagList'
import { useInfiniteScroll } from '../hooks/useInfiniteScroll'

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

interface TagInfo {
  name: string
  slug: string
  usage_count: number
}

export default function TagPage() {
  const { tagSlug } = useParams<{ tagSlug: string }>()
  const [images, setImages] = useState<Image[]>([])
  const [tagInfo, setTagInfo] = useState<TagInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(0)
  const limit = 20

  const loadImages = async (pageNum: number = 0) => {
    try {
      setLoading(true)
      setError(null)
      
      const data = await apiService.get<{
        tag: TagInfo;
        images: Image[];
        total: number;
      }>(`/api/v1/tags/by-slug/${tagSlug}/images`, {
        params: {
          skip: pageNum * limit,
          limit: limit
        }
      })
      
      if (pageNum === 0) {
        setImages(data.images)
        setTagInfo(data.tag)
      } else {
        setImages(prev => [...prev, ...data.images])
      }
      
      setHasMore(data.images.length === limit)
      setPage(pageNum)
    } catch (err: any) {
      console.error('Error loading tag images:', err)
      if (err.response?.status === 404) {
        setError('Tag not found')
      } else {
        setError('Failed to load images')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (tagSlug) {
      loadImages(0)
    }
  }, [tagSlug])

  const loadMore = () => {
    if (!loading && hasMore) {
      loadImages(page + 1)
    }
  }

  // Use infinite scroll hook
  useInfiniteScroll({
    loading,
    hasMore,
    onLoadMore: loadMore,
    threshold: 100
  })

  if (loading && images.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <TagIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
            {error}
          </h3>
          <div className="mt-6">
            <Link
              to="/"
              className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              Go back home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <div className="h-16 w-16 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
                <TagIcon className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                #{tagInfo?.name}
              </h1>
              <p className="text-gray-500 dark:text-gray-400">
                {tagInfo?.usage_count} {tagInfo?.usage_count === 1 ? 'image' : 'images'} tagged
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Images Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {images.length === 0 ? (
          <div className="text-center py-12">
            <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
              No images found
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              No images have been tagged with #{tagInfo?.name} yet.
            </p>
          </div>
        ) : (
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
                    alt={image.title || 'Tagged image'}
                    aspectRatio="square"
                    className="group-hover:scale-105 transition-transform duration-200"
                  />
                  <div className="p-4">
                    {image.title && (
                      <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate mb-2">
                        {image.title}
                      </h3>
                    )}
                    
                    {/* Show other tags */}
                    {image.tags && image.tags.length > 1 && (
                      <div className="mb-2">
                        <TagList 
                          tags={image.tags.filter(t => t !== tagInfo?.name).slice(0, 2)} 
                          size="sm"
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

            {/* Loading indicator */}
            {loading && images.length > 0 && (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            )}

            {/* End of results */}
            {!loading && !hasMore && images.length > 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-gray-500">
                  You've seen all images with this tag! 🏷️
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}