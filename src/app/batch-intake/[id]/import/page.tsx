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
import type { SupabaseClient } from '@supabase/supabase-js';
// Removed: Direct Supabase import - using hooks instead
import { useCreateRepairJob } from '@/lib/hooks/use-repair-jobs';
import { REPAIR_TYPE_MAP } from '@/lib/constants';
import { LegacyRepairType, RepairType, DrPhoneData } from '@/lib/types/business-types';
import {
  useFilterDevicesByExisting,
  useCompletedQCByDevices,
  useFindExistingDevice
} from '@/lib/hooks/use-device-import';
import { useDeviceImportState } from '@/lib/hooks/use-device-import-state';
import { ProductionMetricsClientService } from '@/lib/services/production-metrics-client-service';
import { useSupabaseClient } from '@/lib/stores/supabase-store';


// Using DrPhoneData from business types

// Type guard function to check if a string is a valid legacy repair type
function isLegacyRepairType(value: string): value is LegacyRepairType {
  return value in REPAIR_TYPE_MAP
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
  
  // Use custom hook for device import state management
  const {
    deviceRepairs,
    deviceOtherDescriptions,
    deviceGrades,
    expandedRepairSections,
    deviceQcApproaches,
    completedDevices: _completedDevices, // Not used anymore - cards handle their own completion state
    handleDeviceRepairToggle,
    handleDeviceOtherDescription,
    handleRepairSectionToggle,
    handleQcApproachChange,
    handleDeviceGradeChange,
    markDeviceCompleted: _markDeviceCompleted,
    resetAllStates: _resetAllStates,
    updateCompletedDevices,
  } = useDeviceImportState()
  const [isDragOver, setIsDragOver] = useState(false)
  const [fileInputKey, setFileInputKey] = useState(0)

  // Track when we're creating devices to prevent automatic refetches
  const [_isCreatingDevice, setIsCreatingDevice] = useState(false)
  
  // Store the count of devices that already exist in the system
  const [existingDevicesCount, setExistingDevicesCount] = useState(0)
  
  // Store device IDs for each device index
  const [deviceIds, setDeviceIds] = useState<Record<number, string>>({})
  
  const createDevicesFromImport = useCreateDevicesFromImport()
  const createRepairJob = useCreateRepairJob()
  const findExistingDevice = useFindExistingDevice()
  const supabase = useSupabaseClient()



  // Convert parsed data to DrPhoneData format
  const convertedData = React.useMemo(() => {
    if (!parsedData?.rows) return []
    
    const converted = parsedData.rows.map((row, _index) => {
      const imei = row['Imei'] || row['imei'] || row['IMEI'] || row['Imei Number'] || row['IMEI Number'] || ''
      const brand = row['Brand'] || row['brand'] || row['Brand Name'] || row['brand_name'] || row[1] || ''
      const model = row['Model Name'] || row['Model'] || row['model'] || row['Model Name'] || ''
      const serialNumber = row['Serial'] || row['serial'] || row['Serial Number'] || row['serial_number'] || ''
      const faults = row['Fail'] || row['fail'] || row['Faults'] || row['faults'] || row['Issues'] || 'No faults detected'
    
      
      return {
        imei: String(imei),
        device_info: {
          brand: String(brand),
          model: String(model)
        },
        serialNumber: String(serialNumber),
        faults: String(faults),
        notes: `Imported from Dr. Phone Excel file`
      } as DrPhoneData
    })
    
    
    // Filter out devices with empty IMEIs
    const validDevices = converted.filter(device => {
      const hasValidIMEI = device.imei && typeof device.imei === 'string' && device.imei.trim() !== ''
      if (!hasValidIMEI) {
        console.warn(`⚠️ Excel Parsing: Device with empty IMEI filtered out:`, device)
      }
      return hasValidIMEI
    })
    
    return validDevices
  }, [parsedData])

  // Use hooks to filter and check devices
  const { filteredDevices: hookFilteredDevices, existingCount } = useFilterDevicesByExisting(convertedData as DrPhoneData[])
  const { completedIMEIs } = useCompletedQCByDevices(hookFilteredDevices, createdDevices)
  
  // Use all devices - filtering is handled by individual card isCompleted state
  const filteredDevices = hookFilteredDevices

  
  // Function to create a single device when QC is completed
  const createSingleDevice = async (deviceData: DrPhoneData, deviceIndex: number, selectedRepairs: string[], otherDescription: string, selectedGrade: string, supabaseClient?: unknown) => {
    try {
      setIsCreatingDevice(true)
      
      // Validate device data before proceeding
      if (!deviceData?.imei || String(deviceData.imei).trim() === '') {
        throw new Error('Device IMEI is missing. Cannot create device.')
      }
      
      // Remove direct supabase usage - using hooks instead

      // Create device with status 'received' (according to schema)
      const deviceToCreate = {
        batch_id: batchId,
        imei: String(deviceData.imei),
        brand: deviceData.device_info?.brand || '',
        model: deviceData.device_info?.model || '',
        serial_number: String(deviceData.serialNumber),
        dr_phone_data: {
          faults: String(deviceData.faults),
          original_data: deviceData,
          required_repairs: selectedRepairs,
          other_repair_description: otherDescription
        },
        grade: selectedGrade || 'ungraded', // Use selected grade or default to 'ungraded'
        notes: `Imported from Dr. Phone Excel file`
      }
      
      const result = await createDevicesFromImport.mutateAsync([deviceToCreate])

      if (result && result.length > 0) {
        const createdDevice = result[0]
          
          // Create repair jobs for selected repairs
          if (selectedRepairs.length > 0) {
            try {
              for (const repairType of selectedRepairs) {
                // Map old values to new schema values (backward compatibility)
                if (!isLegacyRepairType(repairType)) {
                  continue
                }
                
                const mappedRepairType = REPAIR_TYPE_MAP[repairType]
                
                if (!mappedRepairType) {
                  continue
                }
                
                const repairJobData = {
                  device_id: createdDevice.id,
                  repair_type: mappedRepairType,
                  description: mappedRepairType === 'other' ? otherDescription : undefined
                }
                
                await createRepairJob.mutateAsync({
                  data: repairJobData,
                })
              }
              
              // Update production metrics immediately after creating repair jobs
              try {
                if (!supabaseClient || typeof supabaseClient !== 'object') {
                  throw new Error('Supabase client not available')
                }
                
                const productionMetricsService = new ProductionMetricsClientService(supabaseClient as unknown as SupabaseClient)
                await productionMetricsService.updateRepairMetrics(selectedRepairs as RepairType[])
                
              } catch (metricsError) {
                console.error('Failed to update production metrics:', metricsError)
              }
              
            } catch (error) {
              console.error(`❌ handleCompleteDeviceQC: Error creating repair jobs:`, error)
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
            imei: String(deviceData.imei),
            batchId: batchId
          })

          if (existingDevice) {
            // Add to createdDevices if not already there
            setCreatedDevices(prev => {
              if (!prev.find(d => d.id === existingDevice.id)) {
                return [...prev, { id: existingDevice.id, imei: String(deviceData.imei) }]
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
      
      // Check if any valid devices were found
      if (convertedData.length === 0) {
        toast.error('No valid devices found in Excel file. Please check that IMEI numbers are present.')
      } else if (convertedData.length < parsedData.totalRows) {
        toast.warning(`Found ${convertedData.length} valid devices out of ${parsedData.totalRows} rows. Some rows may have missing IMEI numbers.`)
      }
      
      // Force a re-render by updating a timestamp
      setFileInputKey(prev => prev + 1)
    }
  }, [parsedData, convertedData])

  // Update filtered devices when hook data changes
  React.useEffect(() => {
    if (hookFilteredDevices.length > 0) {

      setExistingDevicesCount(existingCount)
    }
  }, [hookFilteredDevices, existingCount])

  // Update completed devices when QC check data changes
  React.useEffect(() => {
    if (completedIMEIs.size > 0 && hookFilteredDevices.length > 0) {
      const completedIndices = new Set<number>()
      hookFilteredDevices.forEach((device, index) => {
        if (completedIMEIs.has(String(device.imei))) {
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

    const handleCompleteDeviceQC = async (deviceIndex: number, deviceData?: DrPhoneData): Promise<string | null> => {
    try {
      // Safety check: ensure device is in the filtered list
      if (!filteredDevices[deviceIndex]) {
        toast.error('Device not found. Please refresh and try again.')
        return null
      }

      if (deviceData) {
        // Create device first with status 'received' (according to schema)
        const deviceId = await createSingleDevice(deviceData, deviceIndex, deviceRepairs[deviceIndex] || [], deviceOtherDescriptions[deviceIndex] || '', deviceGrades[deviceIndex] || '', supabase)
        
        if (deviceId) {
          // Store the device ID for this device index
          setDeviceIds(prev => ({ ...prev, [deviceIndex]: deviceId }))
          
          // Don't mark as completed yet - let the QC process handle it
          toast.success(`Device ${deviceData.imei} created and ready for Initial QC`)
          
          // Return the deviceId so QC can proceed
          return deviceId
        } else {
          toast.error('Device creation failed. Please try again.')
          return null
        }
        
        
      } else {
        // Device already exists, handle repair jobs and metrics if needed
        const selectedRepairs = deviceRepairs[deviceIndex] || []
        const qcApproach = deviceQcApproaches[deviceIndex] || ''
        
        if (qcApproach === 'repairs' && selectedRepairs.length > 0) {
          try {
            // Get existing device ID from deviceIds state
            const existingDeviceId = deviceIds[deviceIndex]
            if (!existingDeviceId) {
              toast.error('Device ID not found. Please refresh and try again.')
              return null
            }
            
            // Create repair jobs for selected repairs
            for (const repairType of selectedRepairs) {
              await createRepairJob.mutateAsync({
                data: {
                  device_id: existingDeviceId,
                  repair_type: repairType as RepairType,
                  status: 'pending',
                  priority: 'medium',
                  notes: `Initial QC: ${repairType} required`,
                  estimated_hours: 2,
                  actual_hours: null
                }
              })
            }
            
            // Update production metrics for repairs
            try {
              if (supabase) {
                const productionMetricsService = new ProductionMetricsClientService(supabase)
                await productionMetricsService.updateRepairMetrics(selectedRepairs as RepairType[])
              }
            } catch (metricsError) {
              console.error('Failed to update production metrics:', metricsError)
            }
            
          } catch {
            toast.error('Failed to create repair jobs. Please try again.')
            return null
          }
        }
        
        // Mark as completed
        // Device completion is now handled by individual cards
        toast.success(`Initial QC completed for device ${filteredDevices[deviceIndex].imei}`)
        return null
      }
    } catch {
      toast.error('Failed to complete device QC. Please try again.')
      return null
    }
  }

  // Removed: Unused navigation functions


  // Callback when data is saved to table
  const handleSaveToTable = (_data: unknown) => {
    // Здесь можно добавить дополнительную логику если нужно
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
                filteredDevices.map((device, _index) => {
                  
                  // Use working functions for immediate functionality
                  const selectedRepairsForDevice = deviceRepairs[_index] || []
                  const otherDescriptionForDevice = deviceOtherDescriptions[_index] || ''
                  const selectedGradeForDevice = deviceGrades[_index] || ''

                  
                  const deviceId = deviceIds[_index]
                  
                  // If no deviceId exists for this device, create one
                  if (!deviceId) {
                    console.log(`🔍 No deviceId for device ${_index} (${device.imei}), creating device first`)
                    // This will trigger device creation and then QC
                    return (
                      <InitialQCDeviceCard
                        key={`preview-${_index}-${device.imei}`}
                        device={device}
                        deviceIndex={_index}
                        deviceId={undefined} // No deviceId yet
                        selectedRepairs={selectedRepairsForDevice}
                        otherDescription={otherDescriptionForDevice}
                        selectedGrade={selectedGradeForDevice}
                        onRepairToggle={(repairId) => handleDeviceRepairToggle(_index, repairId)}
                        onOtherDescriptionChange={(desc) => handleDeviceOtherDescription(_index, desc)}
                        onGradeChange={(grade) => handleDeviceGradeChange(_index, grade)}
                        onCompleteQCWithDevice={(deviceData, deviceIndex) => handleCompleteDeviceQC(deviceIndex, deviceData)}
                        isRepairSectionExpanded={expandedRepairSections[_index] || false}
                        onRepairSectionToggle={() => handleRepairSectionToggle(_index)}
                        qcApproach={deviceQcApproaches[_index] || 'repairs'}
                        onQcApproachChange={(approach) => handleQcApproachChange(_index, approach || 'repairs')}
                        onSaveToTable={handleSaveToTable}
                      />
                    )
                  }
                  
                  return (
                    <InitialQCDeviceCard
                      key={`preview-${_index}-${device.imei}`}
                      device={device}
                      deviceIndex={_index}
                      deviceId={deviceId} // Pass the device ID for this device
                      selectedRepairs={selectedRepairsForDevice}
                      otherDescription={otherDescriptionForDevice}
                      selectedGrade={selectedGradeForDevice}
                      onRepairToggle={(repairId) => handleDeviceRepairToggle(_index, repairId)}
                      onOtherDescriptionChange={(desc) => handleDeviceOtherDescription(_index, desc)}
                      onGradeChange={(grade) => handleDeviceGradeChange(_index, grade)}
                      onCompleteQCWithDevice={(deviceData, deviceIndex) => handleCompleteDeviceQC(deviceIndex, deviceData)}
                      isRepairSectionExpanded={expandedRepairSections[_index] || false}
                      onRepairSectionToggle={() => handleRepairSectionToggle(_index)}
                      qcApproach={deviceQcApproaches[_index] || 'repairs'}
                      onQcApproachChange={(approach) => handleQcApproachChange(_index, approach || 'repairs')}
                      onSaveToTable={handleSaveToTable}
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