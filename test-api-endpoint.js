/**
 * Test API Endpoint
 * This script tests the file processing API endpoint directly
 */

require('dotenv').config({ path: '.env.local' });

async function testApiEndpoint() {
  console.log('🔍 Testing API endpoint directly...\n');

  const testRunId = 'dLVdbnxnBLKy7S2v8'; // Use the run ID from our analysis
  const baseUrl = process.env.FRONT_URL?.replace(/\/+$/, '') || 'http://localhost:3000';
  const url = `${baseUrl}/api/files/process/${testRunId}`;

  console.log(`Testing URL: ${url}`);
  console.log(`FRONT_URL: ${process.env.FRONT_URL}`);

  try {
    const response = await fetch(url, {
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
  }
}

testApiEndpoint().catch(console.error);
