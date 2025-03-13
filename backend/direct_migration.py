import os
import psycopg2
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def run_direct_migration():
    """Run direct SQL to add website column to PostgreSQL database"""
    # Get database URL from environment
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        database_url = os.environ.get('RAILWAY_DATABASE_URL')
    
    if not database_url:
        logger.error("No database URL found in environment variables")
        return
    
    logger.info(f"Running direct migration on database: {database_url.split('@')[1] if '@' in database_url else 'hidden'}")
    
    conn = None
    try:
        # Connect to PostgreSQL database
        conn = psycopg2.connect(database_url)
        conn.autocommit = True
        cursor = conn.cursor()
        
        # Check if column exists
        cursor.execute("""
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='research_opportunities' AND column_name='website';
        """)
        
        if cursor.fetchone() is None:
            logger.info("Adding website column to research_opportunities table")
            # Add the column if it doesn't exist
            cursor.execute("""
            ALTER TABLE research_opportunities 
            ADD COLUMN website TEXT;
            """)
            logger.info("Website column added successfully")
        else:
            logger.info("Website column already exists")
            
    except Exception as e:
        logger.error(f"Direct migration error: {str(e)}")
    finally:
        if conn:
            conn.close()
            logger.info("Database connection closed")

if __name__ == "__main__":
    run_direct_migration() 