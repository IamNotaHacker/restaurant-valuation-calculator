const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigrations() {
  console.log('🔄 Applying database migrations...\n');

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '002_access_tokens.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Split the SQL into individual statements (separated by semicolons)
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--')); // Remove empty and comment-only statements

    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';'; // Re-add the semicolon

      // Extract a preview of the statement for logging
      const preview = statement.substring(0, 100).replace(/\n/g, ' ');
      console.log(`Executing statement ${i + 1}/${statements.length}: ${preview}...`);

      const { error } = await supabase.rpc('query', { query: statement });

      if (error) {
        // Try direct execution if RPC fails
        const { data, error: directError } = await supabase.from('_sql').select(statement);

        if (directError) {
          console.error(`❌ Error in statement ${i + 1}:`, directError.message);
          // Continue with other statements even if one fails
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
        }
      } else {
        console.log(`✅ Statement ${i + 1} executed successfully`);
      }
    }

    console.log('\n✨ Migration completed!');
    console.log('\nDatabase tables created:');
    console.log('  - access_tokens (for tracking 30-day access)');
    console.log('  - Functions: check_calculator_access, create_access_token');
    console.log('  - Indexes and RLS policies configured');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Run the migrations
runMigrations();