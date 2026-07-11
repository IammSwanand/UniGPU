from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from app.config import get_settings

settings = get_settings()

engine = create_async_engine(settings.DATABASE_URL, echo=False, future=True)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db():
    """FastAPI dependency — yields an async DB session."""
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


async def init_db():
    """Import ORM models so metadata is registered.

    Database schema management is handled by Alembic migrations at startup.
    """
    from app.models import user, gpu, job, wallet  # noqa: F401 — register models


async def run_migrations() -> None:
    """Apply pending Alembic migrations."""
    import asyncio
    from alembic.config import Config
    from alembic import command

    def _upgrade() -> None:
        cfg = Config("alembic.ini")
        cfg.set_main_option("sqlalchemy.url", settings.DATABASE_URL)
        command.upgrade(cfg, "head")

    await asyncio.to_thread(_upgrade)
