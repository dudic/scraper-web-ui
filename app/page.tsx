'use client'

import { useState } from 'react'
import { ImportForm } from '@/components/ImportForm'
import { RunProgress } from '@/components/RunProgress'
import { RunList } from '@/components/RunList'

export default function Home() {
  const [currentRunId, setCurrentRunId] = useState<string | null>(null)

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Scraper Dashboard
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Real-time web scraping with progress tracking
            </p>
          </div>

          {/* Import Form */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
            <ImportForm onRunStart={setCurrentRunId} />
          </div>

          {/* Current Run Progress */}
          {currentRunId && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
              <RunProgress runId={currentRunId} />
            </div>
          )}

          {/* Run History */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <RunList />
          </div>
        </div>
      </div>
    </main>
  )
} 