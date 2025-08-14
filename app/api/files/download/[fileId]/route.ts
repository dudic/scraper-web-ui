import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    const { fileId } = params

    if (!fileId) {
      return NextResponse.json(
        { error: 'File ID is required' },
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

    // Get file metadata
    const { data: file, error: fileError } = await supabase
      .from('files')
      .select('*')
      .eq('id', fileId)
      .single()

    if (fileError || !file) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      )
    }

    // Generate a fresh signed URL for download
    const { data: urlData, error: urlError } = await supabase.storage
      .from('scraper-files')
      .createSignedUrl(file.supabase_path, 3600) // 1 hour expiry

    if (urlError || !urlData?.signedUrl) {
      console.error('URL generation error:', urlError)
      return NextResponse.json(
        { error: 'Failed to generate download URL' },
        { status: 500 }
      )
    }

    // Update the download URL in the database
    await supabase
      .from('files')
      .update({ download_url: urlData.signedUrl })
      .eq('id', fileId)

    // Return the download URL and file metadata
    return NextResponse.json({
      id: file.id,
      filename: file.filename,
      contentType: file.content_type,
      fileSize: file.file_size,
      downloadUrl: urlData.signedUrl,
      expiresAt: new Date(Date.now() + 3600 * 1000).toISOString() // 1 hour from now
    })

  } catch (error) {
    console.error('File download error:', error)
    return NextResponse.json(
      { error: 'Failed to process download request' },
      { status: 500 }
    )
  }
}
