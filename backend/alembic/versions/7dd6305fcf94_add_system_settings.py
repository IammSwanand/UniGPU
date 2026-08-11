"""add system settings

Revision ID: 7dd6305fcf94
Revises: 6cc5294fcf93
Create Date: 2026-08-11 18:20:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7dd6305fcf94'
down_revision: Union[str, None] = '6cc5294fcf93'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('system_settings',
    sa.Column('id', sa.String(), nullable=False),
    sa.Column('overdraft_limit', sa.Float(), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    op.drop_table('system_settings')
