"""add_enterprise_role

Revision ID: 6cc5294fcf93
Revises: 6908ef4bed51
Create Date: 2026-08-11 16:25:32.159949

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '6cc5294fcf93'
down_revision = '6908ef4bed51'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add 'enterprise' to the userrole enum
    # We use IF NOT EXISTS just in case (though PostgreSQL 12+ supports IF NOT EXISTS for ALTER TYPE ADD VALUE)
    op.execute("ALTER TYPE userrole ADD VALUE IF NOT EXISTS 'enterprise'")


def downgrade() -> None:
    # Removing a value from an enum is complex in Postgres, usually requires recreating the type
    pass