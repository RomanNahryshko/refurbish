import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Phone Tracking | ReMobile Refurbish',
  description: 'Track phones by IMEI through the refurbishment process',
}

export default function PhoneTrackingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {children}
    </div>
  )
}