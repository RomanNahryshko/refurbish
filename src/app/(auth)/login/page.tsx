import { LoginForm } from '@/components/auth/login-form'

export default function LoginPage() {
  return (
    <div className="container relative h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex">
        <div className="absolute inset-0 bg-primary-600" />
        <div className="relative z-20 flex items-center text-lg font-medium">
          <div className="h-8 w-8 rounded bg-white flex items-center justify-center text-primary-600 font-bold mr-2">
            R
          </div>
          ReMobile Refurbish
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg">
              {'"Streamline your phone refurbishment operations with our comprehensive management system."'}
            </p>
            <footer className="text-sm">Internal ERP System</footer>
          </blockquote>
        </div>
      </div>
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">Welcome Back</h1>
            <p className="text-sm text-muted-foreground">
              Sign in to your account
            </p>
          </div>
          <LoginForm />
        </div>
      </div>
    </div>
  )
} 