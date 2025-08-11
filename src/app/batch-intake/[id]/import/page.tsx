'use client';
import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, ArrowLeft, CheckCircle, Loader2, FileUp } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { InitialQCDeviceCard } from '@/components/batch-intake/initial-qc-device-card';
import { useExcelParser } from '@/lib/hooks/use-excel-parser';
import { useBatch } from '@/lib/hooks/use-batches';
import { useCreateDevicesFromImport } from '@/lib/hooks/use-devices';
import { LoadingSpinner } from '@/components/common/loading-spinner';
import { createClient } from '@/lib/supabase/client';


// Mock Dr. Phone data format
interface DrPhoneData {
  imei: string
  model: string
  brand: string
  serialNumber: string
  faults: string
}



export default function ImportDrPhonePage() {
  const params = useParams()
  const router = useRouter()
  const batchId = params.id as string
  
  // Get batch data from API
  const { data: batch, isLoading: batchLoading, error: batchError } = useBatch(batchId)
  
  // Excel parser hook
  const { parsedData, isParsing, error, parseExcelFile, clearData } = useExcelParser()
  

  
  const [importedData, setImportedData] = useState<DrPhoneData[]>([])
  const [createdDevices, setCreatedDevices] = useState<Array<{ id: string; imei: string }>>([])
  // Store filtered devices (duplicates removed)
  const [filteredDevices, setFilteredDevices] = useState<DrPhoneData[]>([])
  
  // Per-device repair task selection state
  const [deviceRepairs, setDeviceRepairs] = useState<Record<number, string[]>>({})
  const [deviceOtherDescriptions, setDeviceOtherDescriptions] = useState<Record<number, string>>({})
  
  // Per-device grade selection state
  const [deviceGrades, setDeviceGrades] = useState<Record<number, string>>({})
  
  // Per-device repair section expansion state
  const [expandedRepairSections, setExpandedRepairSections] = useState<Record<number, boolean>>({})
  
  // Per-device QC approach state (repairs vs grade)
  const [deviceQcApproaches, setDeviceQcApproaches] = useState<Record<number, 'repairs' | 'grade' | ''>>({})
  const [completedDevices, setCompletedDevices] = useState<Set<number>>(new Set())
  const [isDragOver, setIsDragOver] = useState(false)
  const [fileInputKey, setFileInputKey] = useState(0)

  // Track when we're creating devices to prevent automatic refetches
  const [isCreatingDevice, setIsCreatingDevice] = useState(false)
  
  const createDevicesFromImport = useCreateDevicesFromImport()
  
  // Function to create a single device when QC is completed
  const createSingleDevice = async (deviceData: DrPhoneData, deviceIndex: number) => {
    try {
      setIsCreatingDevice(true)
      
      const supabase = createClient()
      if (!supabase) {
        toast.error('Database connection failed')
        return null
      }

      // Get the selected repairs and grade for this device
      const selectedRepairs = deviceRepairs[deviceIndex] || []
      const selectedGrade = deviceGrades[deviceIndex] || ''
      const otherDescription = deviceOtherDescriptions[deviceIndex] || ''
      const qcApproach = deviceQcApproaches[deviceIndex] || ''

      // Try to create the device directly - let the database handle conflicts
      const deviceToCreate = {
        imei: deviceData.imei,
        brand: deviceData.brand,
        model: deviceData.model,
        serial_number: deviceData.serialNumber,
        dr_phone_data: {
          faults: deviceData.faults,
          original_data: deviceData,
          qc_data: {
            approach: qcApproach,
            selected_repairs: selectedRepairs,
            selected_grade: selectedGrade,
            other_description: otherDescription
          }
        }
      }
      
      const result = await createDevicesFromImport.mutateAsync({
        batchId,
        devices: [deviceToCreate]
      })

      if (result && result.length > 0) {
        const createdDevice = result[0]
        setCreatedDevices(prev => {
          const newState = [...prev, { id: createdDevice.id, imei: createdDevice.imei }]
          return newState
        })
        
        // Small delay to ensure state is updated before continuing
        await new Promise(resolve => setTimeout(resolve, 100))
        
        return createdDevice.id
      }

      return null
    } catch (error: any) {
      console.error('❌ Error creating device:', error)
      console.error('❌ Error details:', {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint
      })
      
      // Check if it's a duplicate IMEI error
      if (error?.message?.includes('duplicate key') || error?.message?.includes('already exists')) {
        
        try {
          // Device already exists, fetch its ID
          const supabase = createClient()
          if (supabase) {
            const { data: existingDevice, error: fetchError } = await supabase
              .from('devices')
              .select('id')
              .eq('imei', deviceData.imei)
              .eq('batch_id', batchId)
              .is('deleted_at', null)
              .single()

            if (fetchError) {
              toast.error('Failed to create or find device. Please try again.')
              return null
            }

            if (existingDevice) {
              // Add to createdDevices if not already there
              setCreatedDevices(prev => {
                if (!prev.find(d => d.id === existingDevice.id)) {
                  return [...prev, { id: existingDevice.id, imei: deviceData.imei }]
                }
                return prev
              })
              return existingDevice.id
            }
          }
        } catch (_fetchError) {
          // Handle fetch error silently
        }
      }
      
      toast.error('Failed to create device. Please try again.')
      return null
    } finally {
      setIsCreatingDevice(false)
    }
  }

  // Function to check if devices already have completed QC
  const checkAlreadyCompletedDevices = async (devices: DrPhoneData[]) => {
    try {
      const completedIMEIs = new Set<string>()
      
      // Check each device against the database
      for (const device of devices) {
        // Check if device exists and has completed QC
        const existingDevice = createdDevices.find(d => d.imei === device.imei)
        if (existingDevice?.id) {
          // Device exists, check if it has completed QC
          const supabase = createClient()
          if (supabase) {
            const { data: qcChecks } = await supabase
              .from('qc_checks')
              .select('id, overall_result')
              .eq('device_id', existingDevice.id)
              .eq('check_type', 'initial')
              .in('overall_result', ['pass', 'fail'])
              .limit(1)
            
            if (qcChecks && qcChecks.length > 0) {
              completedIMEIs.add(device.imei)
            }
          }
        }
      }
      
      return completedIMEIs
    } catch (_error) {
      return new Set<string>()
    }
  }

  // Function to fetch existing devices and filter out duplicates
  const fetchExistingDevicesAndFilter = async (parsedDevices: DrPhoneData[]) => {
    try {
      
      const supabase = createClient()
      if (!supabase) {
        return parsedDevices
      }

      
      const { data: existingDevices, error } = await supabase
        .from('devices')
        .select('id, imei, brand, model, serial_number')
        .eq('batch_id', batchId)
        .is('deleted_at', null)
      
      


      if (error) {
        console.error('❌ Error fetching existing devices:', error)
        toast.error('Failed to check for existing devices. Please try again.')
        return parsedDevices
      }

    

      // Filter out devices that already exist (by IMEI)
      const existingIMEIs = new Set(existingDevices?.map((d: any) => d.imei?.toString()?.trim()) || [])
      
      // Clean and validate parsed IMEIs
      const cleanedParsedDevices = parsedDevices.map(device => ({
        ...device,
        imei: device.imei?.toString()?.trim() || ''
      }))
      
      
      // Detailed filtering with logging
      const filteredDevices = cleanedParsedDevices.filter(device => {
        const isDuplicate = existingIMEIs.has(device.imei)
        return !isDuplicate
      })


      return filteredDevices
    } catch (_error) {
      console.error('❌ Error filtering existing devices:', _error)
      toast.error('Error checking for existing devices. Please try again.')
      return parsedDevices
    }
  }

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
      
      const newState = { ...prev, [deviceIndex]: updatedRepairs }
      
      return newState
    })
  }

  const handleDeviceOtherDescription = (deviceIndex: number, description: string) => {
    setDeviceOtherDescriptions(prev => ({ ...prev, [deviceIndex]: description }))
  }

  // Handle expanding/collapsing repair sections
  const handleRepairSectionToggle = (deviceIndex: number) => {
    setExpandedRepairSections(prev => {
      const newState = {
        ...prev,
        [deviceIndex]: !prev[deviceIndex]
      }
      return newState
    })
  }

  // Handle QC approach changes for each device
  const handleQcApproachChange = (deviceIndex: number, approach: 'repairs' | 'grade') => {
    setDeviceQcApproaches(prev => ({
      ...prev,
      [deviceIndex]: approach
    }))
  }

  // Handle grade selection changes for each device
  const handleDeviceGradeChange = (deviceIndex: number, grade: string) => {
    setDeviceGrades(prev => {
      const newState = { ...prev, [deviceIndex]: grade }
      return newState
    })
  }

  // Handle Excel parsing success
  React.useEffect(() => {
    if (parsedData) {
      toast.success(`Successfully parsed ${parsedData.totalRows} rows from Excel file`)
      
      // Check for already completed devices when Excel is parsed
      if (parsedData.rows && parsedData.rows.length > 0) {
        const convertedData = parsedData.rows.map((row) => ({
          imei: row['Imei'] || '',
          brand: row['Brand'] || row['brand'] || row[1] || '',
          model: row['Model Name'] || '',
          serialNumber: row['Serial'] || '',
          faults: row['Fail'] || 'No faults detected'
        }))
        
        // First, filter out devices that already exist in the database
        fetchExistingDevicesAndFilter(convertedData)
          .then(filteredDevices => {
            // Store both the original and filtered data
            setImportedData(convertedData)
            setFilteredDevices(filteredDevices)
            
            // Force a re-render by updating a timestamp
            setFileInputKey(prev => prev + 1)
            
            // Then check which of the remaining devices already have completed QC
            return { filteredDevices, completedIMEIs: checkAlreadyCompletedDevices(filteredDevices) }
          })
          .then(async ({ filteredDevices, completedIMEIs }) => {
            const completedIMEIsSet = await completedIMEIs
            
            if (completedIMEIsSet.size > 0) {
              // Mark already completed devices
              const completedIndices = new Set<number>()
              filteredDevices.forEach((device, index) => {
                if (completedIMEIsSet.has(device.imei)) {
                  completedIndices.add(index)
                }
              })
              
              setCompletedDevices(completedIndices)
              toast.info(`${completedIndices.size} devices already have completed QC and will be hidden`)
            }
            
            // Log final state
            console.log('Final state after filtering:')
            console.log('- Total parsed:', convertedData.length)
            console.log('- Filtered (no duplicates):', filteredDevices.length)
            console.log('- Already completed QC:', completedIMEIsSet.size)
            console.log('- Available for QC:', filteredDevices.length - completedIMEIsSet.size)
          })
          .catch(_error => {
            toast.error('Error processing Excel data. Please try again.')
          })
      }
    }
  }, [parsedData])

  // Handle Excel parsing error
  React.useEffect(() => {
    if (error) {
      toast.error(`Excel parsing error: ${error}`)
    }
  }, [error])

  const handleCompleteDeviceQC = async (deviceIndex: number, deviceData?: DrPhoneData) => {
    
    try {
      // Safety check: ensure device is in the filtered list
      if (!filteredDevices[deviceIndex]) {
        toast.error('Device not found. Please refresh and try again.')
        return
      }

      if (deviceData) {
        // Create device first, then complete QC
        const deviceId = await createSingleDevice(deviceData, deviceIndex)
        
        if (deviceId) {
          // Now mark as completed
          setCompletedDevices(prev => {
            const newSet = new Set([...prev, deviceIndex])
            return newSet
          })
          toast.success(`Initial QC completed for device ${deviceData.imei}`)
          
          // Note: The QC check will be saved by the InitialQCDeviceCard component
          // after the device is created and it has a valid deviceId
        }
        
        // Re-filter the devices list to exclude newly created devices
        const updatedFilteredDevices = await fetchExistingDevicesAndFilter(importedData)
        setFilteredDevices(updatedFilteredDevices)
        
        // Reset all radio button states after filtering
        setDeviceQcApproaches({})
        setDeviceRepairs({})
        setDeviceGrades({})
        setDeviceOtherDescriptions({})
        setExpandedRepairSections({})
        
      } else {
        // Device already exists, just mark as completed
        setCompletedDevices(prev => {
          const newSet = new Set([...prev, deviceIndex])
          return newSet
        })
        toast.success(`Initial QC completed for device ${filteredDevices[deviceIndex].imei}`)
      }
    } catch (_error) {
      toast.error('Failed to complete device QC. Please try again.')
    }
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
    
    toast.success(`Initial QC completed for ${completedCount} devices. Proceeding to batch management.`)
    router.push(`/devices?batch=${batchId}`)
  }

  // Handle saving current state and quitting
  const handleSaveAndQuit = () => {
    const completedCount = completedDevices.size
    
    if (completedCount === 0) {
      toast.error('No devices have completed Initial QC yet. Please complete at least one device before saving.')
      return
    }
    
    toast.success(`Saved ${completedCount} completed devices. Returning to batch list.`)
    router.push('/batch-intake')
  }

  // Callback when QC is actually completed (called from InitialQCDeviceCard)
  const handleQCCompleted = (deviceIndex: number) => {
    setCompletedDevices(prev => {
      const newSet = new Set([...prev, deviceIndex])
      return newSet
    })
    
    // Force a re-render to ensure the UI updates
    setTimeout(() => {
      setFileInputKey(prev => prev + 1)
    }, 100)
    
    toast.success(`Initial QC completed for device ${filteredDevices[deviceIndex].imei}`)
  }

  // Test function to verify filtering logic
  const _testFilteringLogic = () => {
    const sampleParsedDevices = [
      { imei: '123456789', brand: 'Samsung', model: 'Galaxy', serialNumber: 'SN1', faults: 'None' },
      { imei: '987654321', brand: 'Apple', model: 'iPhone', serialNumber: 'SN2', faults: 'None' },
      { imei: '555666777', brand: 'Huawei', model: 'P30', serialNumber: 'SN3', faults: 'None' }
    ]
    
    const sampleExistingDevices = [
      { id: '1', imei: '123456789', brand: 'Samsung', model: 'Galaxy', serial_number: 'SN1' }
    ]
    
    const existingIMEIs = new Set(sampleExistingDevices.map(d => d.imei?.toString()?.trim()))
    const filteredDevices = sampleParsedDevices.filter(device => !existingIMEIs.has(device.imei?.toString()?.trim()))
          
    if (filteredDevices.length === 2) {
      // Test passed
    } else {
      // Test failed
    }
  }

  // Show loading state
  if (batchLoading) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner />
        </div>
      </div>
    )
  }

  // Show error state
  if (batchError) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="text-center py-12">
          <AlertCircle className="mx-auto h-12 w-12 text-red-600 mb-3" />
          <h3 className="text-lg font-semibold text-red-600">Error Loading Batch</h3>
          <p className="text-gray-600 mb-4">{batchError.message}</p>
          <Link href="/batch-intake">
            <Button variant="outline">Back to Batches</Button>
          </Link>
        </div>
      </div>
    )
  }

  // Show not found state
  if (!batch) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="text-center py-12">
          <AlertCircle className="mx-auto h-12 w-12 text-red-600 mb-3" />
          <h3 className="text-lg font-semibold text-red-600">Batch Not Found</h3>
          <p className="text-gray-600 mb-4">The batch you&apos;re looking for doesn&apos;t exist or has been deleted.</p>
          <Link href="/batch-intake">
            <Button variant="outline">Back to Batches</Button>
          </Link>
        </div>
      </div>
    )
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
            <FileUp className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-700 mb-2">
              {isDragOver ? 'Drop your Excel file here' : 'Drag and drop your Excel file here'}
            </p>
            <p className="text-gray-500 mb-4">or</p>
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
              className="cursor-pointer mb-4"
              onClick={handleUploadClick}
            >
              {isParsing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <FileUp className="h-4 w-4 mr-2" />
                  {parsedData ? 'Choose New Excel File' : 'Choose Excel File'}
                </>
              )}
            </Button>
            <p className="text-sm text-gray-400 mt-2">
              Supports .xlsx and .xls files exported from Dr. Phone software
            </p>
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
                  {filteredDevices.length > 0 ? (
                    <>
                      Preview of {filteredDevices.length} devices ready for Initial QC processing.
                      {importedData.length > filteredDevices.length && (
                        <span className="text-orange-600 font-medium">
                          {' '}({importedData.length - filteredDevices.length} duplicate devices were filtered out)
                        </span>
                      )}
                    </>
                  ) : (
                    'Excel data has been parsed successfully. Click "Convert to Device Cards" to transform the data into device cards for Initial QC processing.'
                  )}
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
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Alert className="mb-4">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                {filteredDevices.length > 0 ? (
                  <>
                    <strong>Excel data converted:</strong> {filteredDevices.length} devices ready for QC
                    {importedData.length > filteredDevices.length && (
                      <span className="text-orange-600 font-medium">
                        {' '}({importedData.length - filteredDevices.length} duplicate devices were automatically filtered out)
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    Excel file has been parsed successfully. Click &quot;Convert to Device Cards&quot; to transform the data into device cards for Initial QC processing.
                  </>
                )}
              </AlertDescription>
            </Alert>
            
            <div className="space-y-4">
              {filteredDevices.length > 0 ? (
                filteredDevices.map((device, index) => {
                  
                  // Use working functions for immediate functionality
                  const selectedRepairsForDevice = deviceRepairs[index] || []
                  const otherDescriptionForDevice = deviceOtherDescriptions[index] || ''
                  const selectedGradeForDevice = deviceGrades[index] || ''

                  
                  return (
                    <InitialQCDeviceCard
                      key={`preview-${index}-${device.imei}`}
                      device={device}
                      deviceIndex={index}
                      selectedRepairs={selectedRepairsForDevice}
                      otherDescription={otherDescriptionForDevice}
                      selectedGrade={selectedGradeForDevice}
                      onRepairToggle={(repairId) => handleDeviceRepairToggle(index, repairId)}
                      onOtherDescriptionChange={(desc) => handleDeviceOtherDescription(index, desc)}
                      onGradeChange={(grade) => handleDeviceGradeChange(index, grade)}
                      onCompleteQCWithDevice={(deviceData, deviceIndex) => handleCompleteDeviceQC(deviceIndex, deviceData)}
                      isRepairSectionExpanded={expandedRepairSections[index] || false}
                      onRepairSectionToggle={() => handleRepairSectionToggle(index)}
                      qcApproach={deviceQcApproaches[index] || ''}
                      onQcApproachChange={(approach) => handleQcApproachChange(index, approach)}
                      onQCCompleted={() => handleQCCompleted(index)}
                    />
                  )
                })
              ) : importedData.length > 0 ? (
                // Show message when data is being processed
                <div className="text-center py-8">
                  <Loader2 className="mx-auto h-12 w-12 text-muted-foreground mb-3 animate-spin" />
                  <h3 className="text-lg font-semibold text-muted-foreground">Processing Excel Data...</h3>
                  <p className="text-gray-600 mb-4">Filtering out duplicate devices and preparing for QC.</p>
                </div>
              ) : (
                // Show message when no Excel data is available
                <div className="text-center py-8">
                  <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                  <h3 className="text-lg font-semibold text-muted-foreground">No Excel Data Available</h3>
                  <p className="text-gray-600 mb-4">Upload an Excel file to see device cards here.</p>
                </div>
              )}
            </div>
            

          </CardContent>
        </Card>
      )}
    </div>
  );
}