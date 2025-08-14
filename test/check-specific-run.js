/**
 * Check Specific APIFY Run
 * This script examines a specific APIFY run in detail
 */

const { ApifyClient } = require('apify-client');
require('dotenv').config({ path: '.env.local' });

async function checkSpecificRun() {
  console.log('🔍 Examining specific APIFY run...\n');

  const runId = '0SjsJcSBusV436fZZ';
  const apifyClient = new ApifyClient({ token: process.env.APIFY_TOKEN });

  try {
    // Get run details
    console.log(`1️⃣ Getting run details for: ${runId}`);
    const run = await apifyClient.run(runId);
    
    console.log('Run Details:');
    console.log(`   ID: ${run.id}`);
    console.log(`   Status: ${run.status}`);
    console.log(`   Actor ID: ${run.actorId || 'Unknown'}`);
    console.log(`   User ID: ${run.userId}`);
    console.log(`   Started At: ${run.startedAt}`);
    console.log(`   Finished At: ${run.finishedAt}`);
    console.log(`   Meta:`, run.meta);
    console.log(`   Input:`, run.input);
    console.log(`   Output:`, run.output);

    // Check if run has dataset
    console.log('\n2️⃣ Checking dataset...');
    try {
      const dataset = await apifyClient.dataset(runId);
      const datasetItems = await dataset.listItems({ limit: 10 });
      console.log(`✅ Dataset found with ${datasetItems.items.length} items`);
      
      if (datasetItems.items.length > 0) {
        console.log('Sample dataset items:');
        datasetItems.items.slice(0, 3).forEach((item, index) => {
          console.log(`   Item ${index + 1}:`, JSON.stringify(item, null, 2));
        });
      }
    } catch (error) {
      console.log(`❌ Dataset error: ${error.message}`);
    }

    // Check if run has key-value store
    console.log('\n3️⃣ Checking key-value store...');
    try {
      const keyValueStore = await apifyClient.keyValueStore(runId);
      const records = await keyValueStore.listKeys({ limit: 10 });
      console.log(`✅ Key-value store found with ${records.items.length} keys`);
      
      if (records.items.length > 0) {
        console.log('Sample keys:');
        records.items.slice(0, 5).forEach((record, index) => {
          console.log(`   Key ${index + 1}: ${record.key} (${record.size} bytes)`);
        });
      }
    } catch (error) {
      console.log(`❌ Key-value store error: ${error.message}`);
    }

    // Check if run has request queue
    console.log('\n4️⃣ Checking request queue...');
    try {
      const requestQueue = await apifyClient.requestQueue(runId);
      const queueInfo = await requestQueue.getInfo();
      console.log(`✅ Request queue found:`);
      console.log(`   Pending: ${queueInfo.pendingRequestCount}`);
      console.log(`   Handled: ${queueInfo.handledRequestCount}`);
    } catch (error) {
      console.log(`❌ Request queue error: ${error.message}`);
    }

    // Check run logs
    console.log('\n5️⃣ Checking run logs...');
    try {
      const logs = await apifyClient.run(runId).log();
      console.log(`✅ Logs found (${logs.length} lines)`);
      
      if (logs.length > 0) {
        console.log('Last 10 log lines:');
        logs.slice(-10).forEach(log => {
          console.log(`   ${log.level}: ${log.message}`);
        });
      }
    } catch (error) {
      console.log(`❌ Logs error: ${error.message}`);
    }

    // Check if this run exists in our database
    console.log('\n6️⃣ Checking database record...');
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: dbRun, error: dbError } = await supabase
      .from('runs')
      .select('*')
      .eq('id', runId)
      .single();

    if (dbError) {
      console.log(`❌ Database error: ${dbError.message}`);
    } else if (dbRun) {
      console.log('✅ Database record found:');
      console.log(`   Status: ${dbRun.status}`);
      console.log(`   Progress: ${dbRun.pct}%`);
      console.log(`   File Count: ${dbRun.file_count || 0}`);
      console.log(`   Started At: ${dbRun.started_at}`);
      console.log(`   Updated At: ${dbRun.updated_at}`);
    } else {
      console.log('❌ No database record found for this run');
    }

  } catch (error) {
    console.log(`❌ Error examining run: ${error.message}`);
  }
}

checkSpecificRun().catch(console.error);
