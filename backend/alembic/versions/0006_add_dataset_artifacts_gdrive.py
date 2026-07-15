"""add dataset, artifacts, and gdrive columns to jobs

Revision ID: 0006_dataset_artifacts_gdrive
Revises: 0005_email_verification
Create Date: 2026-07-15 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "0006_dataset_artifacts_gdrive"
down_revision = "0005_email_verification"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Dataset: path to uploaded CSV or Google Drive-fetched file in OCI/local storage
    op.add_column("jobs", sa.Column("dataset_path", sa.String(), nullable=True))

    # Google Drive fields (backend-only — never exposed to agent or provider)
    op.add_column("jobs", sa.Column("gdrive_file_id", sa.String(), nullable=True))
    op.add_column("jobs", sa.Column("gdrive_refresh_token_enc", sa.Text(), nullable=True))

    # Output artifacts: OCI key or local path for the zip uploaded by the agent
    op.add_column("jobs", sa.Column("artifacts_path", sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column("jobs", "artifacts_path")
    op.drop_column("jobs", "gdrive_refresh_token_enc")
    op.drop_column("jobs", "gdrive_file_id")
    op.drop_column("jobs", "dataset_path")
