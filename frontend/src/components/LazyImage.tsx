import { useState, useEffect, useRef } from 'react'
import { PhotoIcon } from '@heroicons/react/24/outline'

interface LazyImageProps {
  src: string
  thumbnailSrc?: string
  alt: string
  className?: string
  onLoad?: () => void
  onError?: () => void
  loading?: 'lazy' | 'eager'
  aspectRatio?: 'square' | 'auto'
}

export default function LazyImage({
  src,
  thumbnailSrc,
  alt,
  className = '',
  onLoad,
  onError,
  loading = 'lazy',
  aspectRatio = 'auto'
}: LazyImageProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [thumbnailLoaded, setThumbnailLoaded] = useState(false)
  const [error, setError] = useState(false)
  const [inView, setInView] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (loading === 'eager') {
      setInView(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.disconnect()
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
      }
    )

    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => observer.disconnect()
  }, [loading])

  const handleImageLoad = () => {
    setImageLoaded(true)
    onLoad?.()
  }

  const handleImageError = () => {
    setError(true)
    onError?.()
  }

  const handleThumbnailLoad = () => {
    setThumbnailLoaded(true)
  }

  const containerClasses = `
    relative overflow-hidden bg-gray-100
    ${aspectRatio === 'square' ? 'aspect-square' : ''}
    ${className}
  `

  const imageClasses = `
    w-full h-full object-cover transition-opacity duration-300
    ${imageLoaded ? 'opacity-100' : 'opacity-0'}
  `

  const thumbnailClasses = `
    absolute inset-0 w-full h-full object-cover transition-opacity duration-300
    ${thumbnailLoaded && !imageLoaded ? 'opacity-100' : 'opacity-0'}
    filter blur-sm scale-105
  `

  const placeholderClasses = `
    absolute inset-0 flex items-center justify-center bg-gray-100
    ${thumbnailLoaded || imageLoaded ? 'opacity-0' : 'opacity-100'}
    transition-opacity duration-300
  `

  if (error) {
    return (
      <div ref={containerRef} className={containerClasses}>
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center text-gray-400">
            <PhotoIcon className="mx-auto h-8 w-8 mb-2" />
            <p className="text-sm">Failed to load image</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className={containerClasses}>
      {/* Placeholder */}
      <div className={placeholderClasses}>
        <div className="text-center text-gray-400">
          <PhotoIcon className="mx-auto h-8 w-8 mb-2" />
          <div className="animate-pulse">
            <div className="h-2 bg-gray-200 rounded w-16 mx-auto"></div>
          </div>
        </div>
      </div>

      {/* Thumbnail (low quality preview) */}
      {inView && thumbnailSrc && (
        <img
          src={thumbnailSrc}
          alt={alt}
          className={thumbnailClasses}
          onLoad={handleThumbnailLoad}
          onError={() => {}} // Ignore thumbnail errors
        />
      )}

      {/* Full quality image */}
      {inView && (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          className={imageClasses}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      )}

      {/* Loading overlay */}
      {inView && !imageLoaded && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div>
        </div>
      )}
    </div>
  )
}