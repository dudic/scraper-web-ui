import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Apify from 'apify-client'

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
      return NextResponse.json(
        { error: 'APIFY_TOKEN environment variable is not set' },
        { status: 500 }
      )
    }

    const client = new Apify({
      token: apifyToken,
    })

    // Start the Apify run
    const run = await client.actor(actorId).call(input || {})

    // Initialize Supabase client
    const supabaseUrl = process.env.SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Insert run record into database
    const { error: dbError } = await supabase
      .from('runs')
      .insert({
        id: run.id,
        pct: 0,
        status: 'RUNNING',
      })

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { error: 'Failed to create run record' },
        { status: 500 }
      )
    }

    return NextResponse.json({ runId: run.id })
  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json(
      { error: 'Failed to start import' },
      { status: 500 }
    )
  }
} 