"""Add tags and image_tags tables

Revision ID: add_tags_tables
Revises: 3d517edb2fa0
Create Date: 2025-07-16 15:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'add_tags_tables'
down_revision: Union[str, None] = '3d517edb2fa0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create tags table
    op.create_table('tags',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=50), nullable=False),
        sa.Column('slug', sa.String(length=50), nullable=False),
        sa.Column('usage_count', sa.Integer(), nullable=True, default=0),
        sa.Column('created_by', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name'),
        sa.UniqueConstraint('slug')
    )
    op.create_index(op.f('ix_tags_id'), 'tags', ['id'], unique=False)
    op.create_index(op.f('ix_tags_name'), 'tags', ['name'], unique=True)
    op.create_index(op.f('ix_tags_slug'), 'tags', ['slug'], unique=True)
    
    # Create image_tags table
    op.create_table('image_tags',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('image_id', sa.Integer(), nullable=False),
        sa.Column('tag_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['image_id'], ['images.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['tag_id'], ['tags.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('image_id', 'tag_id', name='_image_tag_uc')
    )
    op.create_index(op.f('ix_image_tags_id'), 'image_tags', ['id'], unique=False)
    op.create_index('ix_image_tags_image_id', 'image_tags', ['image_id'], unique=False)
    op.create_index('ix_image_tags_tag_id', 'image_tags', ['tag_id'], unique=False)


def downgrade() -> None:
    # Drop image_tags table
    op.drop_index('ix_image_tags_tag_id', table_name='image_tags')
    op.drop_index('ix_image_tags_image_id', table_name='image_tags')
    op.drop_index(op.f('ix_image_tags_id'), table_name='image_tags')
    op.drop_table('image_tags')
    
    # Drop tags table
    op.drop_index(op.f('ix_tags_slug'), table_name='tags')
    op.drop_index(op.f('ix_tags_name'), table_name='tags')
    op.drop_index(op.f('ix_tags_id'), table_name='tags')
    op.drop_table('tags')