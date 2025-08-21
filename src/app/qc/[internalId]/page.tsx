'use client';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
    ArrowLeft,
    ClipboardCheck
} from 'lucide-react';
import { useDeviceByInternalId } from '@/lib/hooks/use-devices';
import { useBatches } from '@/lib/hooks/use-batches';
import { useRepairJobs } from '@/lib/hooks/use-repair-jobs';
import { useCreateQCCheck } from '@/lib/hooks/use-qc-checks';
import { useCreateRepairJob } from '@/lib/hooks/use-repair-jobs';
import { toast } from 'sonner';
import { FinalQCDeviceCard } from '@/components/quality-control/final-qc-device-card';
import { LoadingSpinner } from '@/components/common/loading-spinner';
import { useSupabaseClient } from '@/lib/hooks/use-supabase-client';
import { RepairType } from '@/lib/types/business-types';

export default function FinalQCPage() {
  const params = useParams()
  const router = useRouter()
  const internalId = params.internalId as string
  const supabase = useSupabaseClient()
  
  // State for QC form - must be called before any early returns
  const [qcNotes, setQcNotes] = useState<string>('')
  const [selectedRepairs, setSelectedRepairs] = useState<string[]>([])
  const [otherRepairDescription, setOtherRepairDescription] = useState<string>('')
  
  // Fetch device data from database
  const { data: device, isLoading: deviceLoading, error: deviceError } = useDeviceByInternalId(internalId)
  
  // Fetch batches for device information
  const { data: batches, error: batchesError } = useBatches()
  
  // Fetch repair jobs for this device
  const { data: repairJobs, error: repairJobsError } = useRepairJobs()
  
  // QC check creation hook
  const createQCCheck = useCreateQCCheck()
  
  // Repair job creation hook
  const createRepairJob = useCreateRepairJob()
  
  // Validate internal ID format (8 digits)
  if (!/^\d{8}$/.test(internalId)) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900">Invalid Device ID</h1>
          <p className="text-gray-600 mt-2">Device ID must be 8 digits: {internalId}</p>
          <Link href="/qc" className="mt-4 inline-block">
            <Button>Back to QC Queue</Button>
          </Link>
        </div>
      </div>
    )
  }
  
  // Show loading state while device is being fetched
  if (deviceLoading) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner />
        </div>
      </div>
    )
  }
  
  // Show error if device fetch failed
  if (deviceError) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900">Error Loading Device</h1>
          <p className="text-gray-600 mt-2">Failed to load device data: {deviceError.message}</p>
          <Link href="/qc" className="mt-4 inline-block">
            <Button>Back to QC Queue</Button>
          </Link>
        </div>
      </div>
    )
  }
  
  // Check if device was found
  if (!device) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900">Device Not Found</h1>
          <p className="text-gray-600 mt-2">No device found with internal ID: {internalId}</p>
          <Link href="/qc" className="mt-4 inline-block">
            <Button>Back to QC Queue</Button>
          </Link>
        </div>
      </div>
    )
  }
  
  const batch = batches?.find(b => b.id === device.batch_id)
  const completedRepairs = repairJobs?.filter(r => 
    r.device_id === device.id && r.status === 'completed'
  ) || []
  
  // Handle repair selection
  const handleRepairToggle = (repairId: string) => {
    setSelectedRepairs(prev => 
      prev.includes(repairId) 
        ? prev.filter(id => id !== repairId)
        : [...prev, repairId]
    )
  }
  
  // Handle final QC completion
  const handleCompleteQC = async (decision: 'pass' | 'fail', grade?: string) => {
    if (selectedRepairs.includes('other') && !otherRepairDescription.trim()) {
      toast.error('Please provide a description for "Other" repair')
      return
    }
    
    try {
      // Create QC check record in database
      if (supabase) {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          toast.error('User not authenticated')
          return
        }
        
        // Prepare QC check data
        const qcData = {
          device_id: device.id,
          check_type: 'final' as const,
          overall_result: decision as 'pass' | 'fail',
          grade_assigned: decision === 'pass' ? grade as 'A' | 'B' | 'C' : undefined,
          notes: qcNotes || `Final QC: ${decision === 'pass' ? `Passed with Grade ${grade}` : 'Failed - requires additional repairs'}`
        }
        
        // Create QC check (no need for artificial test results)
        await createQCCheck.mutateAsync({
          qcData
        })
        
        // If QC failed, create repair jobs for selected repairs
        if (decision === 'fail' && selectedRepairs.length > 0) {
          try {
            for (const repairType of selectedRepairs) {
              // Map repair type to the correct format
              const repairTypeMap: Record<string, string> = {
                'housing_replace': 'housing_change',
                'glass_replace': 'glass_change',
                'battery_replace': 'battery_change',
                'housing_change': 'housing_change',
                'glass_change': 'glass_change',
                'battery_change': 'battery_change',
                'software_update': 'software_update',
                'other': 'other'
              }
              
              const mappedRepairType = repairTypeMap[repairType]
              
              if (!mappedRepairType) {
                continue
              }
              
              const repairJobData = {
                device_id: device.id,
                repair_type: mappedRepairType as RepairType,
                description: mappedRepairType === 'other' ? otherRepairDescription : undefined
              }
              
              await createRepairJob.mutateAsync({
                data: repairJobData,
                createdBy: user.id
              })
            }
            
            toast.success(`Created ${selectedRepairs.length} repair job(s) for device ${device.internal_id}`)
          } catch {
            toast.error('QC completed but failed to create repair jobs. Please check repair queue.')
          }
        }
        
        toast.success(`Final QC completed successfully for device ${device.internal_id}`)
      }
      
      // Show success message
      if (decision === 'pass') {
        toast.success(`Device ${device.internal_id} passed Final QC with Grade ${grade}. Ready to ship!`)
      } else {
        const repairCount = selectedRepairs.length
        toast.warning(`Device ${device.internal_id} failed Final QC. ${repairCount} additional repair task(s) created`)
      }
      
      router.push('/qc')
    } catch {
      toast.error('Failed to complete final QC. Please try again.')
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/qc">
          <Button variant="ghost" size="sm" className="cursor-pointer">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to QC Queue
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardCheck className="h-6 w-6" />
            Final Quality Control
          </h1>
          <p className="text-gray-600">Device {device.internal_id}</p>
          {(batchesError || repairJobsError) && (
            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
              ⚠️ Some data may not be fully loaded due to connection issues
            </div>
          )}
        </div>
      </div>

      {/* Final QC Device Card */}
      <FinalQCDeviceCard
        device={device}
        batch={batch}
        completedRepairs={completedRepairs}
        selectedRepairs={selectedRepairs}
        otherDescription={otherRepairDescription}
        qcNotes={qcNotes}
        onRepairToggle={handleRepairToggle}
        onOtherDescriptionChange={setOtherRepairDescription}
        onQCNotesChange={setQcNotes}
        onCompleteQC={handleCompleteQC}
        isSubmitting={createQCCheck.isPending}
      />
    </div>
  )
}