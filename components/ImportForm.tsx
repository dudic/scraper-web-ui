'use client'

import { useState } from 'react'

interface ImportFormProps {
  onRunStart: (runId: string) => void
}

export function ImportForm({ onRunStart }: ImportFormProps) {
  const [actorId, setActorId] = useState('HceSv1pj0Y3PZTMvG')
  const [code, setCode] = useState('')
  const [codeType, setCodeType] = useState('HR_COCKPIT')
  const [customInput, setCustomInput] = useState('')
  const [useCustomInput, setUseCustomInput] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      // Prepare input based on mode
      let input = {}
      if (useCustomInput && customInput) {
        try {
          input = JSON.parse(customInput)
        } catch (parseError) {
          throw new Error('Invalid JSON format in custom input')
        }
      } else {
        input = { code, codeType }
      }
      
      const response = await fetch('/api/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          actorId,
          input,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Provide more specific error messages based on the response
        if (response.status === 400) {
          throw new Error(data.error || 'Invalid request data')
        } else if (response.status === 500) {
          throw new Error(data.error || 'Server error occurred')
        } else {
          throw new Error(data.error || `Request failed with status ${response.status}`)
        }
      }

      if (!data.runId) {
        throw new Error('No run ID received from server')
      }

      onRunStart(data.runId)
      
      // Reset form
      setActorId('HceSv1pj0Y3PZTMvG')
      setCode('')
      setCodeType('HR_COCKPIT')
      setCustomInput('')
      setUseCustomInput(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
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
          <select
            id="actorId"
            value={actorId}
            onChange={(e) => setActorId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            required
          >
            <option value="HceSv1pj0Y3PZTMvG">HceSv1pj0Y3PZTMvG</option>
          </select>
        </div>

        <div className="flex items-center mb-4">
          <input
            type="checkbox"
            id="useCustomInput"
            checked={useCustomInput}
            onChange={(e) => setUseCustomInput(e.target.checked)}
            className="mr-2"
          />
          <label htmlFor="useCustomInput" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Use custom input (JSON)
          </label>
        </div>

        {!useCustomInput ? (
          <>
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Code
              </label>
              <input
                type="text"
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Enter the code to search for"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                required
              />
            </div>

            <div>
              <label htmlFor="codeType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Code Type
              </label>
              <select
                id="codeType"
                value={codeType}
                onChange={(e) => setCodeType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                required
              >
                <option value="HR_COCKPIT">HR Cockpit</option>
                <option value="HR_COCKPIT_SOLL">HR Cockpit Soll</option>
                <option value="PROFILING_VALUES">Profiling Values</option>
                <option value="PROFILING_VALUES_SOLL">Profiling Values Soll</option>
              </select>
            </div>
          </>
        ) : (
          <div>
            <label htmlFor="customInput" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Custom Input (JSON)
            </label>
            <textarea
              id="customInput"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder='{"code": "ABC123", "codeType": "HR_COCKPIT"}'
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        )}

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