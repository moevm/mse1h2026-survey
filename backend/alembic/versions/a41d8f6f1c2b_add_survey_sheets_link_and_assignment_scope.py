"""add survey sheets link and assignment scope

Revision ID: a41d8f6f1c2b
Revises: 45904853ac45
Create Date: 2026-05-25 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = "a41d8f6f1c2b"
down_revision: Union[str, Sequence[str], None] = "45904853ac45"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        "surveys",
        sa.Column("google_sheets_link", sa.String(length=500), nullable=True),
    )
    op.add_column(
        "group_teacher_disciplines",
        sa.Column("survey_id", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.create_foreign_key(
        "group_teacher_disciplines_survey_id_fkey",
        "group_teacher_disciplines",
        "surveys",
        ["survey_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.create_unique_constraint(
        "uq_survey_group_teacher_discipline",
        "group_teacher_disciplines",
        ["survey_id", "group_id", "teacher_id", "discipline_id"],
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint(
        "uq_survey_group_teacher_discipline",
        "group_teacher_disciplines",
        type_="unique",
    )
    op.drop_constraint(
        "group_teacher_disciplines_survey_id_fkey",
        "group_teacher_disciplines",
        type_="foreignkey",
    )
    op.drop_column("group_teacher_disciplines", "survey_id")
    op.drop_column("surveys", "google_sheets_link")
