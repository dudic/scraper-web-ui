/**
 * Debug Script for File Processing
 * This script helps identify where the file processing pipeline is failing
 */

const { createClient } = require('@supabase/supabase-js');
const { ApifyClient } = require('apify-client');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

async function debugFileProcessing() {
  console.log('🔍 Starting file processing debug...\n');

  // Test 1: Environment Variables
  console.log('1️⃣ Checking environment variables...');
  const requiredEnvVars = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'APIFY_TOKEN',
    'FRONT_URL'
  ];

  for (const envVar of requiredEnvVars) {
    const value = process.env[envVar];
    if (!value) {
      console.log(`❌ Missing: ${envVar}`);
    } else {
      console.log(`✅ Found: ${envVar} = ${value.substring(0, 20)}...`);
    }
  }
  console.log('');

  // Test 2: Supabase Connection
  console.log('2️⃣ Testing Supabase connection...');
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Test database connection
    const { data: runs, error: runsError } = await supabase
      .from('runs')
      .select('*')
      .limit(5);

    if (runsError) {
      console.log(`❌ Database connection failed: ${runsError.message}`);
    } else {
      console.log(`✅ Database connected. Found ${runs.length} runs`);
    }

    // Test files table
    const { data: files, error: filesError } = await supabase
      .from('files')
      .select('*')
      .limit(5);

    if (filesError) {
      console.log(`❌ Files table error: ${filesError.message}`);
    } else {
      console.log(`✅ Files table accessible. Found ${files.length} files`);
    }

    // Test storage bucket
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    if (bucketsError) {
      console.log(`❌ Storage error: ${bucketsError.message}`);
    } else {
      const scraperBucket = buckets.find(b => b.name === 'scraper-files');
      if (scraperBucket) {
        console.log(`✅ Storage bucket 'scraper-files' exists`);
      } else {
        console.log(`❌ Storage bucket 'scraper-files' not found`);
        console.log(`Available buckets: ${buckets.map(b => b.name).join(', ')}`);
      }
    }

  } catch (error) {
    console.log(`❌ Supabase connection failed: ${error.message}`);
  }
  console.log('');

  // Test 3: APIFY Connection
  console.log('3️⃣ Testing APIFY connection...');
  try {
    const apifyClient = new ApifyClient({ token: process.env.APIFY_TOKEN });
    
    // Test APIFY API access
    const user = await apifyClient.user();
    console.log(`✅ APIFY connected. User: ${user.username}`);
    
    // List recent runs
    const runs = await apifyClient.runs().list({ limit: 5 });
    console.log(`✅ Found ${runs.items.length} recent APIFY runs`);
    
    if (runs.items.length > 0) {
      const latestRun = runs.items[0];
      console.log(`Latest run: ${latestRun.id} (${latestRun.status})`);
      
      // Test dataset access
      try {
        const dataset = await apifyClient.dataset(latestRun.id);
        const datasetItems = await dataset.listItems({ limit: 5 });
        console.log(`✅ Dataset accessible. Found ${datasetItems.items.length} items`);
        
        if (datasetItems.items.length > 0) {
          console.log('Sample dataset item:', JSON.stringify(datasetItems.items[0], null, 2));
        }
      } catch (datasetError) {
        console.log(`❌ Dataset access failed: ${datasetError.message}`);
      }
      
      // Test key-value store access
      try {
        const keyValueStore = await apifyClient.keyValueStore(latestRun.id);
        const records = await keyValueStore.listKeys({ limit: 5 });
        console.log(`✅ Key-value store accessible. Found ${records.items.length} keys`);
        
        if (records.items.length > 0) {
          console.log('Sample keys:', records.items.map(r => r.key).slice(0, 3));
        }
      } catch (kvError) {
        console.log(`❌ Key-value store access failed: ${kvError.message}`);
      }
    }
    
  } catch (error) {
    console.log(`❌ APIFY connection failed: ${error.message}`);
  }
  console.log('');

  // Test 4: Manual File Processing Test
  console.log('4️⃣ Testing manual file processing...');
  try {
    const apifyClient = new ApifyClient({ token: process.env.APIFY_TOKEN });
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Find a completed run
    const runs = await apifyClient.runs().list({ 
      limit: 10,
      status: 'SUCCEEDED'
    });

    if (runs.items.length === 0) {
      console.log('❌ No completed runs found to test with');
      return;
    }

    const testRun = runs.items[0];
    console.log(`Testing with run: ${testRun.id}`);

    // Check if files already processed
    const { data: existingFiles } = await supabase
      .from('files')
      .select('id')
      .eq('run_id', testRun.id);

    if (existingFiles && existingFiles.length > 0) {
      console.log(`✅ Files already processed for run ${testRun.id} (${existingFiles.length} files)`);
      return;
    }

    // Try to process files manually
    console.log('Attempting manual file processing...');
    
    const response = await fetch(`${process.env.FRONT_URL}/api/files/process/${testRun.id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();
    console.log(`Response status: ${response.status}`);
    console.log('Response:', JSON.stringify(result, null, 2));

  } catch (error) {
    console.log(`❌ Manual processing test failed: ${error.message}`);
  }

  console.log('\n🔍 Debug complete!');
}

// Run the debug script
debugFileProcessing().catch(console.error);
