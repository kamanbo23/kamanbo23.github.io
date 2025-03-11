import os
import logging
from typing import Generator
from contextlib import contextmanager

from sqlalchemy import create_engine, event, exc
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables - in production, Railway will provide these
load_dotenv()

# Use SQLite by default for local development, Railway will provide DATABASE_URL in production
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///app.db")

# Railway uses 'postgres://' but SQLAlchemy requires 'postgresql://'
if DATABASE_URL and DATABASE_URL.startswith('postgres://'):
    DATABASE_URL = DATABASE_URL.replace('postgres://', 'postgresql://', 1)

logger.info(f"Using database: {DATABASE_URL.split('@')[0].split('//')[0]}/*****")

DEBUG_SQL = os.getenv("DEBUG_SQL", "False").lower() in ('true', '1', 't')

# Create engine with appropriate parameters based on the database type
try:
    if DATABASE_URL.startswith('sqlite'):
        # SQLite specific configuration
        engine = create_engine(
            DATABASE_URL,
            connect_args={"check_same_thread": False},
            echo=DEBUG_SQL
        )
        
        # Add pragma for better SQLite performance
        @event.listens_for(engine, "connect")
        def set_sqlite_pragma(dbapi_connection, connection_record):
            cursor = dbapi_connection.cursor()
            cursor.execute("PRAGMA journal_mode=WAL;")
            cursor.execute("PRAGMA synchronous=NORMAL;")
            cursor.execute("PRAGMA foreign_keys=ON;")
            cursor.close()
            
    else:
        # PostgreSQL configuration for Railway
        engine = create_engine(
            DATABASE_URL,
            pool_size=10,
            max_overflow=20,
            pool_pre_ping=True,  # Help detect stale connections
            pool_recycle=300,    # Recycle connections every 5 minutes
            echo=DEBUG_SQL
        )
        logger.info("Successfully configured PostgreSQL engine")
    
    logger.info(f"Connected to database: {DATABASE_URL.split('///')[0]}")
    
except exc.SQLAlchemyError as e:
    logger.error(f"Database connection error: {e}")
    raise

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# FastAPI dependency for DB session
def get_db() -> Generator[Session, None, None]:
    """Dependency for FastAPI to get a database session.
    
    This function creates a new SQLAlchemy session that will be used in a
    single request, and then closed once the request is finished.
    
    Yields:
        Session: The SQLAlchemy session
    """
    db = SessionLocal()
    try:
        yield db
    except exc.SQLAlchemyError as e:
        logger.error(f"Database error during request: {e}")
        db.rollback()
        raise
    finally:
        db.close()
        
@contextmanager
def get_db_context() -> Generator[Session, None, None]:
    """Context manager for getting a database session outside of FastAPI requests.
    
    Use this function with a 'with' statement for non-FastAPI code that needs
    database access (like scripts, background tasks, etc.)
    
    Example:
        with get_db_context() as db:
            user = db.query(User).filter(User.id == user_id).first()
    
    Yields:
        Session: The SQLAlchemy session
    """
    db = SessionLocal()
    try:
        yield db
    except exc.SQLAlchemyError as e:
        logger.error(f"Database error: {e}")
        db.rollback()
        raise
    finally:
        db.close()