#!/usr/bin/env python3
"""
Database Initialization Script for NeuraLabs

This script creates all database tables and Redis configurations based on the 
database_schema.yaml file. It handles both PostgreSQL and Redis initialization.
"""

import os
import sys
import yaml
import psycopg2
import redis
import json
from datetime import datetime
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
load_dotenv()

class DatabaseInitializer:
    def __init__(self):
        """Initialize database connections and load schema"""
        self.pg_conn = None
        self.pg_cursor = None
        self.redis_conn = None
        self.schema = None
        
        # Load schema from YAML
        self.load_schema()
        
        # Initialize connections
        self.connect_postgresql()
        self.connect_redis()
    
    def load_schema(self):
        """Load database schema from YAML file"""
        schema_path = os.path.join(os.path.dirname(__file__), 'database_schema.yaml')
        try:
            with open(schema_path, 'r') as file:
                self.schema = yaml.safe_load(file)
            print(f"✅ Loaded database schema from {schema_path}")
        except FileNotFoundError:
            print(f"❌ Schema file not found: {schema_path}")
            sys.exit(1)
        except yaml.YAMLError as e:
            print(f"❌ Error parsing YAML schema: {e}")
            sys.exit(1)
    
    def connect_postgresql(self):
        """Establish PostgreSQL connection"""
        try:
            self.pg_conn = psycopg2.connect(
                host=os.getenv('POSTGRES_HOST', 'localhost'),
                database=os.getenv('POSTGRES_DB'),
                user=os.getenv('POSTGRES_USER'),
                password=os.getenv('POSTGRES_PASSWORD'),
                port=os.getenv('POSTGRES_PORT', '5432')
            )
            self.pg_cursor = self.pg_conn.cursor()
            print("✅ Connected to PostgreSQL successfully")
        except Exception as e:
            print(f"❌ Failed to connect to PostgreSQL: {e}")
            sys.exit(1)
    
    def connect_redis(self):
        """Establish Redis connection"""
        try:
            self.redis_conn = redis.Redis(
                host=os.getenv('REDIS_HOST', 'localhost'),
                port=int(os.getenv('REDIS_PORT', '6379')),
                password=os.getenv('REDIS_PASSWORD'),
                decode_responses=True
            )
            self.redis_conn.ping()
            print("✅ Connected to Redis successfully")
        except Exception as e:
            print(f"❌ Failed to connect to Redis: {e}")
            sys.exit(1)
    
    def get_sql_type(self, column_def):
        """Convert YAML column definition to SQL type"""
        col_type = column_def['type']
        
        # Handle special cases
        if col_type == 'SERIAL':
            return 'SERIAL'
        elif 'VARCHAR' in col_type:
            return col_type
        elif col_type == 'TEXT':
            return 'TEXT'
        elif col_type == 'JSONB':
            return 'JSONB'
        elif col_type == 'TIMESTAMP':
            return 'TIMESTAMP'
        elif col_type == 'INTEGER':
            return 'INTEGER'
        elif col_type == 'UUID':
            return 'UUID'
        else:
            return col_type
    
    def get_column_constraints(self, column_name, column_def):
        """Generate SQL constraints for a column"""
        constraints = []
        
        # Primary key
        if column_def.get('primary_key', False):
            constraints.append('PRIMARY KEY')
        
        # Not null (unless explicitly nullable)
        if not column_def.get('nullable', False) and not column_def.get('primary_key', False):
            constraints.append('NOT NULL')
        
        # Unique constraint
        if column_def.get('unique', False):
            constraints.append('UNIQUE')
        
        # Default value
        if 'default' in column_def:
            default_val = column_def['default']
            if default_val == 'CURRENT_TIMESTAMP':
                constraints.append('DEFAULT CURRENT_TIMESTAMP')
            elif default_val == 'gen_random_uuid()':
                constraints.append('DEFAULT gen_random_uuid()')
            elif isinstance(default_val, str) and default_val.startswith('"') and default_val.endswith('"'):
                constraints.append(f'DEFAULT {default_val}')
            else:
                constraints.append(f"DEFAULT '{default_val}'")
        
        # Check constraints
        if 'check' in column_def:
            constraints.append(f"CHECK ({column_name} {column_def['check']})")
        
        # References (foreign key)
        if 'references' in column_def:
            ref_table, ref_column = column_def['references'].split('.')
            constraints.append(f'REFERENCES {ref_table}({ref_column})')
        
        return ' '.join(constraints)
    
    def create_table(self, table_name, table_def):
        """Create a single table"""
        print(f"Creating {table_name} table...")
        
        columns = []
        primary_keys = []
        
        # Process columns
        for col_name, col_def in table_def['columns'].items():
            sql_type = self.get_sql_type(col_def)
            constraints = self.get_column_constraints(col_name, col_def)
            
            column_sql = f"{col_name} {sql_type}"
            if constraints:
                column_sql += f" {constraints}"
            
            columns.append(column_sql)
            
            # Track primary keys for composite keys
            if col_def.get('primary_key', False):
                primary_keys.append(col_name)
        
        # Handle composite primary keys
        if 'primary_key' in table_def and isinstance(table_def['primary_key'], list):
            pk_cols = ', '.join(table_def['primary_key'])
            columns.append(f"PRIMARY KEY ({pk_cols})")
        
        # Create table SQL
        columns_sql = ',\n        '.join(columns)
        create_sql = f"""
        CREATE TABLE IF NOT EXISTS {table_name} (
        {columns_sql}
        );
        """
        
        try:
            self.pg_cursor.execute(create_sql)
            print(f"  ✅ {table_name} table created")
        except Exception as e:
            print(f"  ❌ Error creating {table_name}: {e}")
            raise
    
    def create_indexes(self, table_name, table_def):
        """Create indexes for a table"""
        if 'indexes' not in table_def:
            return
        
        for index_def in table_def['indexes']:
            index_name = index_def['name']
            columns = ', '.join(index_def['columns'])
            
            index_sql = f"CREATE INDEX IF NOT EXISTS {index_name} ON {table_name}({columns});"
            
            try:
                self.pg_cursor.execute(index_sql)
                print(f"  ✅ Created index {index_name}")
            except Exception as e:
                print(f"  ❌ Error creating index {index_name}: {e}")
    
    def initialize_postgresql(self):
        """Initialize all PostgreSQL tables"""
        print("🚀 Initializing PostgreSQL database...")
        
        # Create pgcrypto extension
        print("Creating pgcrypto extension...")
        self.pg_cursor.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto;")
        
        # Get tables from schema
        tables = self.schema.get('postgres', {}).get('tables', {})
        
        # Define table creation order to handle foreign key dependencies
        table_order = [
            'SALT_EMAIL',
            'CHAIN_DETAILS',
            'USER_AUTH',
            'ACCESS_LEVEL_TABLE',
            'AGENT',
            'UNPUBLISHED_AGENT',
            'PUBLISHED_AGENT',
            'METADATA',
            'CONTRACT_DETAILS',
            'BLOCKCHAIN_AGENT_DATA',
            'NFT_ACCESS',
            'CONVERSATIONS',
            'MESSAGES',
            'FLOWBUILDER_BLOCKS'
        ]
        
        # Create tables in order
        for table_name in table_order:
            if table_name in tables:
                self.create_table(table_name, tables[table_name])
                self.create_indexes(table_name, tables[table_name])
        
        # Create any remaining tables not in the ordered list
        for table_name, table_def in tables.items():
            if table_name not in table_order:
                self.create_table(table_name, table_def)
                self.create_indexes(table_name, table_def)
        
        # Commit changes
        self.pg_conn.commit()
        print("✅ PostgreSQL initialization completed successfully!")
    
    def initialize_redis(self):
        """Initialize Redis configurations"""
        print("🚀 Initializing Redis configurations...")
        
        # Get Redis key definitions from schema
        redis_keys = self.schema.get('redis', {}).get('keys', {})
        
        # Create documentation for each Redis key type
        for key_name, key_def in redis_keys.items():
            key_pattern = key_def.get('key_pattern', '')
            key_type = key_def.get('type', 'hash')
            ttl = key_def.get('ttl', 0)
            fields = key_def.get('fields', [])
            
            # Create documentation key
            doc_key = f"schema:{key_name}:doc"
            
            # Create example key based on pattern
            example_key = ""
            if key_name == 'USER_SESSION':
                example_key = key_pattern.format(token='eyJhbGciOiJIUzI1NiI...')
            elif key_name == 'WORKFLOW_LIVE_EDITOR':
                example_key = key_pattern.format(agent_id='agent456')
            else:
                try:
                    example_key = key_pattern.format(user_id='user123')
                except KeyError:
                    example_key = key_pattern
            
            # Create documentation with field examples
            doc_data = {
                'key_pattern': key_pattern,
                'type': key_type,
                'ttl': ttl,
                'fields': [{'name': field.get('name'), 'description': field.get('description')} for field in fields],
                'example': example_key
            }
            
            self.redis_conn.set(doc_key, json.dumps(doc_data))
            print(f"  ✅ Created Redis schema documentation for {key_name}")
        
        # Create synchronization configuration
        sync_config = self.schema.get('synchronization', {})
        if sync_config:
            self.redis_conn.set('schema:sync:config', json.dumps(sync_config))
            print("  ✅ Created Redis synchronization configuration")
        
        print("✅ Redis initialization completed successfully!")
    
    def verify_installation(self):
        """Verify that tables were created successfully"""
        print("🔍 Verifying database installation...")
        
        # Check PostgreSQL tables
        self.pg_cursor.execute("""
            SELECT table_name FROM information_schema.tables 
            WHERE table_schema='public' 
            ORDER BY table_name;
        """)
        tables = self.pg_cursor.fetchall()
        
        print(f"📊 Created {len(tables)} PostgreSQL tables:")
        for table in tables:
            print(f"  • {table[0]}")
        
        # Check Redis keys
        redis_keys = self.redis_conn.keys('schema:*')
        print(f"📊 Created {len(redis_keys)} Redis schema keys:")
        for key in redis_keys:
            print(f"  • {key}")
        
        print("✅ Database verification completed!")
    
    def cleanup_connections(self):
        """Close database connections"""
        if self.pg_cursor:
            self.pg_cursor.close()
        if self.pg_conn:
            self.pg_conn.close()
        print("🔒 Database connections closed")

def main():
    """Main initialization function"""
    print("🚀 Starting NeuraLabs Database Initialization...")
    print("=" * 50)
    
    try:
        # Initialize database
        db_init = DatabaseInitializer()
        
        # Initialize PostgreSQL
        db_init.initialize_postgresql()
        
        # Initialize Redis
        db_init.initialize_redis()
        
        # Verify installation
        db_init.verify_installation()
        
        print("=" * 50)
        print("🎉 Database initialization completed successfully!")
        
    except Exception as e:
        print(f"❌ Database initialization failed: {e}")
        sys.exit(1)
    
    finally:
        if 'db_init' in locals():
            db_init.cleanup_connections()

if __name__ == "__main__":
    main()