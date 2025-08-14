import { useState, useEffect } from 'react'

interface File {
  id: string
  filename: string
  contentType: string
  fileSize: number
  downloadUrl: string
  createdAt: string
}

interface FileListResponse {
  runId: string
  runStatus: string
  fileCount: number
  files: File[]
  error?: string
}

export function useFileList(runId: string | null) {
  const [files, setFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fileCount, setFileCount] = useState(0)
  const [runStatus, setRunStatus] = useState<string | null>(null)

  const fetchFiles = async () => {
    if (!runId) {
      setFiles([])
      setFileCount(0)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/files/${runId}`)
      const data: FileListResponse = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch files')
      }

      setFiles(data.files || [])
      setFileCount(data.fileCount || 0)
      setRunStatus(data.runStatus)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch files')
      setFiles([])
      setFileCount(0)
    } finally {
      setLoading(false)
    }
  }

  const refreshFiles = () => {
    fetchFiles()
  }

  useEffect(() => {
    fetchFiles()
  }, [runId])

  return {
    files,
    loading,
    error,
    fileCount,
    runStatus,
    refreshFiles
  }
}
