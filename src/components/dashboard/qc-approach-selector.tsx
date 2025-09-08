import { Award, Wrench } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Label } from "../ui/label";
import React from "react";

export default function QcApproachSelector({
  qcApproach,
  onQcApproachChange,
  deviceIndex,
}: {
  qcApproach: string;
  onQcApproachChange?: (value: 'repairs' | 'grade') => void;
  deviceIndex: number;
}) {
  return (
    <div className="border-t pt-3">
      <span className="text-sm font-medium text-muted-foreground">
        Initial QC Decision:
      </span>
      <RadioGroup
        value={qcApproach}
        onValueChange={(value) =>
          onQcApproachChange?.(value as 'repairs' | 'grade')
        }
        className="mt-2"
      >
        <div className="space-y-3">
          <RadioOption
            id={`repairs-${deviceIndex}`}
            value="repairs"
            icon={<Wrench className="h-4 w-4" />}
            label="Add Required Repairs"
          />
          <RadioOption
            id={`grade-${deviceIndex}`}
            value="grade"
            icon={<Award className="h-4 w-4" />}
            label="Assign Final Grade (No Repairs Needed)"
          />
        </div>
      </RadioGroup>
    </div>
  );
}


function RadioOption({
  id,
  value,
  icon,
  label,
}: {
  id: string;
  value: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div className="flex items-center space-x-3">
      <RadioGroupItem value={value} id={id} />
      <Label htmlFor={id} className="cursor-pointer">
        <div className="flex items-center gap-2">
          {icon}
          <span>{label}</span>
        </div>
      </Label>
    </div>
  );
}