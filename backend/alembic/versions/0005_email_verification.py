"""add email verification fields

Revision ID: 0005_email_verification
Revises: 0004_username_not_unique
Create Date: 2026-07-12 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "0005_email_verification"
down_revision = "0004_username_not_unique"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("is_email_verified", sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column("users", sa.Column("email_verification_token_hash", sa.String(), nullable=True))
    op.add_column(
        "users",
        sa.Column("email_verification_expires", sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("users", "email_verification_expires")
    op.drop_column("users", "email_verification_token_hash")
    op.drop_column("users", "is_email_verified")