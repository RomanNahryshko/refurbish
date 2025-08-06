import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Shipping | ReMobile Refurbish',
  description: 'Manage device shipping and logistics',
}

export default function ShippingLayout({
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