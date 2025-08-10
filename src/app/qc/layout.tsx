import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Quality Control | ReMobile Refurbish',
  description: 'Final quality control and device grading',
}

export default function QualityControlLayout({
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