import { useState, useEffect } from 'react'

interface CacheEntry {
  url: string
  timestamp: number
  blob?: Blob
}

class ImageCache {
  private cache = new Map<string, CacheEntry>()
  private readonly maxSize = 100 // Maximum number of cached images
  private readonly maxAge = 30 * 60 * 1000 // 30 minutes in milliseconds

  async get(url: string): Promise<string | null> {
    const entry = this.cache.get(url)
    
    if (!entry) {
      return null
    }

    // Check if entry is expired
    if (Date.now() - entry.timestamp > this.maxAge) {
      this.cache.delete(url)
      return null
    }

    if (entry.blob) {
      return URL.createObjectURL(entry.blob)
    }

    return entry.url
  }

  async set(url: string, blob?: Blob): Promise<void> {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value
      if (oldestKey) {
        this.cache.delete(oldestKey)
      }
    }

    this.cache.set(url, {
      url,
      timestamp: Date.now(),
      blob
    })
  }

  clear(): void {
    this.cache.clear()
  }

  size(): number {
    return this.cache.size
  }
}

const imageCache = new ImageCache()

export function useImageCache(url: string) {
  const [cachedUrl, setCachedUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const loadImage = async () => {
      try {
        setLoading(true)
        setError(null)

        // Check cache first
        const cached = await imageCache.get(url)
        if (cached && isMounted) {
          setCachedUrl(cached)
          setLoading(false)
          return
        }

        // Fetch image if not in cache
        const response = await fetch(url)
        if (!response.ok) {
          throw new Error(`Failed to load image: ${response.status}`)
        }

        const blob = await response.blob()
        const objectUrl = URL.createObjectURL(blob)
        
        if (isMounted) {
          setCachedUrl(objectUrl)
          await imageCache.set(url, blob)
          setLoading(false)
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Unknown error')
          setLoading(false)
        }
      }
    }

    loadImage()

    return () => {
      isMounted = false
    }
  }, [url])

  return { cachedUrl, loading, error }
}

export { imageCache }