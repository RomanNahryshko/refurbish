import { Suspense } from 'react'
import { LoginForm } from '@/components/auth/login-form'
import Image from 'next/image'

function LoginFormFallback() {
  return (
    <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
      <div className="bg-card text-card-foreground rounded-xl border shadow-sm p-6">
        <div className="flex flex-col space-y-2 text-center mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
          <p className="text-sm text-muted-foreground">
            Enter your email and password to sign in
          </p>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="h-screen flex min-h-[600px] items-center justify-center bg-gray-50">
      <div className="max-w-md h-full w-full space-y-8 p-8 flex flex-col justify-center">
        {/* Logo and Brand Section */}
        <div className="text-center">
          <div>
            <Image
              src="/logo_remobile.svg"
              alt="Remobile Logo"
              width={120}
              height={120}
              className="mx-auto mb-4"
            />
            <p className="text-lg text-gray-700 font-medium">Refurbish Workflow</p>
          </div>
        </div>

        {/* Login Section */}
        <div>
          <Suspense fallback={<LoginFormFallback />}>
            <LoginForm />
          </Suspense>
        </div>

        {/* Mission Statement at Bottom */}
        <div className="text-center mt-4 pt-3 border-t border-gray-200">
          <p className="text-sm text-gray-500 italic">
            &ldquo;Delivering refurbished phones that feel new&rdquo;
          </p>
        </div>
      </div>
    </div>
  )
} 