'use client'

import { useState } from 'react'
import { useFileList } from '@/hooks/useFileList'

interface FileListProps {
  runId: string | null
  onFileSelect?: (fileId: string) => void
}

export function FileList({ runId, onFileSelect }: FileListProps) {
  const { files, loading, error, fileCount, refreshFiles } = useFileList(runId)
  const [downloading, setDownloading] = useState<string | null>(null)

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString()
  }

  const getFileIcon = (contentType: string): string => {
    if (contentType.includes('pdf')) return '📄'
    if (contentType.includes('image')) return '🖼️'
    if (contentType.includes('text')) return '📝'
    if (contentType.includes('spreadsheet') || contentType.includes('excel')) return '📊'
    if (contentType.includes('word') || contentType.includes('document')) return '📄'
    return '📁'
  }

  const handleDownload = async (fileId: string, filename: string) => {
    setDownloading(fileId)
    
    try {
      const response = await fetch(`/api/files/download/${fileId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get download URL')
      }

      // Create a temporary link and trigger download
      const link = document.createElement('a')
      link.href = data.downloadUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Download error:', error)
      alert('Failed to download file')
    } finally {
      setDownloading(null)
    }
  }

  if (!runId) {
    return (
      <div className="p-4 text-center text-gray-500">
        Select a run to view its files
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-4 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading files...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">Error: {error}</p>
          <button
            onClick={refreshFiles}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (fileCount === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        <p>No files found for this run</p>
        <button
          onClick={refreshFiles}
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>
    )
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Files ({fileCount})
        </h3>
        <button
          onClick={refreshFiles}
          className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
        >
          Refresh
        </button>
      </div>

      <div className="space-y-2">
        {files.map((file) => (
          <div
            key={file.id}
            className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-750"
          >
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <span className="text-2xl">{getFileIcon(file.contentType)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {file.filename}
                </p>
                <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                  <span>{formatFileSize(file.fileSize)}</span>
                  <span>{file.contentType}</span>
                  <span>{formatDate(file.createdAt)}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {onFileSelect && (
                <button
                  onClick={() => onFileSelect(file.id)}
                  className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800"
                >
                  View
                </button>
              )}
              <button
                onClick={() => handleDownload(file.id, file.filename)}
                disabled={downloading === file.id}
                className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 dark:bg-green-900 dark:text-green-300 dark:hover:bg-green-800 disabled:opacity-50"
              >
                {downloading === file.id ? 'Downloading...' : 'Download'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
