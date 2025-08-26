import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function DELETE(
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

    // First, get all files associated with this run
    const { data: files, error: filesError } = await supabase
      .from('files')
      .select('supabase_path')
      .eq('run_uuid', runId)

    if (filesError) {
      console.error('Error fetching files:', filesError)
      return NextResponse.json(
        { error: 'Failed to fetch associated files' },
        { status: 500 }
      )
    }

    // Delete files from Supabase Storage
    if (files && files.length > 0) {
      const filePaths = files.map(file => file.supabase_path).filter(Boolean)
      
      if (filePaths.length > 0) {
        const { error: storageError } = await supabase.storage
          .from('scraper-files')
          .remove(filePaths)

        if (storageError) {
          console.error('Error deleting files from storage:', storageError)
          // Continue with database deletion even if storage deletion fails
        }
      }
    }

    // Delete the run record (this will cascade delete files due to foreign key constraint)
    const { error: deleteError } = await supabase
      .from('runs')
      .delete()
      .eq('id', runId)

    if (deleteError) {
      console.error('Error deleting run:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete run record' },
        { status: 500 }
      )
    }

    console.log(`Successfully deleted run ${runId} and ${files?.length || 0} associated files`)

    return NextResponse.json({
      success: true,
      message: 'Run and associated files deleted successfully',
      deletedFiles: files?.length || 0
    })

  } catch (error) {
    console.error('Delete run error:', error)
    return NextResponse.json(
      { error: 'Failed to delete run' },
      { status: 500 }
    )
  }
}
