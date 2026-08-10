"""add location

Revision ID: 64380556e9fd
Revises: 32079445d8ec
Create Date: 2026-08-11 01:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '64380556e9fd'
down_revision = '32079445d8ec'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('users', sa.Column('location', sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column('users', 'location')
