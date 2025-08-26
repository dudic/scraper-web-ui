import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { ApifyClient } from 'apify-client'

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 === IMPORT ROUTE CALLED ===')
    console.log('📅 Timestamp:', new Date().toISOString())
    console.log('🔗 Request URL:', request.url)
    console.log('👤 User Agent:', request.headers.get('user-agent'))
    console.log('🔑 Authorization:', request.headers.get('authorization') ? 'Present' : 'None')
    
    const { actorId, input } = await request.json()

    // DEBUG: Log the received data
    console.log('🔍 DEBUG - Received request data:')
    console.log('  actorId:', actorId)
    console.log('  input:', JSON.stringify(input, null, 2))

    if (!actorId) {
      return NextResponse.json(
        { error: 'Actor ID is required' },
        { status: 400 }
      )
    }

    // Initialize Supabase client first
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

    console.log('🔍 DEBUG - Extracted values:')
    console.log('  code:', code)
    console.log('  code_type:', code_type)

        // Check if a record with this code/code_type combination already exists
    const { data: existingRun, error: checkError } = await supabase
      .from('runs')
      .select('id, apify_run_id')
      .eq('code', code)
      .eq('code_type', code_type)
      .single()

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('❌ Error checking for existing run:', checkError)
      return NextResponse.json(
        { error: 'Failed to check for existing run' },
        { status: 500 }
      )
    }

    let runId: string

    if (existingRun) {
      // Use existing record
      console.log('✅ Found existing run record:', existingRun.id)
      runId = existingRun.id
    } else {
      // Create new record - let Supabase auto-generate the id (UUID)
      const runData = {
        // Don't specify id - let Supabase auto-generate UUID
        apify_run_id: null, // Will be updated after Apify call
        code: code,
        code_type: code_type,
        pct: 0,
        status: 'STARTING',
        done: 0,
        total: 0,
        description: 'Initializing...',
        started_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      console.log('🔍 DEBUG - Creating new record (Supabase will auto-generate UUID):')
      console.log('  runData:', JSON.stringify(runData, null, 2))

      const { data: insertedData, error: dbError } = await supabase
        .from('runs')
        .insert(runData)
        .select('id') // Select the auto-generated UUID

      if (dbError) {
        console.error('❌ Database error creating new record:', dbError)
        return NextResponse.json(
          { error: 'Failed to create run record in database' },
          { status: 500 }
        )
      }

      console.log('✅ New record created successfully:')
      console.log('  insertedData:', JSON.stringify(insertedData, null, 2))
      console.log('🆔 Generated UUID:', insertedData[0].id)
      runId = insertedData[0].id // Use the auto-generated UUID
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

    // Prepare input for Apify - include the internal run ID
    const apifyInput = {
      ...input,
      internalRunId: runId // Pass the internal run ID to Apify
    }
    
    console.log('📤 Sending to Apify:')
    console.log('  Actor ID:', actorId)
    console.log('  Internal Run ID:', runId)
    console.log('  Apify Input:', JSON.stringify(apifyInput, null, 2))

    // Start the Apify run
    let run
    try {
      run = await client.actor(actorId).call(apifyInput)
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

    console.log('✅ Apify run started with ID:', run.id)

    // Update the record with the actual Apify run ID
    const { error: updateError } = await supabase
      .from('runs')
      .update({ 
        apify_run_id: run.id,
        status: 'RUNNING',
        updated_at: new Date().toISOString()
      })
      .eq('id', runId) // Use id (UUID) instead of run_id

    if (updateError) {
      console.error('❌ Error updating record with Apify run ID:', updateError)
      return NextResponse.json(
        { error: 'Failed to update run record with Apify ID' },
        { status: 500 }
      )
    }

    console.log('✅ Record updated with Apify run ID successfully')
    console.log('🏁 === IMPORT ROUTE COMPLETED ===')

    return NextResponse.json({ 
      runId: runId,
      apifyRunId: run.id,
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