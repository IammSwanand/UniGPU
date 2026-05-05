"""add gpu locking fields

Revision ID: 0002_add_gpu_locking
Revises: 0001_initial_schema
Create Date: 2026-05-05 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "0002_add_gpu_locking"
down_revision = "0001_initial_schema"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add GPU locking columns for pessimistic concurrency control
    op.add_column(
        "gpus",
        sa.Column("locked_by_job_id", sa.String(), nullable=True)
    )
    op.add_column(
        "gpus",
        sa.Column("locked_until", sa.DateTime(timezone=True), nullable=True)
    )


def downgrade() -> None:
    # Remove GPU locking columns
    op.drop_column("gpus", "locked_until")
    op.drop_column("gpus", "locked_by_job_id")
