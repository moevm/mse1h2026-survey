"""add user auth services

Revision ID: f1c7a0d9b2e4
Revises: 45904853ac45
Create Date: 2026-05-25 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = "f1c7a0d9b2e4"
down_revision: Union[str, Sequence[str], None] = "45904853ac45"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto")
    op.alter_column("users", "hashed_password", existing_type=sa.String(), nullable=True)

    op.create_table(
        "user_password_credentials",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("algorithm", sa.String(length=50), nullable=False),
        sa.Column("password_hash", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "algorithm", name="uq_user_password_algorithm"),
    )
    op.create_table(
        "user_ldap_identities",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("external_id", sa.String(length=255), nullable=False),
        sa.Column("id_attribute", sa.String(length=100), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id"),
        sa.UniqueConstraint("external_id", "id_attribute", name="uq_ldap_external_identity"),
    )

    op.execute(
        """
        INSERT INTO user_password_credentials (id, user_id, algorithm, password_hash, created_at)
        SELECT gen_random_uuid(), id, 'bcrypt', hashed_password, NOW()
        FROM users
        WHERE hashed_password IS NOT NULL
        """
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.execute(
        """
        UPDATE users
        SET hashed_password = credentials.password_hash
        FROM user_password_credentials AS credentials
        WHERE credentials.user_id = users.id
          AND credentials.algorithm = 'bcrypt'
        """
    )
    op.drop_table("user_ldap_identities")
    op.drop_table("user_password_credentials")
    op.alter_column("users", "hashed_password", existing_type=sa.String(), nullable=False)
