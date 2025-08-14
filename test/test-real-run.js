/**
 * Test API with Real Run ID
 * This script tests the file processing API with a real run ID from the database
 */

require('dotenv').config({ path: '.env.local' });

async function testRealRun() {
  console.log('🔍 Testing API with real run ID...\n');

  const realRunId = 'mgPOUgeHr3T9JyCK3'; // From the database
  const baseUrl = process.env.FRONT_URL?.replace(/\/+$/, '') || 'http://localhost:3000';
  const url = `${baseUrl}/api/files/process/${realRunId}`;

  console.log(`Testing with real run ID: ${realRunId}`);
  console.log(`URL: ${url}`);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log(`Response status: ${response.status}`);
    console.log(`Response headers:`, Object.fromEntries(response.headers.entries()));

    const text = await response.text();
    console.log(`Response text: "${text}"`);

    if (text) {
      try {
        const json = JSON.parse(text);
        console.log('Response JSON:', JSON.stringify(json, null, 2));
      } catch (parseError) {
        console.log('❌ JSON parse error:', parseError.message);
      }
    }

  } catch (error) {
    console.log(`❌ Request failed: ${error.message}`);
  }
}

testRealRun().catch(console.error);
