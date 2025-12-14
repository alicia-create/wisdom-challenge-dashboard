#!/usr/bin/env node

/**
 * Apply Performance Indexes to Supabase
 * 
 * This script creates indexes one by one using raw SQL queries
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Supabase client with service role key for admin access
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY; // This should be the service_role key for admin operations

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: SUPABASE_URL and SUPABASE_KEY environment variables are required');
  console.error('   Make sure SUPABASE_KEY is the service_role key (not anon key)');
  process.exit(1);
}

console.log('🚀 Applying Performance Indexes to Supabase\n');
console.log(`📍 Supabase URL: ${supabaseUrl}\n`);

// Read the SQL file
const migrationsDir = join(__dirname, '..', 'migrations');
const indexesFile = join(migrationsDir, '002_performance_indexes.sql');

console.log(`📄 Reading ${indexesFile}...\n`);

const sql = readFileSync(indexesFile, 'utf8');

// Parse SQL into individual statements
const statements = sql
  .split(';')
  .map(s => s.trim())
  .filter(s => {
    // Remove comments and empty lines
    if (!s || s.startsWith('--')) return false;
    // Keep only CREATE INDEX and CREATE EXTENSION and ANALYZE statements
    return s.toUpperCase().startsWith('CREATE INDEX') || 
           s.toUpperCase().startsWith('CREATE EXTENSION') ||
           s.toUpperCase().startsWith('ANALYZE');
  });

console.log(`📝 Found ${statements.length} SQL statements to execute\n`);
console.log('═══════════════════════════════════════════════════════\n');

// Execute each statement
let successCount = 0;
let failCount = 0;
const errors = [];

for (let i = 0; i < statements.length; i++) {
  const statement = statements[i] + ';';
  const statementType = statement.split(/\s+/).slice(0, 3).join(' ');
  
  console.log(`[${i + 1}/${statements.length}] Executing: ${statementType}...`);
  
  try {
    // Use fetch to call Supabase REST API directly with raw SQL
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({ query: statement })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    console.log(`✅ Success\n`);
    successCount++;
  } catch (error) {
    console.log(`⚠️  ${error.message}\n`);
    failCount++;
    errors.push({ statement: statementType, error: error.message });
  }
}

console.log('═══════════════════════════════════════════════════════\n');
console.log('📊 Migration Results:');
console.log(`   ✅ Success: ${successCount}`);
console.log(`   ⚠️  Failed: ${failCount}\n`);

if (errors.length > 0) {
  console.log('⚠️  Errors encountered:');
  errors.forEach(({ statement, error }) => {
    console.log(`   • ${statement}`);
    console.log(`     ${error}\n`);
  });
  console.log('Note: Some errors are expected if indexes already exist or if using anon key instead of service_role key.\n');
}

console.log('═══════════════════════════════════════════════════════\n');
console.log('💡 Alternative: Copy SQL to Supabase SQL Editor');
console.log('   1. Open https://supabase.com/dashboard');
console.log('   2. Go to SQL Editor');
console.log('   3. Copy contents of migrations/002_performance_indexes.sql');
console.log('   4. Paste and click Run');
console.log('   5. Repeat for migrations/003_materialized_views.sql\n');
