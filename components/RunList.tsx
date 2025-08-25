'use client'

import { useEffect, useState } from 'react'
import { useRunList } from '@/hooks/useRunList'
import { FileDetailsModal } from './FileDetailsModal'

export function RunList() {
  const { runs, isLoading } = useRunList()
  const [modalRunId, setModalRunId] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // TEMPORARY DEBUG: Log the runs data
  useEffect(() => {
    console.log('🔍 RunList Debug - Received runs data:', runs);
    if (runs.length > 0) {
      runs.forEach((run, index) => {
        console.log(`Run ${index + 1}:`, {
          id: run.id,
          code: run.code,
          code_type: run.code_type,
          status: run.status,
          started_at: run.started_at
        });
      });
    }
  }, [runs]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCEEDED':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'FAILED':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      case 'RUNNING':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

  const handleFileClick = (runId: string) => {
    setModalRunId(runId)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setModalRunId(null)
  }

  if (isLoading) {
    return (
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
          Run History
        </h2>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Loading runs...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
        Run History
      </h2>
      
      {runs.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600 dark:text-gray-400">No runs found. Start your first import above!</p>
        </div>
      ) : (
        <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 rounded-lg">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-24">
                  Code
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-32">
                  Code Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-32">
                  Run ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-24">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-32">
                  Progress
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-20">
                  Items
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-20">
                  Files
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-40">
                  Started
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-40">
                  Updated
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {runs.map((run) => (
                <tr key={run.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">
                    <span className="truncate block max-w-20">{run.code || '-'}</span>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">
                    <span className="truncate block max-w-28">{run.code_type || '-'}</span>
                  </td>
                  <td className="px-4 py-4 text-sm font-mono text-gray-900 dark:text-white">
                    <span className="truncate block max-w-28">{run.id}</span>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(run.status)}`}>
                      {run.status}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${run.pct}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-900 dark:text-white">
                        {run.pct}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {run.done !== undefined && run.total !== undefined ? `${run.done}/${run.total}` : '-'}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {run.file_count ? (
                      <button
                        onClick={() => handleFileClick(run.id)}
                        className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30 cursor-pointer transition-colors"
                        title="Click to view files"
                      >
                        📁 {run.file_count}
                      </button>
                    ) : '-'}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {run.started_at ? new Date(run.started_at).toLocaleString() : '-'}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {run.updated_at ? new Date(run.updated_at).toLocaleString() : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* File Details Modal */}
      <FileDetailsModal
        runId={modalRunId}
        isOpen={isModalOpen}
        onClose={closeModal}
      />
    </div>
  )
} 