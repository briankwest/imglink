"""
Pagination utilities for API endpoints
"""
from typing import TypeVar, Generic, List, Optional
from pydantic import BaseModel

T = TypeVar("T")


class PaginatedResponse(BaseModel, Generic[T]):
    """Generic paginated response model"""
    items: List[T]
    total: int
    skip: int
    limit: int
    
    @property
    def pages(self) -> int:
        """Calculate total number of pages"""
        return (self.total + self.limit - 1) // self.limit if self.limit > 0 else 0
    
    @property
    def current_page(self) -> int:
        """Calculate current page number (1-indexed)"""
        return (self.skip // self.limit) + 1 if self.limit > 0 else 1
    
    @property
    def has_next(self) -> bool:
        """Check if there's a next page"""
        return self.skip + self.limit < self.total
    
    @property
    def has_previous(self) -> bool:
        """Check if there's a previous page"""
        return self.skip > 0


def paginate_query(query, skip: int = 0, limit: int = 20):
    """
    Apply pagination to a SQLAlchemy query
    
    Args:
        query: SQLAlchemy query object
        skip: Number of items to skip
        limit: Maximum number of items to return
        
    Returns:
        Paginated query results
    """
    return query.offset(skip).limit(limit).all()


def get_pagination_params(
    skip: Optional[int] = 0,
    limit: Optional[int] = 20,
    max_limit: int = 100
) -> tuple[int, int]:
    """
    Validate and return pagination parameters
    
    Args:
        skip: Number of items to skip
        limit: Maximum number of items to return
        max_limit: Maximum allowed limit
        
    Returns:
        Tuple of (skip, limit)
    """
    skip = max(0, skip or 0)
    limit = min(max_limit, max(1, limit or 20))
    return skip, limit