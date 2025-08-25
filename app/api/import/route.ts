import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { ApifyClient } from 'apify-client'

export async function POST(request: NextRequest) {
  try {
    const { actorId, input } = await request.json()

    if (!actorId) {
      return NextResponse.json(
        { error: 'Actor ID is required' },
        { status: 400 }
      )
    }

    // Initialize Apify client
    const apifyToken = process.env.APIFY_TOKEN
    if (!apifyToken) {
      console.error('APIFY_TOKEN environment variable is not set')
      return NextResponse.json(
        { error: 'APIFY_TOKEN environment variable is not set' },
        { status: 500 }
      )
    }

    const client = new ApifyClient({
      token: apifyToken,
    })

    // Start the Apify run
    let run
    try {
      run = await client.actor(actorId).call(input || {})
    } catch (apifyError) {
      console.error('Apify API error:', apifyError)
      return NextResponse.json(
        { error: 'Failed to start Apify actor run' },
        { status: 500 }
      )
    }

    if (!run || !run.id) {
      return NextResponse.json(
        { error: 'No valid run ID received from Apify' },
        { status: 500 }
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

    // Extract code and code_type from input
    const code = input?.code || null
    const code_type = input?.codeType || null

    // Insert run record into database with proper initial values
    const { error: dbError } = await supabase
      .from('runs')
      .insert({
        id: run.id,
        code: code,
        code_type: code_type,
        pct: 0,
        status: 'RUNNING',
        done: 0,
        total: 0,
        started_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { error: 'Failed to create run record in database' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      runId: run.id,
      message: 'Run started successfully'
    })
  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json(
      { error: 'Internal server error during import process' },
      { status: 500 }
    )
  }
} 