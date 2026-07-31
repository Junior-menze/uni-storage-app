'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Lock, Loader2, CheckCircle, ArrowLeft, X } from 'lucide-react'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) throw error

      setSuccess(true)
      setTimeout(() => {
        router.push('/auth')
      }, 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

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
            />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-display text-xl font-bold">Uni-Storage</span>
            <p className="text-[10px] text-muted-foreground">Your Belongings, Safely Stored</p>
          </div>
        </Link>

        <div className="bg-card/80 backdrop-blur-sm rounded-2xl shadow-2xl border p-8">
          <button
            onClick={() => router.push('/auth')}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition mb-6"
          >
            <ArrowLeft className="size-4" />
            Back to Sign In
          </button>

          <div className="text-center mb-8">
            <div className="size-16 rounded-full bg-brand/10 border-2 border-brand/20 flex items-center justify-center mx-auto mb-4">
              <Lock className="size-8 text-brand" />
            </div>
            <h1 className="font-display text-2xl font-bold">Reset Password</h1>
            <p className="text-muted-foreground text-sm mt-2">
              Enter your new password below.
            </p>
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive p-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          {success ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <CheckCircle className="size-8 text-green-500 mx-auto mb-2" />
              <p className="text-green-700 font-medium">Password reset successful!</p>
              <p className="text-sm text-green-600 mt-1">
                Redirecting to sign in...
              </p>
            </div>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground/80">
                  New Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="Enter new password (min 6 chars)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand transition"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground/80">
                  Confirm Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <input
                    type="password"
                    required
                    placeholder="Confirm your new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand transition"
                  />
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
                    Resetting...
                  </>
                ) : (
                  'Reset Password'
                )}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground/60 mt-6">
          <Link href="/auth" className="hover:text-foreground transition">
            Remember your password? Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}