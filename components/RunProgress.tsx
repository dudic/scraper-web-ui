'use client'

import { useEffect, useState } from 'react'
import { useRunProgress } from '@/hooks/useRunProgress'

interface RunProgressProps {
  runId: string
}

export function RunProgress({ runId }: RunProgressProps) {
  const { pct, status, done, total, error, startedAt } = useRunProgress(runId)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCEEDED':
        return 'text-green-600 dark:text-green-400'
      case 'FAILED':
        return 'text-red-600 dark:text-red-400'
      case 'RUNNING':
        return 'text-blue-600 dark:text-blue-400'
      default:
        return 'text-gray-600 dark:text-gray-400'
    }
  }

  const getProgressColor = (pct: number) => {
    if (pct === 100) return 'bg-green-500'
    if (pct > 50) return 'bg-blue-500'
    return 'bg-gray-300 dark:bg-gray-600'
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
        Current Run Progress
      </h2>
      
      <div className="space-y-4">
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Progress
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {pct}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
            <div
              className={`h-2.5 rounded-full transition-all duration-300 ${getProgressColor(pct)}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Status:
            </span>
            <span className={`ml-2 text-sm ${getStatusColor(status)}`}>
              {status}
            </span>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Run ID:
            </span>
            <span className="ml-2 text-sm text-gray-500 dark:text-gray-400 font-mono">
              {runId}
            </span>
          </div>
        </div>

        {done !== undefined && total !== undefined && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Items:
              </span>
              <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                {done}/{total}
              </span>
            </div>
          </div>
        )}

        {startedAt && (
          <div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Started:
            </span>
            <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
              {new Date(startedAt).toLocaleString()}
            </span>
          </div>
        )}

        {status === 'SUCCEEDED' && (
          <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
            <p className="text-green-800 dark:text-green-200 text-sm">
              ✅ Import completed successfully! Check the run history below for download links.
            </p>
          </div>
        )}

        {status === 'FAILED' && (
          <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-red-800 dark:text-red-200 text-sm">
              ❌ Import failed. Please check the logs and try again.
            </p>
            {error && (
              <p className="text-red-700 dark:text-red-300 text-xs mt-2 font-mono">
                Error: {error}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
} 