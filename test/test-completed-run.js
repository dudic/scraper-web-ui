/**
 * Test API with Completed Run ID
 * This script tests the file processing API with a completed run ID from the database
 */

require('dotenv').config({ path: '.env.local' });

async function testCompletedRun() {
  console.log('🔍 Testing API with completed run ID...\n');

  // Use one of the completed runs from the database
  const completedRunId = '0SjsJcSBusV436fZZ'; // Most recent completed run
  const baseUrl = process.env.FRONT_URL?.replace(/\/+$/, '') || 'http://localhost:3000';
  const url = `${baseUrl}/api/files/process/${completedRunId}`;

  console.log(`Testing with completed run ID: ${completedRunId}`);
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
        
        // Check if files were processed
        if (json.success) {
          console.log(`✅ Successfully processed ${json.processedCount} files`);
        } else if (json.message) {
          console.log(`ℹ️ ${json.message}`);
        }
      } catch (parseError) {
        console.log('❌ JSON parse error:', parseError.message);
      }
    }

  } catch (error) {
    console.log(`❌ Request failed: ${error.message}`);
  }
}

testCompletedRun().catch(console.error);
