import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Admin | ReMobile Refurbish',
  description: 'System administration and user management',
}

export default function AdminLayout({
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