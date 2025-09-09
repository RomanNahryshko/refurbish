import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Supplier Management | ReMobile Refurbish',
  description: 'Manage suppliers for devices and spare parts',
}

export default function SuppliersLayout({
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