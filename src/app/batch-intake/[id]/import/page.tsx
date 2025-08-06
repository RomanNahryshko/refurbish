'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { 
  ArrowLeft, 
  Upload, 
  Download,
  FileSpreadsheet, 
  AlertCircle, 
  CheckCircle,
  Edit,
  Save,
  ChevronDown,
  ChevronUp,
  Wrench
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { mockBatches } from '@/lib/mock-data'
import { InitialQCDeviceCard } from '@/components/batch-intake/initial-qc-device-card'

// Mock Dr. Phone data format
interface DrPhoneData {
  imei: string
  model: string
  brand: string
  serialNumber: string
  faults: string[]
}

export default function ImportDrPhonePage() {
  const params = useParams()
  const router = useRouter()
  const batchId = params.id as string
  const batch = mockBatches.find(b => b.id === batchId)
  
  const [importMethod, setImportMethod] = useState<'file' | 'manual'>('file')
  const [importedData, setImportedData] = useState<DrPhoneData[]>([])
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [manualInput, setManualInput] = useState('')
  
  // Per-device repair task selection state
  const [deviceRepairs, setDeviceRepairs] = useState<Record<number, string[]>>({})
  const [deviceOtherDescriptions, setDeviceOtherDescriptions] = useState<Record<number, string>>({})
  const [completedDevices, setCompletedDevices] = useState<Set<number>>(new Set())
  
  // Mock imported data
  const mockDrPhoneData: DrPhoneData[] = [
    {
      imei: '356789012345678',
      model: 'iPhone 12',
      brand: 'Apple',
      serialNumber: 'F2LZK1234567',
      faults: ['Battery health 78%', 'Minor scratches on screen']
    },
    {
      imei: '356789012345679',
      model: 'Galaxy S21',
      brand: 'Samsung',
      serialNumber: 'RF8R1234567',
      faults: ['Camera not focusing', 'Housing damage']
    },
    {
      imei: '356789012345680',
      model: 'iPhone 11',
      brand: 'Apple',
      serialNumber: 'F2LZK7654321',
      faults: ['Screen unresponsive in corner', 'Speaker crackling']
    }
  ]

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Mock file processing
      setTimeout(() => {
        setImportedData(mockDrPhoneData)
        toast.success(`Imported ${mockDrPhoneData.length} devices from ${file.name}`)
      }, 1000)
    }
  }

  const handleManualImport = () => {
    // Mock parsing CSV text
    const lines = manualInput.trim().split('\n')
    if (lines.length > 0) {
      setImportedData(mockDrPhoneData)
      toast.success(`Imported ${mockDrPhoneData.length} devices`)
      setManualInput('')
    }
  }



  // Handle per-device repair task selection
  const handleDeviceRepairToggle = (deviceIndex: number, repairId: string) => {
    setDeviceRepairs(prev => {
      const currentRepairs = prev[deviceIndex] || []
      const updatedRepairs = currentRepairs.includes(repairId)
        ? currentRepairs.filter(id => id !== repairId)
        : [...currentRepairs, repairId]
      
      return { ...prev, [deviceIndex]: updatedRepairs }
    })
  }

  const handleDeviceOtherDescription = (deviceIndex: number, description: string) => {
    setDeviceOtherDescriptions(prev => ({ ...prev, [deviceIndex]: description }))
  }

  const handleCompleteDeviceQC = (deviceIndex: number) => {
    setCompletedDevices(prev => new Set([...prev, deviceIndex]))
    toast.success(`Initial QC completed for device ${importedData[deviceIndex].imei}`)
  }

  const proceedToBatchDevices = () => {
    if (completedDevices.size === 0) {
      alert('Please complete Initial QC for at least one device before proceeding.')
      return
    }
    
    const completedCount = completedDevices.size
    const totalCount = importedData.length
    
    if (completedCount < totalCount) {
      const confirmMessage = `You have completed ${completedCount} of ${totalCount} devices. Do you want to proceed anyway?`
      if (!confirm(confirmMessage)) {
        return
      }
    }
    
    toast.success(`Initial QC completed for ${completedCount} devices. Proceeding to batch devices.`)
    router.push(`/devices?batch=${batchId}`)
  }

  if (!batch) {
    return <div>Batch not found</div>
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/batch-intake" className="cursor-pointer">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Import Dr. Phone Data</h1>
          <p className="text-muted-foreground">
            Batch: {batch.batch_number} • {batch.device_count} devices expected
          </p>
        </div>
      </div>

      {/* Import Methods */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Import Method</CardTitle>
          <CardDescription>
            Choose how to import Dr. Phone diagnostic results
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={importMethod} onValueChange={(v) => setImportMethod(v as 'file' | 'manual')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="file">
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Upload File
              </TabsTrigger>
              <TabsTrigger value="manual">
                <Edit className="h-4 w-4 mr-2" />
                Paste Data
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="file" className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Upload CSV or Excel file exported from Dr. Phone software. 
                  File should contain IMEI, Model, and diagnostic results.
                </AlertDescription>
              </Alert>
              
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <Download className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-4">
                  Click to upload or drag and drop
                </p>
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Button type="button" className="cursor-pointer">
                    Choose File
                  </Button>
                </label>
              </div>
            </TabsContent>
            
            <TabsContent value="manual" className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Paste CSV data directly from Dr. Phone export. 
                  Format: IMEI, Brand, Model, Serial Number, Faults
                </AlertDescription>
              </Alert>
              
              <Textarea
                placeholder="Paste CSV data here..."
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                rows={10}
                className="font-mono text-sm"
              />
              
              <Button 
                onClick={handleManualImport}
                disabled={!manualInput.trim()}
              >
                <Download className="h-4 w-4 mr-2" />
                Import Data
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Imported Data Review */}
      {importedData.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Initial Quality Control</CardTitle>
                <CardDescription>
                  Complete Initial QC for each device - assign repairs or final grade
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline" className="text-lg">
                  {completedDevices.size} of {importedData.length} completed
                </Badge>
                {completedDevices.size > 0 && (
                  <Badge variant="default" className="bg-green-600">
                    {completedDevices.size} QC Complete
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {importedData
                .filter((_, index) => !completedDevices.has(index))
                .map((device, originalIndex) => {
                  // Find the original index in the full array
                  const deviceIndex = importedData.findIndex(d => d.imei === device.imei)
                  return (
                    <InitialQCDeviceCard
                      key={deviceIndex}
                      device={device}
                      deviceIndex={deviceIndex}
                      selectedRepairs={deviceRepairs[deviceIndex] || []}
                      otherDescription={deviceOtherDescriptions[deviceIndex] || ''}
                      onRepairToggle={(repairId) => handleDeviceRepairToggle(deviceIndex, repairId)}
                      onOtherDescriptionChange={(desc) => handleDeviceOtherDescription(deviceIndex, desc)}
                      onCompleteQC={() => handleCompleteDeviceQC(deviceIndex)}
                    />
                  )
                })
              }
              
              {/* Show message when all devices are completed */}
              {completedDevices.size === importedData.length && importedData.length > 0 && (
                <div className="text-center py-8">
                  <CheckCircle className="mx-auto h-12 w-12 text-green-600 mb-3" />
                  <h3 className="text-lg font-semibold text-green-600">All Devices Completed!</h3>
                  <p className="text-gray-600">Initial QC has been completed for all {importedData.length} devices.</p>
                </div>
              )}
            </div>
            
            <div className="flex justify-between items-center mt-6 pt-6 border-t">
              <Alert className="flex-1 mr-4">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Complete Initial QC for each device individually. Repair tasks and grades will be saved automatically.
                  You can proceed to batch management once you've completed QC for the devices you want to process.
                </AlertDescription>
              </Alert>
              
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setImportedData([])}>
                  Clear All Data
                </Button>
                <Button 
                  onClick={proceedToBatchDevices}
                  disabled={completedDevices.size === 0}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Proceed to Batch Management
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}