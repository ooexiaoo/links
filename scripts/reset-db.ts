import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

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

async function resetDatabase() {
  console.log('Resetting database...');
  
  try {
    // Disable RLS temporarily
    await supabase.rpc('exec', { 
      query: 'ALTER TABLE links DISABLE ROW LEVEL SECURITY;' 
    });

    // Delete all data from tables
    const { error: deleteError } = await supabase
      .from('links')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Keep the dummy record

    if (deleteError) throw deleteError;

    // Re-enable RLS
    await supabase.rpc('exec', { 
      query: 'ALTER TABLE links ENABLE ROW LEVEL SECURITY;' 
    });

    console.log('✅ Database reset completed successfully');
  } catch (error) {
    console.error('Error resetting database:', error);
    process.exit(1);
  }
}

async function main() {
  try {
    await resetDatabase();
    process.exit(0);
  } catch (error) {
    console.error('Error in database reset:', error);
    process.exit(1);
  }
}

main();
