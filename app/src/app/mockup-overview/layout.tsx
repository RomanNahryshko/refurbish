import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mockup Overview | ReMobile Refurbish',
  description: 'Development mockup pages overview',
}

export default function MockupOverviewLayout({
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