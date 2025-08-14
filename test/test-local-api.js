/**
 * Test Local API Endpoint
 * This script tests the file processing API endpoint locally
 */

require('dotenv').config({ path: '.env.local' });

async function testLocalApi() {
  console.log('🔍 Testing local API endpoint...\n');

  const testRunId = 'dLVdbnxnBLKy7S2v8';
  const localUrl = `http://localhost:3000/api/files/process/${testRunId}`;

  console.log(`Testing local URL: ${localUrl}`);

  try {
    const response = await fetch(localUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log(`Response status: ${response.status}`);
    console.log(`Response headers:`, Object.fromEntries(response.headers.entries()));

    // Check if response has content
    const text = await response.text();
    console.log(`Response text: "${text}"`);

    if (text) {
      try {
        const json = JSON.parse(text);
        console.log('Response JSON:', JSON.stringify(json, null, 2));
      } catch (parseError) {
        console.log('❌ JSON parse error:', parseError.message);
      }
    } else {
      console.log('❌ Empty response body');
    }

  } catch (error) {
    console.log(`❌ Request failed: ${error.message}`);
    console.log('Make sure the development server is running with: npm run dev');
  }
}

testLocalApi().catch(console.error);
