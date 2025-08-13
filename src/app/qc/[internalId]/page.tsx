'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  ArrowLeft,
  ClipboardCheck
} from 'lucide-react'
import { mockBatches, mockRepairJobs, getDeviceByInternalId } from '@/lib/mock-data'
import { toast } from 'sonner'
import { FinalQCDeviceCard } from '@/components/quality-control/final-qc-device-card'

export default function FinalQCPage() {
  const params = useParams()
  const router = useRouter()
  const internalId = params.internalId as string
  
  // State for QC form - must be called before any early returns
  const [qcNotes, setQcNotes] = useState<string>('')
  const [selectedRepairs, setSelectedRepairs] = useState<string[]>([])
  const [otherRepairDescription, setOtherRepairDescription] = useState<string>('')
  
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
  
  // Find device and related data
  const device = getDeviceByInternalId(internalId)
  
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
  
  const batch = mockBatches.find(b => b.id === device.batch_id)
  const completedRepairs = mockRepairJobs.filter(r => 
    r.device_id === device.id && r.status === 'completed'
  )
  
  // Handle repair selection
  const handleRepairToggle = (repairId: string) => {
    setSelectedRepairs(prev => 
      prev.includes(repairId) 
        ? prev.filter(id => id !== repairId)
        : [...prev, repairId]
    )
  }
  
  // Handle final QC completion
  const handleCompleteQC = (decision: 'pass' | 'fail', grade?: string) => {
    if (selectedRepairs.includes('other') && !otherRepairDescription.trim()) {
      toast.error('Please provide a description for "Other" repair')
      return
    }
    
    if (decision === 'pass') {
      toast.success(`Device ${device.internal_id} passed Final QC with Grade ${grade}. Ready to ship!`)
      router.push('/qc')
    } else {
      const repairCount = selectedRepairs.length
      toast.warning(`Device ${device.internal_id} failed Final QC. ${repairCount} additional repair task(s) created`)
      router.push('/qc')
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
      />
    </div>
  )
}