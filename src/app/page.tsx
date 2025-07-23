import { redirect } from 'next/navigation'

export default function Home() {
  // Redirect to dashboard as this is an internal ERP system
  redirect('/dashboard')
}
