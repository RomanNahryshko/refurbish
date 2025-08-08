'use client'

import React, { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Upload,
  Download,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle,
  Save,
  Loader2
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { mockBatches } from '@/lib/mock-data'
import { InitialQCDeviceCard } from '@/components/batch-intake/initial-qc-device-card'
import { useExcelParser } from '@/lib/hooks/use-excel-parser'
import { v4 as uuidv4 } from 'uuid'


// Mock Dr. Phone data format
interface DrPhoneData {
  imei: string
  model: string
  brand: string
  serialNumber: string
  faults: string
}

// Function to convert Excel data to DrPhoneData format
function convertExcelToDrPhoneData(excelData: any): DrPhoneData[] {
  if (!excelData || !excelData.rows || excelData.rows.length === 0) {
    return []
  }

  return excelData.rows.map((row: any) => {
    // Excel parser returns rows as objects with column names as keys
    const imei = row['IMEI'] || row['imei'] || row[0] || ''
    const brand = row['Brand'] || row['brand'] || row[1] || ''
    const model = row['Model'] || row['model'] || row[2] || ''
    const serialNumber = row['Serial Number'] || row['SerialNumber'] || row['serial_number'] || row[3] || ''
    const faultsString = row['Faults'] || row['faults'] || row[4] || ''
    
    // Split faults by common delimiters and clean up
    const faults = faultsString
      .split(/[,;|]/)
      .map((fault: string) => fault.trim())
      .filter((fault: string) => fault.length > 0)
      .filter((fault: string) => fault.toLowerCase() !== 'no faults detected')
    
    return {
      imei,
      brand,
      model,
      serialNumber,
      faults: faults.length > 0 ? faults : ['No faults detected']
    }
  });
}

export default function ImportDrPhonePage() {
  const params = useParams()
  const router = useRouter()
  const batchId = params.id as string
  const batch = mockBatches.find(b => b.id === batchId)
  
  // Excel parser hook
  const { parsedData, isParsing, error, parseExcelFile, clearData } = useExcelParser()
  

  
  const [importedData, setImportedData] = useState<DrPhoneData[]>([])
  
  // Per-device repair task selection state
  const [deviceRepairs, setDeviceRepairs] = useState<Record<number, string[]>>({})
  const [deviceOtherDescriptions, setDeviceOtherDescriptions] = useState<Record<number, string>>({})
  const [completedDevices, setCompletedDevices] = useState<Set<number>>(new Set())
  const [isDragOver, setIsDragOver] = useState(false)
  const [fileInputKey, setFileInputKey] = useState(0)
  
  // Mock imported data for simulation
  const mockDrPhoneData: DrPhoneData[] = [
    {
      imei: '356789012345678',
      model: 'iPhone 12',
      brand: 'Apple',
      serialNumber: 'F2LZK1234567',
      faults: 'Battery health 78%, Minor scratches on screen'
    },
    {
      imei: '356789012345679',
      model: 'Galaxy S21',
      brand: 'Samsung',
      serialNumber: 'RF8R1234567',
      faults: 'Camera not focusing, Housing damage'
    },
    {
      imei: '356789012345680',
      model: 'iPhone 11',
      brand: 'Apple',
      serialNumber: 'F2LZK7654321',
      faults: 'Screen unresponsive in corner, Speaker crackling'
    },
    {
      imei: '356789012345681',
      model: 'Pixel 6',
      brand: 'Google',
      serialNumber: 'GP6K1234567',
      faults: 'No faults detected'
    },
    {
      imei: '356789012345682',
      model: 'Galaxy A52',
      brand: 'Samsung',
      serialNumber: 'RF8A1234567',
      faults: 'Battery drain issue, Wifi connectivity problems'
    }
  ]

      const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0]
      if (file) {
        // Clear previous data when new file is selected
        if (parsedData) {
          clearData()
          // Force file input to re-render
          setFileInputKey(prev => prev + 1)
        }
        
        // Check if it's an Excel file (case insensitive)
        const fileName = file.name.toLowerCase()
        if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
          toast.error('Please upload an Excel file (.xlsx or .xls)')
          return
        }
        
        // Parse Excel file using web worker
        if (typeof parseExcelFile !== 'function') {
          toast.error('Excel parser not initialized')
          return
        }
        
        try {
          parseExcelFile(file)
          toast.info('Processing Excel file...')
        } catch (error: any) {
          toast.error(`Failed to start file processing: ${error.message}`)
        }
      }
    } catch (error: any) {
      toast.error(`Error processing file upload: ${error.message}`)
    }
  }

  const handleUploadClick = () => {
    const fileInput = document.getElementById('file-upload') as HTMLInputElement
    
    if (fileInput && !isParsing) {
      // Reset the file input value to ensure onChange triggers even for same file
      fileInput.value = ''
      fileInput.click()
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      const file = files[0]
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        parseExcelFile(file)
        toast.info('Processing Excel file...')
      } else {
        toast.error('Please upload an Excel file (.xlsx or .xls)')
      }
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

  // Handle Excel parsing success
  React.useEffect(() => {
    if (parsedData) {
      toast.success(`Successfully parsed ${parsedData.totalRows} rows from Excel file`)
    }
  }, [parsedData])

  // Handle Excel parsing error
  React.useEffect(() => {
    if (error) {
      toast.error(`Excel parsing error: ${error}`)
    }
  }, [error])

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

      {/* Excel File Upload */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Upload Dr. Phone Excel File</CardTitle>
          <CardDescription>
            Upload Excel file (.xlsx) exported from Dr. Phone software containing device diagnostic results
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Excel file should contain columns: IMEI, Brand, Model, Serial Number, and diagnostic faults.
              Supports .xlsx and .xls files. The file will be parsed in a web worker and displayed in a table below.
            </AlertDescription>
          </Alert>
          
          <div 
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragOver 
                ? 'border-primary bg-primary/5' 
                : 'hover:border-primary/50'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-4">
              Click to upload Excel file or drag and drop
            </p>
            <input
              key={fileInputKey}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
              disabled={isParsing}
            />
            <Button 
              type="button" 
              disabled={isParsing}
              className="cursor-pointer"
              onClick={handleUploadClick}
            >
              {isParsing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  {parsedData ? 'Choose New Excel File' : 'Choose Excel File'}
                </>
              )}
            </Button>
            
            {/* Demo/Simulation Button */}
            <div className="mt-4 pt-4 border-t border-dashed">
              <p className="text-xs text-muted-foreground mb-2">For testing purposes:</p>
              <div className="flex gap-2 justify-center">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setImportedData(mockDrPhoneData)
                    toast.success(`Loaded ${mockDrPhoneData.length} demo devices for testing`)
                  }}
                  className="text-xs"
                >
                  <Download className="h-3 w-3 mr-1" />
                  Load Demo Data
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Excel Data Preview */}
      {parsedData && (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Excel Data Preview</CardTitle>
                <CardDescription>
                  Preview of parsed Excel data. Review the data and proceed to Initial QC.
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => {
                  clearData()
                  
                  // Reset file input value
                  const fileInput = document.getElementById('file-upload') as HTMLInputElement
                  if (fileInput) {
                    fileInput.value = ''
                  }
                }}>
                  Clear Data
                </Button>
                <Button 
                  onClick={() => {
                    // Convert Excel data to DrPhoneData format
                    const convertedData = convertExcelToDrPhoneData(parsedData)
                    setImportedData(convertedData)
                    toast.success(`Converted ${convertedData.length} devices from Excel data`)
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Convert to Device Cards
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Excel data has been parsed successfully. Click &quot;Convert to Device Cards&quot; to transform the data into device cards for Initial QC processing.
                </AlertDescription>
              </Alert>
              
              {/* Debug info */}
              <div className="text-xs text-muted-foreground p-2 bg-gray-50 rounded">
                <p>Debug: Parsed {parsedData.rows?.length || 0} rows</p>
                <p>Headers: {parsedData.headers?.join(', ') || 'None'}</p>
                {parsedData.rows && parsedData.rows.length > 0 && (
                  <p>First row keys: {Object.keys(parsedData.rows[0]).join(', ')}</p>
                )}
              </div>
              
              <div className="space-y-4">
                {parsedData.rows && parsedData.rows.length > 0 ? (
                  parsedData.rows.map((row, index) => {
                    console.log('Processing row:', row); // Debug log
                    
                    // Convert row to DrPhoneData format for preview
                    // Excel parser returns rows as objects with column names as keys
                    const previewDevice: DrPhoneData = {
                      imei: row['Imei'] || '',
                      brand: row['Brand'] || row['brand'] || row[1] || '',
                      model: row['Model Name'] || '',
                      serialNumber: row['Serial'] || '',
                      faults: row['Fail'] || 'No faults detected'
                    }
                    
                    console.log('Preview device:', previewDevice); // Debug log
                    
                    return (
                      <InitialQCDeviceCard
                        key={uuidv4()}
                        device={previewDevice}
                        deviceIndex={index}
                        selectedRepairs={[]}
                        otherDescription=""
                        onRepairToggle={() => {}} // No-op for preview
                        onOtherDescriptionChange={() => {}} // No-op for preview
                        onCompleteQC={() => {}} // No-op for preview
                      />
                    )
                  })
                ) : (
                  // Show demo data if no Excel data is available
                  <div className="text-center py-8">
                    <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                    <h3 className="text-lg font-semibold text-muted-foreground">No Excel Data Available</h3>
                    <p className="text-gray-600 mb-4">Upload an Excel file to see device cards here.</p>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setImportedData(mockDrPhoneData)
                        toast.success(`Loaded ${mockDrPhoneData.length} demo devices for testing`)
                      }}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Load Demo Data Instead
                    </Button>
                  </div>
                )}
              </div>
              

            </div>
          </CardContent>
        </Card>
      )}

      {/* Initial Quality Control */}
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
                .map((device) => {
                  // Find the original index in the full array
                  const deviceIndex = importedData.findIndex(d => d.imei === device.imei)
                  
                  return (
                    <InitialQCDeviceCard
                      key={uuidv4()}
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
                  You can proceed to batch management once you&apos;ve completed QC for the devices you want to process.
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
  );
}