import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Batch Intake | ReMobile Refurbish',
  description: 'Register and manage incoming phone batches from suppliers',
}

export default function BatchIntakeLayout({
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