'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Menu, X } from 'lucide-react'
import { User } from '@supabase/supabase-js'

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: string, session: any) => {
        setUser(session?.user ?? null)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return (
    <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-blue-600">StashSpace</span>
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            <Link href="/#pricing" className="text-gray-700 hover:text-blue-600 transition">
              Pricing
            </Link>
            <Link href="/#how-it-works" className="text-gray-700 hover:text-blue-600 transition">
              How it works
            </Link>
            {user ? (
              <Link href="/dashboard" className="text-gray-700 hover:text-blue-600 transition">
                Dashboard
              </Link>
            ) : (
              <Link href="/auth" className="text-gray-700 hover:text-blue-600 transition">
                Sign in
              </Link>
            )}
            <Link
              href="/booking"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Book now
            </Link>
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-gray-700 hover:text-blue-600"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {isOpen && (
          <div className="md:hidden pb-4 space-y-3">
            <Link
              href="/#pricing"
              className="block text-gray-700 hover:text-blue-600 transition"
              onClick={() => setIsOpen(false)}
            >
              Pricing
            </Link>
            <Link
              href="/#how-it-works"
              className="block text-gray-700 hover:text-blue-600 transition"
              onClick={() => setIsOpen(false)}
            >
              How it works
            </Link>
            {user ? (
              <Link
                href="/dashboard"
                className="block text-gray-700 hover:text-blue-600 transition"
                onClick={() => setIsOpen(false)}
              >
                Dashboard
              </Link>
            ) : (
              <Link
                href="/auth"
                className="block text-gray-700 hover:text-blue-600 transition"
                onClick={() => setIsOpen(false)}
              >
                Sign in
              </Link>
            )}
            <Link
              href="/booking"
              className="block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition text-center"
              onClick={() => setIsOpen(false)}
            >
              Book now
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}