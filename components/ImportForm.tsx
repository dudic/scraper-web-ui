'use client'

import { useState } from 'react'

interface ImportFormProps {
  onRunStart: (runId: string) => void
}

export function ImportForm({ onRunStart }: ImportFormProps) {
  const [actorId, setActorId] = useState('')
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          actorId,
          input: input ? JSON.parse(input) : {},
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to start import')
      }

      const data = await response.json()
      onRunStart(data.runId)
      
      // Reset form
      setActorId('')
      setInput('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
        Start New Import
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="actorId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Actor ID
          </label>
          <input
            type="text"
            id="actorId"
            value={actorId}
            onChange={(e) => setActorId(e.target.value)}
            placeholder="Enter Apify Actor ID"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            required
          />
        </div>

        <div>
          <label htmlFor="input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Input (JSON)
          </label>
          <textarea
            id="input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='{"startUrls": ["https://example.com"]}'
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        {error && (
          <div className="text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
        >
          {isLoading ? 'Starting...' : 'Start Import'}
        </button>
      </form>
    </div>
  )
} 