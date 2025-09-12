'use client'

import { useState, useCallback } from 'react'

export interface DeviceImportState {
  // Per-device repair task selection state
  deviceRepairs: Record<number, string[]>
  deviceOtherDescriptions: Record<number, string>
  
  // Per-device grade selection state
  deviceGrades: Record<number, string>
  
  // Per-device repair section expansion state
  expandedRepairSections: Record<number, boolean>
  
  // Per-device QC approach state (repairs vs grade)
  deviceQcApproaches: Record<number, 'repairs' | 'grade' | ''>
  
  // Completed devices tracking
  completedDevices: Set<number>
  
  // Function signatures
  handleQcApproachChange: (deviceIndex: number, approach: 'repairs' | 'grade' | '') => void
}

export function useDeviceImportState() {
  const [deviceRepairs, setDeviceRepairs] = useState<Record<number, string[]>>({})
  const [deviceOtherDescriptions, setDeviceOtherDescriptions] = useState<Record<number, string>>({})
  const [deviceGrades, setDeviceGrades] = useState<Record<number, string>>({})
  const [expandedRepairSections, setExpandedRepairSections] = useState<Record<number, boolean>>({})
  const [deviceQcApproaches, setDeviceQcApproaches] = useState<Record<number, 'repairs' | 'grade' | ''>>({})
  const [completedDevices, setCompletedDevices] = useState<Set<number>>(new Set())

  // Handle per-device repair task selection
  const handleDeviceRepairToggle = useCallback((deviceIndex: number, repairId: string) => {
    setDeviceRepairs(prev => {
      const currentRepairs = prev[deviceIndex] || []
      
      const updatedRepairs = currentRepairs.includes(repairId)
        ? currentRepairs.filter(id => id !== repairId)
        : [...currentRepairs, repairId]
      
      return { ...prev, [deviceIndex]: updatedRepairs }
    })
  }, [])

  const handleDeviceOtherDescription = useCallback((deviceIndex: number, description: string) => {
    setDeviceOtherDescriptions(prev => ({ ...prev, [deviceIndex]: description }))
  }, [])

  // Handle expanding/collapsing repair sections
  const handleRepairSectionToggle = useCallback((deviceIndex: number) => {
    setExpandedRepairSections(prev => ({
      ...prev,
      [deviceIndex]: !prev[deviceIndex]
    }))
  }, [])

  // Handle QC approach changes for each device
  const handleQcApproachChange = useCallback((deviceIndex: number, approach: 'repairs' | 'grade' | '') => {
    setDeviceQcApproaches(prev => ({
      ...prev,
      [deviceIndex]: approach
    }))
  }, [])

  // Handle grade selection changes for each device
  const handleDeviceGradeChange = useCallback((deviceIndex: number, grade: string) => {
    setDeviceGrades(prev => ({ ...prev, [deviceIndex]: grade }))
  }, [])

  // Mark device as completed
  const markDeviceCompleted = useCallback((deviceIndex: number) => {
    setCompletedDevices(prev => new Set([...prev, deviceIndex]))
  }, [])

  // Reset all states
  const resetAllStates = useCallback(() => {
    setDeviceQcApproaches({})
    setDeviceRepairs({})
    setDeviceGrades({})
    setDeviceOtherDescriptions({})
    setExpandedRepairSections({})
  }, [])

  // Update completed devices from external set
  const updateCompletedDevices = useCallback((newCompletedSet: Set<number>) => {
    setCompletedDevices(newCompletedSet)
  }, [])

  return {
    // State
    deviceRepairs,
    deviceOtherDescriptions,
    deviceGrades,
    expandedRepairSections,
    deviceQcApproaches,
    completedDevices,
    
    // Actions
    handleDeviceRepairToggle,
    handleDeviceOtherDescription,
    handleRepairSectionToggle,
    handleQcApproachChange,
    handleDeviceGradeChange,
    markDeviceCompleted,
    resetAllStates,
    updateCompletedDevices,
  }
}
