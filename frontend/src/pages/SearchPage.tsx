import { useState, useEffect, useRef } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { MagnifyingGlassIcon, FunnelIcon, PhotoIcon } from '@heroicons/react/24/outline'
import axios from 'axios'
import LazyImage from '../components/LazyImage'
import { useInfiniteScroll } from '../hooks/useInfiniteScroll'

interface Image {
  id: number
  title?: string
  description?: string
  url: string
  thumbnail_url?: string
  views: number
  like_count: number
  created_at: string
}

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '')
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'created_at')
  const [order, setOrder] = useState(searchParams.get('order') || 'desc')
  const [showFilters, setShowFilters] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedSuggestion, setSelectedSuggestion] = useState(-1)
  const searchInputRef = useRef<HTMLInputElement>(null)
  
  // Advanced filter states
  const [fileType, setFileType] = useState(searchParams.get('file_type') || '')
  const [isNsfw, setIsNsfw] = useState(searchParams.get('is_nsfw') || '')
  const [minViews, setMinViews] = useState(searchParams.get('min_views') || '')
  const [maxViews, setMaxViews] = useState(searchParams.get('max_views') || '')
  const [minLikes, setMinLikes] = useState(searchParams.get('min_likes') || '')
  const [maxLikes, setMaxLikes] = useState(searchParams.get('max_likes') || '')
  const [dateFrom, setDateFrom] = useState(searchParams.get('date_from') || '')
  const [dateTo, setDateTo] = useState(searchParams.get('date_to') || '')
  const [minWidth, setMinWidth] = useState(searchParams.get('min_width') || '')
  const [minHeight, setMinHeight] = useState(searchParams.get('min_height') || '')
  const [aspectRatio, setAspectRatio] = useState(searchParams.get('aspect_ratio') || '')

  const fetchSearchResults = async (skip: number, limit: number): Promise<Image[]> => {
    const params = new URLSearchParams({
      skip: skip.toString(),
      limit: limit.toString(),
      sort_by: sortBy,
      order: order,
    })

    if (searchTerm) params.append('search', searchTerm)
    if (fileType) params.append('file_type', fileType)
    if (isNsfw) params.append('is_nsfw', isNsfw)
    if (minViews) params.append('min_views', minViews)
    if (maxViews) params.append('max_views', maxViews)
    if (minLikes) params.append('min_likes', minLikes)
    if (maxLikes) params.append('max_likes', maxLikes)
    if (dateFrom) params.append('date_from', dateFrom)
    if (dateTo) params.append('date_to', dateTo)
    if (minWidth) params.append('min_width', minWidth)
    if (minHeight) params.append('min_height', minHeight)
    if (aspectRatio) params.append('aspect_ratio', aspectRatio)

    const response = await axios.get(`/api/v1/images/?${params}`)
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
    fetchFunction: fetchSearchResults,
    limit: 20
  })

  useEffect(() => {
    const params = new URLSearchParams()
    if (searchTerm) params.set('q', searchTerm)
    if (sortBy !== 'created_at') params.set('sort', sortBy)
    if (order !== 'desc') params.set('order', order)
    if (fileType) params.set('file_type', fileType)
    if (isNsfw) params.set('is_nsfw', isNsfw)
    if (minViews) params.set('min_views', minViews)
    if (maxViews) params.set('max_views', maxViews)
    if (minLikes) params.set('min_likes', minLikes)
    if (maxLikes) params.set('max_likes', maxLikes)
    if (dateFrom) params.set('date_from', dateFrom)
    if (dateTo) params.set('date_to', dateTo)
    if (minWidth) params.set('min_width', minWidth)
    if (minHeight) params.set('min_height', minHeight)
    if (aspectRatio) params.set('aspect_ratio', aspectRatio)
    
    setSearchParams(params)
  }, [searchTerm, sortBy, order, fileType, isNsfw, minViews, maxViews, minLikes, maxLikes, dateFrom, dateTo, minWidth, minHeight, aspectRatio, setSearchParams])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    refresh()
  }

  const handleSortChange = (newSortBy: string, newOrder: string) => {
    setSortBy(newSortBy)
    setOrder(newOrder)
  }

  // Fetch search suggestions
  const fetchSuggestions = async (query: string) => {
    if (query.length < 2) {
      setSuggestions([])
      return
    }

    try {
      const response = await axios.get(`/api/v1/search/suggestions?q=${encodeURIComponent(query)}`)
      setSuggestions(response.data)
    } catch (error) {
      console.error('Error fetching suggestions:', error)
      setSuggestions([])
    }
  }

  // Handle search input changes with debouncing
  const handleSearchTermChange = (value: string) => {
    setSearchTerm(value)
    setSelectedSuggestion(-1)
    
    // Debounce suggestions
    const timeoutId = setTimeout(() => {
      fetchSuggestions(value)
    }, 300)

    return () => clearTimeout(timeoutId)
  }

  // Handle keyboard navigation in suggestions
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedSuggestion(prev => Math.min(prev + 1, suggestions.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedSuggestion(prev => Math.max(prev - 1, -1))
        break
      case 'Enter':
        e.preventDefault()
        if (selectedSuggestion >= 0) {
          setSearchTerm(suggestions[selectedSuggestion])
          setShowSuggestions(false)
        }
        handleSearch(e)
        break
      case 'Escape':
        setShowSuggestions(false)
        setSelectedSuggestion(-1)
        break
    }
  }

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    setSearchTerm(suggestion)
    setShowSuggestions(false)
    setSelectedSuggestion(-1)
    refresh()
  }

  // Show suggestions when input is focused
  const handleSearchFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true)
    }
  }

  // Hide suggestions when clicking outside
  const handleSearchBlur = () => {
    // Small delay to allow suggestion clicks
    setTimeout(() => {
      setShowSuggestions(false)
      setSelectedSuggestion(-1)
    }, 200)
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Search Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Search Images</h1>
        
        {/* Search Form */}
        <form onSubmit={handleSearch} className="flex gap-4 mb-4">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => handleSearchTermChange(e.target.value)}
              onFocus={handleSearchFocus}
              onBlur={handleSearchBlur}
              onKeyDown={handleKeyDown}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Search for images..."
            />
            
            {/* Search Suggestions */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className={`px-4 py-2 text-sm cursor-pointer ${
                      index === selectedSuggestion
                        ? 'bg-indigo-500 text-white'
                        : 'text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-600'
                    }`}
                  >
                    {suggestion}
                  </div>
                ))}
              </div>
            )}
          </div>
          <button
            type="submit"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Search
          </button>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <FunnelIcon className="h-4 w-4 mr-2" />
            Filters
          </button>
        </form>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Sorting Options */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sort by
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md"
                >
                  <option value="created_at">Upload Date</option>
                  <option value="views">View Count</option>
                  <option value="like_count">Like Count</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Order
                </label>
                <select
                  value={order}
                  onChange={(e) => setOrder(e.target.value)}
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md"
                >
                  <option value="desc">Highest to Lowest</option>
                  <option value="asc">Lowest to Highest</option>
                </select>
              </div>
              
              {/* File Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  File Type
                </label>
                <select
                  value={fileType}
                  onChange={(e) => setFileType(e.target.value)}
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md"
                >
                  <option value="">All Types</option>
                  <option value="image/jpeg">JPEG</option>
                  <option value="image/png">PNG</option>
                  <option value="image/gif">GIF</option>
                  <option value="image/webp">WebP</option>
                </select>
              </div>
              
              {/* NSFW Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Content Filter
                </label>
                <select
                  value={isNsfw}
                  onChange={(e) => setIsNsfw(e.target.value)}
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md"
                >
                  <option value="">All Content</option>
                  <option value="false">Safe for Work</option>
                  <option value="true">NSFW Only</option>
                </select>
              </div>
              
              {/* Aspect Ratio Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Aspect Ratio
                </label>
                <select
                  value={aspectRatio}
                  onChange={(e) => setAspectRatio(e.target.value)}
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md"
                >
                  <option value="">Any Ratio</option>
                  <option value="square">Square</option>
                  <option value="landscape">Landscape</option>
                  <option value="portrait">Portrait</option>
                </select>
              </div>
              
              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  From Date
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="block w-full pl-3 pr-3 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  To Date
                </label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="block w-full pl-3 pr-3 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md"
                />
              </div>
              
              {/* Views Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Min Views
                </label>
                <input
                  type="number"
                  value={minViews}
                  onChange={(e) => setMinViews(e.target.value)}
                  placeholder="0"
                  className="block w-full pl-3 pr-3 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Max Views
                </label>
                <input
                  type="number"
                  value={maxViews}
                  onChange={(e) => setMaxViews(e.target.value)}
                  placeholder="No limit"
                  className="block w-full pl-3 pr-3 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md"
                />
              </div>
              
              {/* Likes Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Min Likes
                </label>
                <input
                  type="number"
                  value={minLikes}
                  onChange={(e) => setMinLikes(e.target.value)}
                  placeholder="0"
                  className="block w-full pl-3 pr-3 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Max Likes
                </label>
                <input
                  type="number"
                  value={maxLikes}
                  onChange={(e) => setMaxLikes(e.target.value)}
                  placeholder="No limit"
                  className="block w-full pl-3 pr-3 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md"
                />
              </div>
              
              {/* Dimension Filters */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Min Width (px)
                </label>
                <input
                  type="number"
                  value={minWidth}
                  onChange={(e) => setMinWidth(e.target.value)}
                  placeholder="0"
                  className="block w-full pl-3 pr-3 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Min Height (px)
                </label>
                <input
                  type="number"
                  value={minHeight}
                  onChange={(e) => setMinHeight(e.target.value)}
                  placeholder="0"
                  className="block w-full pl-3 pr-3 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md"
                />
              </div>
            </div>
            
            {/* Filter Actions */}
            <div className="mt-4 flex justify-end space-x-2">
              <button
                onClick={() => {
                  setFileType('')
                  setIsNsfw('')
                  setMinViews('')
                  setMaxViews('')
                  setMinLikes('')
                  setMaxLikes('')
                  setDateFrom('')
                  setDateTo('')
                  setMinWidth('')
                  setMinHeight('')
                  setAspectRatio('')
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Clear Filters
              </button>
              <button
                onClick={() => refresh()}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}

        {/* Search Results Summary */}
        {searchTerm && !loading && (
          <div className="mb-4">
            <p className="text-gray-600 dark:text-gray-400">
              {images.length > 0 
                ? `Showing results for "${searchTerm}" (${images.length}${hasMore ? '+' : ''} images)`
                : `No results found for "${searchTerm}"`
              }
            </p>
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && images.length === 0 && (
        <div className="flex justify-center items-center min-h-96">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
        </div>
      )}

      {/* Error State */}
      {error && images.length === 0 && (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Search Error</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={refresh}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Results Grid */}
      {images.length > 0 && (
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
                alt={image.title || 'Search result'}
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

      {/* No Results */}
      {!loading && images.length === 0 && searchTerm && (
        <div className="text-center py-12">
          <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No images found</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Try adjusting your search terms or removing filters.
          </p>
        </div>
      )}

      {/* Default State */}
      {!loading && images.length === 0 && !searchTerm && (
        <div className="text-center py-12">
          <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Start searching</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Enter a search term to find images by title or description.
          </p>
        </div>
      )}

      {/* Loading More */}
      {loading && images.length > 0 && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      )}

      {/* Load More Button */}
      {!loading && hasMore && images.length > 0 && (
        <div className="text-center py-8">
          <button
            onClick={loadMore}
            className="inline-flex items-center px-6 py-3 border border-gray-300 dark:border-gray-600 shadow-sm text-base font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Load More Results
          </button>
        </div>
      )}

      {/* End of Results */}
      {!loading && !hasMore && images.length > 0 && (
        <div className="text-center py-8">
          <p className="text-sm text-gray-500 dark:text-gray-400">You've reached the end of the results! 🎉</p>
        </div>
      )}
    </div>
  )
}