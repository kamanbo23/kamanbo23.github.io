import os
import logging
from typing import Generator
from contextlib import contextmanager

from sqlalchemy import create_engine, event, exc, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from dotenv import load_dotenv

# Configure logging for better visibility
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Load environment variables - in production, Railway will provide these
load_dotenv()

# Debug available environment variables related to databases
logger.info("Database Environment Variables:")
for key, value in os.environ.items():
    if "DATABASE" in key or "DB_" in key:
        # Mask the value for security
        masked_value = value[:10] + "..." if value and len(value) > 12 else value
        logger.info(f"  {key}: {masked_value}")

# First check for RAILWAY_DATABASE_URL, then DATABASE_URL, then fallback to SQLite
if os.getenv("RAILWAY_DATABASE_URL"):
    logger.info("Using RAILWAY_DATABASE_URL environment variable")
    DATABASE_URL = os.getenv("RAILWAY_DATABASE_URL")
elif os.getenv("DATABASE_URL"):
    logger.info("Using DATABASE_URL environment variable")
    DATABASE_URL = os.getenv("DATABASE_URL")
else:
    logger.warning("No DATABASE_URL found, falling back to SQLite")
    DATABASE_URL = "sqlite:///app.db"

# Railway uses 'postgres://' but SQLAlchemy requires 'postgresql://'
if DATABASE_URL and DATABASE_URL.startswith('postgres://'):
    logger.info("Converting postgres:// to postgresql:// for SQLAlchemy compatibility")
    DATABASE_URL = DATABASE_URL.replace('postgres://', 'postgresql://', 1)

# Create a safe version of the URL for logging
if DATABASE_URL:
    db_type = DATABASE_URL.split(":")[0]
    logger.info(f"Database type: {db_type}")
    
    # Mask credentials in URL for logging
    if '@' in DATABASE_URL:
        masked_url = DATABASE_URL.split('@')[0].split('//')[0] + '//*****@' + DATABASE_URL.split('@')[1]
    else:
        masked_url = DATABASE_URL
    logger.info(f"Using database: {masked_url}")
else:
    logger.error("DATABASE_URL is empty or None!")

DEBUG_SQL = os.getenv("DEBUG_SQL", "False").lower() in ('true', '1', 't')

# Create engine with appropriate parameters based on the database type
try:
    if DATABASE_URL.startswith('sqlite'):
        # SQLite specific configuration
        logger.info("Configuring SQLite engine")
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
        logger.info("Configuring PostgreSQL engine")
        engine = create_engine(
            DATABASE_URL,
            pool_size=10,
            max_overflow=20,
            pool_pre_ping=True,  # Help detect stale connections
            pool_recycle=300,    # Recycle connections every 5 minutes
            echo=DEBUG_SQL
        )
        logger.info("Successfully configured PostgreSQL engine")
    
    # Test the engine connection immediately - Make sure to use text() function
    logger.info("Testing database connection...")
    try:
        with engine.connect() as conn:
            # IMPORTANT: Use text() to create a proper SQL expression
            query_result = conn.execute(text("SELECT 1")).scalar()
            logger.info(f"Database connection test successful: {query_result}")
    except Exception as e:
        logger.error(f"Database connection test failed: {str(e)}")
        raise
    
except exc.SQLAlchemyError as e:
    logger.error(f"Database connection error: {str(e)}")
    # Log critical details for debugging but don't crash
    logger.error(f"DATABASE_URL type: {DATABASE_URL.split(':')[0] if DATABASE_URL else 'None'}")
    logger.error(f"Engine creation failed")
    
    # Create a fallback SQLite engine for development/testing
    if not DATABASE_URL.startswith('sqlite'):
        logger.warning("Falling back to SQLite engine as contingency")
        DATABASE_URL = "sqlite:///app.db"
        engine = create_engine(
            DATABASE_URL,
            connect_args={"check_same_thread": False},
            echo=DEBUG_SQL
        )
    else:
        # If we're already using SQLite and it failed, re-raise the error
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
        logger.error(f"Database error during request: {str(e)}")
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
        logger.error(f"Database error: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()