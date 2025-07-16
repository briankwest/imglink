import { useState, useEffect, useCallback } from 'react'

interface UseInfiniteScrollProps<T> {
  fetchFunction: (page: number, limit: number) => Promise<T[]>
  limit?: number
  enabled?: boolean
}

interface UseInfiniteScrollReturn<T> {
  data: T[]
  loading: boolean
  error: string | null
  hasMore: boolean
  loadMore: () => void
  refresh: () => void
}

export function useInfiniteScroll<T>({
  fetchFunction,
  limit = 20,
  enabled = true
}: UseInfiniteScrollProps<T>): UseInfiniteScrollReturn<T> {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [initialLoad, setInitialLoad] = useState(false)

  const loadData = useCallback(async (pageNumber: number, reset = false) => {
    if (!enabled) return

    setLoading(true)
    setError(null)

    try {
      const newData = await fetchFunction(pageNumber - 1, limit) // Convert to 0-based indexing
      
      if (reset) {
        setData(newData)
      } else {
        setData(prev => {
          // Filter out duplicates based on ID
          const existingIds = new Set(prev.map((item: any) => item.id))
          const uniqueNewData = newData.filter((item: any) => !existingIds.has(item.id))
          return [...prev, ...uniqueNewData]
        })
      }
      
      // Check if we have more data
      setHasMore(newData.length === limit)
      
    } catch (err: any) {
      // Handle different error types gracefully
      if (!err.response) {
        // Network error or connection refused
        setError('Unable to connect. Please check your connection and try again.')
      } else if (err.response.status >= 500) {
        setError('Server temporarily unavailable. Please try again later.')
      } else if (err.response.status === 404) {
        setError('Content not found.')
      } else if (err.response.status === 401) {
        setError('Please log in to view this content.')
      } else {
        setError(err.response?.data?.detail || 'Unable to load content. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }, [fetchFunction, limit, enabled])

  const loadMore = useCallback(() => {
    if (!loading && hasMore && enabled) {
      const nextPage = page + 1
      setPage(nextPage)
      loadData(nextPage)
    }
  }, [loading, hasMore, page, loadData, enabled])

  const refresh = useCallback(() => {
    if (!enabled) return
    
    setPage(1)
    setHasMore(true)
    setData([])
    loadData(1, true)
  }, [loadData, enabled])

  // Initial load
  useEffect(() => {
    if (enabled && !initialLoad) {
      setInitialLoad(true)
      loadData(1, true)
    }
  }, [enabled, initialLoad, loadData])

  // Intersection Observer for automatic loading
  useEffect(() => {
    if (!enabled || !hasMore || loading) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore()
        }
      },
      {
        threshold: 0.1,
        rootMargin: '100px',
      }
    )

    // Create a sentinel element
    const sentinel = document.createElement('div')
    sentinel.id = 'infinite-scroll-sentinel'
    sentinel.style.height = '1px'
    document.body.appendChild(sentinel)
    observer.observe(sentinel)

    return () => {
      observer.disconnect()
      const existingSentinel = document.getElementById('infinite-scroll-sentinel')
      if (existingSentinel) {
        document.body.removeChild(existingSentinel)
      }
    }
  }, [loadMore, hasMore, loading, enabled])

  return {
    data,
    loading,
    error,
    hasMore,
    loadMore,
    refresh
  }
}