import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    // Verify authorization
    const auth = request.headers.get('authorization')?.replace('Bearer ', '')
    const actorSecret = process.env.ACTOR_SECRET
    
    if (!actorSecret || auth !== actorSecret) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { runId, done, total, status, error } = await request.json()

    if (!runId) {
      return NextResponse.json(
        { error: 'Missing required field: runId' },
        { status: 400 }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = process.env.SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase environment variables')
      return NextResponse.json(
        { error: 'Database configuration error' },
        { status: 500 }
      )
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get current run data to preserve existing values
    const { data: currentRun } = await supabase
      .from('runs')
      .select('*')
      .eq('id', runId)
      .single()

    // Calculate percentage and determine final status
    let pct = 0
    let finalStatus = status || 'RUNNING'
    let finalDone = done
    let finalTotal = total
    
    // Handle error status
    if (error) {
      finalStatus = 'FAILED'
    }
    
    // Handle completion logic
    if (status === 'SUCCEEDED' || status === 'COMPLETED' || status === 'FINISHED') {
      finalStatus = 'SUCCEEDED'
      
      // If this is a completion update, preserve the highest done/total values
      if (currentRun) {
        // Use the maximum of current and new values to prevent reverting
        if (done !== undefined && total !== undefined) {
          finalDone = Math.max(currentRun.done || 0, done)
          finalTotal = Math.max(currentRun.total || 0, total)
        } else {
          // If no done/total provided in completion update, keep existing values
          finalDone = currentRun.done
          finalTotal = currentRun.total
        }
      }
      
      // Set percentage to 100 for completed runs
      pct = 100
    } else if (done !== undefined && total !== undefined && total > 0) {
      // For running updates, calculate percentage normally
      pct = Math.round((done / total) * 100)
      finalDone = done
      finalTotal = total
      
      // If we reach 100%, mark as succeeded
      if (pct === 100) {
        finalStatus = 'SUCCEEDED'
      }
    } else if (currentRun) {
      // If no done/total provided but we have existing data, preserve it
      finalDone = currentRun.done
      finalTotal = currentRun.total
      pct = currentRun.pct
    }

    // Prepare data for insert/update
    const runData: any = {
      id: runId,
      pct,
      status: finalStatus,
      updated_at: new Date().toISOString(),
    }
    
    // Only update done/total if we have valid values
    if (finalDone !== undefined) runData.done = finalDone
    if (finalTotal !== undefined) runData.total = finalTotal
    if (error) runData.error = error
    
    // Try to upsert (insert or update) the run record
    const { error: dbError } = await supabase
      .from('runs')
      .upsert(runData, { onConflict: 'id' })

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { error: 'Failed to update run record', details: dbError.message },
        { status: 500 }
      )
    }

    // Trigger file processing if run just completed
    let fileProcessingTriggered = false
    if (finalStatus === 'SUCCEEDED' && currentRun?.status !== 'SUCCEEDED') {
      try {
        // Trigger file processing asynchronously (don't wait for it)
        const baseUrl = process.env.FRONT_URL?.replace(/\/+$/, '') || 'http://localhost:3000';
        const fileProcessingUrl = `${baseUrl}/api/files/process/${runId}`;
        
        console.log(`Triggering file processing for run ${runId} at: ${fileProcessingUrl}`);
        
        fetch(fileProcessingUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }).catch(error => {
          console.error('Failed to trigger file processing:', error)
        })
        
        fileProcessingTriggered = true
      } catch (error) {
        console.error('Error triggering file processing:', error)
      }
    }
    
    return NextResponse.json({ 
      ok: true, 
      runId, 
      pct, 
      status: finalStatus,
      done: finalDone,
      total: finalTotal,
      fileProcessingTriggered
    })
  } catch (error) {
    console.error('Actor update error:', error)
    return NextResponse.json(
      { error: 'Failed to process actor update' },
      { status: 500 }
    )
  }
} 