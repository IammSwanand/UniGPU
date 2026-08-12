"""merge enterprise and 2fa migrations

Revision ID: a9442da85d6b
Revises: 6cc5294fcf93, c3b975bf3c53
Create Date: 2026-08-12 19:10:00.043979

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'a9442da85d6b'
down_revision = ('6cc5294fcf93', 'c3b975bf3c53')
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass