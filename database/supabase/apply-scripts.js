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
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const readline = require('readline');

// Load environment variables
dotenv.config();

// Check for required environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY; // Use service key for admin operations

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables are required.');
  console.error('Please add them to your .env file or environment.');
  process.exit(1);
}

// Create a Supabase client with admin privileges
const supabase = createClient(supabaseUrl, supabaseKey);

// Define the SQL files to apply in order
const sqlFiles = [
  { name: '01_schema.sql', description: 'Database schema, tables, and RLS policies' },
  { name: '02_functions.sql', description: 'Database functions' },
  { name: '04_crawler_integration.sql', description: 'Crawler integration functions' },
  { name: '03_seed_data.sql', description: 'Sample product and store data (optional)' }
];

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to execute SQL in Supabase
async function executeSQL(sql, description) {
  console.log(`Executing SQL: ${description}...`);
  
  try {
    const { data, error } = await supabase.rpc('execute_sql', { query: sql });
    
    if (error) {
      console.error('Error executing SQL:');
      console.error(error);
      return false;
    }
    
    console.log('SQL executed successfully!');
    return true;
  } catch (err) {
    console.error('Exception occurred:');
    console.error(err);
    return false;
  }
}

// Function to read a SQL file
function readSqlFile(filename) {
  const filePath = path.join(__dirname, filename);
  
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    console.error(`Error reading file ${filename}:`);
    console.error(err);
    return null;
  }
}

// Main function to apply the SQL files
async function applyScripts() {
  console.log('Supabase SQL Script Application');
  console.log('===============================');
  console.log(`Connected to: ${supabaseUrl}`);
  console.log('\nAvailable SQL scripts:');
  
  sqlFiles.forEach((file, index) => {
    console.log(`${index + 1}. ${file.name} - ${file.description}`);
  });
  
  console.log('\nSelect which scripts to apply (comma-separated numbers, "all" for all scripts, or "q" to quit):');
  
  rl.question('> ', async (answer) => {
    if (answer.toLowerCase() === 'q') {
      rl.close();
      return;
    }
    
    let filesToApply = [];
    
    if (answer.toLowerCase() === 'all') {
      filesToApply = sqlFiles;
    } else {
      const selectedIndexes = answer.split(',').map(s => parseInt(s.trim()) - 1);
      filesToApply = selectedIndexes.map(i => sqlFiles[i]).filter(file => file);
    }
    
    if (filesToApply.length === 0) {
      console.log('No valid files selected.');
      rl.close();
      return;
    }
    
    console.log(`\nWill apply the following files:`);
    filesToApply.forEach(file => console.log(`- ${file.name}`));
    
    rl.question('\nConfirm application (y/n)? ', async (confirm) => {
      if (confirm.toLowerCase() !== 'y') {
        console.log('Operation cancelled.');
        rl.close();
        return;
      }
      
      console.log('\nApplying SQL files...\n');
      
      for (const file of filesToApply) {
        const sql = readSqlFile(file.name);
        
        if (sql) {
          const success = await executeSQL(sql, file.description);
          if (!success) {
            console.log(`\nError applying ${file.name}. Stopping execution.`);
            break;
          }
        } else {
          console.log(`\nCould not read ${file.name}. Skipping.`);
        }
      }
      
      console.log('\nSQL application process completed.');
      rl.close();
    });
  });
}

// Run the main function
applyScripts(); 