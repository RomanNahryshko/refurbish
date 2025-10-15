import { BATTERY_HEALTH_THRESHOLD, REPAIR_TYPES } from '../constants'
import { DrPhoneData } from '../types/business-types'

/**
 * Determines if a device requires battery change based on battery health
 * @param device - The device data from Excel import
 * @returns boolean - true if battery change is required
 */
export function requiresBatteryChange(device: DrPhoneData): boolean {
  const batteryHealth = device.diagnostic_results?.battery_health
  
  if (batteryHealth === undefined || batteryHealth === null) {
    return false // Unknown battery health - no auto-selection
  }
  
  return batteryHealth < BATTERY_HEALTH_THRESHOLD
}

/**
 * Gets the initial QC approach for a device based on battery health
 * @param device - The device data from Excel import
 * @returns 'repairs' | 'grade' | '' - the initial QC approach
 */
export function getInitialQcApproach(device: DrPhoneData): 'repairs' | 'grade' | '' {
  if (requiresBatteryChange(device)) {
    return 'repairs' // Devices with low battery health go to repairs path
  }
  
  return '' // Let user choose for devices with good/unknown battery health
}

/**
 * Gets the initial repair selections for a device based on battery health
 * @param device - The device data from Excel import
 * @returns string[] - array of repair IDs that should be pre-selected
 */
export function getInitialRepairSelections(device: DrPhoneData): string[] {
  if (requiresBatteryChange(device)) {
    return [REPAIR_TYPES.battery_change] // Pre-select battery change
  }
  
  return [] // No pre-selections for devices with good/unknown battery health
}

/**
 * Gets a user-friendly message explaining why battery change is required
 * @param device - The device data from Excel import
 * @returns string | null - explanation message or null if not required
 */
export function getBatteryChangeReason(device: DrPhoneData): string | null {
  const batteryHealth = device.diagnostic_results?.battery_health
  
  if (batteryHealth !== undefined && batteryHealth < BATTERY_HEALTH_THRESHOLD) {
    return `Battery Health is ${batteryHealth}% (below ${BATTERY_HEALTH_THRESHOLD}% threshold)`
  }
  
  return null
}
