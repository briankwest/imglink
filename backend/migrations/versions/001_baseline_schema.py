"""baseline_schema

Revision ID: 001_baseline_schema
Revises: 
Create Date: 2025-07-16 21:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '001_baseline_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # This migration represents the baseline state of the database
    # All tables already exist in the current database
    pass


def downgrade() -> None:
    # This would drop all tables, but we don't want to do that
    pass