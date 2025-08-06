import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Device Tracking | ReMobile Refurbish',
  description: 'Track and manage devices through the refurbishment process',
}

export default function DeviceTrackingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {children}
    </>
  )
}