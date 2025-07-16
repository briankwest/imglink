import os
from typing import Optional, Dict, List
from urllib.parse import urljoin
import hashlib
import time

from app.core.config import settings


class CDNService:
    """
    Service to simulate CDN functionality for image delivery optimization
    In production, this would integrate with actual CDN providers like CloudFlare, AWS CloudFront, etc.
    """
    
    def __init__(self):
        self.cdn_domains = getattr(settings, 'CDN_DOMAINS', [
            'cdn1.imglink.com',
            'cdn2.imglink.com', 
            'cdn3.imglink.com'
        ])
        self.use_cdn = getattr(settings, 'USE_CDN', False)
        self.cdn_cache_ttl = getattr(settings, 'CDN_CACHE_TTL', 86400)  # 24 hours
    
    def get_optimized_url(self, image_path: str, size: str = 'original') -> str:
        """
        Get optimized CDN URL for an image
        
        Args:
            image_path: Original image path
            size: Requested size (thumbnail, small, medium, large, original)
        
        Returns:
            Optimized CDN URL
        """
        if not self.use_cdn:
            return self._get_local_url(image_path, size)
        
        # Select CDN domain based on image hash for distribution
        image_hash = hashlib.md5(image_path.encode()).hexdigest()
        domain_index = int(image_hash, 16) % len(self.cdn_domains)
        cdn_domain = self.cdn_domains[domain_index]
        
        # Generate optimized path
        optimized_path = self._get_optimized_path(image_path, size)
        
        return f"https://{cdn_domain}/{optimized_path}"
    
    def _get_local_url(self, image_path: str, size: str) -> str:
        """Get local URL for development/testing"""
        if size == 'original':
            return f"/uploads/{image_path}"
        
        # For local development, return size-specific paths
        base_name, ext = os.path.splitext(image_path)
        return f"/uploads/{base_name}_{size}{ext}"
    
    def _get_optimized_path(self, image_path: str, size: str) -> str:
        """Generate optimized CDN path with cache-busting and size parameters"""
        base_name, ext = os.path.splitext(image_path)
        
        # Size transformations
        size_params = {
            'thumbnail': 'w_150,h_150,c_fill',
            'small': 'w_300,h_300,c_fit',
            'medium': 'w_600,h_600,c_fit', 
            'large': 'w_1200,h_1200,c_fit',
            'original': ''
        }
        
        transform = size_params.get(size, '')
        
        if transform:
            return f"image/upload/{transform}/v1/{base_name}{ext}"
        else:
            return f"image/upload/v1/{base_name}{ext}"
    
    def get_responsive_urls(self, image_path: str) -> Dict[str, str]:
        """
        Get responsive image URLs for different screen sizes
        
        Returns:
            Dictionary with URLs for different sizes
        """
        return {
            'thumbnail': self.get_optimized_url(image_path, 'thumbnail'),
            'small': self.get_optimized_url(image_path, 'small'),
            'medium': self.get_optimized_url(image_path, 'medium'),
            'large': self.get_optimized_url(image_path, 'large'),
            'original': self.get_optimized_url(image_path, 'original')
        }
    
    def get_srcset(self, image_path: str) -> str:
        """
        Generate srcset attribute for responsive images
        
        Returns:
            Srcset string for use in img tags
        """
        urls = self.get_responsive_urls(image_path)
        
        srcset_parts = [
            f"{urls['small']} 300w",
            f"{urls['medium']} 600w", 
            f"{urls['large']} 1200w",
            f"{urls['original']} 2000w"
        ]
        
        return ", ".join(srcset_parts)
    
    def preload_images(self, image_paths: List[str], priority_size: str = 'medium') -> List[str]:
        """
        Generate preload URLs for critical images
        
        Args:
            image_paths: List of image paths to preload
            priority_size: Size to prioritize for preloading
            
        Returns:
            List of URLs to preload
        """
        preload_urls = []
        
        for path in image_paths[:5]:  # Limit to first 5 images
            url = self.get_optimized_url(path, priority_size)
            preload_urls.append(url)
        
        return preload_urls
    
    def invalidate_cache(self, image_path: str) -> bool:
        """
        Simulate CDN cache invalidation
        In production, this would call the CDN provider's API
        
        Args:
            image_path: Path of image to invalidate
            
        Returns:
            Success status
        """
        if not self.use_cdn:
            return True
        
        # Simulate API call to CDN provider
        print(f"🔄 Invalidating CDN cache for: {image_path}")
        
        # In production, you'd call something like:
        # cloudflare_api.purge_cache(urls=[self.get_optimized_url(image_path)])
        # or
        # cloudfront_api.create_invalidation(paths=[f"/{image_path}"])
        
        return True
    
    def get_cache_headers(self) -> Dict[str, str]:
        """
        Get recommended cache headers for images
        
        Returns:
            Dictionary of HTTP headers
        """
        return {
            'Cache-Control': f'public, max-age={self.cdn_cache_ttl}, immutable',
            'Expires': str(int(time.time() + self.cdn_cache_ttl)),
            'Vary': 'Accept-Encoding',
            'X-Content-Type-Options': 'nosniff'
        }
    
    def get_webp_url(self, image_path: str, size: str = 'original') -> str:
        """
        Get WebP optimized URL if supported
        
        Args:
            image_path: Original image path
            size: Requested size
            
        Returns:
            WebP optimized URL
        """
        base_url = self.get_optimized_url(image_path, size)
        
        if self.use_cdn:
            # Add WebP transformation parameter
            return base_url.replace('/upload/', '/upload/f_webp/')
        else:
            # For local development, return WebP version if exists
            base_name, _ = os.path.splitext(image_path)
            if size != 'original':
                return f"/uploads/{base_name}_{size}.webp"
            return f"/uploads/{base_name}.webp"
    
    def get_progressive_jpeg_url(self, image_path: str, size: str = 'original') -> str:
        """
        Get progressive JPEG URL for better perceived performance
        
        Args:
            image_path: Original image path 
            size: Requested size
            
        Returns:
            Progressive JPEG URL
        """
        base_url = self.get_optimized_url(image_path, size)
        
        if self.use_cdn:
            # Add progressive JPEG parameter
            return base_url.replace('/upload/', '/upload/fl_progressive/')
        
        return base_url


# Global CDN service instance
cdn_service = CDNService()


def get_image_urls(image_path: str) -> Dict[str, str]:
    """
    Helper function to get all optimized URLs for an image
    
    Args:
        image_path: Path to the image
        
    Returns:
        Dictionary with all URL variants
    """
    urls = cdn_service.get_responsive_urls(image_path)
    
    # Add WebP variants
    urls.update({
        'thumbnail_webp': cdn_service.get_webp_url(image_path, 'thumbnail'),
        'small_webp': cdn_service.get_webp_url(image_path, 'small'),
        'medium_webp': cdn_service.get_webp_url(image_path, 'medium'),
        'large_webp': cdn_service.get_webp_url(image_path, 'large'),
        'original_webp': cdn_service.get_webp_url(image_path, 'original')
    })
    
    # Add srcset
    urls['srcset'] = cdn_service.get_srcset(image_path)
    
    return urls