'use client'

import Image from 'next/image'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  PackageOpen, 
  LogOut, 
  Package, 
  Calendar, 
  Wallet,
  Plus,
  ChevronRight,
  Loader2,
  Clock,
  CheckCircle,
  AlertCircle,
  Edit,
  Trash2,
  X,
  RefreshCw
} from 'lucide-react'

interface Booking {
  id: string
  campus: string
  collection_date: string
  delivery_date: string | null
  total_items: number
  total_amount: number
  deposit_amount: number
  balance_amount: number
  deposit_status: string
  balance_status: string
  status: string
  created_at: string
  payment_reference?: string
  payment_date?: string
  deposit_paid?: boolean
  payment_method?: string
}

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [bookingStats, setBookingStats] = useState({
    active: 0,
    items: 0,
    balance: 0
  })
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [bookingToCancel, setBookingToCancel] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isRetrying, setIsRetrying] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const router = useRouter()

  async function loadDashboard() {
    try {
      setError(null)
      setIsRetrying(true)
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError) throw userError
      
      if (!user) {
        router.push('/auth')
        return
      }
      
      // Check if user has a profile
      let profileData = null
      let profileError = null
      
      try {
        const result = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        profileData = result.data
        profileError = result.error
      } catch (err) {
        console.error('Profile fetch error:', err)
      }
      
      // If profile doesn't exist, create one
      if (!profileData || profileError) {
        console.log('Creating profile for user:', user.id)
        
        const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Student'
        const studentNumber = `STU${Date.now().toString().slice(-6)}`
        
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            full_name: fullName,
            student_number: studentNumber,
            campus: 'UMP',
            phone_number: 'Not provided',
            role: 'student'
          })
        
        if (insertError) {
          console.error('Error creating profile:', insertError)
        } else {
          const { data: newProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()
          
          profileData = newProfile
        }
      }
      
      setProfile(profileData)
      
      // Check if admin and redirect if needed
      if (profileData?.role === 'admin') {
        router.push('/admin')
        return
      }
      
      // Set user with profile data
      setUser({
        ...user,
        user_metadata: {
          ...user.user_metadata,
          full_name: profileData?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Student'
        }
      })
      
      // Fetch bookings (excluding cancelled)
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', user.id)
        .neq('status', 'CANCELLED') //  Exclude cancelled bookings
        .order('created_at', { ascending: false })
      
      if (bookingsError) throw bookingsError
      
      setBookings(bookingsData || [])
      
      //  Calculate stats from active bookings only (non-cancelled)
      const activeBookings = bookingsData?.filter(b => b.status !== 'DELIVERED' && b.status !== 'CANCELLED').length || 0
      
      //  Total items from active bookings only (excluding cancelled)
      const totalItems = bookingsData?.reduce((sum, b) => {
        // Only count items from non-cancelled bookings
        if (b.status !== 'CANCELLED') {
          return sum + b.total_items
        }
        return sum
      }, 0) || 0
      
      // Total balance from active bookings only (excluding cancelled)
      const totalBalance = bookingsData?.reduce((sum, b) => {
        if (b.balance_status === 'PENDING' && b.status !== 'CANCELLED') {
          return sum + b.balance_amount
        }
        return sum
      }, 0) || 0
      
      setBookingStats({
        active: activeBookings,
        items: totalItems,
        balance: totalBalance
      })
      
    } catch (error) {
      console.error('Error loading dashboard:', error)
      setError('Failed to load your dashboard. Please refresh the page.')
    } finally {
      setLoading(false)
      setIsRetrying(false)
    }
  }

  useEffect(() => {
    loadDashboard()
  }, [router])

  async function handleSignOut() {
    try {
      await supabase.auth.signOut()
      router.push('/auth')
    } catch (error) {
      console.error('Error signing out:', error)
    }
    setShowLogoutModal(false)
  }

  function handleLogoutClick() {
    setShowLogoutModal(true)
  }

  function handleLogoClick(e: React.MouseEvent) {
    e.preventDefault()
    setShowLogoutModal(true)
  }

  async function handleCancelBooking(bookingId: string) {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'CANCELLED' })
        .eq('id', bookingId)
        .eq('user_id', user?.id)

      if (error) throw error

      // Refresh bookings (excluding cancelled)
      const { data: bookingsData, error: fetchError } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', user?.id)
        .neq('status', 'CANCELLED')
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError
      
      setBookings(bookingsData || [])
      
      // Recalculate stats
      const activeBookings = bookingsData?.filter(b => b.status !== 'DELIVERED' && b.status !== 'CANCELLED').length || 0
      const totalItems = bookingsData?.reduce((sum, b) => {
        if (b.status !== 'CANCELLED') {
          return sum + b.total_items
        }
        return sum
      }, 0) || 0
      const totalBalance = bookingsData?.reduce((sum, b) => {
        if (b.balance_status === 'PENDING' && b.status !== 'CANCELLED') {
          return sum + b.balance_amount
        }
        return sum
      }, 0) || 0
      
      setBookingStats({
        active: activeBookings,
        items: totalItems,
        balance: totalBalance
      })
      
      setShowCancelModal(false)
      setBookingToCancel(null)
      
    } catch (error) {
      console.error('Error cancelling booking:', error)
      alert('Failed to cancel booking. Please try again.')
    }
  }

  function getStatusBadge(status: string) {
    const statuses: Record<string, { color: string, icon: any, label: string }> = {
      'CONFIRMED': { color: 'bg-blue-100 text-blue-700', icon: Clock, label: 'Confirmed' },
      'COLLECTED': { color: 'bg-amber-100 text-amber-700', icon: Package, label: 'Collected' },
      'IN_STORAGE': { color: 'bg-purple-100 text-purple-700', icon: PackageOpen, label: 'In Storage' },
      'DELIVERED': { color: 'bg-green-100 text-green-700', icon: CheckCircle, label: 'Delivered' },
      'CANCELLED': { color: 'bg-red-100 text-red-700', icon: AlertCircle, label: 'Cancelled' }
    }
    return statuses[status] || { color: 'bg-gray-100 text-gray-700', icon: AlertCircle, label: status }
  }

  function getCampusName(campus: string) {
    if (campus === 'UMP') return 'University of Mpumalanga'
    if (campus === 'TUT Nelspruit') return 'TUT Nelspruit'
    return campus
  }

  function getPaymentStatus(booking: Booking) {
  if (booking.deposit_paid && booking.balance_status === 'PAID') {
    return { label: 'Fully Paid', color: 'text-green-600 bg-green-100' }
  } else if (booking.deposit_paid) {
    return { label: 'Deposit Paid (50%)', color: 'text-blue-600 bg-blue-100' }
  } else {
    return { label: 'Pending Payment', color: 'text-amber-600 bg-amber-100' }
  }
}



  const handleRetry = () => {
    setLoading(true)
    loadDashboard()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="size-12 animate-spin text-brand mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md bg-card border rounded-2xl p-8 shadow-xl">
          <AlertCircle className="size-16 text-red-500 mx-auto mb-4" />
          <h2 className="font-display text-2xl font-bold text-red-600 mb-2">Something went wrong</h2>
          <p className="text-muted-foreground text-sm">{error}</p>
          <div className="mt-6 flex flex-col gap-3">
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className="w-full bg-brand text-brand-foreground px-6 py-3 rounded-lg hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isRetrying ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Retrying...
                </>
              ) : (
                <>
                  <RefreshCw className="size-4" />
                  Refresh Page
                </>
              )}
            </button>
            <button
              onClick={() => router.push('/')}
              className="w-full border border-border px-6 py-3 rounded-lg hover:bg-muted/50 transition"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link 
            href="/" 
            onClick={handleLogoClick}
            className="flex items-center gap-2 cursor-pointer"
          >
            <div className="relative size-7 rounded-lg overflow-hidden flex-shrink-0">
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
              <span className="font-display text-base font-bold">Uni-Storage</span>
              <span className="text-[9px] text-muted-foreground hidden sm:block">
                Your Belongings, Safely Stored
              </span>
            </div>
          </Link>
          <nav className="flex items-center gap-2">
            <Link 
              href="/booking" 
              className="flex items-center gap-1.5 bg-brand text-brand-foreground px-4 py-2 rounded-lg hover:opacity-90 transition text-sm"
            >
              <Plus className="size-4" />
              New Booking
            </Link>
            <button
              onClick={handleLogoutClick}
              className="flex items-center gap-1.5 px-3 py-2 text-sm border rounded-lg hover:bg-muted/50 transition"
            >
              <LogOut className="size-4" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="font-display text-2xl font-bold">
            Welcome back, {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Student'} 
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your storage bookings and track your items.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-card border rounded-xl p-6 hover:shadow-md transition">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-lg bg-brand/10 text-brand grid place-items-center">
                <Package className="size-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Bookings</p>
                <p className="font-display text-2xl font-bold">{bookingStats.active}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-card border rounded-xl p-6 hover:shadow-md transition">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-lg bg-blue-500/10 text-blue-500 grid place-items-center">
                <Calendar className="size-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Items Stored</p>
                <p className="font-display text-2xl font-bold">{bookingStats.items}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-card border rounded-xl p-6 hover:shadow-md transition">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-lg bg-amber-500/10 text-amber-500 grid place-items-center">
                <Wallet className="size-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Balance Due</p>
                <p className="font-display text-2xl font-bold">R{bookingStats.balance.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Link 
            href="/booking"
            className="bg-gradient-to-br from-brand to-brand/80 rounded-xl p-6 text-brand-foreground hover:opacity-90 transition"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-display text-lg font-semibold">Book New Storage</h3>
                <p className="text-brand-foreground/80 text-sm mt-1">
                  Secure your spot for the upcoming break
                </p>
              </div>
              <ChevronRight className="size-5 opacity-60" />
            </div>
          </Link>

          <Link 
            href="/bookings"
            className="bg-card border rounded-xl p-6 hover:shadow-md transition"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-display text-lg font-semibold">View All Bookings</h3>
                <p className="text-muted-foreground text-sm mt-1">
                  Track your storage history and status
                </p>
              </div>
              <ChevronRight className="size-5 text-muted-foreground" />
            </div>
          </Link>
        </div>

        {bookings.filter(b => b.status !== 'CANCELLED').length > 0 ? (
          <div className="bg-card border rounded-xl p-6">
            <h3 className="font-display text-lg font-semibold mb-4">Recent Bookings</h3>
            <div className="space-y-3">
              {bookings.filter(b => b.status !== 'CANCELLED').slice(0, 3).map((booking) => {
                const status = getStatusBadge(booking.status)
                const StatusIcon = status.icon
                const paymentStatus = getPaymentStatus(booking)
                
                return (
                  <div key={booking.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition gap-4">
                    <div className="flex items-center gap-4">
                      <div className="size-10 rounded-lg bg-muted grid place-items-center">
                        <Package className="size-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">{getCampusName(booking.campus)}</p>
                        <p className="text-sm text-muted-foreground">
                          {booking.total_items} items · Collection: {new Date(booking.collection_date).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Delivery: {booking.delivery_date ? new Date(booking.delivery_date).toLocaleDateString() : 'To be arranged'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${status.color}`}>
                        <StatusIcon className="size-3" />
                        {status.label}
                      </span>
                      <span className="font-medium">R{booking.total_amount.toFixed(2)}</span>
                      {booking.status !== 'DELIVERED' && booking.status !== 'CANCELLED' && (
                        <>
                          <Link
                            href={`/booking/edit/${booking.id}`}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Edit Booking"
                          >
                            <Edit className="size-4" />
                          </Link>
                          <button
                            onClick={() => {
                              setBookingToCancel(booking.id)
                              setShowCancelModal(true)
                            }}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Cancel Booking"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </>
                      )}
                    </div>
                    <div className="mt-2 flex items-center gap-2">
  <span className={`text-xs px-2 py-0.5 rounded-full ${getPaymentStatus(booking).color}`}>
    {getPaymentStatus(booking).label}
  </span>
  {/* <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${paymentStatus.color}`}>
  {paymentStatus.label}
</span> */}
  {booking.payment_reference && booking.deposit_paid && (
    <span className="text-xs text-muted-foreground">
      Ref: {booking.payment_reference}
    </span>
    
  )}
</div>
                  </div>
                )
              })}
            </div>
            {bookings.filter(b => b.status !== 'CANCELLED').length > 3 && (
              <Link href="/bookings" className="block text-center text-sm text-brand hover:underline mt-4">
                View all {bookings.filter(b => b.status !== 'CANCELLED').length} bookings →
              </Link>
            )}
          </div>
        ) : (
          <div className="bg-card border rounded-xl p-8 text-center">
            <div className="max-w-sm mx-auto">
              <div className="size-16 rounded-full bg-muted/50 grid place-items-center mx-auto mb-4">
                <PackageOpen className="size-8 text-muted-foreground/50" />
              </div>
              <h3 className="font-display font-semibold">No bookings yet</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Your storage bookings will appear here once you make your first booking.
              </p>
              <Link 
                href="/booking"
                className="inline-block mt-4 bg-brand text-brand-foreground px-6 py-2 rounded-lg hover:opacity-90 transition text-sm"
              >
                Make your first booking
              </Link>
            </div>
          </div>

        )}
        
      </main>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowLogoutModal(false)} />
          
          <div className="relative bg-card rounded-2xl shadow-2xl max-w-md w-full p-8 animate-in fade-in zoom-in duration-300">
            <button
              onClick={() => setShowLogoutModal(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition"
            >
              <X className="size-5" />
            </button>

            <div className="text-center">
              <div className="size-16 rounded-full bg-amber-500/10 border-2 border-amber-500 flex items-center justify-center mx-auto mb-4">
                <LogOut className="size-8 text-amber-500" />
              </div>
              
              <h2 className="font-display text-2xl font-bold mb-2">Sign Out?</h2>
              <p className="text-muted-foreground text-sm">
                Are you sure you want to sign out of your account?
              </p>
              
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="flex-1 border border-border px-4 py-2.5 rounded-lg font-medium hover:bg-muted/50 transition"
                >
                  Stay Signed In
                </button>
                <button
                  onClick={handleSignOut}
                  className="flex-1 bg-red-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-red-700 transition"
                >
                  Yes, Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowCancelModal(false)} />
          
          <div className="relative bg-card rounded-2xl shadow-2xl max-w-md w-full p-8 animate-in fade-in zoom-in duration-300">
            <button
              onClick={() => setShowCancelModal(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition"
            >
              <X className="size-5" />
            </button>

            <div className="text-center">
              <div className="size-16 rounded-full bg-red-500/10 border-2 border-red-500 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="size-8 text-red-500" />
              </div>
              
              <h2 className="font-display text-2xl font-bold text-red-600 mb-2">Cancel Booking?</h2>
              <p className="text-muted-foreground text-sm">
                Are you sure you want to cancel this booking? This action cannot be undone.
              </p>
              
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 border border-border px-4 py-2.5 rounded-lg font-medium hover:bg-muted/50 transition"
                >
                  Keep Booking
                </button>
                <button
                  onClick={() => bookingToCancel && handleCancelBooking(bookingToCancel)}
                  className="flex-1 bg-red-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-red-700 transition"
                >
                  Yes, Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}