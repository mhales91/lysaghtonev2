@echo off
echo Base44 to Supabase Environment Setup
echo =====================================

REM Set the Supabase URL
set VITE_SUPABASE_URL=http://134.199.146.249:8000
echo ✅ Set VITE_SUPABASE_URL to: %VITE_SUPABASE_URL%

REM Prompt for the anon key
set /p VITE_SUPABASE_ANON_KEY="Enter your Supabase anon key: "
if "%VITE_SUPABASE_ANON_KEY%"=="" (
    echo ❌ Anon key not provided
) else (
    echo ✅ Set VITE_SUPABASE_ANON_KEY
)

REM Prompt for the service role key
set /p VITE_SUPABASE_SERVICE_ROLE_KEY="Enter your Supabase service role key: "
if "%VITE_SUPABASE_SERVICE_ROLE_KEY%"=="" (
    echo ❌ Service role key not provided
) else (
    echo ✅ Set VITE_SUPABASE_SERVICE_ROLE_KEY
)

echo.
echo Environment variables set for current session.
echo To make them permanent, add them to your system environment variables.

echo.
echo Next steps:
echo 1. Run the SQL setup script in your Supabase dashboard
echo 2. Test connection: node test-connection.js
echo 3. Start your app: npm run dev

pause
