"""google_oauth_support

Revision ID: 0007_google_oauth
Revises: f451283e1832
Create Date: 2026-07-24

Changes:
- hashed_password: NOT NULL → nullable (Google-only users have no password)
- Add google_id column (VARCHAR, unique, nullable, indexed)
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers
revision = "0007_google_oauth"
down_revision = "f451283e1832"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Make hashed_password nullable
    op.alter_column(
        "users",
        "hashed_password",
        existing_type=sa.String(),
        nullable=True,
    )

    # 2. Add google_id column
    op.add_column(
        "users",
        sa.Column("google_id", sa.String(), nullable=True),
    )

    # 3. Add unique constraint + index on google_id
    op.create_index("ix_users_google_id", "users", ["google_id"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_users_google_id", table_name="users")
    op.drop_column("users", "google_id")
    op.alter_column(
        "users",
        "hashed_password",
        existing_type=sa.String(),
        nullable=False,
    )
