"""Add user activity

Revision ID: ec1c40f37dd9
Revises: 6cf91349339e
Create Date: 2026-08-15 13:13:05.753669

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
"""Add user activity

Revision ID: ec1c40f37dd9
Revises: 6cf91349339e
Create Date: 2026-08-15 13:13:05.753669

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'ec1c40f37dd9'
down_revision = '6cf91349339e'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table('user_activities',
    sa.Column('id', sa.VARCHAR(), autoincrement=False, nullable=False),
    sa.Column('user_id', sa.VARCHAR(), autoincrement=False, nullable=True),
    sa.Column('action', sa.VARCHAR(), autoincrement=False, nullable=False),
    sa.Column('description', sa.VARCHAR(), autoincrement=False, nullable=True),
    sa.Column('ip_address', sa.VARCHAR(), autoincrement=False, nullable=True),
    sa.Column('metadata_payload', postgresql.JSONB(astext_type=sa.Text()), autoincrement=False, nullable=True),
    sa.Column('timestamp', postgresql.TIMESTAMP(timezone=True), autoincrement=False, nullable=False),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], name='user_activities_user_id_fkey', ondelete='SET NULL'),
    sa.PrimaryKeyConstraint('id', name='user_activities_pkey')
    )
    op.create_index(op.f('ix_user_activities_timestamp'), 'user_activities', ['timestamp'], unique=False)
    op.create_index(op.f('ix_user_activities_user_id'), 'user_activities', ['user_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_user_activities_user_id'), table_name='user_activities')
    op.drop_index(op.f('ix_user_activities_timestamp'), table_name='user_activities')
    op.drop_table('user_activities')