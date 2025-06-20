#!/usr/bin/env python3
"""
Migration script to add thinking state and transaction data columns to messages table
Run this to ensure the database has all required columns for conversation history

Requirements:
- psycopg2-binary: pip install psycopg2-binary
- python-dotenv: pip install python-dotenv

Usage:
    cd database/notebooks
    python migration.py
"""

import os
import sys
import psycopg2
from psycopg2 import sql
from dotenv import load_dotenv
import logging

# Add parent directory to path to import from database module
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env'))

class DatabaseMigration:
    def __init__(self):
        """Initialize database connection"""
        try:
            self.conn = psycopg2.connect(
                host=os.getenv('POSTGRES_HOST', 'localhost'),
                database=os.getenv('POSTGRES_DB', 'neuralabs'),
                user=os.getenv('POSTGRES_USER', 'neuralabs_postgres'),
                password=os.getenv('POSTGRES_PASSWORD', 'neurapass@2025'),
                port=os.getenv('POSTGRES_PORT', '5432')
            )
            self.conn.autocommit = False
            self.cursor = self.conn.cursor()
            logger.info("Successfully connected to PostgreSQL database")
        except Exception as e:
            logger.error(f"Failed to connect to database: {e}")
            raise

    def column_exists(self, table_name, column_name):
        """Check if a column exists in a table"""
        query = """
            SELECT EXISTS (
                SELECT 1 
                FROM information_schema.columns 
                WHERE table_name = %s AND column_name = %s
            )
        """
        self.cursor.execute(query, (table_name, column_name))
        return self.cursor.fetchone()[0]

    def constraint_exists(self, table_name, constraint_name):
        """Check if a constraint exists on a table"""
        query = """
            SELECT EXISTS (
                SELECT 1 
                FROM information_schema.table_constraints 
                WHERE table_name = %s AND constraint_name = %s
            )
        """
        self.cursor.execute(query, (table_name, constraint_name))
        return self.cursor.fetchone()[0]

    def index_exists(self, index_name):
        """Check if an index exists"""
        query = """
            SELECT EXISTS (
                SELECT 1 
                FROM pg_indexes 
                WHERE indexname = %s
            )
        """
        self.cursor.execute(query, (index_name,))
        return self.cursor.fetchone()[0]

    def add_column_if_not_exists(self, table_name, column_name, column_type, comment=None):
        """Add a column to a table if it doesn't exist"""
        if not self.column_exists(table_name, column_name):
            query = sql.SQL("ALTER TABLE {} ADD COLUMN {} {}").format(
                sql.Identifier(table_name),
                sql.Identifier(column_name),
                sql.SQL(column_type)
            )
            self.cursor.execute(query)
            logger.info(f"Added column {column_name} to table {table_name}")
            
            if comment:
                comment_query = sql.SQL("COMMENT ON COLUMN {}.{} IS %s").format(
                    sql.Identifier(table_name),
                    sql.Identifier(column_name)
                )
                self.cursor.execute(comment_query, (comment,))
        else:
            logger.info(f"Column {column_name} already exists in table {table_name}")

    def rename_column_if_exists(self, table_name, old_column_name, new_column_name):
        """Rename a column if it exists and the new name doesn't exist"""
        if self.column_exists(table_name, old_column_name) and not self.column_exists(table_name, new_column_name):
            query = sql.SQL("ALTER TABLE {} RENAME COLUMN {} TO {}").format(
                sql.Identifier(table_name),
                sql.Identifier(old_column_name),
                sql.Identifier(new_column_name)
            )
            self.cursor.execute(query)
            logger.info(f"Renamed column {old_column_name} to {new_column_name} in table {table_name}")
        elif self.column_exists(table_name, new_column_name):
            logger.info(f"Column {new_column_name} already exists in table {table_name}")
        else:
            logger.info(f"Column {old_column_name} does not exist in table {table_name}")

    def create_index_if_not_exists(self, index_name, table_name, column_name):
        """Create an index if it doesn't exist"""
        if not self.index_exists(index_name):
            query = sql.SQL("CREATE INDEX {} ON {} ({})").format(
                sql.Identifier(index_name),
                sql.Identifier(table_name),
                sql.Identifier(column_name)
            )
            self.cursor.execute(query)
            logger.info(f"Created index {index_name} on {table_name}.{column_name}")
        else:
            logger.info(f"Index {index_name} already exists")

    def run_migration(self):
        """Run all migration steps"""
        try:
            logger.info("Starting database migration...")
            
            # Add columns to messages table
            logger.info("Updating messages table...")
            
            # Add thinking_state column
            self.add_column_if_not_exists(
                'messages', 
                'thinking_state', 
                'JSONB',
                'Stores the thinking UI state including execution steps'
            )
            
            # Add transaction_data column
            self.add_column_if_not_exists(
                'messages', 
                'transaction_data', 
                'JSONB',
                'Stores proposed blockchain transactions'
            )
            
            # Add metadata column
            self.add_column_if_not_exists(
                'messages', 
                'metadata', 
                'JSONB',
                'Additional message metadata'
            )
            
            # Add parent_message_id column
            self.add_column_if_not_exists(
                'messages', 
                'parent_message_id', 
                'VARCHAR(255)',
                'Links assistant messages to their parent user messages'
            )
            
            # Add model column
            self.add_column_if_not_exists(
                'messages', 
                'model', 
                'VARCHAR(100)'
            )
            
            # Rename sender_type to role if needed
            self.rename_column_if_exists('messages', 'sender_type', 'role')
            
            # Rename created_at to timestamp if needed
            self.rename_column_if_exists('messages', 'created_at', 'timestamp')
            
            # Update conversations table
            logger.info("Updating conversations table...")
            
            # Add updated_at column
            self.add_column_if_not_exists(
                'conversations', 
                'updated_at', 
                'TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
            )
            
            # Add agent_id column
            self.add_column_if_not_exists(
                'conversations', 
                'agent_id', 
                'VARCHAR(255)'
            )
            
            # Create indexes for better performance
            logger.info("Creating indexes...")
            self.create_index_if_not_exists('idx_messages_conversation_id', 'messages', 'conversation_id')
            self.create_index_if_not_exists('idx_messages_parent_message_id', 'messages', 'parent_message_id')
            
            # Update constraints
            logger.info("Updating constraints...")
            
            # Drop old constraint if it exists
            if self.constraint_exists('messages', 'messages_sender_type_check'):
                self.cursor.execute("ALTER TABLE messages DROP CONSTRAINT messages_sender_type_check")
                logger.info("Dropped old messages_sender_type_check constraint")
            
            # Add new constraint if it doesn't exist
            if not self.constraint_exists('messages', 'messages_role_check'):
                self.cursor.execute("""
                    ALTER TABLE messages ADD CONSTRAINT messages_role_check 
                    CHECK (role IN ('user', 'assistant'))
                """)
                logger.info("Added messages_role_check constraint")
            
            # Commit the transaction
            self.conn.commit()
            logger.info("Migration completed successfully!")
            
            # Verify the changes
            self.verify_migration()
            
        except Exception as e:
            logger.error(f"Migration failed: {e}")
            self.conn.rollback()
            raise
        finally:
            self.cursor.close()
            self.conn.close()

    def verify_migration(self):
        """Verify that all expected columns exist"""
        logger.info("\nVerifying migration...")
        
        # Check messages table columns
        messages_columns = [
            'message_id', 'conversation_id', 'role', 'content', 'timestamp',
            'model', 'parent_message_id', 'metadata', 'thinking_state', 'transaction_data'
        ]
        
        logger.info("Checking messages table columns:")
        for column in messages_columns:
            exists = self.column_exists('messages', column)
            status = "✓" if exists else "✗"
            logger.info(f"  {status} {column}")
        
        # Check conversations table columns
        conversations_columns = ['conversation_id', 'user_id', 'title', 'created_at', 'updated_at', 'agent_id']
        
        logger.info("\nChecking conversations table columns:")
        for column in conversations_columns:
            exists = self.column_exists('conversations', column)
            status = "✓" if exists else "✗"
            logger.info(f"  {status} {column}")
        
        # Check indexes
        indexes = ['idx_messages_conversation_id', 'idx_messages_parent_message_id']
        
        logger.info("\nChecking indexes:")
        for index in indexes:
            exists = self.index_exists(index)
            status = "✓" if exists else "✗"
            logger.info(f"  {status} {index}")

def main():
    """Main function to run the migration"""
    try:
        migration = DatabaseMigration()
        migration.run_migration()
    except Exception as e:
        logger.error(f"Migration failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()