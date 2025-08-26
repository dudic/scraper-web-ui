'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

interface RunData {
  id: string
  code?: string
  code_type?: string
  pct: number
  status: string
  done?: number
  total?: number
  error?: string
  description?: string
  started_at: string
  updated_at: string
  file_count?: number
}

export function useRunList() {
  const [runs, setRuns] = useState<RunData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Fetch initial data
    const fetchRuns = async () => {
      const { data, error } = await supabase
        .from('runs')
        .select('*')
        .order('started_at', { ascending: false })

      if (data && !error) {
        setRuns(data)
      }
      setIsLoading(false)
    }

    fetchRuns()

    // Subscribe to real-time updates
    const channel = supabase
      .channel('runs-list')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'runs',
        },
        async () => {
          // Refetch all runs when there's any change
          const { data, error } = await supabase
            .from('runs')
            .select('*')
            .order('started_at', { ascending: false })

          if (data && !error) {
            setRuns(data)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return { runs, isLoading }
} 