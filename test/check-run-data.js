/**
 * Check Run Data
 * This script properly checks the run's dataset and key-value store
 */

const { ApifyClient } = require('apify-client');
require('dotenv').config({ path: '.env.local' });

async function checkRunData() {
  console.log('🔍 Checking run data properly...\n');

  const runId = '0SjsJcSBusV436fZZ';
  const apifyClient = new ApifyClient({ token: process.env.APIFY_TOKEN });

  try {
    // Test 1: Get run details
    console.log(`1️⃣ Getting run details for: ${runId}`);
    const run = await apifyClient.run(runId);
    console.log('Run object:', JSON.stringify(run, null, 2));

    // Test 2: Check dataset items
    console.log('\n2️⃣ Checking dataset items...');
    try {
      const dataset = await apifyClient.dataset(runId);
      const datasetItems = await dataset.listItems({ limit: 10 });
      console.log(`✅ Dataset items found: ${datasetItems.items.length}`);
      
      if (datasetItems.items.length > 0) {
        console.log('Sample items:');
        datasetItems.items.slice(0, 3).forEach((item, index) => {
          console.log(`   Item ${index + 1}:`, JSON.stringify(item, null, 2));
        });
      }
    } catch (error) {
      console.log(`❌ Dataset error: ${error.message}`);
    }

    // Test 3: Check key-value store keys
    console.log('\n3️⃣ Checking key-value store keys...');
    try {
      const keyValueStore = await apifyClient.keyValueStore(runId);
      const records = await keyValueStore.listKeys({ limit: 10 });
      console.log(`✅ Key-value store keys found: ${records.items.length}`);
      
      if (records.items.length > 0) {
        console.log('Sample keys:');
        records.items.slice(0, 5).forEach((record, index) => {
          console.log(`   Key ${index + 1}: ${record.key} (${record.size} bytes)`);
        });

        // Try to get the first key's value
        if (records.items.length > 0) {
          console.log('\n4️⃣ Getting first key value...');
          const firstKey = records.items[0].key;
          const value = await keyValueStore.getValue(firstKey);
          console.log(`Value for "${firstKey}":`, JSON.stringify(value, null, 2));
        }
      }
    } catch (error) {
      console.log(`❌ Key-value store error: ${error.message}`);
    }

    // Test 4: Check if we can access the actor directly
    console.log('\n5️⃣ Checking actor directly...');
    try {
      const actor = await apifyClient.actor('dudic/unified-scraper-actor');
      console.log('Actor object:', JSON.stringify(actor, null, 2));
    } catch (error) {
      console.log(`❌ Actor error: ${error.message}`);
    }

    // Test 5: List all datasets
    console.log('\n6️⃣ Listing all datasets...');
    try {
      const datasets = await apifyClient.datasets().list({ limit: 10 });
      console.log(`Found ${datasets.items.length} datasets:`);
      datasets.items.forEach((dataset, index) => {
        console.log(`   ${index + 1}. ${dataset.id}: ${dataset.name || 'Unnamed'}`);
      });
    } catch (error) {
      console.log(`❌ Datasets list error: ${error.message}`);
    }

    // Test 6: List all key-value stores
    console.log('\n7️⃣ Listing all key-value stores...');
    try {
      const keyValueStores = await apifyClient.keyValueStores().list({ limit: 10 });
      console.log(`Found ${keyValueStores.items.length} key-value stores:`);
      keyValueStores.items.forEach((store, index) => {
        console.log(`   ${index + 1}. ${store.id}: ${store.name || 'Unnamed'}`);
      });
    } catch (error) {
      console.log(`❌ Key-value stores list error: ${error.message}`);
    }

  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
}

checkRunData().catch(console.error);
