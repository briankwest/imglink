"""
File handling utilities
"""
import os
import hashlib
import mimetypes
from typing import Optional, Tuple
from pathlib import Path


def get_file_extension(filename: str) -> str:
    """Extract file extension from filename"""
    return Path(filename).suffix.lower()


def generate_file_hash(file_path: str) -> str:
    """Generate SHA256 hash of a file"""
    sha256_hash = hashlib.sha256()
    with open(file_path, "rb") as f:
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)
    return sha256_hash.hexdigest()


def get_mime_type(filename: str) -> Optional[str]:
    """Get MIME type from filename"""
    mime_type, _ = mimetypes.guess_type(filename)
    return mime_type


def ensure_directory(directory: str) -> None:
    """Ensure directory exists, create if not"""
    Path(directory).mkdir(parents=True, exist_ok=True)


def safe_filename(filename: str) -> str:
    """
    Generate a safe filename by removing/replacing unsafe characters
    
    Args:
        filename: Original filename
        
    Returns:
        Safe filename
    """
    # Get the base name and extension
    name, ext = os.path.splitext(filename)
    
    # Replace unsafe characters
    safe_chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_"
    name = "".join(c if c in safe_chars else "_" for c in name)
    
    # Ensure name is not empty
    if not name:
        name = "file"
    
    # Limit length
    max_length = 100
    if len(name) > max_length:
        name = name[:max_length]
    
    return name + ext


def get_file_size_mb(file_path: str) -> float:
    """Get file size in megabytes"""
    size_bytes = os.path.getsize(file_path)
    return size_bytes / (1024 * 1024)


def cleanup_file(file_path: str) -> bool:
    """
    Safely delete a file
    
    Args:
        file_path: Path to file to delete
        
    Returns:
        True if deleted, False otherwise
    """
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
            return True
        return False
    except Exception:
        return False


def get_image_dimensions(file_path: str) -> Optional[Tuple[int, int]]:
    """
    Get image dimensions without loading the entire image
    
    Args:
        file_path: Path to image file
        
    Returns:
        Tuple of (width, height) or None if not an image
    """
    from PIL import Image
    
    try:
        with Image.open(file_path) as img:
            return img.size
    except Exception:
        return None