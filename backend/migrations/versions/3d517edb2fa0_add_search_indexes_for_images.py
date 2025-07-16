"""Add search indexes for images

Revision ID: 3d517edb2fa0
Revises: d5851632d64e
Create Date: 2025-07-16 09:23:19.764076

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3d517edb2fa0'
down_revision: Union[str, None] = 'd5851632d64e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create GIN index for full-text search on title and description
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_images_search_gin 
        ON images USING GIN(to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(description, '')))
    """)
    
    # Create individual indexes for common filter fields
    op.execute("CREATE INDEX IF NOT EXISTS idx_images_file_type ON images (file_type)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_images_is_nsfw ON images (is_nsfw)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_images_views ON images (views)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_images_privacy_created ON images (privacy, created_at)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_images_created_at_desc ON images (created_at DESC)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_images_views_desc ON images (views DESC)")
    
    # Composite index for common query patterns
    op.execute("CREATE INDEX IF NOT EXISTS idx_images_privacy_nsfw_created ON images (privacy, is_nsfw, created_at DESC)")
    
    # Add trigram extension for fuzzy search if PostgreSQL supports it
    try:
        op.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm")
        op.execute("CREATE INDEX IF NOT EXISTS idx_images_title_trgm ON images USING GIN(title gin_trgm_ops)")
        op.execute("CREATE INDEX IF NOT EXISTS idx_images_description_trgm ON images USING GIN(description gin_trgm_ops)")
    except:
        # If trigram extension is not available, skip
        pass


def downgrade() -> None:
    # Drop all created indexes
    op.execute("DROP INDEX IF EXISTS idx_images_search_gin")
    op.execute("DROP INDEX IF EXISTS idx_images_file_type")
    op.execute("DROP INDEX IF EXISTS idx_images_is_nsfw")
    op.execute("DROP INDEX IF EXISTS idx_images_views")
    op.execute("DROP INDEX IF EXISTS idx_images_privacy_created")
    op.execute("DROP INDEX IF EXISTS idx_images_created_at_desc")
    op.execute("DROP INDEX IF EXISTS idx_images_views_desc")
    op.execute("DROP INDEX IF EXISTS idx_images_privacy_nsfw_created")
    op.execute("DROP INDEX IF EXISTS idx_images_title_trgm")
    op.execute("DROP INDEX IF EXISTS idx_images_description_trgm")