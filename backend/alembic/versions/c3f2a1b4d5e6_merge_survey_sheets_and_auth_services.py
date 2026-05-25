"""merge survey sheets and auth service heads

Revision ID: c3f2a1b4d5e6
Revises: a41d8f6f1c2b, f1c7a0d9b2e4
Create Date: 2026-05-25 00:00:00.000000

"""
from typing import Sequence, Union


# revision identifiers, used by Alembic.
revision: str = "c3f2a1b4d5e6"
down_revision: Union[str, Sequence[str], None] = (
    "a41d8f6f1c2b",
    "f1c7a0d9b2e4",
)
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Merge migration branches."""
    pass


def downgrade() -> None:
    """Split migration branches."""
    pass
