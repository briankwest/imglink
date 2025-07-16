import io
import os
from typing import Tuple, Optional
from minio import Minio
from minio.error import S3Error
from PIL import Image as PILImage
import logging

from app.core.config import settings
from app.services.image_processing import image_service

logger = logging.getLogger(__name__)


class StorageService:
    def __init__(self):
        self.client = None
        self.bucket_name = settings.S3_BUCKET
        self._initialize_client()
    
    def _initialize_client(self):
        """Initialize MinIO client."""
        try:
            # Parse endpoint URL to remove protocol
            endpoint = settings.S3_ENDPOINT.replace('http://', '').replace('https://', '')
            
            # Determine if we should use SSL
            use_ssl = settings.S3_ENDPOINT.startswith('https://')
            
            self.client = Minio(
                endpoint,
                access_key=settings.S3_ACCESS_KEY,
                secret_key=settings.S3_SECRET_KEY,
                secure=use_ssl
            )
            
            # Ensure bucket exists
            if not self.client.bucket_exists(self.bucket_name):
                self.client.make_bucket(self.bucket_name)
                logger.info(f"Created bucket: {self.bucket_name}")
            
        except Exception as e:
            logger.error(f"Failed to initialize MinIO client: {e}")
            raise
    
    def upload_image_with_thumbnails(
        self, 
        file_data: bytes, 
        file_name: str, 
        content_type: str = 'image/jpeg'
    ) -> Tuple[str, Optional[str], Optional[str], Optional[str]]:
        """
        Upload an image and create thumbnails.
        
        Returns:
            Tuple of (original_url, small_url, medium_url, large_url)
        """
        try:
            # Upload original image
            original_url = self._upload_file(file_data, file_name, content_type)
            
            # Create thumbnails
            image = PILImage.open(io.BytesIO(file_data))
            base_name = os.path.splitext(file_name)[0]
            
            thumbnail_urls = {}
            for size_name, dimensions in settings.THUMBNAIL_SIZES.items():
                # Generate thumbnail
                thumbnail = image_service._create_thumbnail(image, dimensions[0], dimensions[1])
                
                # Convert to bytes
                thumbnail_bytes = io.BytesIO()
                thumbnail.save(thumbnail_bytes, format='JPEG', quality=85, optimize=True)
                thumbnail_bytes.seek(0)
                
                # Upload thumbnail
                thumbnail_filename = f"{base_name}_{size_name}.jpg"
                thumbnail_url = self._upload_file(
                    thumbnail_bytes.getvalue(), 
                    thumbnail_filename, 
                    'image/jpeg'
                )
                thumbnail_urls[size_name] = thumbnail_url
            
            return (
                original_url,
                thumbnail_urls.get('small'),
                thumbnail_urls.get('medium'),
                thumbnail_urls.get('large')
            )
            
        except Exception as e:
            logger.error(f"Failed to upload image with thumbnails: {e}")
            raise
    
    def _upload_file(self, file_data: bytes, file_name: str, content_type: str) -> str:
        """Upload a file to MinIO and return its URL."""
        try:
            # Upload to MinIO
            result = self.client.put_object(
                self.bucket_name,
                file_name,
                io.BytesIO(file_data),
                len(file_data),
                content_type=content_type
            )
            
            # Construct URL
            # For local development or when MinIO is in Docker network, use backend proxy
            if 'minio' in settings.S3_ENDPOINT or 'localhost' in settings.S3_ENDPOINT or '127.0.0.1' in settings.S3_ENDPOINT:
                # Use the backend URL as base for local development
                base_url = settings.BACKEND_URL.rstrip('/')
                url = f"{base_url}/api/v1/images/file/{file_name}"
            else:
                # For production, use the S3 endpoint directly
                url = f"{settings.S3_ENDPOINT}/{self.bucket_name}/{file_name}"
            
            return url
            
        except Exception as e:
            logger.error(f"Failed to upload file {file_name}: {e}")
            raise
    
    def delete_file(self, file_name: str):
        """Delete a file from MinIO."""
        try:
            self.client.remove_object(self.bucket_name, file_name)
            logger.info(f"Deleted file: {file_name}")
        except S3Error as e:
            if e.code == 'NoSuchKey':
                logger.warning(f"File not found for deletion: {file_name}")
            else:
                logger.error(f"Failed to delete file {file_name}: {e}")
                raise
        except Exception as e:
            logger.error(f"Failed to delete file {file_name}: {e}")
            raise
    
    def get_file(self, file_name: str) -> bytes:
        """Get a file from MinIO."""
        try:
            response = self.client.get_object(self.bucket_name, file_name)
            data = response.read()
            response.close()
            response.release_conn()
            return data
        except Exception as e:
            logger.error(f"Failed to get file {file_name}: {e}")
            raise
    
    def get_file_info(self, file_name: str) -> dict:
        """Get file metadata from MinIO."""
        try:
            stat = self.client.stat_object(self.bucket_name, file_name)
            return {
                'size': stat.size,
                'content_type': stat.content_type,
                'etag': stat.etag,
                'last_modified': stat.last_modified
            }
        except Exception as e:
            logger.error(f"Failed to get file info for {file_name}: {e}")
            raise


# Create singleton instance
storage_service = StorageService()