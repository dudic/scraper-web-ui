'use client'

import { useEffect, useState } from 'react'
import { useRunList } from '@/hooks/useRunList'
import { FileList } from './FileList'

export function RunList() {
  const { runs, isLoading } = useRunList()
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null)

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
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Run ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Progress
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Files
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Started
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Updated
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {runs.map((run) => (
                <tr key={run.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900 dark:text-white">
                    {run.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(run.status)}`}>
                      {run.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {run.done !== undefined && run.total !== undefined ? `${run.done}/${run.total}` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {run.file_count ? (
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full dark:bg-blue-900/20 dark:text-blue-400">
                        📁 {run.file_count}
                      </span>
                    ) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {run.started_at ? new Date(run.started_at).toLocaleString() : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {run.updated_at ? new Date(run.updated_at).toLocaleString() : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {run.status === 'SUCCEEDED' && (
                      <button
                        onClick={() => setSelectedRunId(selectedRunId === run.id ? null : run.id)}
                        className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800"
                      >
                        {selectedRunId === run.id ? 'Hide Files' : 'View Files'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* File List Section */}
      {selectedRunId && (
        <div className="mt-8">
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <FileList runId={selectedRunId} />
          </div>
        </div>
      )}
    </div>
  )
} 