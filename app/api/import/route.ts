import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { ApifyClient } from 'apify-client'

export async function POST(request: NextRequest) {
  try {
    const { actorId, input } = await request.json()

    // Debug logging
    console.log('🔍 Import API Debug - Received data:')
    console.log('  actorId:', actorId)
    console.log('  input:', JSON.stringify(input, null, 2))

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

    console.log('✅ Apify run started successfully:')
    console.log('  run.id:', run.id)

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

    console.log('🔍 Extracted values:')
    console.log('  code:', code)
    console.log('  code_type:', code_type)

    // Prepare data for database insertion
    const runData = {
      id: run.id,
      code: code,
      code_type: code_type,
      pct: 0,
      status: 'RUNNING',
      done: 0,
      total: 0,
      started_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    console.log('🔍 Data to be inserted:')
    console.log('  runData:', JSON.stringify(runData, null, 2))

    // Insert run record into database with proper initial values
    const { data: insertedData, error: dbError } = await supabase
      .from('runs')
      .insert(runData)
      .select()

    if (dbError) {
      console.error('❌ Database error:', dbError)
      return NextResponse.json(
        { error: 'Failed to create run record in database' },
        { status: 500 }
      )
    }

    console.log('✅ Database insertion successful:')
    console.log('  insertedData:', JSON.stringify(insertedData, null, 2))

    return NextResponse.json({ 
      runId: run.id,
      message: 'Run started successfully'
    })
  } catch (error) {
    console.error('❌ Import error:', error)
    return NextResponse.json(
      { error: 'Internal server error during import process' },
      { status: 500 }
    )
  }
} 