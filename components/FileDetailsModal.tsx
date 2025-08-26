'use client'

import { useEffect, useState } from 'react'
import { useFileList } from '@/hooks/useFileList'

interface FileDetailsModalProps {
  runId: string | null
  isOpen: boolean
  onClose: () => void
}

export function FileDetailsModal({ runId, isOpen, onClose }: FileDetailsModalProps) {
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
    // PDF files
    if (contentType.includes('pdf')) return '📄'
    
    // CSV files
    if (contentType.includes('csv')) return '📊'
    
    // JSON files
    if (contentType.includes('json')) return '📋'
    
    // Excel/Spreadsheet files
    if (contentType.includes('spreadsheet') || contentType.includes('excel') || contentType.includes('xlsx') || contentType.includes('xls')) return '📈'
    
    // Word documents
    if (contentType.includes('word') || contentType.includes('document') || contentType.includes('docx') || contentType.includes('doc')) return '📝'
    
    // PowerPoint files
    if (contentType.includes('presentation') || contentType.includes('powerpoint') || contentType.includes('pptx') || contentType.includes('ppt')) return '📽️'
    
    // Image files
    if (contentType.includes('image')) return '🖼️'
    
    // Text files
    if (contentType.includes('text/plain') || contentType.includes('txt')) return '📄'
    
    // HTML files
    if (contentType.includes('html')) return '🌐'
    
    // XML files
    if (contentType.includes('xml')) return '📋'
    
    // Archive files
    if (contentType.includes('zip') || contentType.includes('rar') || contentType.includes('7z')) return '📦'
    
    // Default folder icon for unknown types
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

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Files for Run: {runId}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {fileCount} file{fileCount !== 1 ? 's' : ''} available
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={refreshFiles}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              Refresh
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600 dark:text-gray-400">Loading files...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600 dark:text-red-400">{error}</p>
              <button
                onClick={refreshFiles}
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Try Again
              </button>
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">No files found for this run.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600"
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
                    <button
                      onClick={() => handleDownload(file.id, file.filename)}
                      disabled={downloading === file.id}
                      className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {downloading === file.id ? 'Downloading...' : 'Download'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


