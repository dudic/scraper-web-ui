/**
 * Debug APIFY Connection
 * This script checks APIFY connection and authentication
 */

const { ApifyClient } = require('apify-client');
require('dotenv').config({ path: '.env.local' });

async function debugApifyConnection() {
  console.log('🔍 Debugging APIFY connection...\n');

  // Check environment variables
  console.log('1️⃣ Environment variables:');
  const token = process.env.APIFY_TOKEN;
  if (token) {
    console.log(`✅ APIFY_TOKEN: ${token.substring(0, 10)}...${token.substring(token.length - 4)}`);
  } else {
    console.log('❌ APIFY_TOKEN: Missing');
    return;
  }

  const apifyClient = new ApifyClient({ token });

  try {
    // Test 1: Check user info
    console.log('\n2️⃣ Testing user connection...');
    const user = await apifyClient.user();
    console.log(`✅ Connected as: ${user.username} (${user.id})`);
    console.log(`   Plan: ${user.plan}`);

    // Test 2: List recent runs
    console.log('\n3️⃣ Listing recent runs...');
    const runs = await apifyClient.runs().list({ limit: 10 });
    console.log(`✅ Found ${runs.items.length} recent runs:`);
    
    runs.items.forEach((run, index) => {
      console.log(`   ${index + 1}. ${run.id}: ${run.status} (Actor: ${run.actorId || 'Unknown'})`);
    });

    // Test 3: Try to get the specific run
    console.log('\n4️⃣ Getting specific run: 0SjsJcSBusV436fZZ');
    try {
      const specificRun = await apifyClient.run('0SjsJcSBusV436fZZ');
      console.log('✅ Specific run found:');
      console.log(`   ID: ${specificRun.id}`);
      console.log(`   Status: ${specificRun.status}`);
      console.log(`   Actor ID: ${specificRun.actorId}`);
      console.log(`   Started At: ${specificRun.startedAt}`);
      console.log(`   Finished At: ${specificRun.finishedAt}`);
    } catch (error) {
      console.log(`❌ Error getting specific run: ${error.message}`);
      console.log(`   Error code: ${error.code}`);
      console.log(`   Error status: ${error.status}`);
    }

    // Test 4: Check if we can access the actor
    console.log('\n5️⃣ Checking actor access...');
    try {
      const actor = await apifyClient.actor('dudic/unified-scraper-actor');
      console.log(`✅ Actor found: ${actor.name}`);
      console.log(`   Description: ${actor.description}`);
      console.log(`   Version: ${actor.versionNumber}`);
    } catch (error) {
      console.log(`❌ Error accessing actor: ${error.message}`);
    }

    // Test 5: Check dataset access
    console.log('\n6️⃣ Testing dataset access...');
    try {
      const dataset = await apifyClient.dataset('0SjsJcSBusV436fZZ');
      const datasetInfo = await dataset.getInfo();
      console.log(`✅ Dataset found: ${datasetInfo.itemCount} items`);
    } catch (error) {
      console.log(`❌ Dataset error: ${error.message}`);
    }

    // Test 6: Check key-value store access
    console.log('\n7️⃣ Testing key-value store access...');
    try {
      const keyValueStore = await apifyClient.keyValueStore('0SjsJcSBusV436fZZ');
      const storeInfo = await keyValueStore.getInfo();
      console.log(`✅ Key-value store found: ${storeInfo.keyCount} keys`);
    } catch (error) {
      console.log(`❌ Key-value store error: ${error.message}`);
    }

  } catch (error) {
    console.log(`❌ Connection error: ${error.message}`);
    console.log(`   Error code: ${error.code}`);
    console.log(`   Error status: ${error.status}`);
  }
}

debugApifyConnection().catch(console.error);
