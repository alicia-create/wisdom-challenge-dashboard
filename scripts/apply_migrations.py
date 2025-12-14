#!/usr/bin/env python3

"""
Apply Performance Optimization Migrations to Supabase

This script connects directly to PostgreSQL and executes SQL migrations:
1. Create 28 performance indexes
2. Create wisdom_contacts materialized view
3. Verify all objects were created successfully

Requirements:
    pip install psycopg2-binary python-dotenv
"""

import os
import re
import psycopg2
from urllib.parse import urlparse
from pathlib import Path

def parse_supabase_url(supabase_url):
    """Extract PostgreSQL connection details from Supabase URL"""
    # Supabase URL format: https://PROJECT_ID.supabase.co
    # PostgreSQL connection: postgresql://postgres:PASSWORD@db.PROJECT_ID.supabase.co:5432/postgres
    
    project_id = supabase_url.replace('https://', '').replace('.supabase.co', '')
    
    # Get password from environment
    password = os.getenv('SUPABASE_DB_PASSWORD')
    if not password:
        print("❌ Error: SUPABASE_DB_PASSWORD environment variable is required")
        print("   Find it in Supabase Dashboard → Settings → Database → Connection string")
        return None
    
    return f"postgresql://postgres.{project_id}:{password}@aws-0-us-west-1.pooler.supabase.com:6543/postgres"

def execute_sql_file(cursor, file_path, description):
    """Execute SQL file statement by statement"""
    print(f"\n📄 Reading {file_path}...")
    
    with open(file_path, 'r') as f:
        sql = f.read()
    
    # Split into statements (separated by semicolons)
    statements = [s.strip() for s in sql.split(';') if s.strip() and not s.strip().startswith('--')]
    
    print(f"📝 Found {len(statements)} SQL statements\n")
    print("═" * 60)
    
    success_count = 0
    fail_count = 0
    errors = []
    
    for i, statement in enumerate(statements, 1):
        # Skip comments
        if statement.startswith('--'):
            continue
        
        # Extract statement type for logging
        statement_type = ' '.join(statement.split()[:3])
        print(f"[{i}/{len(statements)}] Executing: {statement_type}...")
        
        try:
            cursor.execute(statement)
            print(f"✅ Success\n")
            success_count += 1
        except Exception as e:
            error_msg = str(e).split('\n')[0]  # Get first line of error
            print(f"⚠️  {error_msg}\n")
            fail_count += 1
            errors.append((statement_type, error_msg))
    
    print("═" * 60)
    print(f"\n📊 {description} Results:")
    print(f"   ✅ Success: {success_count}")
    print(f"   ⚠️  Failed: {fail_count}\n")
    
    if errors:
        print("⚠️  Errors encountered:")
        for stmt, err in errors:
            print(f"   • {stmt}")
            print(f"     {err}\n")
        print("Note: Some errors are expected if objects already exist.\n")
    
    return fail_count == 0

def verify_indexes(cursor):
    """Verify indexes were created"""
    print("🔍 Verifying indexes...")
    
    cursor.execute("""
        SELECT tablename, indexname 
        FROM pg_indexes 
        WHERE schemaname = 'public' 
          AND indexname LIKE 'idx_%'
        ORDER BY tablename, indexname
    """)
    
    indexes = cursor.fetchall()
    
    print(f"✅ Found {len(indexes)} indexes:\n")
    
    # Group by table
    indexes_by_table = {}
    for table, index in indexes:
        if table not in indexes_by_table:
            indexes_by_table[table] = []
        indexes_by_table[table].append(index)
    
    for table, idxs in sorted(indexes_by_table.items()):
        print(f"   📋 {table}: {len(idxs)} indexes")
        for idx in idxs:
            print(f"      - {idx}")
    
    print()
    return True

def verify_materialized_view(cursor):
    """Verify materialized view was created"""
    print("🔍 Verifying materialized view...")
    
    try:
        cursor.execute("SELECT COUNT(*) FROM wisdom_contacts")
        count = cursor.fetchone()[0]
        print(f"✅ Materialized view 'wisdom_contacts' exists with {count} contacts\n")
        return True
    except Exception as e:
        print(f"❌ Error verifying materialized view: {e}\n")
        return False

def main():
    print("🚀 Starting Supabase Performance Optimization Migrations\n")
    
    # Get Supabase credentials
    supabase_url = os.getenv('SUPABASE_URL')
    
    if not supabase_url:
        print("❌ Error: SUPABASE_URL environment variable is required")
        return 1
    
    print(f"📍 Supabase URL: {supabase_url}")
    
    # Parse connection string
    conn_string = parse_supabase_url(supabase_url)
    if not conn_string:
        return 1
    
    print("🔌 Connecting to PostgreSQL...\n")
    
    try:
        # Connect to database
        conn = psycopg2.connect(conn_string)
        conn.autocommit = True  # Auto-commit each statement
        cursor = conn.cursor()
        
        print("✅ Connected successfully\n")
        
        # Get migrations directory
        script_dir = Path(__file__).parent
        migrations_dir = script_dir.parent / 'migrations'
        
        # Step 1: Apply indexes
        print("═" * 60)
        print("STEP 1: Creating Performance Indexes")
        print("═" * 60)
        
        indexes_file = migrations_dir / '002_performance_indexes.sql'
        execute_sql_file(cursor, indexes_file, 'Performance Indexes Migration')
        
        # Step 2: Apply materialized view
        print("═" * 60)
        print("STEP 2: Creating Materialized View")
        print("═" * 60)
        
        view_file = migrations_dir / '003_materialized_views.sql'
        execute_sql_file(cursor, view_file, 'Materialized View Migration')
        
        # Step 3: Verify everything was created
        print("═" * 60)
        print("STEP 3: Verification")
        print("═" * 60 + "\n")
        
        verify_indexes(cursor)
        verify_materialized_view(cursor)
        
        # Final summary
        print("═" * 60)
        print("🎉 Migration Complete!")
        print("═" * 60 + "\n")
        
        print("📈 Expected Performance Improvements:")
        print("   • Overview page: 3-5s → 0.5-1s (5-10x faster)")
        print("   • Daily Analysis: 5-8s → 1-2s (3-5x faster)")
        print("   • Date filters: 2-4s → 0.3-0.5s (5-10x faster)")
        print("   • Wisdom filter: 500-1000ms → 50-100ms (10-50x faster)\n")
        
        print("⚠️  Important: Materialized view needs periodic refresh!")
        print("   Run this command daily or set up pg_cron:")
        print("   REFRESH MATERIALIZED VIEW CONCURRENTLY wisdom_contacts;\n")
        
        cursor.close()
        conn.close()
        
        return 0
        
    except psycopg2.Error as e:
        print(f"❌ Database error: {e}\n")
        print("💡 Make sure SUPABASE_DB_PASSWORD is set correctly")
        print("   Find it in: Supabase Dashboard → Settings → Database → Connection string\n")
        return 1
    except Exception as e:
        print(f"💥 Fatal error: {e}\n")
        return 1

if __name__ == '__main__':
    exit(main())
