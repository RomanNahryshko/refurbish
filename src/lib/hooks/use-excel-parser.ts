import React, { useState, useCallback, useRef } from 'react'

interface ExcelData {
  headers: string[]
  rows: Record<string, unknown>[]
  totalRows: number
  sheetName: string
}

interface UseExcelParserReturn {
  parsedData: ExcelData | null
  isParsing: boolean
  error: string | null
  parseExcelFile: (file: File) => void
  clearData: () => void
}

export function useExcelParser(): UseExcelParserReturn {
  const [parsedData, setParsedData] = useState<ExcelData | null>(null)
  const [isParsing, setIsParsing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const workerRef = useRef<Worker | null>(null)

  const parseExcelFile = useCallback((file: File) => {
    // Clear previous data and errors
    setParsedData(null)
    setError(null)
    setIsParsing(true)

    // Always create a fresh worker to avoid issues
    if (workerRef.current) {
      workerRef.current.terminate()
      workerRef.current = null
    }
    
    try {
      workerRef.current = new Worker('/excel-worker.js')
      
      // Test if worker is responsive
      workerRef.current.addEventListener('error', (error) => {
        console.error('Worker error:', error)
      })
      
      workerRef.current.addEventListener('messageerror', (error) => {
        console.error('Worker message error:', error)
      })
      
    } catch {
      setError('Failed to create web worker')
      setIsParsing(false)
      return
    }

    const worker = workerRef.current

    // Handle worker messages
    const handleMessage = (e: MessageEvent) => {
      const { type, data, error: workerError } = e.data

      if (type === 'parse-success') {
        setParsedData(data)
        setError(null)
        setIsParsing(false)
      } else if (type === 'parse-error') {
        setError(workerError)
        setParsedData(null)
        setIsParsing(false)
      }
    }

    // Add event listener to fresh worker
    worker.addEventListener('message', handleMessage)

    // Send file to worker
    try {
      worker.postMessage({
        type: 'parse-excel',
        file
      })
      
      // Add timeout to detect if worker is hanging
      setTimeout(() => {
        if (isParsing) {
          setError('Excel parsing timed out. Please try again.')
          setIsParsing(false)
        }
      }, 30000) // 30 second timeout
      
    } catch {
      setError('Failed to send file to worker')
      setIsParsing(false)
    }

    // Cleanup function
    return () => {
      worker.removeEventListener('message', handleMessage)
    }
  }, [isParsing])

  // Cleanup worker on unmount
  React.useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate()
        workerRef.current = null
      }
    }
  }, [])

  const clearData = useCallback(() => {
    setParsedData(null)
    setError(null)
    setIsParsing(false)
    
    // Terminate the existing worker
    if (workerRef.current) {
      workerRef.current.terminate()
      workerRef.current = null
    }
  }, [])

  return {
    parsedData,
    isParsing,
    error,
    parseExcelFile,
    clearData
  }
}
