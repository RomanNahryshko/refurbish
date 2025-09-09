import { Award } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Label } from "../ui/label";

export default function GradeBlock({
  selectedGrade,
  onGradeChange,
  deviceIndex,
}: {
  selectedGrade: string;
  onGradeChange?: (grade: string) => void;
  deviceIndex: number;
}) {
  const grades = [
    { value: 'A', color: 'green', label: 'Best' },
    { value: 'B', color: 'blue', label: 'Good' },
    { value: 'C', color: 'orange', label: 'Acceptable' },
  ];
  return (
    <div className="border rounded-lg p-3 bg-green-50">
      <div className="flex items-center gap-2 mb-3">
        <Award className="h-4 w-4" />
        <span className="font-medium">Assign Grade</span>
      </div>
      <RadioGroup
        value={selectedGrade}
        onValueChange={onGradeChange}
        className="grid grid-cols-3 gap-3"
      >
        {grades.map((g) => (
          <div
            key={g.value}
            className={`border rounded-lg p-3 cursor-pointer transition-all ${
              selectedGrade === g.value
                ? `border-${g.color}-500 bg-${g.color}-100 shadow-md`
                : `hover:bg-white hover:border-${g.color}-300`
            }`}
          >
            <RadioGroupItem
              value={g.value}
              id={`grade-${g.value}-${deviceIndex}`}
              className="sr-only"
            />
            <Label
              htmlFor={`grade-${g.value}-${deviceIndex}`}
              className="cursor-pointer w-full"
            >
              <div className="text-center">
                <div className={`text-xl font-bold text-${g.color}-600`}>
                  {g.value}
                </div>
                <div className="text-xs">{g.label}</div>
              </div>
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}