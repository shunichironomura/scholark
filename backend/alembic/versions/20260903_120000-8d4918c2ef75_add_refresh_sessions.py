"""Add refresh sessions

Revision ID: 8d4918c2ef75
Revises: f510e294b98a
Create Date: 2026-09-03 12:00:00+00:00

"""

from collections.abc import Sequence

import sqlalchemy as sa
import sqlmodel.sql.sqltypes

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "8d4918c2ef75"
down_revision: str | None = "f510e294b98a"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "refreshsession",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("token_hash", sqlmodel.sql.sqltypes.AutoString(length=64), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["user.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_refreshsession_token_hash"), "refreshsession", ["token_hash"], unique=True)
    op.create_index(op.f("ix_refreshsession_user_id"), "refreshsession", ["user_id"], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f("ix_refreshsession_user_id"), table_name="refreshsession")
    op.drop_index(op.f("ix_refreshsession_token_hash"), table_name="refreshsession")
    op.drop_table("refreshsession")
