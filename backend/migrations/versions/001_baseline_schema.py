"""baseline_schema

Revision ID: 001_baseline_schema
Revises: 
Create Date: 2025-07-16 21:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '001_baseline_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Skip enums for now - use VARCHAR fields instead for simplicity
    
    # Create users table
    op.create_table('users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('username', sa.String(length=50), nullable=False),
        sa.Column('email', sa.String(length=100), nullable=False),
        sa.Column('hashed_password', sa.String(length=100), nullable=False),
        sa.Column('full_name', sa.String(length=100), nullable=True),
        sa.Column('avatar_url', sa.String(length=500), nullable=True),
        sa.Column('bio', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True),
        sa.Column('is_verified', sa.Boolean(), nullable=False, default=False),
        sa.Column('is_superuser', sa.Boolean(), nullable=False, default=False),
        sa.Column('tier', sa.String(length=20), nullable=True, default='standard'),
        sa.Column('email_verification_token', sa.String(length=100), nullable=True),
        sa.Column('email_verification_sent_at', sa.DateTime(), nullable=True),
        sa.Column('password_reset_token', sa.String(length=100), nullable=True),
        sa.Column('password_reset_sent_at', sa.DateTime(), nullable=True),
        sa.Column('google_id', sa.String(length=100), nullable=True),
        sa.Column('github_id', sa.String(length=100), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, default=sa.func.current_timestamp()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, default=sa.func.current_timestamp()),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email'),
        sa.UniqueConstraint('username')
    )
    op.create_index('ix_users_email', 'users', ['email'], unique=False)
    op.create_index('ix_users_username', 'users', ['username'], unique=False)
    
    # Create images table
    op.create_table('images',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('filename', sa.String(length=255), nullable=False),
        sa.Column('original_filename', sa.String(length=255), nullable=True),
        sa.Column('title', sa.String(length=255), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('file_size', sa.Integer(), nullable=True),
        sa.Column('file_type', sa.String(length=50), nullable=True),
        sa.Column('width', sa.Integer(), nullable=True),
        sa.Column('height', sa.Integer(), nullable=True),
        sa.Column('url', sa.String(length=500), nullable=False),
        sa.Column('thumbnail_url', sa.String(length=500), nullable=True),
        sa.Column('medium_url', sa.String(length=500), nullable=True),
        sa.Column('large_url', sa.String(length=500), nullable=True),
        sa.Column('delete_hash', sa.String(length=100), nullable=True),
        sa.Column('privacy', sa.String(length=20), nullable=False, default='public'),
        sa.Column('views', sa.Integer(), nullable=False, default=0),
        sa.Column('is_nsfw', sa.Boolean(), nullable=False, default=False),
        sa.Column('owner_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, default=sa.func.current_timestamp()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, default=sa.func.current_timestamp()),
        sa.ForeignKeyConstraint(['owner_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('delete_hash')
    )
    op.create_index('ix_images_created_at', 'images', ['created_at'], unique=False)
    op.create_index('ix_images_owner_id', 'images', ['owner_id'], unique=False)
    op.create_index('ix_images_privacy', 'images', ['privacy'], unique=False)
    
    # Create albums table
    op.create_table('albums',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('cover_image_id', sa.Integer(), nullable=True),
        sa.Column('privacy', sa.String(length=20), nullable=False, default='public'),
        sa.Column('delete_hash', sa.String(length=100), nullable=True),
        sa.Column('views', sa.Integer(), nullable=True, default=0),
        sa.Column('owner_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, default=sa.func.current_timestamp()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, default=sa.func.current_timestamp()),
        sa.ForeignKeyConstraint(['cover_image_id'], ['images.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['owner_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('delete_hash')
    )
    op.create_index('ix_albums_owner_id', 'albums', ['owner_id'], unique=False)
    op.create_index('ix_albums_delete_hash', 'albums', ['delete_hash'], unique=True)
    
    # Create tags table
    op.create_table('tags',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=50), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, default=sa.func.current_timestamp()),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )
    op.create_index('ix_tags_name', 'tags', ['name'], unique=False)
    
    # Create follows table
    op.create_table('follows',
        sa.Column('follower_id', sa.Integer(), nullable=False),
        sa.Column('following_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, default=sa.func.current_timestamp()),
        sa.ForeignKeyConstraint(['follower_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['following_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('follower_id', 'following_id')
    )
    op.create_index('ix_follows_follower_id', 'follows', ['follower_id'], unique=False)
    op.create_index('ix_follows_following_id', 'follows', ['following_id'], unique=False)
    
    # Create rate_limits table
    op.create_table('rate_limits',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('endpoint', sa.String(length=255), nullable=False),
        sa.Column('tier', sa.String(length=20), nullable=False),
        sa.Column('requests', sa.Integer(), nullable=False),
        sa.Column('window', sa.Integer(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, default=sa.func.current_timestamp()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, default=sa.func.current_timestamp()),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_rate_limits_endpoint_tier', 'rate_limits', ['endpoint', 'tier'], unique=False)
    
    # Create notifications table
    op.create_table('notifications',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('type', sa.String(length=50), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('related_user_id', sa.Integer(), nullable=True),
        sa.Column('related_image_id', sa.Integer(), nullable=True),
        sa.Column('related_album_id', sa.Integer(), nullable=True),
        sa.Column('read', sa.Boolean(), nullable=False, default=False),
        sa.Column('read_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, default=sa.func.current_timestamp()),
        sa.Column('data', sa.JSON(), nullable=True),
        sa.ForeignKeyConstraint(['related_album_id'], ['albums.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['related_image_id'], ['images.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['related_user_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_notifications_user_id', 'notifications', ['user_id'], unique=False)
    op.create_index('ix_notifications_created_at', 'notifications', ['created_at'], unique=False)
    
    # Create comments table
    op.create_table('comments',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('image_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('parent_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, default=sa.func.current_timestamp()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, default=sa.func.current_timestamp()),
        sa.ForeignKeyConstraint(['image_id'], ['images.id'], ),
        sa.ForeignKeyConstraint(['parent_id'], ['comments.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_comments_image_id', 'comments', ['image_id'], unique=False)
    op.create_index('ix_comments_user_id', 'comments', ['user_id'], unique=False)
    
    # Create likes table
    op.create_table('likes',
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('image_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, default=sa.func.current_timestamp()),
        sa.ForeignKeyConstraint(['image_id'], ['images.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('user_id', 'image_id')
    )
    
    # Create album_images table
    op.create_table('album_images',
        sa.Column('album_id', sa.Integer(), nullable=False),
        sa.Column('image_id', sa.Integer(), nullable=False),
        sa.Column('position', sa.Integer(), nullable=False, default=0),
        sa.ForeignKeyConstraint(['album_id'], ['albums.id'], ),
        sa.ForeignKeyConstraint(['image_id'], ['images.id'], ),
        sa.PrimaryKeyConstraint('album_id', 'image_id')
    )
    
    # Create image_tags table
    op.create_table('image_tags',
        sa.Column('image_id', sa.Integer(), nullable=False),
        sa.Column('tag_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['image_id'], ['images.id'], ),
        sa.ForeignKeyConstraint(['tag_id'], ['tags.id'], ),
        sa.PrimaryKeyConstraint('image_id', 'tag_id')
    )


def downgrade() -> None:
    # This would drop all tables, but we don't want to do that
    pass