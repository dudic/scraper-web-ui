# Supabase CLI Migration Script for Windows
# This script applies the database migration for code and code_type columns

Write-Host "🚀 Starting Supabase CLI Migration Process..." -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Green

# Step 1: Check Supabase CLI installation
Write-Host "`n📋 Step 1: Checking Supabase CLI installation..." -ForegroundColor Yellow
try {
    $version = supabase --version
    Write-Host "✅ Supabase CLI is installed: $version" -ForegroundColor Green
} catch {
    Write-Host "❌ Supabase CLI is not installed. Please install it first." -ForegroundColor Red
    Write-Host "   Visit: https://supabase.com/docs/guides/cli" -ForegroundColor Red
    exit 1
}

# Step 2: Check project status
Write-Host "`n📋 Step 2: Checking project status..." -ForegroundColor Yellow
try {
    supabase status
} catch {
    Write-Host "⚠️  Could not check project status. You may need to link your project." -ForegroundColor Yellow
    Write-Host "   Run: supabase link --project-ref YOUR_PROJECT_REF" -ForegroundColor Yellow
}

# Step 3: Check migration status
Write-Host "`n📋 Step 3: Checking current migration status..." -ForegroundColor Yellow
try {
    supabase migration list
} catch {
    Write-Host "⚠️  Could not check migration status." -ForegroundColor Yellow
}

# Step 4: Apply migrations
Write-Host "`n📋 Step 4: Applying migrations..." -ForegroundColor Yellow
Write-Host "Applying all pending migrations..." -ForegroundColor Cyan
try {
    supabase db push --include-all
    Write-Host "✅ Migrations applied successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to apply migrations. Please check the error above." -ForegroundColor Red
    Write-Host "   You may need to run the SQL manually in the Supabase dashboard." -ForegroundColor Yellow
}

# Step 5: Verify the migration
Write-Host "`n📋 Step 5: Verifying migration..." -ForegroundColor Yellow
Write-Host "Checking if code and code_type columns exist..." -ForegroundColor Cyan

try {
    Write-Host "Running verification query..." -ForegroundColor Cyan
    supabase db diff
} catch {
    Write-Host "⚠️  Could not run verification. Please check manually." -ForegroundColor Yellow
}

Write-Host "`n🎉 Migration process completed!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "1. Check your frontend to see if Code and Code Type columns appear" -ForegroundColor White
Write-Host "2. Start a new import to test the functionality" -ForegroundColor White
Write-Host "3. Verify existing runs display properly" -ForegroundColor White
Write-Host ""
Write-Host "🔍 If you need to verify manually, run:" -ForegroundColor Cyan
Write-Host "   supabase db diff" -ForegroundColor White
Write-Host "   supabase migration list" -ForegroundColor White
Write-Host ""
Write-Host "💡 If the CLI approach doesn't work, you can run the SQL manually in the Supabase dashboard:" -ForegroundColor Yellow
Write-Host "   See DATABASE_FIX_GUIDE.md for manual SQL instructions" -ForegroundColor White
