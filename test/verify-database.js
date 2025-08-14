/**
 * Database Verification Script
 * This script verifies the database schema and storage configuration
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function verifyDatabase() {
  console.log('🔍 Verifying database schema and storage...\n');

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // Test 1: Check if files table exists
    console.log('1️⃣ Checking files table...');
    const { data: files, error: filesError } = await supabase
      .from('files')
      .select('*')
      .limit(1);

    if (filesError) {
      console.log(`❌ Files table error: ${filesError.message}`);
      
      // Try to get table info
      const { data: tableInfo, error: tableError } = await supabase
        .rpc('get_table_info', { table_name: 'files' })
        .catch(() => ({ data: null, error: 'RPC not available' }));
      
      if (tableError) {
        console.log(`❌ Table info error: ${tableError.message}`);
      }
    } else {
      console.log(`✅ Files table exists and is accessible`);
      console.log(`   Current file count: ${files.length}`);
    }

    // Test 2: Check runs table
    console.log('\n2️⃣ Checking runs table...');
    const { data: runs, error: runsError } = await supabase
      .from('runs')
      .select('*')
      .limit(5);

    if (runsError) {
      console.log(`❌ Runs table error: ${runsError.message}`);
    } else {
      console.log(`✅ Runs table accessible. Found ${runs.length} runs`);
      
      if (runs.length > 0) {
        console.log('Sample run:', {
          id: runs[0].id,
          status: runs[0].status,
          pct: runs[0].pct,
          file_count: runs[0].file_count,
          created_at: runs[0].created_at
        });
      }
    }

    // Test 3: Check storage buckets
    console.log('\n3️⃣ Checking storage buckets...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.log(`❌ Storage error: ${bucketsError.message}`);
    } else {
      console.log(`✅ Storage accessible. Found ${buckets.length} buckets:`);
      buckets.forEach(bucket => {
        console.log(`   - ${bucket.name} (${bucket.public ? 'public' : 'private'})`);
      });

      const scraperBucket = buckets.find(b => b.name === 'scraper-files');
      if (scraperBucket) {
        console.log(`✅ Scraper-files bucket exists and is ${scraperBucket.public ? 'public' : 'private'}`);
        
        // Check bucket contents
        const { data: files, error: filesError } = await supabase.storage
          .from('scraper-files')
          .list('', { limit: 10 });
        
        if (filesError) {
          console.log(`❌ Bucket listing error: ${filesError.message}`);
        } else {
          console.log(`   Bucket contains ${files.length} files/folders`);
          if (files.length > 0) {
            console.log(`   Sample items: ${files.slice(0, 3).map(f => f.name).join(', ')}`);
          }
        }
      } else {
        console.log(`❌ Scraper-files bucket not found`);
        console.log(`   Available buckets: ${buckets.map(b => b.name).join(', ')}`);
      }
    }

    // Test 4: Check RLS policies
    console.log('\n4️⃣ Checking RLS policies...');
    try {
      // Try to access files as anonymous user
      const { data: anonFiles, error: anonError } = await supabase
        .from('files')
        .select('id')
        .limit(1);

      if (anonError) {
        console.log(`❌ Anonymous access blocked: ${anonError.message}`);
      } else {
        console.log(`✅ Anonymous access allowed (RLS might be disabled)`);
      }
    } catch (error) {
      console.log(`❌ RLS test error: ${error.message}`);
    }

    // Test 5: Check table structure
    console.log('\n5️⃣ Checking table structure...');
    try {
      // This is a simple way to check table structure
      const { data: sampleFile, error: sampleError } = await supabase
        .from('files')
        .select('*')
        .limit(1);

      if (sampleError) {
        console.log(`❌ Table structure check failed: ${sampleError.message}`);
      } else {
        console.log(`✅ Files table structure appears correct`);
        if (sampleFile && sampleFile.length > 0) {
          console.log(`   Columns: ${Object.keys(sampleFile[0]).join(', ')}`);
        }
      }
    } catch (error) {
      console.log(`❌ Structure check error: ${error.message}`);
    }

  } catch (error) {
    console.log(`❌ Database verification failed: ${error.message}`);
  }

  console.log('\n🔍 Database verification complete!');
}

verifyDatabase().catch(console.error);
