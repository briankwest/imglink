"""Add rate_limits table for configurable rate limiting

Revision ID: add_rate_limits_table
Revises: 10dbeca76f8c
Create Date: 2025-07-16 18:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import text


# revision identifiers, used by Alembic.
revision: str = 'add_rate_limits_table'
down_revision: Union[str, None] = '706c6a0aefdc'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create rate_limits table
    op.create_table('rate_limits',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('endpoint', sa.String(255), nullable=False),
        sa.Column('tier', sa.String(20), nullable=False),
        sa.Column('requests', sa.Integer(), nullable=False),
        sa.Column('window', sa.Integer(), nullable=False),  # Window in seconds
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('endpoint', 'tier', name='uq_rate_limits_endpoint_tier')
    )
    
    # Create index for faster lookups
    op.create_index('idx_rate_limits_endpoint_tier', 'rate_limits', ['endpoint', 'tier'])
    
    # Insert default rate limits
    op.execute(text("""
    INSERT INTO rate_limits (endpoint, tier, requests, window, description) VALUES
    -- Authentication endpoints
    ('/api/v1/auth/login', 'anonymous', 5, 300, 'Login attempts for unauthenticated users'),
    ('/api/v1/auth/login', 'standard', 10, 300, 'Login attempts for standard users'),
    ('/api/v1/auth/login', 'premium', 20, 300, 'Login attempts for premium users'),
    
    ('/api/v1/auth/register', 'anonymous', 3, 3600, 'Registration attempts per hour'),
    ('/api/v1/auth/register', 'standard', 5, 3600, 'Registration attempts per hour'),
    ('/api/v1/auth/register', 'premium', 10, 3600, 'Registration attempts per hour'),
    
    -- Image upload endpoint
    ('/api/v1/images', 'anonymous', 10, 3600, 'Image uploads per hour for anonymous users'),
    ('/api/v1/images', 'standard', 100, 3600, 'Image uploads per hour for standard users'),
    ('/api/v1/images', 'premium', 1000, 3600, 'Image uploads per hour for premium users'),
    
    -- General API endpoints (default)
    ('default', 'anonymous', 100, 3600, 'Default API calls per hour for anonymous users'),
    ('default', 'standard', 1000, 3600, 'Default API calls per hour for standard users'),
    ('default', 'premium', 10000, 3600, 'Default API calls per hour for premium users')
    """))
    
    # Add trigger to update updated_at timestamp
    op.execute(text("""
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
    END;
    $$ language 'plpgsql';
    """))
    
    op.execute(text("""
    CREATE TRIGGER update_rate_limits_updated_at 
    BEFORE UPDATE ON rate_limits 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
    """))


def downgrade() -> None:
    # Drop trigger and function
    op.execute(text("DROP TRIGGER IF EXISTS update_rate_limits_updated_at ON rate_limits"))
    op.execute(text("DROP FUNCTION IF EXISTS update_updated_at_column()"))
    
    # Drop index
    op.drop_index('idx_rate_limits_endpoint_tier', 'rate_limits')
    
    # Drop table
    op.drop_table('rate_limits')