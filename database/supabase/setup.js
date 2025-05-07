// Supabase Setup Script
// This script helps you create a new Supabase project and apply the schema

console.log('Supabase Project Setup Guide');
console.log('---------------------------');
console.log('Follow these steps to set up your Supabase project:');
console.log('');

console.log('1. Create a new Supabase project:');
console.log('   - Go to https://app.supabase.io/');
console.log('   - Sign in or create an account');
console.log('   - Click "New Project"');
console.log('   - Enter "SveaAI" (or your preferred name) as the project name');
console.log('   - Choose a strong database password (save it somewhere secure)');
console.log('   - Select the region closest to your users');
console.log('   - Choose the free tier (or paid if needed)');
console.log('   - Click "Create new project"');
console.log('');

console.log('2. Wait for your project to be created (this may take a few minutes)');
console.log('');

console.log('3. Configure Authentication:');
console.log('   - In the Supabase dashboard, go to "Authentication" > "Providers"');
console.log('   - Enable "Email" provider');
console.log('   - Configure any additional settings as needed (e.g., email templates)');
console.log('   - Under "Authentication" > "URL Configuration" set your site URL');
console.log('   - Save changes');
console.log('');

console.log('4. Apply the database schema:');
console.log('   - In the Supabase dashboard, go to "SQL Editor"');
console.log('   - Click "New Query"');
console.log('   - Copy and paste the contents of the schema.sql file in this directory');
console.log('   - Run the query to create all tables, indexes, policies, and triggers');
console.log('');

console.log('5. Get your API credentials:');
console.log('   - In the Supabase dashboard, go to "Settings" > "API"');
console.log('   - Under "Project API keys", copy:');
console.log('     - anon/public key (for client access)');
console.log('     - URL (project URL)');
console.log('   - Store these in your environment variables or .env file as:');
console.log('     SUPABASE_URL=your_project_url');
console.log('     SUPABASE_ANON_KEY=your_anon_key');
console.log('');

console.log('6. Add a .env file to your project root with these variables');
console.log('');

console.log('7. Create a supabase.js file in your frontend code:');
console.log('   Create a file in your frontend directory with the following content:');
console.log('');
console.log('   // Example for frontend/src/lib/supabase.js');
console.log('   import { createClient } from "@supabase/supabase-js";');
console.log('');
console.log('   const supabaseUrl = process.env.SUPABASE_URL;');
console.log('   const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;');
console.log('');
console.log('   export const supabase = createClient(supabaseUrl, supabaseAnonKey);');
console.log('');

console.log('Your Supabase project setup is complete! You can now use Supabase in your application.'); 