#!/usr/bin/env python3
"""
Migration script to convert existing messages to JSON structure in conversations table
"""

import os
import sys
import psycopg2
from psycopg2 import sql
from dotenv import load_dotenv
import logging
import json
from datetime import datetime

# Add parent directory to path to import from database module
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env'))

class ConversationMigration:
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

    def add_conversation_content_column(self):
        """Add conversation_content column if it doesn't exist"""
        try:
            # Check if column exists
            check_query = """
                SELECT EXISTS (
                    SELECT 1 
                    FROM information_schema.columns 
                    WHERE table_name = 'conversations' 
                    AND column_name = 'conversation_content'
                )
            """
            self.cursor.execute(check_query)
            
            if not self.cursor.fetchone()[0]:
                logger.info("Adding conversation_content column...")
                alter_query = """
                    ALTER TABLE conversations 
                    ADD COLUMN conversation_content JSONB DEFAULT '{"messages": []}'::jsonb
                """
                self.cursor.execute(alter_query)
                
                # Add comment
                comment_query = """
                    COMMENT ON COLUMN conversations.conversation_content 
                    IS 'Stores all messages, thinking states, and transactions as a single JSON document'
                """
                self.cursor.execute(comment_query)
                
                # Create index
                index_query = """
                    CREATE INDEX IF NOT EXISTS idx_conversations_content_messages 
                    ON conversations USING GIN ((conversation_content -> 'messages'))
                """
                self.cursor.execute(index_query)
                
                logger.info("conversation_content column added successfully")
            else:
                logger.info("conversation_content column already exists")
                
        except Exception as e:
            logger.error(f"Error adding conversation_content column: {e}")
            raise

    def migrate_messages_to_json(self):
        """Migrate existing messages to the JSON structure"""
        try:
            # Get all conversations
            conv_query = "SELECT conversation_id FROM conversations"
            self.cursor.execute(conv_query)
            conversations = self.cursor.fetchall()
            
            logger.info(f"Found {len(conversations)} conversations to migrate")
            
            for (conv_id,) in conversations:
                # Get all messages for this conversation
                msg_query = """
                    SELECT 
                        message_id, role, content, timestamp, model,
                        parent_message_id, metadata, thinking_state, transaction_data
                    FROM messages
                    WHERE conversation_id = %s
                    ORDER BY timestamp ASC
                """
                self.cursor.execute(msg_query, (conv_id,))
                messages = self.cursor.fetchall()
                
                if not messages:
                    logger.info(f"No messages found for conversation {conv_id}")
                    continue
                
                # Build messages array
                messages_array = []
                for msg in messages:
                    message_obj = {
                        "id": str(msg[0]),
                        "role": msg[1],
                        "content": msg[2],
                        "timestamp": msg[3].isoformat() if msg[3] else None
                    }
                    
                    # Add optional fields
                    if msg[4]:  # model
                        message_obj["model"] = msg[4]
                    if msg[5]:  # parent_message_id
                        message_obj["parentMessageId"] = msg[5]
                    if msg[6]:  # metadata
                        message_obj["metadata"] = msg[6]
                    if msg[7]:  # thinking_state
                        message_obj["thinkingState"] = msg[7]
                    if msg[8]:  # transaction_data
                        message_obj["transaction"] = msg[8]
                    
                    messages_array.append(message_obj)
                
                # Update conversation with messages
                update_query = """
                    UPDATE conversations
                    SET conversation_content = %s::jsonb
                    WHERE conversation_id = %s
                """
                content = {"messages": messages_array}
                self.cursor.execute(update_query, (json.dumps(content), conv_id))
                
                logger.info(f"Migrated {len(messages_array)} messages for conversation {conv_id}")
            
            # Commit the transaction
            self.conn.commit()
            logger.info("Migration completed successfully!")
            
        except Exception as e:
            logger.error(f"Migration failed: {e}")
            self.conn.rollback()
            raise
        finally:
            self.cursor.close()
            self.conn.close()

    def verify_migration(self):
        """Verify the migration was successful"""
        try:
            # Check a few conversations
            verify_query = """
                SELECT 
                    conversation_id,
                    jsonb_array_length(conversation_content->'messages') as message_count
                FROM conversations
                WHERE conversation_content IS NOT NULL
                LIMIT 5
            """
            self.cursor.execute(verify_query)
            results = self.cursor.fetchall()
            
            logger.info("\nVerification Results:")
            for conv_id, msg_count in results:
                logger.info(f"Conversation {conv_id}: {msg_count} messages")
                
        except Exception as e:
            logger.error(f"Verification failed: {e}")

def main():
    """Main function to run the migration"""
    try:
        migration = ConversationMigration()
        
        # Step 1: Add the conversation_content column
        migration.add_conversation_content_column()
        
        # Step 2: Migrate existing messages
        migration.migrate_messages_to_json()
        
        # Step 3: Verify the migration
        migration.verify_migration()
        
    except Exception as e:
        logger.error(f"Migration failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()