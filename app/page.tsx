'use client'

import { ImportForm } from '@/components/ImportForm'
import { RunList } from '@/components/RunList'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
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
            <ImportForm />
          </div>

          {/* Run History */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <RunList />
          </div>
        </div>
      </div>
    </main>
  )
} 