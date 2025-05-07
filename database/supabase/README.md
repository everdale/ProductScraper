# Supabase Setup for Svea AI Application

This directory contains all the resources needed to set up and configure the Supabase project for the Svea AI application.

## Files Included

- `schema.sql`: Database schema definitions including tables, indexes, and RLS policies
- `functions.sql`: Custom PostgreSQL functions for efficient queries
- `seed_data.sql`: Sample data to populate the database for testing
- `setup.js`: Interactive guide for setting up the Supabase project

## Setup Instructions

1. **Create a Supabase Project**
   - Go to [Supabase](https://app.supabase.io/)
   - Sign in or create an account
   - Click "New Project"
   - Enter "SveaAI" (or your preferred name) as the project name
   - Choose a strong database password (save it somewhere secure)
   - Select the region closest to your users
   - Choose the free tier (or paid if needed)
   - Click "Create new project"

2. **Wait for Project Creation**
   - This may take a few minutes

3. **Configure Authentication**
   - In the Supabase dashboard, go to "Authentication" > "Providers"
   - Enable "Email" provider
   - Configure any additional settings as needed (e.g., email templates)
   - Under "Authentication" > "URL Configuration" set your site URL
   - Save changes

4. **Apply Database Schema**
   - In the Supabase dashboard, go to "SQL Editor"
   - Click "New Query"
   - Copy and paste the contents of `schema.sql`
   - Run the query to create all tables, indexes, policies, and triggers

5. **Create Database Functions**
   - In the SQL Editor, create a new query
   - Copy and paste the contents of `functions.sql`
   - Run the query to create all functions

6. **Seed Test Data (Optional)**
   - In the SQL Editor, create a new query
   - Copy and paste the contents of `seed_data.sql`
   - Run the query to insert sample products

7. **Get API Credentials**
   - In the Supabase dashboard, go to "Settings" > "API"
   - Under "Project API keys", copy:
     - anon/public key (for client access)
     - URL (project URL)
   - Store these in your environment variables or .env file as:
     ```
     SUPABASE_URL=your_project_url
     SUPABASE_ANON_KEY=your_anon_key
     ```

8. **Connect to Your Application**
   - Follow the instructions in `frontend/src/lib/supabase.js` to connect your application to Supabase

## Testing Your Setup

To verify your Supabase setup is working correctly:

1. Check that tables were created correctly:
   - Go to "Table Editor" in the Supabase dashboard
   - You should see `profiles` and `products` tables

2. Verify authentication is working:
   - Create a test user through "Authentication" > "Users" > "Add User"
   - Check that a profile was automatically created in the `profiles` table

3. Test Row Level Security:
   - Try accessing the `products` table from the client API (should be allowed for reading)
   - Try modifying a product without admin rights (should be denied)

## Additional Configuration

### Creating an Admin User

To create an admin user with special privileges:

1. Create a user through regular signup
2. Go to "Authentication" > "Users" in the Supabase dashboard
3. Find the user and click "Edit"
4. Under "Raw User Metadata", add:
   ```json
   {
     "role": "admin"
   }
   ```
5. This user will now have admin privileges through the RLS policies

### Adding More Tables

If you need to add more tables to the schema:

1. Create a new SQL file (e.g., `additional_tables.sql`)
2. Add your table definitions with proper RLS policies
3. Apply the schema using the SQL Editor

## Useful Resources

- [Supabase Documentation](https://supabase.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Supabase Auth Documentation](https://supabase.io/docs/guides/auth)
- [Row Level Security Guide](https://supabase.io/docs/guides/auth/row-level-security) 