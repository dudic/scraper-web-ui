/**
 * Test APIFY Actor Configuration
 * This script tests the APIFY actor configuration and runs a test execution
 */

const { ApifyClient } = require('apify-client');
require('dotenv').config({ path: '.env.local' });

async function testApifyActor() {
  console.log('🔍 Testing APIFY actor configuration...\n');

  const apifyClient = new ApifyClient({ token: process.env.APIFY_TOKEN });

  try {
    // Test 1: Check APIFY connection
    console.log('1️⃣ Testing APIFY connection...');
    const user = await apifyClient.user();
    console.log(`✅ Connected to APIFY as: ${user.username}`);
    console.log(`   User ID: ${user.id}`);
    console.log(`   Plan: ${user.plan}`);

    // Test 2: List actors
    console.log('\n2️⃣ Listing actors...');
    const actors = await apifyClient.actors().list();
    console.log(`Found ${actors.items.length} actors:`);
    
    actors.items.forEach(actor => {
      console.log(`   - ${actor.name} (${actor.id}) - ${actor.description || 'No description'}`);
    });

    // Test 3: Check specific actor (if provided)
    const actorId = process.env.APIFY_ACTOR_ID;
    if (actorId) {
      console.log(`\n3️⃣ Checking specific actor: ${actorId}`);
      try {
        const actor = await apifyClient.actor(actorId);
        console.log(`✅ Actor found: ${actor.name}`);
        console.log(`   Description: ${actor.description}`);
        console.log(`   Version: ${actor.versionNumber}`);
        console.log(`   Input Schema:`, actor.inputSchema);
      } catch (error) {
        console.log(`❌ Actor not found: ${error.message}`);
      }
    }

    // Test 4: Check recent runs
    console.log('\n4️⃣ Checking recent runs...');
    const runs = await apifyClient.runs().list({ limit: 5 });
    console.log(`Found ${runs.items.length} recent runs:`);
    
    runs.items.forEach(run => {
      console.log(`   - ${run.id}: ${run.status} (Actor: ${run.actorId || 'Unknown'})`);
    });

    // Test 5: Environment variables check
    console.log('\n5️⃣ Environment variables check...');
    const requiredVars = ['APIFY_TOKEN', 'FRONT_URL', 'ACTOR_SECRET'];
    requiredVars.forEach(varName => {
      const value = process.env[varName];
      if (value) {
        console.log(`✅ ${varName}: ${value.substring(0, 20)}...`);
      } else {
        console.log(`❌ ${varName}: Missing`);
      }
    });

  } catch (error) {
    console.log(`❌ APIFY test failed: ${error.message}`);
  }
}

testApifyActor().catch(console.error);
