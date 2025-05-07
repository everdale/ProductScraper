/**
 * Supabase SQL Script Application Utility
 * 
 * This script automates the process of applying SQL scripts to your Supabase project.
 * It reads the SQL files and executes them using the Supabase REST API.
 * 
 * Prerequisites:
 * - Node.js installed
 * - Supabase project created
 * - Service role key (found in Supabase dashboard under Settings > API)
 */

const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const readline = require('readline');

// Create interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to prompt for input
const prompt = (query) => new Promise((resolve) => rl.question(query, resolve));

async function main() {
  console.log('Supabase SQL Script Application Utility');
  console.log('---------------------------------------');
  
  // Get Supabase URL and service role key from user
  const supabaseUrl = await prompt('Enter your Supabase project URL: ');
  const serviceRoleKey = await prompt('Enter your service role key (from Settings > API): ');
  
  // Create .env file if it doesn't exist
  if (!fs.existsSync('.env')) {
    const anonKey = await prompt('Enter your anon/public key: ');
    
    const envContent = `SUPABASE_URL=${supabaseUrl}
SUPABASE_ANON_KEY=${anonKey}
SUPABASE_SERVICE_KEY=${serviceRoleKey}`;
    
    fs.writeFileSync('.env', envContent);
    console.log('Created .env file with Supabase credentials');
  }
  
  // Path to SQL files
  const scriptsDir = path.join(__dirname);
  const schemaFile = path.join(scriptsDir, 'schema.sql');
  const functionsFile = path.join(scriptsDir, 'functions.sql');
  const seedDataFile = path.join(scriptsDir, 'seed_data.sql');
  
  // Read SQL files
  console.log('Reading SQL files...');
  const schemaSQL = fs.readFileSync(schemaFile, 'utf8');
  const functionsSQL = fs.readFileSync(functionsFile, 'utf8');
  const seedDataSQL = fs.readFileSync(seedDataFile, 'utf8');
  
  // Execute SQL files in order
  console.log('\nApplying schema.sql...');
  await executeSQL(supabaseUrl, serviceRoleKey, schemaSQL);
  
  console.log('\nApplying functions.sql...');
  await executeSQL(supabaseUrl, serviceRoleKey, functionsSQL);
  
  const applySeedData = await prompt('\nDo you want to apply seed data? (y/n): ');
  if (applySeedData.toLowerCase() === 'y') {
    console.log('Applying seed_data.sql...');
    await executeSQL(supabaseUrl, serviceRoleKey, seedDataSQL);
  }
  
  console.log('\nAll SQL scripts have been applied successfully!');
  console.log('\nNext steps:');
  console.log('1. Configure authentication in the Supabase dashboard');
  console.log('2. Test the connection in your application');
  console.log('3. Create an admin user if needed (see README.md for instructions)');
  
  rl.close();
}

async function executeSQL(supabaseUrl, serviceRoleKey, sqlContent) {
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        query: sqlContent
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`SQL execution failed: ${errorText}`);
    }
    
    console.log('SQL executed successfully');
  } catch (error) {
    console.error('Error executing SQL:', error.message);
    const proceed = await prompt('An error occurred. Do you want to continue with the next script? (y/n): ');
    if (proceed.toLowerCase() !== 'y') {
      rl.close();
      process.exit(1);
    }
  }
}

// Run the main function
main().catch(err => {
  console.error('Error:', err);
  rl.close();
  process.exit(1);
}); 