"""add assignment source order

Revision ID: e4b7c8d9a012
Revises: c3f2a1b4d5e6
Create Date: 2026-05-25 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "e4b7c8d9a012"
down_revision: Union[str, Sequence[str], None] = "c3f2a1b4d5e6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        "group_teacher_disciplines",
        sa.Column("source_order", sa.Integer(), nullable=True),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("group_teacher_disciplines", "source_order")
