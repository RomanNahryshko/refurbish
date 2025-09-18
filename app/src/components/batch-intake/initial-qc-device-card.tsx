'use client';;
import { useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { useCreateQCCheck } from '@/lib/hooks/use-qc-checks';
import { toast } from 'sonner';
import { RepairType, DrPhoneData, QCCheck } from '@/lib/types/business-types';
import { TEST_RESULT, DEVICE_GRADES } from '@/lib/constants';
import DeviceInfo from '../dashboard/device-info';
import DeviceFaults from '../dashboard/device-faults';
import QcApproachSelector from '../dashboard/qc-approach-selector';
import RepairsBlock from '../dashboard/repair-blocl';
import GradeBlock from '../dashboard/grade-block';
import CompleteButton from '../common/complete-button';
import { ConfirmationDialog } from '../common/confirmation-dialog';

const REPAIR_LABELS: Record<string, string> = {
  housing_change: 'Housing Change',
  screen_change: 'Screen Change',
  battery_change: 'Battery Change',
  software_update: 'Software Update',
  glass_change: 'Glass Change',
  other: 'Other',
};

const getRepairLabel = (repairId: string) => REPAIR_LABELS[repairId] || repairId;

interface InitialQCDeviceCardProps {
  device: DrPhoneData;
  deviceIndex: number;
  deviceId?: string;
  selectedRepairs: string[];
  otherDescription: string;
  selectedGrade?: string;
  onRepairToggle: (repairId: string) => void;
  onOtherDescriptionChange: (description: string) => void;
  onGradeChange?: (grade: string) => void;
  onRepairSectionToggle?: () => void;
  isRepairSectionExpanded?: boolean;
  qcApproach?: 'repairs' | 'grade' | '';
  onQcApproachChange?: (approach: 'repairs' | 'grade' | '') => void;
  onCompleteQCWithDevice?: (
    deviceData: DrPhoneData,
    deviceIndex: number
  ) => Promise<string | null>;
  onSaveToTable?: (data: { data: QCCheck; message: string; repair_jobs_created: number }) => void;
}

export function InitialQCDeviceCard(props: InitialQCDeviceCardProps) {
  const {
    device,
    deviceIndex,
    deviceId: _deviceId, // Not used - always create new device
    selectedRepairs,
    otherDescription,
    selectedGrade = '',
    onRepairToggle,
    onOtherDescriptionChange,
    onGradeChange,
    onRepairSectionToggle,
    isRepairSectionExpanded = false,
    qcApproach = '',
    onQcApproachChange,
    onCompleteQCWithDevice,
    onSaveToTable,
  } = props;


  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [localDeviceId, setLocalDeviceId] = useState<string | undefined>(undefined);


  const createQCCheck = useCreateQCCheck();

  const prepareQCData = useCallback(() => {
    return {
      device_id: localDeviceId!,
      check_type: 'initial' as const,
      overall_result: qcApproach === 'repairs' ? TEST_RESULT.fail : TEST_RESULT.pass,
      grade_assigned:
        qcApproach === 'grade' ? (selectedGrade as keyof typeof DEVICE_GRADES) : undefined,
      notes:
        qcApproach === 'repairs'
          ? `Initial QC: Repairs required. Selected repairs: ${selectedRepairs
              .map(getRepairLabel)
              .join(', ')}${
              otherDescription ? ` ${otherDescription}` : ''
            }`
          : `Initial QC: Grade assigned. Grade: ${selectedGrade}`,
      required_repairs:
        qcApproach === 'repairs'
          ? (selectedRepairs as RepairType[])
          : undefined,
    };
  }, [localDeviceId, qcApproach, selectedGrade, selectedRepairs, otherDescription]);

  const saveQCData = useCallback(async () => {
    try {
      setIsSubmitting(true);

      // Always create a new device and clear states before creating
      // Clear all states first
      onQcApproachChange?.('');
      onGradeChange?.('');
      selectedRepairs.forEach((repair) => onRepairToggle(repair));
      onOtherDescriptionChange('');
      setLocalDeviceId(undefined);
      
      if (!onCompleteQCWithDevice) {
        toast.error('Device ID missing');
        setIsSubmitting(false);
        return;
      }
      
      const newDeviceId = await onCompleteQCWithDevice(device, deviceIndex);
      if (!newDeviceId) {
        toast.error('Failed to create device');
        setIsSubmitting(false);
        return;
      }
      
      const currentDeviceId = newDeviceId;
      setLocalDeviceId(newDeviceId);

      const qcData = { ...prepareQCData(), device_id: currentDeviceId };

      const result = await createQCCheck.mutateAsync({ qcData });

      onSaveToTable?.(result);

      setIsCompleted(true);
      toast.success('QC completed successfully');

    } catch (error) {
      console.error('Error saving QC data:', error);
      toast.error('Failed to save QC data');
    } finally {
      setIsSubmitting(false);
    }
  }, [
    device,
    deviceIndex,
    createQCCheck,
    prepareQCData,
    onCompleteQCWithDevice,
    onSaveToTable,
    onQcApproachChange,
    onGradeChange,
    onRepairToggle,
    onOtherDescriptionChange,
    selectedRepairs,
  ]);

  const handleCompleteQC = () => {
    if (!qcApproach) return toast.error('Select QC approach');
    if (qcApproach === 'repairs' && selectedRepairs.length === 0)
      return toast.error('Select at least one repair');
    if (qcApproach === 'grade' && !selectedGrade)
      return toast.error('Assign a grade');
    setShowConfirmation(true);
  };

  const handleConfirmQC = async () => {
    setShowConfirmation(false);
    saveQCData();
  };

  if (isCompleted) return null;

  return (
    <Card className="p-4 space-y-4">
      <DeviceInfo device={device} />
      <DeviceFaults faults={device.faults as string || ''} />
      <QcApproachSelector
        qcApproach={qcApproach}
        onQcApproachChange={onQcApproachChange}
        deviceIndex={deviceIndex}
      />
      {qcApproach === 'repairs' && (
        <RepairsBlock
          selectedRepairs={selectedRepairs}
          isExpanded={isRepairSectionExpanded}
          onToggle={onRepairSectionToggle}
          onRepairToggle={onRepairToggle}
          otherDescription={otherDescription}
          onOtherDescriptionChange={onOtherDescriptionChange}
        />
      )}
      {qcApproach === 'grade' && (
        <GradeBlock
          selectedGrade={selectedGrade}
          onGradeChange={onGradeChange}
          deviceIndex={deviceIndex}
        />
      )}
      <CompleteButton
        onClick={handleCompleteQC}
        isSubmitting={isSubmitting}
        disabled={!qcApproach}
      />
      <ConfirmationDialog
        open={showConfirmation}
        onOpenChange={setShowConfirmation}
        onConfirm={handleConfirmQC}
        title="Complete QC Check"
        description={`Are you sure you want to complete this QC check?`}
        isLoading={isSubmitting}
      />
    </Card>
  );
}

