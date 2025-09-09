import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Inventory Management | ReMobile Refurbish',
  description: 'Manage spare parts inventory and stock levels',
}

export default function InventoryLayout({
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