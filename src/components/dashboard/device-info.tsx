import { DrPhoneData } from "@/lib/types/business-types";

export default function DeviceInfo({ device }: { device: DrPhoneData }) {
  return (
    <div className="grid md:grid-cols-3 gap-4">
      <InfoRow label="IMEI:" value={device.imei as string} mono />
      <InfoRow label="Model:" value={`${device.brand} ${device.model}`} />
      <InfoRow label="Serial:" value={device.serialNumber as string} mono />
    </div>
  );
}

function InfoRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <span className={mono ? 'font-mono text-sm' : ''}>{value}</span>
    </div>
  );
}