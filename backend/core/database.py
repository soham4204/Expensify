from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from .config import settings

# Neon postgres URLs often start with postgresql:// but SQLAlchemy sometimes prefers postgresql+psycopg2:// or similar depending on the driver.
# psycopg2 is standard. If the URL starts with postgres://, SQLAlchemy 1.4+ requires it to be postgresql://
SQLALCHEMY_DATABASE_URL = settings.DATABASE_URL.replace("postgres://", "postgresql://")

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, pool_pre_ping=True
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
