# PowerShell script to set environment variables for Base44 to Supabase setup
# Run this script with: .\set-env.ps1

Write-Host "Base44 to Supabase Environment Setup" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green

# Set the Supabase URL
$env:VITE_SUPABASE_URL = "http://134.199.146.249:8000"
Write-Host "✅ Set VITE_SUPABASE_URL to: $env:VITE_SUPABASE_URL" -ForegroundColor Green

# Prompt for the anon key
$anonKey = Read-Host "Enter your Supabase anon key"
if ($anonKey) {
    $env:VITE_SUPABASE_ANON_KEY = $anonKey
    Write-Host "✅ Set VITE_SUPABASE_ANON_KEY" -ForegroundColor Green
} else {
    Write-Host "❌ Anon key not provided" -ForegroundColor Red
}

# Prompt for the service role key
$serviceKey = Read-Host "Enter your Supabase service role key"
if ($serviceKey) {
    $env:VITE_SUPABASE_SERVICE_ROLE_KEY = $serviceKey
    Write-Host "✅ Set VITE_SUPABASE_SERVICE_ROLE_KEY" -ForegroundColor Green
} else {
    Write-Host "❌ Service role key not provided" -ForegroundColor Red
}

Write-Host "`nEnvironment variables set for current session." -ForegroundColor Yellow
Write-Host "To make them permanent, add them to your system environment variables." -ForegroundColor Yellow

Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "1. Run the SQL setup script in your Supabase dashboard" -ForegroundColor White
Write-Host "2. Test connection: node test-connection.js" -ForegroundColor White
Write-Host "3. Start your app: npm run dev" -ForegroundColor White
