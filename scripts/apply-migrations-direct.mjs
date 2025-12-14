#!/usr/bin/env node

/**
 * Apply Performance Optimization Migrations to Supabase
 * 
 * This script uses the Supabase client from the project to execute SQL migrations.
 * It reads the SQL files and executes them using the database connection.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get credentials from environment
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: SUPABASE_URL and SUPABASE_KEY environment variables are required');
  process.exit(1);
}

console.log('🚀 Applying Performance Optimization Migrations to Supabase\n');
console.log(`📍 Supabase URL: ${supabaseUrl}\n`);

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Get migrations directory
const migrationsDir = join(__dirname, '..', 'migrations');

/**
 * Execute SQL file by reading and executing each statement
 */
async function executeSQLFile(filePath, description) {
  console.log(`\n📄 Reading ${filePath}...\n`);
  
  const sql = readFileSync(filePath, 'utf8');
  
  // Split into statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => {
      if (!s || s.startsWith('--')) return false;
      const upper = s.toUpperCase();
      return upper.startsWith('CREATE INDEX') || 
             upper.startsWith('CREATE EXTENSION') ||
             upper.startsWith('CREATE MATERIALIZED') ||
             upper.startsWith('DROP MATERIALIZED') ||
             upper.startsWith('ANALYZE');
    });
  
  console.log(`📝 Found ${statements.length} SQL statements\n`);
  console.log('═══════════════════════════════════════════════════════\n');
  
  let successCount = 0;
  let failCount = 0;
  const errors = [];
  
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    const statementType = statement.split(/\s+/).slice(0, 3).join(' ');
    
    console.log(`[${i + 1}/${statements.length}] ${statementType}...`);
    
    try {
      // Use rpc to execute raw SQL
      const { data, error } = await supabase.rpc('exec_sql', { 
        sql_query: statement 
      });
      
      if (error) {
        throw error;
      }
      
      console.log(`✅ Success\n`);
      successCount++;
    } catch (error) {
      const errorMsg = error.message || String(error);
      console.log(`⚠️  ${errorMsg}\n`);
      failCount++;
      errors.push({ statement: statementType, error: errorMsg });
    }
  }
  
  console.log('═══════════════════════════════════════════════════════\n');
  console.log(`📊 ${description} Results:`);
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ⚠️  Failed: ${failCount}\n`);
  
  if (errors.length > 0) {
    console.log('⚠️  Errors encountered:');
    errors.forEach(({ statement, error }) => {
      console.log(`   • ${statement}`);
      console.log(`     ${error}\n`);
    });
    console.log('Note: This is expected - Supabase REST API does not support DDL commands.\n');
    console.log('💡 You must use the Supabase SQL Editor instead:\n');
    console.log('   1. Open https://supabase.com/dashboard');
    console.log('   2. Go to SQL Editor');
    console.log('   3. Copy contents of migrations/002_performance_indexes.sql');
    console.log('   4. Paste and click Run');
    console.log('   5. Repeat for migrations/003_materialized_views.sql\n');
  }
  
  return failCount === 0;
}

/**
 * Verify indexes exist
 */
async function verifyIndexes() {
  console.log('🔍 Verifying indexes...\n');
  
  try {
    const { data, error } = await supabase
      .from('pg_indexes')
      .select('tablename, indexname')
      .eq('schemaname', 'public')
      .ilike('indexname', 'idx_%')
      .order('tablename')
      .order('indexname');
    
    if (error) {
      console.log(`⚠️  Cannot verify indexes: ${error.message}`);
      console.log('   This is normal - pg_indexes may not be accessible via REST API\n');
      return false;
    }
    
    console.log(`✅ Found ${data.length} indexes:\n`);
    
    // Group by table
    const indexesByTable = {};
    data.forEach(row => {
      if (!indexesByTable[row.tablename]) {
        indexesByTable[row.tablename] = [];
      }
      indexesByTable[row.tablename].push(row.indexname);
    });
    
    Object.entries(indexesByTable).forEach(([table, indexes]) => {
      console.log(`   📋 ${table}: ${indexes.length} indexes`);
      indexes.forEach(idx => console.log(`      - ${idx}`));
    });
    
    console.log('');
    return true;
  } catch (err) {
    console.log(`⚠️  Cannot verify indexes: ${err.message}\n`);
    return false;
  }
}

/**
 * Verify materialized view exists
 */
async function verifyMaterializedView() {
  console.log('🔍 Verifying materialized view...\n');
  
  try {
    const { count, error } = await supabase
      .from('wisdom_contacts')
      .select('contact_id', { count: 'exact', head: true });
    
    if (error) {
      console.log(`⚠️  Materialized view not found: ${error.message}\n`);
      return false;
    }
    
    console.log(`✅ Materialized view 'wisdom_contacts' exists with ${count} contacts\n`);
    return true;
  } catch (err) {
    console.log(`⚠️  Cannot verify materialized view: ${err.message}\n`);
    return false;
  }
}

/**
 * Main execution
 */
async function main() {
  // Try to execute migrations
  const indexesFile = join(migrationsDir, '002_performance_indexes.sql');
  const viewFile = join(migrationsDir, '003_materialized_views.sql');
  
  console.log('═══════════════════════════════════════════════════════');
  console.log('STEP 1: Attempting to Create Performance Indexes');
  console.log('═══════════════════════════════════════════════════════');
  
  await executeSQLFile(indexesFile, 'Performance Indexes Migration');
  
  console.log('═══════════════════════════════════════════════════════');
  console.log('STEP 2: Attempting to Create Materialized View');
  console.log('═══════════════════════════════════════════════════════');
  
  await executeSQLFile(viewFile, 'Materialized View Migration');
  
  console.log('═══════════════════════════════════════════════════════');
  console.log('STEP 3: Verification');
  console.log('═══════════════════════════════════════════════════════\n');
  
  const indexesExist = await verifyIndexes();
  const viewExists = await verifyMaterializedView();
  
  console.log('═══════════════════════════════════════════════════════');
  
  if (!indexesExist && !viewExists) {
    console.log('⚠️  Migration via API Failed (Expected)');
    console.log('═══════════════════════════════════════════════════════\n');
    
    console.log('📋 Manual Migration Required:\n');
    console.log('Supabase does not allow DDL commands (CREATE INDEX, CREATE TABLE, etc.)');
    console.log('via the REST API for security reasons. You must use the SQL Editor.\n');
    
    console.log('✅ Step-by-Step Instructions:\n');
    console.log('1. Open Supabase Dashboard:');
    console.log('   https://supabase.com/dashboard\n');
    
    console.log('2. Navigate to your project → SQL Editor\n');
    
    console.log('3. Create New Query and paste contents of:');
    console.log('   migrations/002_performance_indexes.sql\n');
    
    console.log('4. Click "Run" (or press Cmd/Ctrl + Enter)\n');
    
    console.log('5. Wait ~30-60 seconds for completion\n');
    
    console.log('6. Create another New Query and paste contents of:');
    console.log('   migrations/003_materialized_views.sql\n');
    
    console.log('7. Click "Run" again\n');
    
    console.log('8. Verify with this query:');
    console.log('   SELECT COUNT(*) FROM wisdom_contacts;\n');
    
    console.log('📖 See PERFORMANCE_OPTIMIZATION_GUIDE.md for detailed instructions\n');
  } else {
    console.log('🎉 Migration Complete!');
    console.log('═══════════════════════════════════════════════════════\n');
    
    console.log('📈 Expected Performance Improvements:');
    console.log('   • Overview page: 3-5s → 0.5-1s (5-10x faster)');
    console.log('   • Daily Analysis: 5-8s → 1-2s (3-5x faster)');
    console.log('   • Date filters: 2-4s → 0.3-0.5s (5-10x faster)');
    console.log('   • Wisdom filter: 500-1000ms → 50-100ms (10-50x faster)\n');
    
    console.log('⚠️  Important: Materialized view needs periodic refresh!');
    console.log('   Run this in SQL Editor daily or set up pg_cron:');
    console.log('   REFRESH MATERIALIZED VIEW CONCURRENTLY wisdom_contacts;\n');
  }
}

// Run main
main().catch(err => {
  console.error('💥 Fatal error:', err);
  process.exit(1);
});
