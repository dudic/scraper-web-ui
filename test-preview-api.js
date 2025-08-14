/**
 * Test Preview API Endpoint
 * This script tests the file processing API endpoint on the preview deployment
 */

require('dotenv').config({ path: '.env.local' });

async function testPreviewApi() {
  console.log('🔍 Testing preview API endpoint...\n');

  const testRunId = 'dLVdbnxnBLKy7S2v8';
  const previewUrl = 'https://scraper-web-dp5cz2bzz-dudics-projects.vercel.app';
  const url = `${previewUrl}/api/files/process/${testRunId}`;

  console.log(`Testing preview URL: ${url}`);
  console.log(`Preview deployment: ${previewUrl}`);

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

testPreviewApi().catch(console.error);
