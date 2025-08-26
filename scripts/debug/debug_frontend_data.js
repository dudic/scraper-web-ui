// Debug script to check frontend data
// Run this in the browser console on your Vercel app

console.log('🔍 Debugging Frontend Data...');

// Check if Supabase client is available
if (typeof window !== 'undefined') {
  // Create a simple test to check database data
  const testDatabaseConnection = async () => {
    try {
      // Get the Supabase URL and key from the page
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || window.location.origin;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      console.log('Supabase URL:', supabaseUrl);
      console.log('Supabase Key available:', !!supabaseKey);
      
      // Try to fetch data directly
      const response = await fetch(`${supabaseUrl}/rest/v1/runs?select=*&order=started_at.desc&limit=5`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('🔍 Raw database data:', data);
        
        // Check for code and code_type fields
        data.forEach((run, index) => {
          console.log(`Run ${index + 1}:`, {
            id: run.id,
            code: run.code,
            code_type: run.code_type,
            status: run.status,
            started_at: run.started_at
          });
        });
        
        // Check if any runs have code values
        const runsWithCode = data.filter(run => run.code && run.code !== 'unknown');
        console.log('Runs with actual code values:', runsWithCode.length);
        
      } else {
        console.error('Failed to fetch data:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error testing database connection:', error);
    }
  };
  
  // Run the test
  testDatabaseConnection();
}

// Also check the React component data
console.log('To check React component data, add this to your component:');
console.log(`
// Add this to your RunList component temporarily:
console.log('🔍 React component data:', runs);
runs.forEach((run, index) => {
  console.log(\`Run \${index + 1}:\`, {
    id: run.id,
    code: run.code,
    code_type: run.code_type,
    status: run.status
  });
});
`);

