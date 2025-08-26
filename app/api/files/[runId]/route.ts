import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(
  request: NextRequest,
  { params }: { params: { runId: string } }
) {
  try {
    const { runId } = params

    if (!runId) {
      return NextResponse.json(
        { error: 'Run ID is required' },
        { status: 400 }
      )
    }

    // Validate environment variables
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing required environment variables')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Check if run exists
    const { data: run, error: runError } = await supabase
      .from('runs')
      .select('*')
      .eq('id', runId)
      .single()

    if (runError || !run) {
      return NextResponse.json(
        { error: 'Run not found' },
        { status: 404 }
      )
    }

    // Get files for this run
    const { data: files, error: filesError } = await supabase
      .from('files')
      .select('*')
      .eq('run_uuid', runId)
      .order('created_at', { ascending: false })

    if (filesError) {
      console.error('Database error:', filesError)
      return NextResponse.json(
        { error: 'Failed to fetch files' },
        { status: 500 }
      )
    }

    // Refresh signed URLs for files that might have expired
    const filesWithFreshUrls = await Promise.all(
      (files || []).map(async (file) => {
        try {
          // Generate a new signed URL
          const { data: urlData } = await supabase.storage
            .from('scraper-files')
            .createSignedUrl(file.supabase_path, 3600) // 1 hour expiry

          if (urlData?.signedUrl) {
            // Update the download URL in the database
            await supabase
              .from('files')
              .update({ download_url: urlData.signedUrl })
              .eq('id', file.id)

            return {
              ...file,
              download_url: urlData.signedUrl
            }
          }
        } catch (error) {
          console.error(`Error refreshing URL for file ${file.id}:`, error)
        }

        return file
      })
    )

    return NextResponse.json({
      runId,
      runStatus: run.status,
      fileCount: filesWithFreshUrls.length,
      files: filesWithFreshUrls.map(file => ({
        id: file.id,
        filename: file.filename,
        contentType: file.content_type,
        fileSize: file.file_size,
        downloadUrl: file.download_url,
        createdAt: file.created_at
      }))
    })

  } catch (error) {
    console.error('File listing error:', error)
    return NextResponse.json(
      { error: 'Failed to list files' },
      { status: 500 }
    )
  }
}
