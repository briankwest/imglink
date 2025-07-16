from typing import Any, List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.api.deps import get_db
from app.models.image import Image

router = APIRouter()

@router.get("/suggestions")
def get_search_suggestions(
    *,
    db: Session = Depends(get_db),
    q: str = Query(..., min_length=1, max_length=100, description="Search query for suggestions"),
    limit: int = Query(10, ge=1, le=20, description="Number of suggestions to return")
) -> List[str]:
    """
    Get search suggestions based on existing image titles and descriptions.
    
    Returns a list of suggested search terms that match the query.
    """
    # Simple ILIKE search that works without extensions
    suggestions_query = text("""
        WITH all_suggestions AS (
            SELECT DISTINCT suggestion, 
                   CASE 
                       WHEN suggestion ILIKE :starts_with THEN 1 
                       ELSE 2 
                   END as priority
            FROM (
                SELECT title as suggestion FROM images 
                WHERE title IS NOT NULL 
                AND privacy = 'PUBLIC' 
                AND title ILIKE :pattern
                AND char_length(title) > 2
                
                UNION
                
                SELECT description as suggestion FROM images 
                WHERE description IS NOT NULL 
                AND privacy = 'PUBLIC' 
                AND description ILIKE :pattern
                AND char_length(description) > 2
                
                UNION
                
                SELECT unnest(string_to_array(title, ' ')) as suggestion FROM images 
                WHERE title IS NOT NULL 
                AND privacy = 'PUBLIC' 
                AND title ILIKE :pattern
                
                UNION
                
                SELECT unnest(string_to_array(description, ' ')) as suggestion FROM images 
                WHERE description IS NOT NULL 
                AND privacy = 'PUBLIC' 
                AND description ILIKE :pattern
            ) t
            WHERE char_length(suggestion) > 2
            AND suggestion ILIKE :pattern
        )
        SELECT suggestion
        FROM all_suggestions
        ORDER BY priority, char_length(suggestion), suggestion
        LIMIT :limit
    """)
    
    try:
        pattern = f"%{q}%"
        starts_with = f"{q}%"
        result = db.execute(suggestions_query, {
            "pattern": pattern, 
            "starts_with": starts_with,
            "limit": limit
        })
        suggestions = [row[0] for row in result.fetchall()]
        return suggestions
    except Exception as e:
        # If there's still an error, return empty list
        print(f"Error in search suggestions: {e}")
        return []

@router.get("/popular-terms")
def get_popular_search_terms(
    *,
    db: Session = Depends(get_db),
    limit: int = Query(10, ge=1, le=50, description="Number of popular terms to return")
) -> List[str]:
    """
    Get popular search terms based on most common words in image titles and descriptions.
    
    Returns a list of popular search terms from public images.
    """
    popular_terms_query = text("""
        SELECT word, count(*) as frequency
        FROM (
            SELECT unnest(string_to_array(lower(title), ' ')) as word 
            FROM images 
            WHERE title IS NOT NULL 
            AND privacy = 'PUBLIC'
            
            UNION ALL
            
            SELECT unnest(string_to_array(lower(description), ' ')) as word 
            FROM images 
            WHERE description IS NOT NULL 
            AND privacy = 'PUBLIC'
        ) t
        WHERE char_length(word) > 2
        AND word NOT IN ('the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'who', 'boy', 'did', 'man', 'men', 'put', 'say', 'she', 'too', 'use')
        GROUP BY word
        ORDER BY frequency DESC, word
        LIMIT :limit
    """)
    
    try:
        result = db.execute(popular_terms_query, {"limit": limit})
        popular_terms = [row[0] for row in result.fetchall()]
        return popular_terms
    except Exception as e:
        print(f"Error in popular terms: {e}")
        return []