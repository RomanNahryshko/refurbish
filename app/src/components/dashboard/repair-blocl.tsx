import { ChevronDown, ChevronUp, Wrench } from "lucide-react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { RepairTaskSelector } from "../common/repair-task-selector";

export default function RepairsBlock({
  selectedRepairs,
  isExpanded,
  onToggle,
  onRepairToggle,
  otherDescription,
  onOtherDescriptionChange,
}: {
  selectedRepairs: string[];
  isExpanded: boolean;
  onToggle?: () => void;
  onRepairToggle: (repairId: string) => void;
  otherDescription: string;
  onOtherDescriptionChange: (desc: string) => void;
}) {
  return (
    <div className="border rounded-lg p-3 bg-orange-50">
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggle}
        className="w-full justify-between"
      >
        <span className="flex items-center gap-2">
          <Wrench className="h-4 w-4" />
          Required Repairs
          {selectedRepairs.length > 0 && (
            <Badge variant="outline" className="ml-2">
              {selectedRepairs.length} selected
            </Badge>
          )}
        </span>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </Button>
      {isExpanded && (
        <div className="mt-3">
          <RepairTaskSelector
            title=""
            description=""
            selectedRepairs={selectedRepairs}
            otherDescription={otherDescription}
            onRepairToggle={onRepairToggle}
            onOtherDescriptionChange={onOtherDescriptionChange}
            showCard={false}
            className="pl-4"
          />
        </div>
      )}
    </div>
  );
}       