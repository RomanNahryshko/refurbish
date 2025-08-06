import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Repair Jobs | ReMobile Refurbish',
  description: 'Manage repair tasks and technician assignments',
}

export default function RepairJobsLayout({
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