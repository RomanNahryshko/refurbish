'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { 
  ArrowLeft,
  ClipboardCheck
} from 'lucide-react'
import { mockDevices, mockBatches, mockRepairJobs } from '@/lib/mock-data'
import { toast } from 'sonner'
import { FinalQCDeviceCard } from '@/components/quality-control/final-qc-device-card'

export default function FinalQCPage() {
  const params = useParams()
  const router = useRouter()
  const deviceId = params.deviceId as string
  
  // Find device and related data
  const device = mockDevices.find(d => d.id === deviceId) || 
    { // Add mock device if not found for demo
      id: deviceId,
      internal_id: '00000010',
      batch_id: 'batch-2',
      imei: '223456789012349',
      serial_number: 'SN223460',
      brand: 'Apple',
      model: 'iPhone 13 Pro',
      color: 'Sierra Blue',
      storage_capacity: '256GB',
      status: 'final_qc',
      grade: 'ungraded',
      created_at: '2024-01-17T09:00:00Z'
    }
  
  const batch = mockBatches.find(b => b.id === device.batch_id)
  const completedRepairs = mockRepairJobs.filter(r => 
    r.device_id === deviceId && r.status === 'completed'
  )
  
  // State for QC form
  const [qcNotes, setQcNotes] = useState('')
  const [selectedRepairs, setSelectedRepairs] = useState<string[]>([])
  const [otherRepairDescription, setOtherRepairDescription] = useState('')
  
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
          <Button variant="ghost" size="sm">
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