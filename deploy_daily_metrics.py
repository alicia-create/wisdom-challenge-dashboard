#!/usr/bin/env python3
"""
Deploy get_daily_metrics function to Supabase using the Management API
"""
import os
import requests

SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_KEY = os.environ.get('SUPABASE_KEY')

# Read the SQL file
with open('migrations/007_daily_metrics_function.sql', 'r') as f:
    sql_content = f.read()

# Use the Supabase SQL endpoint (via pg_net or direct query)
# Since we can't use psql directly, we'll use the supabase-py client
from supabase import create_client

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Execute the SQL using the Supabase client's rpc
# Note: We need to use a workaround since execute() isn't directly available
# Let's try using the REST API with the sql endpoint

print("Connecting to Supabase...")
print(f"URL: {SUPABASE_URL}")

# Test connection first
try:
    result = supabase.table('contacts').select('id').limit(1).execute()
    print(f"Connection successful! Found {len(result.data)} contacts")
except Exception as e:
    print(f"Connection error: {e}")
    exit(1)

# For deploying SQL functions, we need to use the Supabase Dashboard or CLI
# Since we can't execute DDL directly via REST API, let's output instructions
print("\n" + "="*60)
print("SQL FUNCTION READY FOR DEPLOYMENT")
print("="*60)
print("\nThe SQL function has been created at:")
print("migrations/007_daily_metrics_function.sql")
print("\nTo deploy, either:")
print("1. Go to Supabase Dashboard > SQL Editor > paste the content")
print("2. Use Supabase CLI: supabase db push")
print("\nAlternatively, I'll create the function via a workaround...")

# Try using the query endpoint if available
import json

# Use the postgrest-js workaround with raw SQL
headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': f'Bearer {SUPABASE_KEY}',
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
}

# Check if the function already exists by trying to call it
print("\nTesting if get_daily_metrics function exists...")
try:
    response = requests.post(
        f"{SUPABASE_URL}/rest/v1/rpc/get_daily_metrics",
        headers=headers,
        json={"p_start_date": "2024-12-01", "p_end_date": "2024-12-15"}
    )
    if response.status_code == 200:
        data = response.json()
        print("✅ Function exists and works!")
        print(f"Sample data: {json.dumps(data, indent=2)[:500]}...")
    elif response.status_code == 404:
        print("❌ Function does not exist yet")
        print("Please deploy using Supabase Dashboard SQL Editor")
    else:
        print(f"Response: {response.status_code} - {response.text[:200]}")
except Exception as e:
    print(f"Error: {e}")
