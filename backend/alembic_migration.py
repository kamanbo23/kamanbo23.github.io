from alembic import op
import sqlalchemy as sa
from sqlalchemy.exc import ProgrammingError, OperationalError

# revision identifiers
revision = 'add_website_column'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    """Add website column to research_opportunities table"""
    try:
        # For PostgreSQL
        op.execute("""
        ALTER TABLE research_opportunities
        ADD COLUMN website TEXT;
        """)
        print("Website column added successfully to research_opportunities table")
    except (ProgrammingError, OperationalError) as e:
        # If column already exists or other error
        print(f"Error adding column (may already exist): {str(e)}")
        pass

def downgrade():
    """Remove website column from research_opportunities table"""
    try:
        op.drop_column('research_opportunities', 'website')
        print("Website column removed from research_opportunities table")
    except (ProgrammingError, OperationalError) as e:
        print(f"Error removing column: {str(e)}")
        pass

# For direct execution without Alembic
if __name__ == "__main__":
    # Create an Alembic context manually
    from alembic.config import Config
    from alembic.runtime.environment import EnvironmentContext
    from sqlalchemy import create_engine
    import os
    
    # Get database URL from environment
    database_url = os.environ.get('DATABASE_URL')
    if database_url and database_url.startswith('postgres://'):
        # Fix for SQLAlchemy 1.4+ compatibility
        database_url = database_url.replace('postgres://', 'postgresql://', 1)
    
    if not database_url:
        database_url = os.environ.get('RAILWAY_DATABASE_URL')
        if database_url and database_url.startswith('postgres://'):
            database_url = database_url.replace('postgres://', 'postgresql://', 1)
    
    if not database_url:
        # Fallback to local development database
        database_url = "postgresql://postgres:password@localhost:5432/appdb"
    
    # Create engine and run upgrade
    engine = create_engine(database_url)
    with engine.connect() as connection:
        # Run the migration
        print(f"Running migration on database: {database_url.split('@')[1] if '@' in database_url else database_url}")
        upgrade()
        print("Migration completed") 