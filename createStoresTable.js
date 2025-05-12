// Script to create the stores table in Supabase
// Run with: node createStoresTable.js

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Get environment variables for Supabase configuration
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Validate required environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Error: Supabase environment variables are missing. Make sure REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY are set in your .env file.'
  );
  process.exit(1);
}

// Initialize the Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createStoresTable() {
  console.log('Attempting to create stores table in Supabase...');
  
  // Use Supabase's RPC to run raw SQL
  const { data, error } = await supabase.rpc('execute_sql', {
    sql_string: `
      CREATE TABLE IF NOT EXISTS public.stores (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        url TEXT NOT NULL UNIQUE,
        logo_url TEXT,
        category TEXT,
        user_id UUID REFERENCES auth.users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        last_crawl TIMESTAMP WITH TIME ZONE,
        product_count INTEGER DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'active',
        config JSONB DEFAULT '{}'
      );

      -- Set RLS policies
      ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
      
      -- Create policy for users to select their own stores
      CREATE POLICY "Users can view their own stores"
        ON public.stores
        FOR SELECT
        USING (auth.uid() = user_id);
        
      -- Create policy for users to insert their own stores
      CREATE POLICY "Users can insert their own stores"
        ON public.stores
        FOR INSERT
        WITH CHECK (auth.uid() = user_id);
        
      -- Create policy for users to update their own stores
      CREATE POLICY "Users can update their own stores"
        ON public.stores
        FOR UPDATE
        USING (auth.uid() = user_id);
        
      -- Create policy for users to delete their own stores
      CREATE POLICY "Users can delete their own stores"
        ON public.stores
        FOR DELETE
        USING (auth.uid() = user_id);
    `
  });

  if (error) {
    console.error('Error creating table:', error);
    // Try alternative approach without RPC
    console.log('Trying alternative approach...');
    try {
      // Using REST API to execute SQL
      const { error: restError } = await supabase.from('_exec_sql').select('*').eq('query', `
        CREATE TABLE IF NOT EXISTS public.stores (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL,
          url TEXT NOT NULL UNIQUE,
          logo_url TEXT,
          category TEXT,
          user_id UUID REFERENCES auth.users(id),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          last_crawl TIMESTAMP WITH TIME ZONE,
          product_count INTEGER DEFAULT 0,
          status TEXT NOT NULL DEFAULT 'active',
          config JSONB DEFAULT '{}'
        );
      `);
      
      if (restError) {
        console.error('Alternative approach failed:', restError);
        console.log('Please create the stores table manually in the Supabase dashboard');
      } else {
        console.log('Stores table created successfully using alternative approach');
      }
    } catch (err) {
      console.error('Exception during alternative approach:', err);
      console.log('Please create the stores table manually in the Supabase dashboard with the following SQL:');
      console.log(`
        CREATE TABLE IF NOT EXISTS public.stores (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL,
          url TEXT NOT NULL UNIQUE,
          logo_url TEXT,
          category TEXT,
          user_id UUID REFERENCES auth.users(id),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          last_crawl TIMESTAMP WITH TIME ZONE,
          product_count INTEGER DEFAULT 0,
          status TEXT NOT NULL DEFAULT 'active',
          config JSONB DEFAULT '{}'
        );
      `);
    }
  } else {
    console.log('Stores table created successfully!');
  }
}

createStoresTable()
  .catch(console.error)
  .finally(() => process.exit()); 