# Base44 to Supabase Setup Guide

This guide will help you complete the setup of your Base44 export with your self-hosted Supabase backend.

## Prerequisites

- Self-hosted Supabase instance running at `http://134.199.146.249:8000`
- Access to your Supabase dashboard
- Your Supabase anon key and service role key

## Step 1: Set Environment Variables

You need to set the following environment variables. Since we can't create .env files directly, you'll need to set them in your system or IDE:

```bash
VITE_SUPABASE_URL=http://134.199.146.249:8000
VITE_SUPABASE_ANON_KEY=your_actual_anon_key_here
VITE_SUPABASE_SERVICE_ROLE_KEY=your_actual_service_role_key_here
```

**For Windows PowerShell:**
```powershell
$env:VITE_SUPABASE_URL="http://134.199.146.249:8000"
$env:VITE_SUPABASE_ANON_KEY="your_actual_anon_key_here"
$env:VITE_SUPABASE_SERVICE_ROLE_KEY="your_actual_service_role_key_here"
```

**For Windows Command Prompt:**
```cmd
set VITE_SUPABASE_URL=http://134.199.146.249:8000
set VITE_SUPABASE_ANON_KEY=your_actual_anon_key_here
set VITE_SUPABASE_SERVICE_ROLE_KEY=your_actual_service_role_key_here
```

## Step 2: Create Database Tables

1. Open your Supabase dashboard at `http://134.199.146.249:8000`
2. Go to the SQL Editor
3. Run one of the following SQL scripts:

### Option A: Basic Setup (Recommended)
Copy and paste the contents of `supabase-setup.sql` into the SQL Editor and run it.

### Option B: Full Setup
Copy and paste the contents of `supabase-full-setup.sql` into the SQL Editor and run it.

## Step 3: Verify Setup

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Open your browser and navigate to your app
3. Check the browser console for any error messages
4. You should see "Service role client initialized successfully" if everything is working

## Step 4: Test Authentication

1. The app should redirect you to a login page
2. For development, you can use the dev login feature
3. The first user created will automatically be set as an admin

## Troubleshooting

### "Users table not found" Error
- Make sure you've run the SQL setup script in your Supabase dashboard
- Check that the script executed without errors

### "Service role client initialization failed" Error
- Verify your `VITE_SUPABASE_SERVICE_ROLE_KEY` is correct
- Make sure your Supabase instance is running and accessible

### Authentication Issues
- Check that your `VITE_SUPABASE_ANON_KEY` is correct
- Verify the Supabase URL is accessible from your browser

## Files Created/Modified

- `src/lib/supabase-client.js` - Browser client configuration
- `src/lib/custom-sdk.js` - Universal SDK with service role client
- `src/api/base44Client.js` - Base44 compatibility layer
- `src/api/entities.js` - Entity exports
- `supabase-setup.sql` - Basic database setup
- `supabase-full-setup.sql` - Complete database setup
- `SETUP.md` - This setup guide

## Next Steps

Once the basic setup is complete, you can:

1. Add more entities to `src/api/entities.js` as needed
2. Customize the database schema in the SQL files
3. Add more sophisticated RLS policies
4. Implement additional integrations in the custom SDK

## Support

If you encounter issues:

1. Check the browser console for error messages
2. Verify all environment variables are set correctly
3. Ensure the SQL setup script ran successfully
4. Check that your Supabase instance is running and accessible
