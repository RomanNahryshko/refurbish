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
// Removed: Direct Supabase import - using hooks instead
import { useCreateRepairJob } from '@/lib/hooks/use-repair-jobs';
import { REPAIR_TYPES } from '@/lib/constants';
import {
  useFilterDevicesByExisting,
  useCompletedQCByDevices,
  useFindExistingDevice
} from '@/lib/hooks/use-device-import';
import { useDeviceImportState } from '@/lib/hooks/use-device-import-state';

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
  const _router = useRouter() // Currently unused but may be needed for navigation
  const batchId = params.id as string
  
  // Get batch data with devices from API
  const { data: batch, isLoading: batchLoading, error: batchError } = useBatch(batchId)
  
  // Excel parser hook
  const { parsedData, isParsing, error, parseExcelFile, clearData } = useExcelParser()
  
  const [importedData, setImportedData] = useState<DrPhoneData[]>([])
  const [createdDevices, setCreatedDevices] = useState<Array<{ id: string; imei: string }>>([])
  // Store filtered devices (duplicates removed)
  const [filteredDevices, setFilteredDevices] = useState<DrPhoneData[]>([])
  
  // Use custom hook for device import state management
  const {
    deviceRepairs,
    deviceOtherDescriptions,
    deviceGrades,
    expandedRepairSections,
    deviceQcApproaches,
    completedDevices: _completedDevices, // Not used in template but needed for hook logic
    handleDeviceRepairToggle,
    handleDeviceOtherDescription,
    handleRepairSectionToggle,
    handleQcApproachChange,
    handleDeviceGradeChange,
    markDeviceCompleted,
    resetAllStates,
    updateCompletedDevices,
  } = useDeviceImportState()
  const [isDragOver, setIsDragOver] = useState(false)
  const [fileInputKey, setFileInputKey] = useState(0)

  // Track when we're creating devices to prevent automatic refetches
  const [_isCreatingDevice, setIsCreatingDevice] = useState(false)
  
  // Store the count of devices that already exist in the system
  const [existingDevicesCount, setExistingDevicesCount] = useState(0)
  
  const createDevicesFromImport = useCreateDevicesFromImport()
  const createRepairJob = useCreateRepairJob()
  const findExistingDevice = useFindExistingDevice()

  // Helper function to get current user ID - should be moved to a hook
  const getCurrentUserId = async (): Promise<string> => {
    const { createSupabaseClient: createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    if (supabase) {
      const { data: { user } } = await supabase.auth.getUser()
      return user?.id || 'unknown'
    }
    return 'unknown'
  }

  // Convert parsed data to DrPhoneData format
  const convertedData = React.useMemo(() => {
    if (!parsedData?.rows) return []
    
    return parsedData.rows.map((row) => ({
      imei: row['Imei'] || '',
      brand: row['Brand'] || row['brand'] || row[1] || '',
      model: row['Model Name'] || '',
      serialNumber: row['Serial'] || '',
      faults: row['Fail'] || 'No faults detected'
    }))
  }, [parsedData])

  // Use hooks to filter and check devices
  const { filteredDevices: hookFilteredDevices, existingCount } = useFilterDevicesByExisting(convertedData as DrPhoneData[])
  const { completedIMEIs } = useCompletedQCByDevices(hookFilteredDevices, createdDevices)

  
  // Function to create a single device when QC is completed
  const createSingleDevice = async (deviceData: DrPhoneData, deviceIndex: number, selectedRepairs: string[], otherDescription: string, selectedGrade: string) => {
    try {
      setIsCreatingDevice(true)
      
      // Remove direct supabase usage - using hooks instead

      // Create device with status 'received' (according to schema)
      const deviceToCreate = {
        batch_id: batchId,
        imei: deviceData.imei,
        brand: deviceData.brand,
        model: deviceData.model,
        serial_number: deviceData.serialNumber,
        dr_phone_data: {
          faults: deviceData.faults,
          original_data: deviceData,
          required_repairs: selectedRepairs,
          other_repair_description: otherDescription
        },
        grade: selectedGrade || 'ungraded', // Use selected grade or default to 'ungraded'
        notes: `Imported from Dr. Phone Excel file`
      }
      
      const result = await createDevicesFromImport.mutateAsync({
        batchId,
        devices: [deviceToCreate]
      })

              if (result && result.length > 0) {
          const createdDevice = result[0]
          
          // Create repair jobs for selected repairs
          if (selectedRepairs.length > 0) {
            try {
                             for (const repairType of selectedRepairs) {
                 // Map old values to new schema values (backward compatibility)
                 const repairTypeMap: Record<string, keyof typeof REPAIR_TYPES> = {
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
                   console.error(`Invalid repair type: ${repairType}`)
                   continue
                 }
                 
                 const repairJobData = {
                   device_id: createdDevice.id,
                   repair_type: mappedRepairType,
                   description: mappedRepairType === 'other' ? otherDescription : undefined
                 }
         
                 
                 await createRepairJob.mutateAsync({
                   data: repairJobData,
                   createdBy: await getCurrentUserId()
                 })
               }
            } catch (error) {
              console.error('Failed to create repair jobs:', error)
              // Continue even if repair jobs fail
            }
          }
          
          setCreatedDevices(prev => {
            const newState = [...prev, { id: createdDevice.id, imei: createdDevice.imei }]
            return newState
          })
          
          // Small delay to ensure state is updated before continuing
          await new Promise(resolve => setTimeout(resolve, 100))
          
          return createdDevice.id
        }

      return null
    } catch (error: unknown) {
      // Check if it's a duplicate IMEI error
      if ((error as Error)?.message?.includes('duplicate key') || (error as Error)?.message?.includes('already exists')) {
        
        try {
          // Device already exists, try to find it using the hook
          const existingDevice = await findExistingDevice.mutateAsync({
            imei: deviceData.imei,
            batchId: batchId
          })

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
          
          toast.error('Failed to create or find device. Please try again.')
          return null
        } catch {
          toast.error('Failed to create or find device. Please try again.')
          return null
        }
      }
      
      toast.error('Failed to create device. Please try again.')
      return null
    } finally {
      setIsCreatingDevice(false)
    }
  }

  // Removed: Functions replaced by hooks

      const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0]
      if (file) {
        // Clear previous data when new file is selected
        if (parsedData) {
          clearData()
          setExistingDevicesCount(0)
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
        } catch (error: unknown) {
          toast.error(`Failed to start file processing: ${(error as Error).message}`)
        }
      }
    } catch (error: unknown) {
      toast.error(`Error processing file upload: ${(error as Error).message}`)
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

  // Removed: Handler functions now provided by useDeviceImportState hook

  // Handle Excel parsing success
  React.useEffect(() => {
    if (parsedData) {
      toast.success(`Successfully parsed ${parsedData.totalRows} rows from Excel file`)
      
      // Store the imported data for processing
      setImportedData(convertedData as DrPhoneData[])
      
      // Force a re-render by updating a timestamp
      setFileInputKey(prev => prev + 1)
    }
  }, [parsedData, convertedData])

  // Update filtered devices when hook data changes
  React.useEffect(() => {
    if (hookFilteredDevices.length > 0) {
      setFilteredDevices(hookFilteredDevices)
      setExistingDevicesCount(existingCount)
    }
  }, [hookFilteredDevices, existingCount])

  // Update completed devices when QC check data changes
  React.useEffect(() => {
    if (completedIMEIs.size > 0 && hookFilteredDevices.length > 0) {
      const completedIndices = new Set<number>()
      hookFilteredDevices.forEach((device, index) => {
        if (completedIMEIs.has(device.imei)) {
          completedIndices.add(index)
        }
      })
      
      updateCompletedDevices(completedIndices)
      
      if (completedIndices.size > 0) {
        toast.info(`${completedIndices.size} devices already have completed QC and will be hidden`)
      }
    }
  }, [completedIMEIs, hookFilteredDevices, updateCompletedDevices])

  // Handle Excel parsing error
  React.useEffect(() => {
    if (error) {
      toast.error(`Excel parsing error: ${error}`)
    }
  }, [error])

  // Reset existing devices count when parsed data is cleared
  React.useEffect(() => {
    if (!parsedData) {
      setExistingDevicesCount(0)
    }
  }, [parsedData])

  const handleCompleteDeviceQC = async (deviceIndex: number, deviceData?: DrPhoneData) => {
    
    try {
      // Safety check: ensure device is in the filtered list
      if (!filteredDevices[deviceIndex]) {
        toast.error('Device not found. Please refresh and try again.')
        return
      }

      if (deviceData) {
        // Create device first with status 'received' (according to schema)
        const deviceId = await createSingleDevice(deviceData, deviceIndex, deviceRepairs[deviceIndex] || [], deviceOtherDescriptions[deviceIndex] || '', deviceGrades[deviceIndex] || '')

        
        
        if (deviceId) {
          // Now mark as completed
          markDeviceCompleted(deviceIndex)
          toast.success(`Device ${deviceData.imei} created and ready for Initial QC`)
          
          // Note: The QC check will be saved by the InitialQCDeviceCard component
          // after the device is created and it has a valid deviceId
        }
        
        // The filtered devices will be updated automatically by the hook
        
        // Reset all radio button states after filtering
        resetAllStates()
        
      } else {
        // Device already exists, just mark as completed
        markDeviceCompleted(deviceIndex)
        toast.success(`Initial QC completed for device ${filteredDevices[deviceIndex].imei}`)
      }
    } catch {
      toast.error('Failed to complete device QC. Please try again.')
    }
  }

  // Removed: Unused navigation functions

  // Callback when QC is actually completed (called from InitialQCDeviceCard)
  const handleQCCompleted = (deviceIndex: number) => {
    markDeviceCompleted(deviceIndex)
    
    // Force a re-render to ensure the UI updates
    setTimeout(() => {
      setFileInputKey(prev => prev + 1)
    }, 100)
    
    toast.success(`Initial QC completed for device ${filteredDevices[deviceIndex].imei}`)
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
                          {' '}({existingDevicesCount} devices from Excel already exist in the system)
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
                  setExistingDevicesCount(0)
                  
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
                    {existingDevicesCount > 0 && (
                      <span className="text-orange-600 font-medium">
                        {' '}({existingDevicesCount} devices from Excel already exist in the system)
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