'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { LogOut, Plus } from 'lucide-react'
import type { ReactNode } from 'react'

type Props = {
  children: ReactNode
  isAdmin?: boolean
  userEmail?: string | null
}

export function AppShell({ children, isAdmin, userEmail }: Props) {
  const router = useRouter()
  
  async function signOut() {
    await supabase.auth.signOut()
    router.push('/auth')
  }
  
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur sticky top-0 z-40">
        <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="relative size-8 rounded-lg overflow-hidden">
              <Image
                src="/images/logo.png"
                alt="Uni-Storage Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <span className="font-display text-lg font-bold">Uni-Storage</span>
          </Link>
          <nav className="flex items-center gap-1">
            <Link href="/dashboard" className="px-3 py-2 text-sm hover:bg-muted rounded-lg transition">
              Dashboard
            </Link>
            <Link href="/booking" className="flex items-center gap-1.5 px-3 py-2 text-sm hover:bg-muted rounded-lg transition">
              <Plus className="size-4" />
              New Booking
            </Link>
            {isAdmin && (
              <Link href="/admin" className="px-3 py-2 text-sm hover:bg-muted rounded-lg transition">
                Admin
              </Link>
            )}
            <span className="hidden sm:inline text-xs text-muted-foreground ml-2 mr-1">{userEmail}</span>
            <button
              onClick={signOut}
              className="flex items-center gap-1 px-3 py-2 text-sm border rounded-lg hover:bg-muted/50 transition"
            >
              <LogOut className="size-4" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  )
}