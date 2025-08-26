#!/bin/bash

# Supabase CLI Migration Script
# This script applies the database migration for code and code_type columns

echo "🚀 Starting Supabase CLI Migration Process..."
echo "=============================================="

# Step 1: Check Supabase CLI installation
echo "📋 Step 1: Checking Supabase CLI installation..."
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed. Please install it first."
    echo "   Visit: https://supabase.com/docs/guides/cli"
    exit 1
fi

echo "✅ Supabase CLI is installed: $(supabase --version)"

# Step 2: Check project status
echo ""
echo "📋 Step 2: Checking project status..."
supabase status

# Step 3: Check migration status
echo ""
echo "📋 Step 3: Checking current migration status..."
supabase migration list

# Step 4: Apply migrations
echo ""
echo "📋 Step 4: Applying migrations..."
echo "Applying all pending migrations..."
supabase db push --include-all

# Step 5: Verify the migration
echo ""
echo "📋 Step 5: Verifying migration..."
echo "Checking if code and code_type columns exist..."

# Run verification query
echo "Running verification query..."
supabase db diff

echo ""
echo "🎉 Migration process completed!"
echo ""
echo "📝 Next steps:"
echo "1. Check your frontend to see if Code and Code Type columns appear"
echo "2. Start a new import to test the functionality"
echo "3. Verify existing runs display properly"
echo ""
echo "🔍 If you need to verify manually, run:"
echo "   supabase db diff"
echo "   supabase migration list"
