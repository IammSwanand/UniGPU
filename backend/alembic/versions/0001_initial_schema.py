"""initial schema

Revision ID: 0001_initial_schema
Revises: 
Create Date: 2026-05-04 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "0001_initial_schema"
down_revision = None
branch_labels = None
depends_on = None


user_role = sa.Enum("client", "provider", "admin", name="userrole")
gpu_status = sa.Enum("online", "busy", "offline", name="gpustatus")
job_status = sa.Enum(
    "pending", "queued", "running", "completed", "failed", "cancelled", name="jobstatus"
)
transaction_type = sa.Enum("credit", "debit", name="transactiontype")


def upgrade() -> None:
    bind = op.get_bind()
    user_role.create(bind, checkfirst=True)
    gpu_status.create(bind, checkfirst=True)
    job_status.create(bind, checkfirst=True)
    transaction_type.create(bind, checkfirst=True)

    op.create_table(
        "users",
        sa.Column("id", sa.String(), primary_key=True, nullable=False),
        sa.Column("email", sa.String(), nullable=False),
        sa.Column("username", sa.String(), nullable=False),
        sa.Column("hashed_password", sa.String(), nullable=False),
        sa.Column("role", user_role, nullable=False, server_default="client"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)
    op.create_index(op.f("ix_users_username"), "users", ["username"], unique=True)

    op.create_table(
        "wallets",
        sa.Column("id", sa.String(), primary_key=True, nullable=False),
        sa.Column("user_id", sa.String(), nullable=False),
        sa.Column("balance", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.UniqueConstraint("user_id"),
    )

    op.create_table(
        "gpus",
        sa.Column("id", sa.String(), primary_key=True, nullable=False),
        sa.Column("provider_id", sa.String(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("vram_mb", sa.Integer(), nullable=False),
        sa.Column("cuda_version", sa.String(), nullable=True),
        sa.Column("status", gpu_status, nullable=False, server_default="offline"),
        sa.Column("last_heartbeat", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["provider_id"], ["users.id"]),
    )

    op.create_table(
        "jobs",
        sa.Column("id", sa.String(), primary_key=True, nullable=False),
        sa.Column("client_id", sa.String(), nullable=False),
        sa.Column("gpu_id", sa.String(), nullable=True),
        sa.Column("script_path", sa.String(), nullable=False),
        sa.Column("requirements_path", sa.String(), nullable=True),
        sa.Column("status", job_status, nullable=False, server_default="pending"),
        sa.Column("logs", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["client_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["gpu_id"], ["gpus.id"]),
    )

    op.create_table(
        "transactions",
        sa.Column("id", sa.String(), primary_key=True, nullable=False),
        sa.Column("wallet_id", sa.String(), nullable=False),
        sa.Column("amount", sa.Float(), nullable=False),
        sa.Column("type", transaction_type, nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["wallet_id"], ["wallets.id"]),
    )


def downgrade() -> None:
    op.drop_table("transactions")
    op.drop_table("jobs")
    op.drop_table("gpus")
    op.drop_table("wallets")
    op.drop_index(op.f("ix_users_username"), table_name="users")
    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_table("users")

    bind = op.get_bind()
    transaction_type.drop(bind, checkfirst=True)
    job_status.drop(bind, checkfirst=True)
    gpu_status.drop(bind, checkfirst=True)
    user_role.drop(bind, checkfirst=True)