import { Button } from "../ui/button";
import { Loader2 } from "lucide-react";
import { CheckCircle } from "lucide-react";

export default function CompleteButton({
  onClick,
  isSubmitting,
  disabled,
}: {
  onClick: () => void;
  isSubmitting: boolean;
  disabled: boolean;
}) {
  return (
    <div className="flex justify-end pt-3 border-t">
      <Button
        onClick={onClick}
        disabled={disabled || isSubmitting}
        className="bg-green-600 hover:bg-green-700"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <CheckCircle className="mr-2 h-4 w-4" />
            Complete Initial QC
          </>
        )}
      </Button>
    </div>
  );
}