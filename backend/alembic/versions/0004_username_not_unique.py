"""make username non-unique

Revision ID: 0004_username_not_unique
Revises: 0003_password_reset
Create Date: 2026-07-12 00:00:00.000000

"""
from alembic import op


# revision identifiers, used by Alembic.
revision = "0004_username_not_unique"
down_revision = "0003_password_reset"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.drop_index(op.f("ix_users_username"), table_name="users")
    op.create_index(op.f("ix_users_username"), "users", ["username"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_users_username"), table_name="users")
    op.create_index(op.f("ix_users_username"), "users", ["username"], unique=True)