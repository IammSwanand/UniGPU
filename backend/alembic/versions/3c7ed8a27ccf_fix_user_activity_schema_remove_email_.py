"""Fix user_activity schema - remove email, add FK, cap user_agent

Revision ID: 3c7ed8a27ccf
Revises: ec1c40f37dd9
Create Date: 2026-08-15 13:22:13.367167

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '3c7ed8a27ccf'
down_revision = 'ec1c40f37dd9'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add columns that were missing from the initial migration
    op.add_column('user_activities', sa.Column('username', sa.String(), nullable=True))
    op.add_column('user_activities', sa.Column('role', sa.String(), nullable=True))
    op.add_column('user_activities', sa.Column('user_agent', sa.String(length=512), nullable=True))

    # Switch metadata_payload from JSONB → JSON (standard, no dialect lock-in)
    op.alter_column(
        'user_activities', 'metadata_payload',
        existing_type=postgresql.JSONB(astext_type=sa.Text()),
        type_=sa.JSON(),
        existing_nullable=True,
    )

    # Add index on action column for fast filtering
    op.create_index(
        op.f('ix_user_activities_action'), 'user_activities', ['action'], unique=False
    )

    # FK (user_activities_user_id_fkey) was already created in the initial migration


def downgrade() -> None:
    op.drop_index(op.f('ix_user_activities_action'), table_name='user_activities')
    op.alter_column(
        'user_activities', 'metadata_payload',
        existing_type=sa.JSON(),
        type_=postgresql.JSONB(astext_type=sa.Text()),
        existing_nullable=True,
    )
    op.drop_column('user_activities', 'user_agent')
    op.drop_column('user_activities', 'role')
    op.drop_column('user_activities', 'username')