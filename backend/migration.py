import sqlite3
import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def run_migration():
    """Add website column to research_opportunities table if it doesn't exist"""
    db_path = os.path.join('backend', 'app.db')
    logger.info(f"Running migration on database: {db_path}")
    
    conn = None
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check if column exists
        cursor.execute("PRAGMA table_info(research_opportunities)")
        columns = [info[1] for info in cursor.fetchall()]
        
        if 'website' not in columns:
            logger.info("Adding website column to research_opportunities table")
            cursor.execute("""
                ALTER TABLE research_opportunities 
                ADD COLUMN website TEXT
            """)
            conn.commit()
            logger.info("Website column added successfully")
        else:
            logger.info("Website column already exists")
            
        # Verify the column was added
        cursor.execute("PRAGMA table_info(research_opportunities)")
        updated_columns = [info[1] for info in cursor.fetchall()]
        logger.info(f"Updated columns: {updated_columns}")
        
    except Exception as e:
        logger.error(f"Migration error: {str(e)}")
        if conn:
            conn.rollback()
        raise
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    run_migration() 