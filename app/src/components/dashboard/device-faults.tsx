import { Badge } from "../ui/badge";

export default function DeviceFaults({ faults }: { faults: string }) {
  const faultList = faults ? faults.split(',') : [];
  return (
    <div>
      <span className="text-sm font-medium text-muted-foreground">
        Detected Faults:
      </span>
      <div className="mt-2 space-y-1">
        {faultList.length > 0 ? (
          faultList.map((fault, i) => (
            <Badge key={i} variant="secondary" className="mr-2">
              {fault}
            </Badge>
          ))
        ) : (
          <span className="text-sm text-muted-foreground">
            No faults detected
          </span>
        )}
      </div>
    </div>
  );
}