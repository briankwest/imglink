import os
import io
from typing import Dict, Tuple, Optional
from PIL import Image, ImageOps, ExifTags
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)


class ImageProcessingService:
    def __init__(self):
        self.thumbnail_sizes = settings.THUMBNAIL_SIZES
        self.max_dimension = 2048  # Max width/height for optimized images
        self.quality = 85  # JPEG quality for compressed images
        
    def process_image(self, image_path: str, filename: str) -> Dict[str, str]:
        """
        Process an uploaded image to generate thumbnails and optimized versions
        Returns a dictionary with paths to all generated image variants
        """
        try:
            with Image.open(image_path) as img:
                # Get original image info
                original_width, original_height = img.size
                original_format = img.format
                
                # Auto-rotate based on EXIF data
                img = self._auto_rotate_image(img)
                
                # Convert to RGB if necessary (for formats like RGBA, P)
                if img.mode in ('RGBA', 'LA', 'P'):
                    # Create white background for transparency
                    background = Image.new('RGB', img.size, (255, 255, 255))
                    if img.mode == 'P':
                        img = img.convert('RGBA')
                    background.paste(img, mask=img.split()[-1] if img.mode in ('RGBA', 'LA') else None)
                    img = background
                elif img.mode != 'RGB':
                    img = img.convert('RGB')
                
                # Generate base filename without extension
                base_name = os.path.splitext(filename)[0]
                upload_dir = os.path.dirname(image_path)
                
                # Store all generated file paths
                generated_files = {}
                
                # Generate thumbnails
                for size_name, (width, height) in self.thumbnail_sizes.items():
                    thumbnail_filename = f"{base_name}_{size_name}.jpg"
                    thumbnail_path = os.path.join(upload_dir, thumbnail_filename)
                    
                    # Create thumbnail
                    thumbnail = self._create_thumbnail(img, width, height)
                    thumbnail.save(thumbnail_path, 'JPEG', quality=self.quality, optimize=True)
                    
                    generated_files[f"{size_name}_url"] = f"/uploads/{thumbnail_filename}"
                
                # Generate optimized full-size image if needed
                if max(original_width, original_height) > self.max_dimension or original_format != 'JPEG':
                    optimized_filename = f"{base_name}_optimized.jpg"
                    optimized_path = os.path.join(upload_dir, optimized_filename)
                    
                    # Resize if too large
                    if max(original_width, original_height) > self.max_dimension:
                        img = self._resize_image(img, self.max_dimension)
                    
                    # Save optimized version
                    img.save(optimized_path, 'JPEG', quality=self.quality, optimize=True)
                    generated_files["optimized_url"] = f"/uploads/{optimized_filename}"
                
                return generated_files
                
        except Exception as e:
            logger.error(f"Error processing image {image_path}: {str(e)}")
            return {}
    
    def _auto_rotate_image(self, img: Image.Image) -> Image.Image:
        """Auto-rotate image based on EXIF orientation data"""
        try:
            # Get EXIF data
            exif = img.getexif()
            if exif:
                # Find orientation tag
                for tag, value in exif.items():
                    if tag in ExifTags.TAGS and ExifTags.TAGS[tag] == 'Orientation':
                        if value == 3:
                            img = img.rotate(180, expand=True)
                        elif value == 6:
                            img = img.rotate(270, expand=True)
                        elif value == 8:
                            img = img.rotate(90, expand=True)
                        break
        except Exception as e:
            logger.warning(f"Could not process EXIF data: {str(e)}")
        
        return img
    
    def _create_thumbnail(self, img: Image.Image, width: int, height: int) -> Image.Image:
        """Create a thumbnail that fits within the specified dimensions while maintaining aspect ratio"""
        # Calculate the thumbnail size that fits within bounds while maintaining aspect ratio
        img_ratio = img.width / img.height
        thumb_ratio = width / height
        
        if img_ratio > thumb_ratio:
            # Image is wider, fit to width
            new_width = width
            new_height = int(width / img_ratio)
        else:
            # Image is taller, fit to height
            new_height = height
            new_width = int(height * img_ratio)
        
        # Resize the image
        thumbnail = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
        
        # Create a square thumbnail with padding if needed for certain sizes
        if width == height and (new_width != width or new_height != height):
            # Create square thumbnail with background padding
            square_thumb = Image.new('RGB', (width, height), (255, 255, 255))
            
            # Calculate position to center the image
            x = (width - new_width) // 2
            y = (height - new_height) // 2
            
            square_thumb.paste(thumbnail, (x, y))
            return square_thumb
        
        return thumbnail
    
    def _resize_image(self, img: Image.Image, max_dimension: int) -> Image.Image:
        """Resize image to fit within max_dimension while maintaining aspect ratio"""
        width, height = img.size
        
        if max(width, height) <= max_dimension:
            return img
        
        if width > height:
            new_width = max_dimension
            new_height = int((height * max_dimension) / width)
        else:
            new_height = max_dimension
            new_width = int((width * max_dimension) / height)
        
        return img.resize((new_width, new_height), Image.Resampling.LANCZOS)
    
    def extract_metadata(self, image_path: str) -> Dict[str, any]:
        """Extract metadata from an image file"""
        try:
            with Image.open(image_path) as img:
                metadata = {
                    'width': img.width,
                    'height': img.height,
                    'format': img.format,
                    'mode': img.mode,
                    'has_transparency': img.mode in ('RGBA', 'LA', 'P') and 'transparency' in img.info,
                }
                
                # Extract EXIF data if available
                exif = img.getexif()
                if exif:
                    exif_data = {}
                    for tag, value in exif.items():
                        tag_name = ExifTags.TAGS.get(tag, tag)
                        # Only include common, useful EXIF data
                        if tag_name in ['DateTime', 'Make', 'Model', 'Software', 'Artist', 'Copyright']:
                            exif_data[tag_name] = str(value)
                    
                    if exif_data:
                        metadata['exif'] = exif_data
                
                return metadata
                
        except Exception as e:
            logger.error(f"Error extracting metadata from {image_path}: {str(e)}")
            return {}
    
    def validate_image(self, file_path: str) -> Tuple[bool, Optional[str]]:
        """
        Validate an uploaded image file
        Returns (is_valid, error_message)
        """
        try:
            with Image.open(file_path) as img:
                # Check if it's a valid image
                img.verify()
                
                # Reopen for further checks (verify() invalidates the image)
                with Image.open(file_path) as img:
                    # Check dimensions
                    width, height = img.size
                    if width > 10000 or height > 10000:
                        return False, "Image dimensions too large (max 10000x10000)"
                    
                    if width < 1 or height < 1:
                        return False, "Invalid image dimensions"
                    
                    # Check file size
                    file_size = os.path.getsize(file_path)
                    if file_size > settings.MAX_UPLOAD_SIZE:
                        return False, f"File size exceeds maximum allowed size ({settings.MAX_UPLOAD_SIZE / 1024 / 1024:.1f}MB)"
                    
                    # Check format
                    if img.format.lower() not in ['jpeg', 'png', 'gif', 'webp']:
                        return False, f"Unsupported image format: {img.format}"
                    
                    return True, None
                    
        except Exception as e:
            return False, f"Invalid or corrupted image file: {str(e)}"
    
    def cleanup_temp_files(self, file_paths: list):
        """Clean up temporary files"""
        for file_path in file_paths:
            try:
                if os.path.exists(file_path):
                    os.remove(file_path)
            except Exception as e:
                logger.warning(f"Could not delete temp file {file_path}: {str(e)}")


# Global image processing service instance
image_service = ImageProcessingService()