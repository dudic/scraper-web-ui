/**
 * Test File Processing with Correct Run ID
 * This script tests the file processing API with the run ID that we know has files
 */

require('dotenv').config({ path: '.env.local' });

async function testCorrectRun() {
  console.log('🔍 Testing API with correct run ID...\n');

  const testRunId = '0SjsJcSBusV436fZZ'; // The run we know has files
  const baseUrl = process.env.FRONT_URL?.replace(/\/+$/, '') || 'http://localhost:3000';
  const url = `${baseUrl}/api/files/process/${testRunId}`;

  console.log(`Testing with run ID: ${testRunId}`);
  console.log(`URL: ${url}`);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log(`Response status: ${response.status}`);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log(`Response text: "${responseText}"`);

    try {
      const responseJson = JSON.parse(responseText);
      console.log('Response JSON:', responseJson);
    } catch (e) {
      console.log('Response is not valid JSON');
    }

  } catch (error) {
    console.log(`❌ Request failed: ${error.message}`);
  }
}

testCorrectRun().catch(console.error);
