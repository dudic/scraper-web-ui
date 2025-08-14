import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { ApifyClient } from 'apify-client'

// Helper function to determine content type from filename
function getContentTypeFromFilename(filename: string): string {
  const ext = filename.toLowerCase().split('.').pop()
  switch (ext) {
    case 'pdf':
      return 'application/pdf'
    case 'csv':
      return 'text/csv'
    case 'xlsx':
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    case 'xls':
      return 'application/vnd.ms-excel'
    case 'pptx':
      return 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    case 'ppt':
      return 'application/vnd.ms-powerpoint'
    case 'docx':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    case 'doc':
      return 'application/msword'
    case 'txt':
      return 'text/plain'
    case 'json':
      return 'application/json'
    default:
      return 'application/octet-stream'
  }
}

// Types for file processing
interface FileMetadata {
  apifyKey: string
  filename: string
  contentType: string
  fileSize?: number
}

interface ProcessedFile {
  id: string
  apifyKey: string
  filename: string
  contentType: string
  fileSize: number
  supabasePath: string
  downloadUrl: string
}

export async function POST(
  request: NextRequest,
  { params }: { params: { runId: string } }
) {
  try {
    const { runId } = params
    console.log(`Processing files for run: ${runId}`);

    if (!runId) {
      console.log('Error: Run ID is required');
      return NextResponse.json(
        { error: 'Run ID is required' },
        { status: 400 }
      )
    }

    // Validate environment variables
    const apifyToken = process.env.APIFY_TOKEN
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!apifyToken || !supabaseUrl || !supabaseKey) {
      console.error('Missing required environment variables')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Initialize clients
    const apifyClient = new ApifyClient({ token: apifyToken })
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Check if run exists and is completed
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

    if (run.status !== 'SUCCEEDED') {
      return NextResponse.json(
        { error: 'Run is not completed yet' },
        { status: 400 }
      )
    }

    // Check if files have already been processed
    const { data: existingFiles } = await supabase
      .from('files')
      .select('id')
      .eq('run_id', runId)

    if (existingFiles && existingFiles.length > 0) {
      return NextResponse.json(
        { 
          message: 'Files already processed for this run',
          fileCount: existingFiles.length
        },
        { status: 200 }
      )
    }

    // Get run info from APIFY to find the actual dataset and key-value store IDs
    let apifyRun
    try {
      apifyRun = await apifyClient.run(runId)
    } catch (error) {
      console.error('Failed to get APIFY run info:', error)
      return NextResponse.json(
        { error: 'Failed to get run information from APIFY' },
        { status: 500 }
      )
    }

    // Get the dataset from APIFY using the run ID
    let dataset
    let datasetItems
    try {
      dataset = await apifyClient.dataset(runId)
      datasetItems = await dataset.listItems()
    } catch (error) {
      console.error('Failed to access dataset:', error)
      return NextResponse.json(
        { error: 'Failed to access dataset from APIFY' },
        { status: 500 }
      )
    }

    if (!datasetItems.items || datasetItems.items.length === 0) {
      return NextResponse.json(
        { message: 'No files found in dataset' },
        { status: 200 }
      )
    }

    // Extract file metadata from dataset items
    const fileMetadata: FileMetadata[] = []
    
    for (const item of datasetItems.items) {
      const itemData = item as any // Type assertion for dataset items
      
      // Handle the new data structure we found
      if (itemData.reports && Array.isArray(itemData.reports)) {
        // New structure: itemData.reports contains file information
        for (const report of itemData.reports) {
          if (report.url && report.name) {
            const urlParts = report.url.split('/')
            const apifyKey = urlParts[urlParts.length - 1] // Get filename from URL
            fileMetadata.push({
              apifyKey,
              filename: report.name,
              contentType: getContentTypeFromFilename(report.name),
              fileSize: 0 // Will be determined when downloading
            })
          }
        }
      } else if (itemData.fileUrl && itemData.fileName) {
        // Old structure: direct file metadata
        fileMetadata.push({
          apifyKey: (itemData.fileUrl as string).split('/').pop() || itemData.fileName,
          filename: itemData.fileName as string,
          contentType: (itemData.contentType as string) || 'application/octet-stream',
          fileSize: itemData.fileSize as number
        })
      }
    }

    if (fileMetadata.length === 0) {
      return NextResponse.json(
        { message: 'No valid file metadata found' },
        { status: 200 }
      )
    }

    // Process files: download from APIFY and upload to Supabase
    const processedFiles: ProcessedFile[] = []
    const errors: string[] = []

    for (const metadata of fileMetadata) {
      try {
        // Download file from APIFY Key-Value Store using the run ID
        let keyValueStore
        let fileRecord
        try {
          keyValueStore = await apifyClient.keyValueStore(runId)
          fileRecord = await keyValueStore.getRecord(metadata.apifyKey)
        } catch (error) {
          console.error(`Failed to access key-value store for file ${metadata.filename}:`, error)
          errors.push(`Failed to access file ${metadata.filename} from APIFY`)
          continue
        }

        if (!fileRecord || !fileRecord.value) {
          errors.push(`File not found in APIFY: ${metadata.filename}`)
          continue
        }

        // Convert to Buffer if needed
        let fileBuffer: Buffer
        if (fileRecord.value instanceof Buffer) {
          fileBuffer = fileRecord.value
        } else if (typeof fileRecord.value === 'string') {
          fileBuffer = Buffer.from(fileRecord.value, 'binary')
        } else {
          // Handle other types by converting to string first
          fileBuffer = Buffer.from(String(fileRecord.value))
        }

        // Generate unique filename for Supabase Storage
        const timestamp = Date.now()
        const safeFilename = metadata.filename.replace(/[^a-zA-Z0-9.-]/g, '_')
        const supabasePath = `${runId}/${timestamp}_${safeFilename}`

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('scraper-files')
          .upload(supabasePath, fileBuffer, {
            contentType: metadata.contentType,
            upsert: false
          })

        if (uploadError) {
          console.error('Upload error:', uploadError)
          errors.push(`Failed to upload ${metadata.filename}: ${uploadError.message}`)
          continue
        }

        // Generate signed download URL
        const { data: urlData } = await supabase.storage
          .from('scraper-files')
          .createSignedUrl(supabasePath, 3600) // 1 hour expiry

        if (!urlData?.signedUrl) {
          errors.push(`Failed to generate download URL for ${metadata.filename}`)
          continue
        }

        // Insert file metadata into database
        const { data: dbFileRecord, error: dbError } = await supabase
          .from('files')
          .insert({
            run_id: runId,
            apify_key: metadata.apifyKey,
            filename: metadata.filename,
            content_type: metadata.contentType,
            file_size: fileBuffer.length,
            supabase_path: supabasePath,
            download_url: urlData.signedUrl
          })
          .select()
          .single()

        if (dbError) {
          console.error('Database error:', dbError)
          errors.push(`Failed to save metadata for ${metadata.filename}`)
          continue
        }

        processedFiles.push({
          id: dbFileRecord.id,
          apifyKey: metadata.apifyKey,
          filename: metadata.filename,
          contentType: metadata.contentType,
          fileSize: fileBuffer.length,
          supabasePath,
          downloadUrl: urlData.signedUrl
        })

      } catch (error) {
        console.error(`Error processing file ${metadata.filename}:`, error)
        errors.push(`Error processing ${metadata.filename}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    // Update run with file count
    if (processedFiles.length > 0) {
      await supabase
        .from('runs')
        .update({ file_count: processedFiles.length })
        .eq('id', runId)
    }

    return NextResponse.json({
      success: true,
      processedCount: processedFiles.length,
      totalFiles: fileMetadata.length,
      errors: errors.length > 0 ? errors : undefined,
      files: processedFiles.map(f => ({
        id: f.id,
        filename: f.filename,
        contentType: f.contentType,
        fileSize: f.fileSize,
        downloadUrl: f.downloadUrl
      }))
    })

  } catch (error) {
    console.error('File processing error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to process files', 
        details: error instanceof Error ? error.message : 'Unknown error',
        runId: params.runId
      },
      { status: 500 }
    )
  }
}
