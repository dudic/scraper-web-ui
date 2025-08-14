/**
 * Detailed APIFY Run Analysis
 * This script analyzes APIFY runs in detail to understand the data structure
 */

const { ApifyClient } = require('apify-client');
require('dotenv').config({ path: '.env.local' });

async function analyzeApifyRuns() {
  console.log('🔍 Analyzing APIFY runs in detail...\n');

  const apifyClient = new ApifyClient({ token: process.env.APIFY_TOKEN });

  try {
    // Get recent runs
    const runs = await apifyClient.runs().list({ limit: 10 });
    console.log(`Found ${runs.items.length} recent runs\n`);

    for (let i = 0; i < Math.min(5, runs.items.length); i++) {
      const run = runs.items[i];
      console.log(`📊 Run ${i + 1}: ${run.id}`);
      console.log(`   Status: ${run.status}`);
      console.log(`   Started: ${run.startedAt}`);
      console.log(`   Finished: ${run.finishedAt}`);
      console.log(`   Actor: ${run.actorId}`);
      console.log(`   User: ${run.userId}`);
      console.log(`   Meta: ${JSON.stringify(run.meta, null, 2)}`);
      
      // Check if run has dataset
      try {
        const dataset = await apifyClient.dataset(run.id);
        const datasetItems = await dataset.listItems({ limit: 3 });
        console.log(`   ✅ Dataset: ${datasetItems.items.length} items`);
        if (datasetItems.items.length > 0) {
          console.log(`   Sample item: ${JSON.stringify(datasetItems.items[0], null, 2)}`);
        }
      } catch (error) {
        console.log(`   ❌ Dataset: ${error.message}`);
      }

      // Check if run has key-value store
      try {
        const keyValueStore = await apifyClient.keyValueStore(run.id);
        const records = await keyValueStore.listKeys({ limit: 3 });
        console.log(`   ✅ Key-Value Store: ${records.items.length} keys`);
        if (records.items.length > 0) {
          console.log(`   Sample keys: ${records.items.map(r => r.key).join(', ')}`);
        }
      } catch (error) {
        console.log(`   ❌ Key-Value Store: ${error.message}`);
      }

      // Check if run has request queue
      try {
        const requestQueue = await apifyClient.requestQueue(run.id);
        const queueInfo = await requestQueue.getInfo();
        console.log(`   ✅ Request Queue: ${queueInfo.pendingRequestCount} pending`);
      } catch (error) {
        console.log(`   ❌ Request Queue: ${error.message}`);
      }

      console.log('');
    }

    // Check actor details
    if (runs.items.length > 0) {
      const latestRun = runs.items[0];
      console.log(`🎭 Actor Analysis for: ${latestRun.actorId}`);
      
      try {
        const actor = await apifyClient.actor(latestRun.actorId);
        console.log(`   Name: ${actor.name}`);
        console.log(`   Version: ${actor.versionNumber}`);
        console.log(`   Description: ${actor.description}`);
        console.log(`   Input Schema: ${JSON.stringify(actor.inputSchema, null, 2)}`);
      } catch (error) {
        console.log(`   ❌ Actor info: ${error.message}`);
      }
    }

  } catch (error) {
    console.log(`❌ Analysis failed: ${error.message}`);
  }
}

analyzeApifyRuns().catch(console.error);
