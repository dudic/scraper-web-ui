/**
 * Test File Processing on Preview Deployment
 * This script tests the file processing API on the Vercel preview deployment
 */

require('dotenv').config({ path: '.env.local' });

async function testPreviewDeployment() {
  console.log('🔍 Testing API on preview deployment...\n');

  const testRunId = '0SjsJcSBusV436fZZ'; // The run we know has files
  const previewUrl = 'https://scraper-web-ui-git-feature-file-storage-dudics-projects.vercel.app';
  const url = `${previewUrl}/api/files/process/${testRunId}`;

  console.log(`Testing with run ID: ${testRunId}`);
  console.log(`Preview URL: ${url}`);

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

testPreviewDeployment().catch(console.error);
