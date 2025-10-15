import { DrPhoneData } from "@/lib/types/business-types";
import { requiresBatteryChange, getBatteryChangeReason } from "@/lib/helpers/battery-health-utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Battery, AlertTriangle } from "lucide-react";

export default function DeviceInfo({ device }: { device: DrPhoneData }) {
  const batteryHealth = device.diagnostic_results?.battery_health;
  const needsBatteryChange = requiresBatteryChange(device);
  const batteryChangeReason = getBatteryChangeReason(device);
  
  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-3 gap-4">
        <InfoRow label="IMEI:" value={device.imei as string} mono />
        <InfoRow label="Model:" value={`${device.device_info?.brand} ${device.device_info?.model}`} />
        <InfoRow label="Serial:" value={device.serialNumber as string} mono />
        {batteryHealth !== undefined && (
          <InfoRow 
            label="Battery Health:" 
            value={`${batteryHealth}%`}
            className={batteryHealth < 92 ? "text-orange-600 font-medium" : "text-green-600"}
          />
        )}
        {batteryHealth === undefined && (
          <InfoRow 
            label="Battery Health:" 
            value="Unknown"
            className="text-muted-foreground"
          />
        )}
      </div>
      
      {needsBatteryChange && batteryChangeReason && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <div className="flex items-center gap-2">
              <Battery className="h-4 w-4" />
              <span className="font-medium">Battery Change Required:</span>
              <span>{batteryChangeReason}</span>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

function InfoRow({
  label,
  value,
  mono,
  className,
}: {
  label: string;
  value: string;
  mono?: boolean;
  className?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <span className={`${mono ? 'font-mono text-sm' : ''} ${className || ''}`}>{value}</span>
    </div>
  );
}