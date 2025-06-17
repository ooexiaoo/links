import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function runMigrations() {
  console.log('Running database migrations...');
  
  try {
    // Read the SQL migration file
    const migrationPath = path.join(__dirname, '../supabase/migrations/20240101000000_initial_schema.sql');
    const migrationSql = fs.readFileSync(migrationPath, 'utf-8');
    
    // Execute the migration
    const { error } = await supabase.rpc('exec', { query: migrationSql });
    
    if (error) {
      console.error('Error running migration:', error);
      process.exit(1);
    }
    
    console.log('✅ Database migrations completed successfully');
  } catch (error) {
    console.error('Error running migrations:', error);
    process.exit(1);
  }
}

async function main() {
  try {
    await runMigrations();
    process.exit(0);
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

main();
