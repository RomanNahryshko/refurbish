import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Change Password | ReMobile Refurbish',
  description: 'Update your account password',
}

export default function ChangePasswordLayout({
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