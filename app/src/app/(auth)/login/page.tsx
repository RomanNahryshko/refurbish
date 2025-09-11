import { LoginForm } from '@/components/auth/login-form'
import Image from 'next/image'

export default function LoginPage() {
  return (
    <div className="h-full flex items-center justify-center bg-gray-50">
      <div className="max-w-md h-full w-full space-y-8 p-8">
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
          <LoginForm />
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