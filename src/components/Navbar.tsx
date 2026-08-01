'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Menu, X, LogOut, User as UserIcon, Home, Package, Calendar } from 'lucide-react'
import { User } from '@supabase/supabase-js'

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: string, session: any) => {
        setUser(session?.user ?? null)
      }
    )

    // Handle scroll effect
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => {
      subscription.unsubscribe()
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    setShowLogoutModal(false)
    window.location.href = '/'
  }

  // Close mobile menu on window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsOpen(false)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-card/95 backdrop-blur-md shadow-sm border-b border-border' : 'bg-card/80 backdrop-blur-sm'
      }`}>
        <div className="container-custom">
          <div className="flex justify-between items-center h-14 sm:h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
              <div className="relative size-7 sm:size-8 rounded-lg overflow-hidden">
                <Image
                  src="/images/logo.jpg"
                  alt="Uni-Storage Logo"
                  fill
                  className="object-contain"
                  priority
                  sizes="32px"
                />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="font-display text-sm sm:text-base font-bold">Uni-Storage</span>
                <span className="text-[8px] sm:text-[9px] text-muted-foreground hidden xs:block">
                  Your Belongings, Safely Stored
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1 lg:gap-2">
              <Link href="/#pricing" className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition">
                Pricing
              </Link>
            <Link href="/#how-it-works" className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition">
                How it works
            </Link>
              
              {user ? (
                <>
                  <Link href="/dashboard" className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition">
                    Dashboard
                  </Link>
                  <button
                    onClick={() => setShowLogoutModal(true)}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition"
                  >
                    <LogOut className="size-4" />
                    <span className="hidden lg:inline">Sign out</span>
                  </button>
                </>
              ) : (
                <Link href="/auth" className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition">
                  Sign in
                </Link>
              )}
              
              <Link
                href={user ? "/booking" : "/auth"}
                className="ml-2 bg-brand text-brand-foreground px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:opacity-90 transition text-xs sm:text-sm whitespace-nowrap"
              >
                Book now
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden text-muted-foreground hover:text-foreground p-2 rounded-lg hover:bg-muted/50 transition touch-target"
              aria-label={isOpen ? 'Close menu' : 'Open menu'}
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile Navigation */}
          <div
            className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
              isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
            <div className="pb-4 space-y-1 border-t border-border pt-4">
              <Link
                href="/#pricing"
                className="flex items-center gap-3 px-3 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition touch-target"
                onClick={() => setIsOpen(false)}
              >
                <Calendar className="size-4" />
                Pricing
              </Link>
              <Link
                href="/#how-it-works"
                className="flex items-center gap-3 px-3 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition touch-target"
                onClick={() => setIsOpen(false)}
              >
                <Package className="size-4" />
                How it works
              </Link>
              
              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-3 px-3 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition touch-target"
                    onClick={() => setIsOpen(false)}
                  >
                    <Home className="size-4" />
                    Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      setIsOpen(false)
                      setShowLogoutModal(true)
                    }}
                    className="w-full flex items-center gap-3 px-3 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition touch-target"
                  >
                    <LogOut className="size-4" />
                    Sign out
                  </button>
                </>
              ) : (
                <Link
                  href="/auth"
                  className="flex items-center gap-3 px-3 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition touch-target"
                  onClick={() => setIsOpen(false)}
                >
                  <UserIcon className="size-4" />
                  Sign in
                </Link>
              )}
              
              <Link
                href={user ? "/booking" : "/auth"}
                className="block bg-brand text-brand-foreground px-4 py-3 rounded-lg hover:opacity-90 transition text-sm text-center mt-2 touch-target"
                onClick={() => setIsOpen(false)}
              >
                {user ? 'Book now' : 'Get started'}
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Spacer to prevent content from hiding behind fixed navbar */}
      <div className="h-14 sm:h-16" />

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowLogoutModal(false)} />
          
          <div className="relative bg-card rounded-2xl shadow-2xl max-w-sm w-full p-6 sm:p-8 animate-in fade-in zoom-in duration-300">
            <button
              onClick={() => setShowLogoutModal(false)}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 text-muted-foreground hover:text-foreground transition p-1"
            >
              <X className="size-5" />
            </button>

            <div className="text-center">
              <div className="size-14 sm:size-16 rounded-full bg-amber-500/10 border-2 border-amber-500 flex items-center justify-center mx-auto mb-4">
                <LogOut className="size-7 sm:size-8 text-amber-500" />
              </div>
              
              <h2 className="font-display text-xl sm:text-2xl font-bold mb-2">Sign Out?</h2>
              <p className="text-muted-foreground text-sm">
                Are you sure you want to sign out of your account?
              </p>
              
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="flex-1 border border-border px-4 py-2.5 rounded-lg font-medium hover:bg-muted/50 transition touch-target"
                >
                  Stay Signed In
                </button>
                <button
                  onClick={handleSignOut}
                  className="flex-1 bg-red-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-red-700 transition touch-target"
                >
                  Yes, Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}