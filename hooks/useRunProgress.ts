'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

interface RunData {
  id: string
  pct: number
  status: string
  done?: number
  total?: number
  error?: string
  started_at: string
  updated_at: string
}

export function useRunProgress(runId: string) {
  const [pct, setPct] = useState(0)
  const [status, setStatus] = useState('RUNNING')
  const [done, setDone] = useState<number | undefined>(undefined)
  const [total, setTotal] = useState<number | undefined>(undefined)
  const [error, setError] = useState<string | undefined>(undefined)
  const [startedAt, setStartedAt] = useState<string | null>(null)

  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Get initial data
    const fetchInitialData = async () => {
      const { data, error } = await supabase
        .from('runs')
        .select('*')
        .eq('id', runId)
        .single()

      if (data && !error) {
        setPct(data.pct)
        setStatus(data.status)
        setDone(data.done)
        setTotal(data.total)
        setError(data.error)
        setStartedAt(data.started_at)
      }
    }

    fetchInitialData()

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`runs-${runId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'runs',
          filter: `id=eq.${runId}`,
        },
        (payload) => {
          const newData = payload.new as RunData
          setPct(newData.pct)
          setStatus(newData.status)
          setDone(newData.done)
          setTotal(newData.total)
          setError(newData.error)
          setStartedAt(newData.started_at)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [runId])

  return { pct, status, done, total, error, startedAt }
} 