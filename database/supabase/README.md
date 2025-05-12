# Supabase Setup for Svea AI Application

This directory contains the SQL scripts needed to set up and configure your Supabase project for the Svea AI application. These scripts create the database schema, functions, and seed data for the application.

## SQL Files

The SQL files are organized in a numbered sequence that should be executed in order:

1. **01_schema.sql**: Creates the basic database structure including tables, indexes, and row-level security policies.
2. **02_functions.sql**: Defines database functions for product search, filtering, and administrative tasks.
3. **03_seed_data.sql**: Contains initial data to populate the database with sample products and stores.
4. **04_crawler_integration.sql**: Provides functions to integrate the crawler functionality with Supabase.

## Setup Instructions

Follow these steps to set up your Supabase project:

1. **Create a new Supabase project**:
   - Go to [Supabase](https://app.supabase.io/)
   - Sign in or create an account
   - Click "New Project"
   - Enter your project name
   - Choose a strong database password (save it somewhere secure)
   - Select the region closest to your users
   - Choose the appropriate pricing tier
   - Click "Create new project"

2. **Wait for your project to be created** (this may take a few minutes)

3. **Configure Authentication**:
   - In the Supabase dashboard, go to "Authentication" > "Providers"
   - Enable "Email" provider
   - Configure any additional settings as needed (e.g., email templates)
   - Under "Authentication" > "URL Configuration" set your site URL
   - Save changes

4. **Apply the database schema and functions**:
   - In the Supabase dashboard, go to "SQL Editor"
   - Click "New Query"
   - Execute each SQL file in order:
     1. Copy and paste the contents of `01_schema.sql` and run the query
     2. Copy and paste the contents of `02_functions.sql` and run the query
     3. Copy and paste the contents of `04_crawler_integration.sql` and run the query
     4. Optionally, run `03_seed_data.sql` if you want sample data for development

5. **Get your API credentials**:
   - In the Supabase dashboard, go to "Settings" > "API"
   - Under "Project API keys", copy:
     - anon/public key (for client access)
     - URL (project URL)
   - Store these in your environment variables or .env file as:
     ```
     SUPABASE_URL=your_project_url
     SUPABASE_ANON_KEY=your_anon_key
     ```

6. **Add these variables to your .env file** in your project root.

7. **Connect your application to Supabase**:
   - Follow the instructions in `src/lib/supabase.js` to connect your application to Supabase

## Integration with Crawler

The application uses a dual-database approach:

1. **SQLite with Prisma**: Used by the crawler for local data storage and processing.
2. **Supabase PostgreSQL**: Used for the main application data and user interface.

The crawler data can be synchronized with Supabase using the functions defined in `04_crawler_integration.sql`:

- `sync_crawler_products`: Takes product data from the crawler and adds/updates products in Supabase
- `update_store_status`: Updates the status of a store in the Supabase database

## Additional Resources

- [Supabase Documentation](https://supabase.io/docs)
- [Supabase JavaScript Client](https://supabase.io/docs/reference/javascript/supabase-client)
- [Supabase Auth Documentation](https://supabase.io/docs/guides/auth)
- [Row Level Security Guide](https://supabase.io/docs/guides/auth/row-level-security) 