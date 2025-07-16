"""Initial schema creation

Revision ID: 001_initial_schema
Revises: 
Create Date: 2025-07-16 18:35:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create users table
    op.create_table('users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('username', sa.String(50), nullable=False),
        sa.Column('email', sa.String(100), nullable=False),
        sa.Column('hashed_password', sa.String(100), nullable=False),
        sa.Column('full_name', sa.String(100), nullable=True),
        sa.Column('avatar_url', sa.String(500), nullable=True),
        sa.Column('bio', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('is_verified', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('is_superuser', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('tier', sa.String(20), nullable=True, server_default='standard'),
        sa.Column('email_verification_token', sa.String(100), nullable=True),
        sa.Column('email_verification_sent_at', sa.DateTime(), nullable=True),
        sa.Column('password_reset_token', sa.String(100), nullable=True),
        sa.Column('password_reset_sent_at', sa.DateTime(), nullable=True),
        sa.Column('google_id', sa.String(100), nullable=True),
        sa.Column('github_id', sa.String(100), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_users_username', 'users', ['username'], unique=True)
    op.create_index('ix_users_email', 'users', ['email'], unique=True)
    op.create_index('ix_users_google_id', 'users', ['google_id'], unique=True)
    op.create_index('ix_users_github_id', 'users', ['github_id'], unique=True)
    
    # Create images table
    op.create_table('images',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('filename', sa.String(255), nullable=False),
        sa.Column('original_filename', sa.String(255), nullable=True),
        sa.Column('title', sa.String(255), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('file_size', sa.Integer(), nullable=True),
        sa.Column('file_type', sa.String(50), nullable=True),
        sa.Column('width', sa.Integer(), nullable=True),
        sa.Column('height', sa.Integer(), nullable=True),
        sa.Column('url', sa.String(500), nullable=False),
        sa.Column('thumbnail_url', sa.String(500), nullable=True),
        sa.Column('medium_url', sa.String(500), nullable=True),
        sa.Column('large_url', sa.String(500), nullable=True),
        sa.Column('delete_hash', sa.String(100), nullable=True),
        sa.Column('privacy', sa.Enum('PUBLIC', 'PRIVATE', 'UNLISTED', name='imageprivacy'), nullable=False, server_default='PUBLIC'),
        sa.Column('views', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('is_nsfw', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('owner_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('optimized_urls', sa.JSON(), nullable=True),
        sa.ForeignKeyConstraint(['owner_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_images_owner_id', 'images', ['owner_id'])
    op.create_index('ix_images_delete_hash', 'images', ['delete_hash'], unique=True)
    op.create_index('ix_images_created_at', 'images', ['created_at'])
    op.create_index('ix_images_privacy', 'images', ['privacy'])
    
    # Create albums table
    op.create_table('albums',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('cover_image_id', sa.Integer(), nullable=True),
        sa.Column('privacy', sa.Enum('PUBLIC', 'PRIVATE', 'UNLISTED', name='albumprivacy'), nullable=False, server_default='PUBLIC'),
        sa.Column('owner_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['owner_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_albums_owner_id', 'albums', ['owner_id'])
    
    # Create album_images junction table
    op.create_table('album_images',
        sa.Column('album_id', sa.Integer(), nullable=False),
        sa.Column('image_id', sa.Integer(), nullable=False),
        sa.Column('position', sa.Integer(), nullable=False, server_default='0'),
        sa.ForeignKeyConstraint(['album_id'], ['albums.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['image_id'], ['images.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('album_id', 'image_id')
    )
    
    # Create comments table
    op.create_table('comments',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('image_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('parent_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['image_id'], ['images.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['parent_id'], ['comments.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_comments_image_id', 'comments', ['image_id'])
    op.create_index('ix_comments_user_id', 'comments', ['user_id'])
    
    # Create likes table
    op.create_table('likes',
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('image_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['image_id'], ['images.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('user_id', 'image_id')
    )
    
    # Create follows table
    op.create_table('follows',
        sa.Column('follower_id', sa.Integer(), nullable=False),
        sa.Column('following_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['follower_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['following_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('follower_id', 'following_id')
    )
    op.create_index('ix_follows_follower_id', 'follows', ['follower_id'])
    op.create_index('ix_follows_following_id', 'follows', ['following_id'])
    
    # Create tags table
    op.create_table('tags',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(50), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_tags_name', 'tags', ['name'], unique=True)
    
    # Create image_tags junction table
    op.create_table('image_tags',
        sa.Column('image_id', sa.Integer(), nullable=False),
        sa.Column('tag_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['image_id'], ['images.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['tag_id'], ['tags.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('image_id', 'tag_id')
    )
    
    # Create notifications table
    op.create_table('notifications',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('type', sa.Enum('COMMENT', 'LIKE', 'FOLLOW', 'MENTION', 'SYSTEM', 'IMAGE_SHARED', 'ALBUM_SHARED', name='notificationtype'), nullable=False),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('related_user_id', sa.Integer(), nullable=True),
        sa.Column('related_image_id', sa.Integer(), nullable=True),
        sa.Column('related_album_id', sa.Integer(), nullable=True),
        sa.Column('read', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('read_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('data', sa.JSON(), nullable=True),
        sa.ForeignKeyConstraint(['related_album_id'], ['albums.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['related_image_id'], ['images.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['related_user_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_notifications_user_id', 'notifications', ['user_id'])
    op.create_index('ix_notifications_created_at', 'notifications', ['created_at'])
    
    # Create rate_limits table
    op.create_table('rate_limits',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('endpoint', sa.String(255), nullable=False),
        sa.Column('tier', sa.String(20), nullable=False),
        sa.Column('requests', sa.Integer(), nullable=False),
        sa.Column('window', sa.Integer(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('endpoint', 'tier', name='uq_rate_limits_endpoint_tier')
    )
    op.create_index('idx_rate_limits_endpoint_tier', 'rate_limits', ['endpoint', 'tier'])
    
    # Insert default rate limits
    op.execute(sa.text("""
    INSERT INTO rate_limits (endpoint, tier, requests, "window", description) VALUES
    ('/api/v1/auth/login', 'anonymous', 5, 300, 'Login attempts for unauthenticated users'),
    ('/api/v1/auth/login', 'standard', 10, 300, 'Login attempts for standard users'),
    ('/api/v1/auth/login', 'premium', 20, 300, 'Login attempts for premium users'),
    ('/api/v1/auth/register', 'anonymous', 3, 3600, 'Registration attempts per hour'),
    ('/api/v1/auth/register', 'standard', 5, 3600, 'Registration attempts per hour'),
    ('/api/v1/auth/register', 'premium', 10, 3600, 'Registration attempts per hour'),
    ('/api/v1/images', 'anonymous', 10, 3600, 'Image uploads per hour for anonymous users'),
    ('/api/v1/images', 'standard', 100, 3600, 'Image uploads per hour for standard users'),
    ('/api/v1/images', 'premium', 1000, 3600, 'Image uploads per hour for premium users'),
    ('default', 'anonymous', 100, 3600, 'Default API calls per hour for anonymous users'),
    ('default', 'standard', 1000, 3600, 'Default API calls per hour for standard users'),
    ('default', 'premium', 10000, 3600, 'Default API calls per hour for premium users')
    """))


def downgrade() -> None:
    # Drop all tables in reverse order
    op.drop_table('rate_limits')
    op.drop_table('notifications')
    op.drop_table('image_tags')
    op.drop_table('tags')
    op.drop_table('follows')
    op.drop_table('likes')
    op.drop_table('comments')
    op.drop_table('album_images')
    op.drop_table('albums')
    op.drop_table('images')
    op.drop_table('users')
    
    # Drop enums
    op.execute('DROP TYPE IF EXISTS notificationtype')
    op.execute('DROP TYPE IF EXISTS albumprivacy')
    op.execute('DROP TYPE IF EXISTS imageprivacy')