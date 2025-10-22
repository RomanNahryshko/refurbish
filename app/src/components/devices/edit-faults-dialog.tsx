'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Loader2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
import { RepairJob } from '@/lib/types/business-types'
import { REPAIR_STATUS } from '@/lib/constants'
import { ConfirmationDialog } from '@/components/common/confirmation-dialog'
import { repairTypes } from '@/components/common/repair-task-selector'

interface EditFaultsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  deviceId: string
  deviceInternalId: string
  onSuccess?: () => void
}

export function EditFaultsDialog({
  open,
  onOpenChange,
  deviceId,
  deviceInternalId,
  onSuccess
}: EditFaultsDialogProps) {
  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(false)
  const [existingJobs, setExistingJobs] = useState<RepairJob[]>([])
  const [selectedFaults, setSelectedFaults] = useState<string[]>([])
  const [otherDescription, setOtherDescription] = useState('')
  const [removedJobs, setRemovedJobs] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    jobId: string
    repairType: string
  }>({ open: false, jobId: '', repairType: '' })

  /**
   * Fetch current faults when dialog opens
   */
  useEffect(() => {
    if (open && deviceId) {
      fetchCurrentFaults()
    }
  }, [open, deviceId])

  /**
   * Fetch existing repair jobs for the device
   * Pre-selects all jobs (including completed) and fills "other" description if exists
   */
  async function fetchCurrentFaults() {
    setFetchingData(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/devices/${deviceId}/faults`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch current faults')
      }

      const jobs = result.data.repairJobs || []
      setExistingJobs(jobs)

      // Pre-select ALL existing faults (including completed ones)
      // Completed jobs will be disabled in UI but still shown as checked
      const currentFaults = jobs.map((job: RepairJob) => job.repair_type)
      setSelectedFaults(currentFaults)
      
      // Pre-fill "other" description if exists
      const otherJob = jobs.find((job: RepairJob) => job.repair_type === 'other')
      if (otherJob?.description) {
        setOtherDescription(otherJob.description)
      }
    } catch (err) {
      console.error('Error fetching faults:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch current faults')
    } finally {
      setFetchingData(false)
    }
  }

  /**
   * Handle toggling of repair task checkbox
   * - Completed jobs cannot be removed
   * - In-progress jobs require confirmation
   * - Pending jobs can be removed immediately
   * - New faults can be added freely
   */
  function handleFaultToggle(faultId: string) {
    const existingJob = existingJobs.find(job => job.repair_type === faultId)
    const isDeselecting = selectedFaults.includes(faultId)
    
    if (isDeselecting) {
      if (existingJob) {
        // Completed jobs cannot be removed
        if (existingJob.status === REPAIR_STATUS.completed) {
          toast.error('Cannot remove completed repair jobs')
          return
        }
        
        // In-progress jobs require confirmation
        if (existingJob.status === REPAIR_STATUS.in_progress) {
          setConfirmDialog({
            open: true,
            jobId: existingJob.id,
            repairType: faultId
          })
          return
        }

        // Pending jobs can be removed immediately
        setRemovedJobs(prev => [...prev, existingJob.id])
      }

      setSelectedFaults(prev => prev.filter(id => id !== faultId))
      setError(null)
    } else {
      // Adding a fault is always allowed
      setSelectedFaults(prev => [...prev, faultId])
      setError(null)
    }
  }

  /**
   * Handle confirmation of in-progress job removal
   */
  function handleConfirmRemoval() {
    const { jobId, repairType } = confirmDialog
    
    setRemovedJobs(prev => [...prev, jobId])
    setSelectedFaults(prev => prev.filter(id => id !== repairType))
    setConfirmDialog({ open: false, jobId: '', repairType: '' })
    setError(null)
    toast.info('In-progress job will be cancelled')
  }

  /**
   * Submit fault changes to the API
   * - Validates 'other' description if selected
   * - Checks if there are any changes before submitting
   * - Handles adding new jobs, updating descriptions, and removing jobs
   */
  async function handleSubmit() {
    setLoading(true)
    setError(null)

    try {
      // Validate 'other' description if 'other' is selected
      if (selectedFaults.includes('other') && !otherDescription.trim()) {
        setError('Description is required for "Other" repair type')
        setLoading(false)
        return
      }

      // Determine faults to add (new jobs, completed jobs to recreate, or 'other' for description update)
      const faultsToAdd = selectedFaults
        .filter(fault => {
          const existingJob = existingJobs.find(job => job.repair_type === fault)
          return !existingJob || existingJob.status === REPAIR_STATUS.completed || fault === 'other'
        })
        .map(fault => ({
          repair_type: fault,
          description: fault === 'other' ? otherDescription : undefined
        }))

      // Check if "other" description has changed
      const existingOtherJob = existingJobs.find(job => job.repair_type === 'other')
      const hasDescriptionChange = 
        selectedFaults.includes('other') && 
        existingOtherJob && 
        existingOtherJob.description !== otherDescription.trim()

      // Early return if no changes detected
      if (faultsToAdd.length === 0 && removedJobs.length === 0 && !hasDescriptionChange) {
        toast.info('No changes to save')
        onOpenChange(false)
        return
      }

      const response = await fetch(`/api/devices/${deviceId}/faults`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          faultsToAdd,
          faultsToRemove: removedJobs
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update faults')
      }

      // Show success message
      toast.success('Success')

      // Show warnings if any
      if (result.data?.errors && result.data.errors.length > 0) {
        result.data.errors.forEach((err: string) => {
          toast.warning(err)
        })
      }

      // Call onSuccess callback
      if (onSuccess) {
        onSuccess()
      }

      // Close dialog
      onOpenChange(false)

      // Reset state
      resetState()
    } catch (err) {
      console.error('Error updating faults:', err)
      setError(err instanceof Error ? err.message : 'Failed to update faults')
      toast.error(err instanceof Error ? err.message : 'Failed to update faults')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Reset all form state to initial values
   */
  function resetState() {
    setSelectedFaults([])
    setOtherDescription('')
    setRemovedJobs([])
    setExistingJobs([])
    setError(null)
  }

  /**
   * Handle dialog close
   * Prevents closing while loading
   */
  function handleClose() {
    if (!loading) {
      resetState()
      onOpenChange(false)
    }
  }

  /**
   * Get the status of a repair job by repair type
   */
  const getJobStatus = (repairType: string): string | null => {
    const job = existingJobs.find(j => j.repair_type === repairType)
    return job?.status || null
  }

  /**
   * Check if a repair job is completed
   */
  const isJobCompleted = (repairType: string): boolean => {
    return getJobStatus(repairType) === REPAIR_STATUS.completed
  }

  /**
   * Check if a repair job is in progress
   */
  const isJobInProgress = (repairType: string): boolean => {
    return getJobStatus(repairType) === REPAIR_STATUS.in_progress
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Faults</DialogTitle>
            <DialogDescription>
              Add or remove repair tasks for device {deviceInternalId}. 
              Completed jobs cannot be removed.
            </DialogDescription>
          </DialogHeader>

          {fetchingData ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
              <span className="ml-2 text-sm text-gray-500">Loading current faults...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Current Jobs Summary */}
              {existingJobs.length > 0 && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm font-medium text-blue-800 mb-2">
                    Current Repair Jobs:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {existingJobs.map(job => (
                      <Badge 
                        key={job.id} 
                        variant={
                          job.status === REPAIR_STATUS.completed ? 'default' :
                          job.status === REPAIR_STATUS.in_progress ? 'secondary' :
                          'outline'
                        }
                      >
                        {repairTypes.find(rt => rt.id === job.repair_type)?.label || job.repair_type}
                        {' '}({job.status})
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Repair Type Selector */}
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-[10px]">
                  <Label className="text-base font-semibold">Select Repair Tasks</Label>
                </div>
                
                {repairTypes.map((repair) => {
                  const status = getJobStatus(repair.id)
                  const isCompleted = isJobCompleted(repair.id)
                  const isInProgress = isJobInProgress(repair.id)
                  const isChecked = selectedFaults.includes(repair.id)

                  return (
                    <div key={repair.id}>
                      <div 
                        className={`flex items-center space-x-3 p-3 border rounded-lg ${
                          isCompleted 
                            ? 'bg-gray-100 cursor-not-allowed opacity-60' 
                            : 'hover:bg-gray-50 cursor-pointer'
                        }`}
                      >
                        <input
                          type="checkbox"
                          id={repair.id}
                          checked={isChecked}
                          onChange={() => !isCompleted && handleFaultToggle(repair.id)}
                          disabled={isCompleted || loading}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer disabled:cursor-not-allowed"
                        />
                        <Label 
                          htmlFor={repair.id} 
                          className={`flex-1 cursor-pointer`}
                        >
                          <div className="flex items-center justify-between gap-[10px]">
                            <span className="font-medium">{repair.label}</span>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{repair.level} Technician</Badge>
                              {status && (
                                <Badge 
                                  variant={
                                    status === REPAIR_STATUS.completed ? 'default' :
                                    status === REPAIR_STATUS.in_progress ? 'secondary' :
                                    'outline'
                                  }
                                >
                                  {status}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </Label>
                        <div className="text-xs text-gray-500">
                          {isChecked ? '✓ Selected' : '○ Not Selected'}
                        </div>
                      </div>

                      {/* Description field for 'other' */}
                      {repair.requiresDescription && isChecked && (
                        <div className="ml-10 mt-2">
                          <Textarea
                            placeholder="Describe the repair needed..."
                            value={otherDescription}
                            onChange={(e) => setOtherDescription(e.target.value)}
                            rows={2}
                            className="text-sm"
                            disabled={loading}
                          />
                        </div>
                      )}

                      {/* Warning for in-progress jobs */}
                      {isInProgress && !isChecked && (
                        <div className="ml-10 mt-2">
                          <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription className="text-xs">
                              This job is in progress. Removing it will cancel the current work.
                            </AlertDescription>
                          </Alert>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Info about changes */}
              {(removedJobs.length > 0 || selectedFaults.some(f => !existingJobs.find(j => j.repair_type === f))) && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Changes will be applied when you click Save. 
                    {removedJobs.length > 0 && ' Jobs will be cancelled.'}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading || fetchingData}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog for removing in-progress jobs */}
      <ConfirmationDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
        title="Remove In-Progress Job?"
        description={`The ${confirmDialog.repairType.replace('_', ' ')} repair job is currently in progress. Removing it will cancel the current work. Are you sure?`}
        confirmText="Remove Job"
        onConfirm={handleConfirmRemoval}
      />
    </>
  )
}

