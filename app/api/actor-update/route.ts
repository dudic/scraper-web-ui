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

    // Calculate percentage if done and total are provided
    let pct = 0
    let finalStatus = status || 'RUNNING'
    
    if (done !== undefined && total !== undefined && total > 0) {
      pct = Math.round((done / total) * 100)
      // Override status based on completion
      if (pct === 100) {
        finalStatus = 'SUCCEEDED'
      } else if (finalStatus === 'COMPLETED') {
        finalStatus = 'SUCCEEDED'
      }
    }
    
    // Handle error status
    if (error) {
      finalStatus = 'FAILED'
    }

    // Initialize Supabase client
    const supabaseUrl = process.env.SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Update run record
    const updateData: any = {
      pct,
      status: finalStatus,
      updated_at: new Date().toISOString(),
    }
    
    // Only update done/total if provided
    if (done !== undefined) updateData.done = done
    if (total !== undefined) updateData.total = total
    if (error) updateData.error = error
    
    const { error: dbError } = await supabase
      .from('runs')
      .update(updateData)
      .eq('id', runId)

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { error: 'Failed to update run record' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      ok: true, 
      runId, 
      pct, 
      status: finalStatus 
    })
  } catch (error) {
    console.error('Actor update error:', error)
    return NextResponse.json(
      { error: 'Failed to process actor update' },
      { status: 500 }
    )
  }
} 