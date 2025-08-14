/**
 * Check All Runs in Database
 * This script examines all runs in the database to find completed ones
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkRuns() {
  console.log('🔍 Examining all runs in the database...\n');

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // Get all runs (without ordering by created_at since it might not exist)
    const { data: runs, error: runsError } = await supabase
      .from('runs')
      .select('*');

    if (runsError) {
      console.log(`❌ Error fetching runs: ${runsError.message}`);
      return;
    }

    console.log(`Found ${runs.length} total runs:\n`);

    // Group runs by status
    const runsByStatus = {};
    runs.forEach(run => {
      const status = run.status || 'UNKNOWN';
      if (!runsByStatus[status]) {
        runsByStatus[status] = [];
      }
      runsByStatus[status].push(run);
    });

    // Display runs by status
    Object.keys(runsByStatus).forEach(status => {
      const statusRuns = runsByStatus[status];
      console.log(`📊 Status: ${status} (${statusRuns.length} runs)`);
      
      statusRuns.forEach(run => {
        console.log(`   - ID: ${run.id}`);
        console.log(`     Progress: ${run.pct}% (${run.done || 0}/${run.total || 0})`);
        console.log(`     File Count: ${run.file_count || 0}`);
        console.log(`     Started At: ${run.started_at || 'N/A'}`);
        console.log(`     Updated At: ${run.updated_at || 'N/A'}`);
        if (run.error) {
          console.log(`     Error: ${run.error}`);
        }
        console.log('');
      });
    });

    // Find completed runs
    const completedRuns = runs.filter(run => 
      run.status === 'SUCCEEDED' || 
      run.status === 'COMPLETED' || 
      run.status === 'FINISHED'
    );

    if (completedRuns.length > 0) {
      console.log(`🎉 Found ${completedRuns.length} completed runs!`);
      console.log('Completed runs:');
      completedRuns.forEach(run => {
        console.log(`   - ${run.id} (${run.status})`);
      });
    } else {
      console.log('❌ No completed runs found');
      console.log('Available statuses:', Object.keys(runsByStatus));
    }

    // Show all runs with their details
    console.log('\n📋 All runs details:');
    runs.forEach(run => {
      console.log(`   - ${run.id}: ${run.status} (${run.pct}%) - Files: ${run.file_count || 0}`);
    });

  } catch (error) {
    console.log(`❌ Database check failed: ${error.message}`);
  }
}

checkRuns().catch(console.error);
