'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { 
  Mail, Lock, User, ArrowRight, Loader2, 
  CheckCircle, X, Sparkles, KeyRound, ArrowLeft,
  Eye, EyeOff, Phone, GraduationCap, MapPin
} from 'lucide-react'

export default function AuthPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [studentNumber, setStudentNumber] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [campus, setCampus] = useState('UMP')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetSent, setResetSent] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const [emailExists, setEmailExists] = useState<boolean | null>(null)
  const [checkingEmail, setCheckingEmail] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Helper function to redirect based on role
  async function redirectBasedOnRole(userId: string) {
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single()
      
      if (profileError) {
        console.log('Profile not found, redirecting to dashboard to create one')
        window.location.href = '/dashboard'
        return
      }
      
      if (profile?.role === 'admin') {
        window.location.href = '/admin'
      } else {
        window.location.href = '/dashboard'
      }
    } catch (error) {
      console.error('Error checking role:', error)
      window.location.href = '/dashboard'
    }
  }

  // Check if email exists in auth users
  async function checkEmailExists(email: string): Promise<boolean> {
    try {
      setCheckingEmail(true)
      
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email,
        password: 'dummy_password_that_will_fail'
      })
      
      if (signInError?.message?.includes('Invalid login credentials')) {
        return true
      } else if (signInError?.message?.includes('User not found')) {
        return false
      }
      
      return true
    } catch (error) {
      console.error('Error checking email:', error)
      return false
    } finally {
      setCheckingEmail(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (mode === 'signup') {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            data: { 
              full_name: fullName,
              student_number: studentNumber,
              phone_number: phoneNumber,
              campus: campus
            },
          },
        })
        if (signUpError) {
          if (signUpError.message?.includes('rate limit')) {
            setError('Too many signup attempts. Please wait a few minutes and try again.')
          } else {
            throw signUpError
          }
          setLoading(false)
          return
        }
        
        if (data.user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              full_name: fullName,
              student_number: studentNumber || `STU${Date.now().toString().slice(-6)}`,
              campus: campus,
              phone_number: phoneNumber, // Required field
              role: 'student'
            })
          
          if (profileError) {
            console.error('Profile creation error:', profileError)
          }
        }
        
        setUserEmail(email)
        setShowSuccessModal(true)
        setLoading(false)
        
        setPassword('')
        setFullName('')
        setStudentNumber('')
        setPhoneNumber('')
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          await redirectBasedOnRole(user.id)
        } else {
          window.location.href = '/dashboard'
        }
        return
      }
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  async function handleGoogleSignIn() {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

async function handleForgotPassword(e: React.FormEvent) {
  e.preventDefault()
  setResetLoading(true)
  setError('')
  setEmailExists(null)

  try {
    const exists = await checkEmailExists(resetEmail)
    setEmailExists(exists)

    if (!exists) {
      setError('No account found with this email address. Please check and try again.')
      setResetLoading(false)
      return
    }

    // Use the production URL from environment variables
    const redirectUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://uni-storage-app.vercel.app'
    
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${redirectUrl}/auth/reset-password`,
    })
    
    if (error) throw error
    
    setResetSent(true)
    setError('')
    
    setTimeout(() => {
      setShowForgotPassword(false)
      setResetSent(false)
      setResetEmail('')
      setEmailExists(null)
    }, 3000)
  } catch (err: any) {
    setError(err.message || 'Failed to send reset link. Please try again.')
  } finally {
    setResetLoading(false)
  }
}

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setResetEmail(e.target.value)
    setEmailExists(null)
    setError('')
  }

  if (showForgotPassword) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center px-4 py-12">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-brand/5 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-brand-2/5 rounded-full blur-3xl"></div>
        </div>

        <div className="w-full max-w-md relative z-10">
          <Link href="/" className="flex items-center gap-2 justify-center mb-8 group">
            <div className="relative size-10 rounded-xl overflow-hidden shadow-lg shadow-brand/20 group-hover:scale-105 transition-transform flex-shrink-0">
              <Image
                src="/images/logo.jpg"
                alt="Uni-Storage Logo"
                fill
                className="object-contain"
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-display text-xl font-bold">Uni-Storage</span>
              <p className="text-[10px] text-muted-foreground">Your Belongings, Safely Stored</p>
            </div>
          </Link>

          <div className="bg-card/80 backdrop-blur-sm rounded-2xl shadow-2xl border p-8">
            <button
              onClick={() => {
                setShowForgotPassword(false)
                setError('')
                setResetEmail('')
                setEmailExists(null)
                setResetSent(false)
              }}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition mb-6"
            >
              <ArrowLeft className="size-4" />
              Back to Sign In
            </button>

            <div className="text-center mb-8">
              <div className="size-16 rounded-full bg-brand/10 border-2 border-brand/20 flex items-center justify-center mx-auto mb-4">
                <KeyRound className="size-8 text-brand" />
              </div>
              <h1 className="font-display text-2xl font-bold">Reset Password</h1>
              <p className="text-muted-foreground text-sm mt-2">
                Enter your email address and we'll send you a link to reset your password.
              </p>
            </div>

            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive p-3 rounded-lg mb-4 text-sm">
                {error}
              </div>
            )}

            {resetSent ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <CheckCircle className="size-8 text-green-500 mx-auto mb-2" />
                <p className="text-green-700 font-medium">Reset link sent!</p>
                <p className="text-sm text-green-600 mt-1">
                  Check your email for the password reset link.
                </p>
                <p className="text-xs text-green-500 mt-2">
                  Redirecting...
                </p>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground/80">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <input
                      type="email"
                      required
                      placeholder="you@example.com"
                      value={resetEmail}
                      onChange={handleEmailChange}
                      className={`w-full pl-10 pr-4 py-2.5 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand transition ${
                        emailExists === false 
                          ? 'border-red-500 focus:ring-red-500' 
                          : emailExists === true 
                          ? 'border-green-500 focus:ring-green-500' 
                          : 'border-input'
                      }`}
                    />
                    {checkingEmail && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 animate-spin text-muted-foreground" />
                    )}
                    {emailExists === true && resetEmail && (
                      <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-green-500" />
                    )}
                    {emailExists === false && resetEmail && (
                      <X className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-red-500" />
                    )}
                  </div>
                  {emailExists === false && resetEmail && (
                    <p className="text-xs text-red-500 mt-1">
                      No account found with this email address.
                    </p>
                  )}
                  {emailExists === true && resetEmail && (
                    <p className="text-xs text-green-500 mt-1">
                      Email found! You can reset your password.
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={resetLoading || checkingEmail || emailExists === false || !resetEmail}
                  className="w-full bg-brand text-brand-foreground py-3 rounded-lg font-medium hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {resetLoading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      Send Reset Link
                      <ArrowRight className="size-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          <p className="text-center text-xs text-muted-foreground/60 mt-6">
            Remember your password?{' '}
            <button
              onClick={() => {
                setShowForgotPassword(false)
                setError('')
                setResetEmail('')
                setEmailExists(null)
              }}
              className="text-brand hover:underline"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center px-4 py-12">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-brand/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-brand-2/5 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 justify-center mb-8 group">
          <div className="relative size-10 rounded-xl overflow-hidden shadow-lg shadow-brand/20 group-hover:scale-105 transition-transform flex-shrink-0">
            <Image
              src="/images/logo.jpg"
              alt="Uni-Storage Logo"
              fill
              className="object-contain"
              priority
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-display text-xl font-bold">Uni-Storage</span>
            <p className="text-[10px] text-muted-foreground">Your Belongings, Safely Stored</p>
          </div>
        </Link>
        
        {/* Auth Card */}
        <div className="bg-card/80 backdrop-blur-sm rounded-2xl shadow-2xl border p-8">
          <div className="text-center mb-8">
            <h1 className="font-display text-2xl font-bold">Welcome</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {mode === 'signin' 
                ? 'Sign in to manage your storage' 
                : 'Create your account and get started'}
            </p>
          </div>
          
          {/* Error Display */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive p-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          {/* Google Sign In */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white dark:bg-card border border-border rounded-lg px-4 py-3 hover:bg-muted/50 transition disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            <span className="text-sm font-medium">Continue with Google</span>
          </button>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-card px-3 text-xs text-muted-foreground">OR</span>
            </div>
          </div>

          {/* Mode Toggle */}
          <div className="flex gap-2 mb-6 bg-muted/30 rounded-lg p-1">
            <button
              onClick={() => setMode('signin')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                mode === 'signin' 
                  ? 'bg-brand text-brand-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setMode('signup')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                mode === 'signup' 
                  ? 'bg-brand text-brand-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Auth Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground/80">
                    Full name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. John Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand transition"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground/80">
                    Student Number *
                  </label>
                  <div className="relative">
                    <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. 202412345"
                      value={studentNumber}
                      onChange={(e) => setStudentNumber(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand transition"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground/80">
                    Phone Number *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 0821234567"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand transition"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground/80">
                    Campus *
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <select
                      required
                      value={campus}
                      onChange={(e) => setCampus(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand transition appearance-none"
                    >
                      <option value="UMP">University of Mpumalanga</option>
                      <option value="TUT Nelspruit">TUT Nelspruit</option>
                    </select>
                  </div>
                </div>
              </>
            )}
            
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground/80">
                Email address *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand transition"
                />
              </div>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground/80">
                Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  placeholder={mode === 'signin' ? 'Enter your password' : 'Create a password (min 6 chars)'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-2.5 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand text-brand-foreground py-3 rounded-lg font-medium hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  {mode === 'signin' ? 'Signing in...' : 'Creating account...'}
                </>
              ) : (
                <>
                  {mode === 'signin' ? 'Sign in' : 'Create account'}
                  <ArrowRight className="size-4" />
                </>
              )}
            </button>
          </form>

          {/* Forgot Password Link */}
          <div className="mt-4 text-center">
            <button
              onClick={() => setShowForgotPassword(true)}
              className="text-sm text-muted-foreground hover:text-brand transition"
            >
              Forgot password?
            </button>
          </div>

          {/* Footer Links */}
          <div className="mt-6 text-center">
            <p className="text-xs text-muted-foreground">
              {mode === 'signin' ? (
                <>
                  Don't have an account?{' '}
                  <button
                    onClick={() => setMode('signup')}
                    className="text-brand font-medium hover:underline"
                  >
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button
                    onClick={() => setMode('signin')}
                    className="text-brand font-medium hover:underline"
                  >
                    Sign in
                  </button>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground/60 mt-6">
          By continuing, you agree to our{' '}
          <a href="#" className="hover:text-foreground transition">Terms</a>
          {' '}and{' '}
          <a href="#" className="hover:text-foreground transition">Privacy Policy</a>
        </p>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              setShowSuccessModal(false)
              setMode('signin')
            }}
          />
          
          <div className="relative bg-card rounded-2xl shadow-2xl max-w-md w-full p-8 animate-in fade-in zoom-in duration-300">
            <button
              onClick={() => {
                setShowSuccessModal(false)
                setMode('signin')
              }}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition"
            >
              <X className="size-5" />
            </button>

            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl animate-pulse"></div>
                <div className="relative size-20 rounded-full bg-green-500/10 border-2 border-green-500 flex items-center justify-center">
                  <CheckCircle className="size-10 text-green-500" />
                </div>
              </div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <h2 className="font-display text-2xl font-bold">Account Created! 🎉</h2>
              </div>
              
              <p className="text-muted-foreground text-sm mb-2">
                {`We've sent a confirmation email to:`}
              </p>
              <p className="font-medium text-foreground bg-muted/30 px-4 py-2 rounded-lg inline-block mb-4">
                {userEmail}
              </p>
              <p className="text-sm text-muted-foreground">
                Please check your inbox and click the confirmation link to activate your account.
              </p>
              
              <div className="mt-6 flex flex-col gap-3">
                <button
                  onClick={() => {
                    setShowSuccessModal(false)
                    setMode('signin')
                  }}
                  className="w-full bg-brand text-brand-foreground py-2.5 rounded-lg font-medium hover:opacity-90 transition"
                >
                  Got it! Go to Sign In
                </button>
                <button
                  onClick={() => {
                    setShowSuccessModal(false)
                    router.push('/')
                  }}
                  className="w-full text-sm text-muted-foreground hover:text-foreground transition"
                >
                  Return to Home →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}