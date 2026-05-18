"""uuid migration

Revision ID: d8e8bcefa876
Revises: 19828d1283bb
Create Date: 2026-05-18 18:25:52.939349

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "d8e8bcefa876"
down_revision: Union[str, Sequence[str], None] = "19828d1283bb"
branch_labels = None
depends_on = None


UUID = postgresql.UUID(as_uuid=True)


def upgrade() -> None:

    op.execute('CREATE EXTENSION IF NOT EXISTS "pgcrypto"')

    op.drop_constraint(
        "answers_survey_id_fkey",
        "answers",
        type_="foreignkey"
    )

    op.drop_constraint(
        "group_teacher_disciplines_group_id_fkey",
        "group_teacher_disciplines",
        type_="foreignkey"
    )

    op.drop_constraint(
        "group_teacher_disciplines_teacher_id_fkey",
        "group_teacher_disciplines",
        type_="foreignkey"
    )

    op.drop_constraint(
        "group_teacher_disciplines_discipline_id_fkey",
        "group_teacher_disciplines",
        type_="foreignkey"
    )


    op.drop_constraint("surveys_pkey", "surveys", type_="primary")

    op.add_column(
        "surveys",
        sa.Column(
            "new_id",
            UUID,
            nullable=False,
            server_default=sa.text("gen_random_uuid()")
        )
    )

    op.drop_column("surveys", "id")

    op.alter_column("surveys", "new_id", new_column_name="id")

    op.create_primary_key("surveys_pkey", "surveys", ["id"])


    op.drop_constraint("answers_pkey", "answers", type_="primary")

    op.add_column(
        "answers",
        sa.Column(
            "new_id",
            UUID,
            nullable=False,
            server_default=sa.text("gen_random_uuid()")
        )
    )

    op.add_column(
        "answers",
        sa.Column(
            "new_survey_id",
            UUID,
            nullable=True,
        )
    )

    op.drop_column("answers", "id")
    op.drop_column("answers", "survey_id")

    op.alter_column("answers", "new_id", new_column_name="id")
    op.alter_column("answers", "new_survey_id", new_column_name="survey_id")

    op.create_primary_key("answers_pkey", "answers", ["id"])


    op.drop_constraint("groups_pkey", "groups", type_="primary")

    op.add_column(
        "groups",
        sa.Column(
            "new_id",
            UUID,
            nullable=False,
            server_default=sa.text("gen_random_uuid()")
        )
    )

    op.drop_column("groups", "id")

    op.alter_column("groups", "new_id", new_column_name="id")

    op.create_primary_key("groups_pkey", "groups", ["id"])


    op.drop_constraint("teachers_pkey", "teachers", type_="primary")

    op.add_column(
        "teachers",
        sa.Column(
            "new_id",
            UUID,
            nullable=False,
            server_default=sa.text("gen_random_uuid()")
        )
    )

    op.drop_column("teachers", "id")

    op.alter_column("teachers", "new_id", new_column_name="id")

    op.create_primary_key("teachers_pkey", "teachers", ["id"])


    op.drop_constraint("disciplines_pkey", "disciplines", type_="primary")

    op.add_column(
        "disciplines",
        sa.Column(
            "new_id",
            UUID,
            nullable=False,
            server_default=sa.text("gen_random_uuid()")
        )
    )

    op.drop_column("disciplines", "id")

    op.alter_column("disciplines", "new_id", new_column_name="id")

    op.create_primary_key("disciplines_pkey", "disciplines", ["id"])


    op.drop_constraint("users_pkey", "users", type_="primary")

    op.add_column(
        "users",
        sa.Column(
            "new_id",
            UUID,
            nullable=False,
            server_default=sa.text("gen_random_uuid()")
        )
    )

    op.drop_column("users", "id")

    op.alter_column("users", "new_id", new_column_name="id")

    op.create_primary_key("users_pkey", "users", ["id"])


    op.drop_constraint(
        "group_teacher_disciplines_pkey",
        "group_teacher_disciplines",
        type_="primary"
    )

    op.add_column(
        "group_teacher_disciplines",
        sa.Column(
            "new_id",
            UUID,
            nullable=False,
            server_default=sa.text("gen_random_uuid()")
        )
    )

    op.add_column(
        "group_teacher_disciplines",
        sa.Column("new_group_id", UUID)
    )

    op.add_column(
        "group_teacher_disciplines",
        sa.Column("new_teacher_id", UUID)
    )

    op.add_column(
        "group_teacher_disciplines",
        sa.Column("new_discipline_id", UUID)
    )

    op.drop_column("group_teacher_disciplines", "id")
    op.drop_column("group_teacher_disciplines", "group_id")
    op.drop_column("group_teacher_disciplines", "teacher_id")
    op.drop_column("group_teacher_disciplines", "discipline_id")

    op.alter_column(
        "group_teacher_disciplines",
        "new_id",
        new_column_name="id"
    )

    op.alter_column(
        "group_teacher_disciplines",
        "new_group_id",
        new_column_name="group_id"
    )

    op.alter_column(
        "group_teacher_disciplines",
        "new_teacher_id",
        new_column_name="teacher_id"
    )

    op.alter_column(
        "group_teacher_disciplines",
        "new_discipline_id",
        new_column_name="discipline_id"
    )

    op.create_primary_key(
        "group_teacher_disciplines_pkey",
        "group_teacher_disciplines",
        ["id"]
    )

    op.create_foreign_key(
        "answers_survey_id_fkey",
        "answers",
        "surveys",
        ["survey_id"],
        ["id"],
        ondelete="CASCADE"
    )

    op.create_foreign_key(
        "group_teacher_disciplines_group_id_fkey",
        "group_teacher_disciplines",
        "groups",
        ["group_id"],
        ["id"],
        ondelete="CASCADE"
    )

    op.create_foreign_key(
        "group_teacher_disciplines_teacher_id_fkey",
        "group_teacher_disciplines",
        "teachers",
        ["teacher_id"],
        ["id"],
        ondelete="CASCADE"
    )

    op.create_foreign_key(
        "group_teacher_disciplines_discipline_id_fkey",
        "group_teacher_disciplines",
        "disciplines",
        ["discipline_id"],
        ["id"],
        ondelete="CASCADE"
    )


def downgrade() -> None:
    pass
