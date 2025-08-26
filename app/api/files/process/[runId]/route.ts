import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { ApifyClient } from 'apify-client'
import { detectFileType } from '@/app/utils/fileTypeDetection'

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
      .eq('run_uuid', runId)

    if (existingFiles && existingFiles.length > 0) {
      return NextResponse.json(
        { 
          message: 'Files already processed for this run',
          fileCount: existingFiles.length
        },
        { status: 200 }
      )
    }

    // Get the dataset from APIFY
    const dataset = await apifyClient.dataset(runId)
    const datasetItems = await dataset.listItems()

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
      if (itemData.fileUrl && itemData.fileName) {
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
        // Download file from APIFY Key-Value Store
        const keyValueStore = await apifyClient.keyValueStore(runId)
        const fileRecord = await keyValueStore.getRecord(metadata.apifyKey)

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

        // Detect proper file type based on content and filename
        const fileTypeInfo = detectFileType(metadata.filename, fileBuffer)
        const detectedContentType = fileTypeInfo.mimeType
        
        console.log(`🔍 File type detection for ${metadata.filename}:`)
        console.log(`  📁 Extension: ${fileTypeInfo.extension}`)
        console.log(`  🏷️  Original content type: ${metadata.contentType}`)
        console.log(`  ✅ Detected content type: ${detectedContentType}`)
        console.log(`  📝 Is text: ${fileTypeInfo.isText}`)
        console.log(`  💾 Is binary: ${fileTypeInfo.isBinary}`)
        
        // Log specific detection for key file types
        if (detectedContentType === 'application/pdf') {
          console.log(`  📄 Detected as PDF file`)
        } else if (detectedContentType === 'text/csv') {
          console.log(`  📊 Detected as CSV file`)
        } else if (detectedContentType.includes('presentation')) {
          console.log(`  📽️  Detected as PowerPoint file`)
        } else if (detectedContentType === 'text/plain') {
          console.log(`  📄 Detected as plain text file`)
        } else if (detectedContentType === 'application/json') {
          console.log(`  📋 Detected as JSON file`)
        }

        // Generate unique filename for Supabase Storage
        const timestamp = Date.now()
        const safeFilename = metadata.filename.replace(/[^a-zA-Z0-9.-]/g, '_')
        const supabasePath = `${runId}/${timestamp}_${safeFilename}`

        // Upload to Supabase Storage with detected content type
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('scraper-files')
          .upload(supabasePath, fileBuffer, {
            contentType: detectedContentType,
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

        // Insert file metadata into database with detected content type
        const { data: dbFileRecord, error: dbError } = await supabase
          .from('files')
          .insert({
            run_uuid: runId,
            apify_key: metadata.apifyKey,
            filename: metadata.filename,
            content_type: detectedContentType,
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
