/**
 * Test Key-Value Store Access
 * This script tests access to the key-value store and lists available keys
 */

require('dotenv').config({ path: '.env.local' });

async function testKeyValueStore() {
  console.log('🔍 Testing key-value store access...\n');

  const keyValueStoreId = 'NQniMkP2rxCTyPpq1';
  const apifyToken = process.env.APIFY_TOKEN;

  console.log(`Testing key-value store: ${keyValueStoreId}`);

  try {
    // Test 1: List all keys in the key-value store
    console.log('\n1️⃣ Listing all keys...');
    const listResponse = await fetch(`https://api.apify.com/v2/key-value-stores/${keyValueStoreId}/keys`, {
      headers: {
        'Authorization': `Bearer ${apifyToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!listResponse.ok) {
      console.log(`❌ Failed to list keys: ${listResponse.status} ${listResponse.statusText}`);
      return;
    }

    const keys = await listResponse.json();
    console.log(`✅ Response:`, JSON.stringify(keys, null, 2));
    
    if (Array.isArray(keys)) {
      console.log(`✅ Found ${keys.length} keys:`);
      keys.forEach((key, index) => {
        console.log(`   ${index + 1}. ${key.key} (${key.size} bytes)`);
      });
    } else if (keys && keys.data && keys.data.items && Array.isArray(keys.data.items)) {
      console.log(`✅ Found ${keys.data.items.length} keys:`);
      keys.data.items.forEach((key, index) => {
        console.log(`   ${index + 1}. ${key.key} (${key.size} bytes)`);
      });
    } else {
      console.log(`❌ Unexpected response format:`, typeof keys);
    }

    // Test 2: Try to access specific files we know should exist
    const expectedFiles = [
      'evaluation_uid_50675.pdf',
      'assessment_evaluation_uid_50675.pdf', 
      '20250814_ppt_report_de.pptx',
      '20250814_collective_rohdaten.csv'
    ];

    console.log('\n2️⃣ Testing specific file access...');
    for (const filename of expectedFiles) {
      try {
        const fileResponse = await fetch(`https://api.apify.com/v2/key-value-stores/${keyValueStoreId}/records/${filename}`, {
          headers: {
            'Authorization': `Bearer ${apifyToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (fileResponse.ok) {
          console.log(`✅ ${filename}: Found (${fileResponse.headers.get('content-length')} bytes)`);
        } else {
          console.log(`❌ ${filename}: ${fileResponse.status} ${fileResponse.statusText}`);
        }
      } catch (error) {
        console.log(`❌ ${filename}: Error - ${error.message}`);
      }
    }

  } catch (error) {
    console.log(`❌ Test failed: ${error.message}`);
  }
}

testKeyValueStore().catch(console.error);
