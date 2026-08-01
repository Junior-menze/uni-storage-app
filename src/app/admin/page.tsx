'use client'

import Image from 'next/image'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Package,
  Calendar,
  Users,
  Wallet,
  CheckCircle,
  Clock,
  AlertCircle,
  Truck,
  Loader2,
  LogOut,
  Search,
  X,
  RefreshCw,
  Trash2,
  Edit,
  MapPin,
  Home,
  Phone,
  Mail,
  Copy
} from 'lucide-react'

interface Booking {
  id: string
  user_id: string
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
  user_name?: string
  user_email?: string
  user_phone?: string
  items?: string[]
  residence_name?: string
  room_number?: string
  address_line?: string
  city?: string
}

interface Profile {
  id: string
  full_name: string
  student_number: string
  campus: string
  phone_number: string
  role: string
  created_at: string
  email?: string
  active_bookings?: number
}

// Helper function to format phone numbers for tel: and WhatsApp links
function formatPhoneNumber(phone: string): string {
  // Remove any non-numeric characters
  let cleaned = phone.replace(/\D/g, '')
  
  // If the number starts with 0, replace with 27
  if (cleaned.startsWith('0')) {
    cleaned = '27' + cleaned.substring(1)
  }
  
  // If the number starts with 27, add + prefix
  if (cleaned.startsWith('27')) {
    return '+' + cleaned
  }
  
  // If the number doesn't have a country code, add +27
  if (cleaned.length <= 10) {
    return '+27' + cleaned
  }
  
  return '+' + cleaned
}

export default function AdminPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [stats, setStats] = useState({
    totalBookings: 0,
    activeBookings: 0,
    collected: 0,
    delivered: 0,
    totalRevenue: 0,
    pendingBalance: 0,
    totalStudents: 0
  })
  const [activeTab, setActiveTab] = useState('bookings')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [bookingToDelete, setBookingToDelete] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [updatingBookingId, setUpdatingBookingId] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const router = useRouter()

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopied(field)
    setTimeout(() => setCopied(null), 2000)
  }

  // Load admin data
  const loadAdminData = useCallback(async () => {
    try {
      setError(null)
      setLoading(true)
      
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError) throw userError
      
      if (!user) {
        router.push('/auth')
        return
      }

      // Check if user is admin
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profileError) {
        if (profileError.code === 'PGRST116') {
          await supabase
            .from('profiles')
            .insert({
              id: user.id,
              full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Admin',
              student_number: `ADMIN${Date.now().toString().slice(-6)}`,
              campus: 'UMP',
              phone_number: 'Not provided',
              role: 'admin'
            })
        }
        const { data: newProfile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        
        if (!newProfile || newProfile?.role !== 'admin') {
          router.push('/dashboard')
          return
        }
      } else if (profile?.role !== 'admin') {
        router.push('/dashboard')
        return
      }

      setUser(user)

      // Fetch ONLY active bookings (exclude CANCELLED)
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .neq('status', 'CANCELLED')
        .order('created_at', { ascending: false })

      if (bookingsError) throw bookingsError

      // Fetch user profiles for all bookings with phone numbers
      const bookingsWithDetails = await Promise.all(
        (bookingsData || []).map(async (booking) => {
          let userName = 'Unknown'
          let userEmail = ''
          let userPhone = ''
          
          if (booking.user_id) {
            const { data: userProfile } = await supabase
              .from('profiles')
              .select('full_name, phone_number')
              .eq('id', booking.user_id)
              .single()
            
            if (userProfile) {
              userName = userProfile.full_name
              userPhone = userProfile.phone_number || ''
            }
            
            try {
              const { data: authUser } = await supabase
                .from('auth.users')
                .select('email')
                .eq('id', booking.user_id)
                .single()
              
              if (authUser) {
                userEmail = authUser.email
              }
            } catch (err) {
              // Fallback
            }
          }
          
          const { data: items } = await supabase
            .from('booking_items')
            .select('item_type')
            .eq('booking_id', booking.id)
          
          return {
            ...booking,
            user_name: userName,
            user_email: userEmail,
            user_phone: userPhone,
            items: items?.map(i => i.item_type) || []
          }
        })
      )

      setBookings(bookingsWithDetails)

      // Fetch ALL profiles with phone numbers
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      const profilesWithDetails = await Promise.all(
        (profilesData || []).map(async (profile) => {
          let email = ''
          try {
            const { data: authUser } = await supabase
              .from('auth.users')
              .select('email')
              .eq('id', profile.id)
              .single()
            
            if (authUser) {
              email = authUser.email
            }
          } catch (err) {
            // Fallback
          }
          
          const { data: studentBookings } = await supabase
            .from('bookings')
            .select('id', { count: 'exact' })
            .eq('user_id', profile.id)
            .neq('status', 'CANCELLED')
          
          return {
            ...profile,
            email,
            active_bookings: studentBookings?.length || 0
          }
        })
      )

      const activeStudents = profilesWithDetails.filter(p => p.active_bookings > 0)
      setProfiles(activeStudents)

      // Calculate stats
      const total = bookingsWithDetails?.length || 0
      const active = bookingsWithDetails?.filter(b => b.status !== 'DELIVERED').length || 0
      const collected = bookingsWithDetails?.filter(b => b.status === 'COLLECTED').length || 0
      const delivered = bookingsWithDetails?.filter(b => b.status === 'DELIVERED').length || 0
      const revenue = bookingsWithDetails?.reduce((sum, b) => sum + (Number(b.deposit_amount) || 0), 0) || 0
      const pending = bookingsWithDetails?.reduce((sum, b) => {
        if (b.balance_status === 'PENDING') {
          return sum + (Number(b.balance_amount) || 0)
        }
        return sum
      }, 0) || 0

      setStats({
        totalBookings: total,
        activeBookings: active,
        collected,
        delivered,
        totalRevenue: revenue,
        pendingBalance: pending,
        totalStudents: activeStudents.length
      })

    } catch (error) {
      console.error('Error loading admin data:', error)
      setError('Failed to load admin dashboard. Please refresh the page.')
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    loadAdminData()
  }, [loadAdminData])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/auth')
  }

  function handleLogoutClick() {
    setShowLogoutModal(true)
  }

  function handleLogoClick(e: React.MouseEvent) {
    e.preventDefault()
    setShowLogoutModal(true)
  }

  async function updateBookingStatus(bookingId: string, status: string) {
    setUpdatingBookingId(bookingId)
    setIsUpdating(true)
    
    try {
      setBookings(prevBookings => 
        prevBookings.map(booking => 
          booking.id === bookingId 
            ? { ...booking, status } 
            : booking
        )
      )

      const { error } = await supabase
        .from('bookings')
        .update({ status })
        .eq('id', bookingId)

      if (error) throw error

      const updatedBookings = bookings.map(booking => 
        booking.id === bookingId ? { ...booking, status } : booking
      )
      
      const active = updatedBookings.filter(b => b.status !== 'DELIVERED' && b.status !== 'CANCELLED').length || 0
      const collected = updatedBookings.filter(b => b.status === 'COLLECTED').length || 0
      const delivered = updatedBookings.filter(b => b.status === 'DELIVERED').length || 0
      
      setStats(prev => ({
        ...prev,
        activeBookings: active,
        collected,
        delivered
      }))

      setShowBookingModal(false)
      setSelectedBooking(null)

    } catch (error) {
      console.error('Error updating booking:', error)
      await loadAdminData()
      alert('Failed to update booking status')
    } finally {
      setIsUpdating(false)
      setUpdatingBookingId(null)
    }
  }

  async function handleDeleteBooking(bookingId: string) {
    setIsDeleting(true)
    
    try {
      setBookings(prevBookings => prevBookings.filter(b => b.id !== bookingId))

      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', bookingId)

      if (error) throw error

      await supabase
        .from('booking_items')
        .delete()
        .eq('booking_id', bookingId)

      const updatedBookings = bookings.filter(b => b.id !== bookingId)
      const active = updatedBookings.filter(b => b.status !== 'DELIVERED' && b.status !== 'CANCELLED').length || 0
      const collected = updatedBookings.filter(b => b.status === 'COLLECTED').length || 0
      const delivered = updatedBookings.filter(b => b.status === 'DELIVERED').length || 0
      const revenue = updatedBookings.reduce((sum, b) => sum + (Number(b.deposit_amount) || 0), 0)
      
      setStats(prev => ({
        ...prev,
        totalBookings: prev.totalBookings - 1,
        activeBookings: active,
        collected,
        delivered,
        totalRevenue: revenue
      }))

      setShowDeleteModal(false)
      setBookingToDelete(null)

    } catch (error) {
      console.error('Error deleting booking:', error)
      await loadAdminData()
      alert('Failed to delete booking')
    } finally {
      setIsDeleting(false)
    }
  }

  function getStatusBadge(status: string) {
    const statuses: Record<string, { color: string, icon: any, label: string }> = {
      'CONFIRMED': { color: 'bg-blue-100 text-blue-700', icon: Clock, label: 'Confirmed' },
      'COLLECTED': { color: 'bg-amber-100 text-amber-700', icon: Truck, label: 'Collected' },
      'IN_STORAGE': { color: 'bg-purple-100 text-purple-700', icon: Package, label: 'In Storage' },
      'DELIVERED': { color: 'bg-green-100 text-green-700', icon: CheckCircle, label: 'Delivered' }
    }
    return statuses[status] || { color: 'bg-gray-100 text-gray-700', icon: AlertCircle, label: status }
  }

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = booking.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.user_phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || booking.status === filterStatus
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="size-12 animate-spin text-brand mx-auto mb-4" />
          <p className="text-muted-foreground">Loading admin dashboard...</p>
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
          <button
            onClick={() => window.location.reload()}
            className="mt-4 bg-brand text-brand-foreground px-6 py-2 rounded-lg hover:opacity-90 transition"
          >
            <RefreshCw className="size-4 inline mr-2" />
            Refresh Page
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
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

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-card border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-lg bg-blue-500/10 text-blue-500 grid place-items-center">
                <Package className="size-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Bookings</p>
                <p className="font-display text-2xl font-bold">{stats.totalBookings}</p>
              </div>
            </div>
          </div>
          <div className="bg-card border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-lg bg-amber-500/10 text-amber-500 grid place-items-center">
                <Clock className="size-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Active</p>
                <p className="font-display text-2xl font-bold">{stats.activeBookings}</p>
              </div>
            </div>
          </div>
          <div className="bg-card border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-lg bg-green-500/10 text-green-500 grid place-items-center">
                <Wallet className="size-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Revenue</p>
                <p className="font-display text-2xl font-bold">R{stats.totalRevenue.toFixed(2)}</p>
              </div>
            </div>
          </div>
          <div className="bg-card border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-lg bg-purple-500/10 text-purple-500 grid place-items-center">
                <Users className="size-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Active Students</p>
                <p className="font-display text-2xl font-bold">{stats.totalStudents}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-card border rounded-xl p-1">
          <button
            onClick={() => setActiveTab('bookings')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition ${
              activeTab === 'bookings'
                ? 'bg-brand text-brand-foreground'
                : 'hover:bg-muted/50'
            }`}
          >
             Bookings
          </button>
          <button
            onClick={() => setActiveTab('students')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition ${
              activeTab === 'students'
                ? 'bg-brand text-brand-foreground'
                : 'hover:bg-muted/50'
            }`}
          >
            Students
          </button>
        </div>

        {/* Bookings Tab */}
        {activeTab === 'bookings' && (
          <div className="bg-card border rounded-xl p-6">
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by name, email, phone, or booking ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-brand/50"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-brand/50"
              >
                <option value="all">All Status</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="COLLECTED">Collected</option>
                <option value="IN_STORAGE">In Storage</option>
                <option value="DELIVERED">Delivered</option>
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Student</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Contact</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Items</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Collection</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Payment</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-muted-foreground">
                        No active bookings found
                      </td>
                    </tr>
                  ) : (
                    filteredBookings.map((booking) => {
                      const status = getStatusBadge(booking.status)
                      const StatusIcon = status.icon
                      const isUpdatingThis = updatingBookingId === booking.id
                      
                      return (
                        <tr key={booking.id} className="border-b hover:bg-muted/30 transition">
                          <td className="py-3 px-4">
                            <p className="font-medium">{booking.user_name}</p>
                          </td>
                          <td className="py-3 px-4">
                            <div className="space-y-1">
                              {booking.user_email && booking.user_email !== '' && (
                                <div className="flex items-center gap-1">
                                  <Mail className="size-3 text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground truncate max-w-[120px]">{booking.user_email}</span>
                                </div>
                              )}
                              {booking.user_phone && booking.user_phone !== '' && (
                                <div className="flex items-center gap-1">
                                  <Phone className="size-3 text-muted-foreground" />
                                  <span className="text-xs">{booking.user_phone}</span>
                                </div>
                              )}
                              {(!booking.user_email || booking.user_email === '') && 
                               (!booking.user_phone || booking.user_phone === '') && (
                                <span className="text-xs text-muted-foreground">No contact info</span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex flex-wrap gap-1">
                              {booking.items?.slice(0, 3).map((item, i) => (
                                <span key={i} className="text-xs bg-muted px-2 py-0.5 rounded">
                                  {item}
                                </span>
                              ))}
                              {(booking.items?.length || 0) > 3 && (
                                <span className="text-xs text-muted-foreground">+{booking.items!.length - 3}</span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            {new Date(booking.collection_date).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                              {isUpdatingThis ? (
                                <Loader2 className="size-3 animate-spin" />
                              ) : (
                                <StatusIcon className="size-3" />
                              )}
                              {status.label}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div>
                              <p className="text-sm">Deposit: R{Number(booking.deposit_amount).toFixed(2)}</p>
                              <p className={`text-xs ${booking.balance_status === 'PAID' ? 'text-green-600' : 'text-amber-600'}`}>
                                Balance: R{Number(booking.balance_amount).toFixed(2)}
                              </p>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => {
                                setSelectedBooking(booking)
                                setShowBookingModal(true)
                              }}
                              className="text-brand hover:underline text-sm flex items-center gap-1 justify-end"
                              disabled={isUpdatingThis}
                            >
                              {isUpdatingThis ? (
                                'Updating...'
                              ) : (
                                <>
                                  Manage
                                  <Edit className="size-3" />
                                </>
                              )}
                            </button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Students Tab */}
        {activeTab === 'students' && (
          <div className="bg-card border rounded-xl p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Name</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Student Number</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Campus</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Contact</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Active Bookings</th>
                  </tr>
                </thead>
                <tbody>
                  {profiles.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-muted-foreground">
                        No active students found
                      </td>
                    </tr>
                  ) : (
                    profiles.map((profile) => {
                      return (
                        <tr key={profile.id} className="border-b hover:bg-muted/30 transition">
                          <td className="py-3 px-4 font-medium">{profile.full_name}</td>
                          <td className="py-3 px-4 text-muted-foreground">{profile.student_number}</td>
                          <td className="py-3 px-4">{profile.campus === 'UMP' ? 'University of Mpumalanga' : 'TUT Nelspruit'}</td>
                          <td className="py-3 px-4">
                            <div className="space-y-1">
                              {profile.email && profile.email !== '' && (
                                <div className="flex items-center gap-1">
                                  <Mail className="size-3 text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground truncate max-w-[150px]">{profile.email}</span>
                                </div>
                              )}
                              {profile.phone_number && profile.phone_number !== '' && profile.phone_number !== 'Not provided' && (
                                <div className="flex items-center gap-1">
                                  <Phone className="size-3 text-muted-foreground" />
                                  <span className="text-xs">{profile.phone_number}</span>
                                  <button
                                    onClick={() => copyToClipboard(profile.phone_number!, 'phone')}
                                    className="text-brand hover:text-brand/80 transition"
                                  >
                                    {copied === 'phone' ? (
                                      <CheckCircle className="size-3 text-green-500" />
                                    ) : (
                                      <Copy className="size-3" />
                                    )}
                                  </button>
                                </div>
                              )}
                              {(!profile.email || profile.email === '') && 
                               (!profile.phone_number || profile.phone_number === '' || profile.phone_number === 'Not provided') && (
                                <span className="text-xs text-muted-foreground">No contact info</span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center gap-1 bg-brand/10 text-brand px-2 py-1 rounded-full text-xs font-medium">
                              {profile.active_bookings} active
                            </span>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)} />
          
          <div className="relative bg-card rounded-2xl shadow-2xl max-w-md w-full p-8 animate-in fade-in zoom-in duration-300">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition"
            >
              <X className="size-5" />
            </button>

            <div className="text-center">
              <div className="size-16 rounded-full bg-red-500/10 border-2 border-red-500 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="size-8 text-red-500" />
              </div>
              
              <h2 className="font-display text-2xl font-bold text-red-600 mb-2">Delete Booking?</h2>
              <p className="text-muted-foreground text-sm">
                Are you sure you want to permanently delete this booking? This action cannot be undone.
              </p>
              
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 border border-border px-4 py-2.5 rounded-lg font-medium hover:bg-muted/50 transition"
                >
                  Keep
                </button>
                <button
                  onClick={() => bookingToDelete && handleDeleteBooking(bookingToDelete)}
                  disabled={isDeleting}
                  className="flex-1 bg-red-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-red-700 transition disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="size-4 animate-spin inline mr-2" />
                      Deleting...
                    </>
                  ) : (
                    'Yes, Delete'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Booking Management Modal with Address, Phone, Email */}
      {showBookingModal && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowBookingModal(false)} />
          
          <div className="relative bg-card rounded-2xl shadow-2xl max-w-lg w-full p-8 animate-in fade-in zoom-in duration-300 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowBookingModal(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition"
            >
              <X className="size-5" />
            </button>

            <h2 className="font-display text-2xl font-bold mb-4">Booking Details</h2>
            
            <div className="space-y-4">
              {/* Student Info with Phone & Email */}
              <div className="bg-muted/30 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="size-4 text-brand" />
                  <p className="text-sm font-medium">Student Information</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm">
                    <span className="font-medium">Name:</span> {selectedBooking.user_name}
                  </p>
                  {selectedBooking.user_email && selectedBooking.user_email !== '' && (
                    <div className="flex items-center gap-1 text-sm">
                      <Mail className="size-3 text-muted-foreground" />
                      <span className="font-medium">Email:</span>
                      <span className="text-muted-foreground">{selectedBooking.user_email}</span>
                      <button
                        onClick={() => copyToClipboard(selectedBooking.user_email!, 'email')}
                        className="text-brand hover:text-brand/80 transition ml-1"
                      >
                        {copied === 'email' ? (
                          <CheckCircle className="size-3 text-green-500" />
                        ) : (
                          <Copy className="size-3" />
                        )}
                      </button>
                    </div>
                  )}
                  {selectedBooking.user_phone && selectedBooking.user_phone !== '' && (
                    <div className="flex items-center gap-1 text-sm">
                      <Phone className="size-3 text-muted-foreground" />
                      <span className="font-medium">Phone:</span>
                      <span className="text-muted-foreground">{selectedBooking.user_phone}</span>
                      <button
                        onClick={() => copyToClipboard(selectedBooking.user_phone!, 'phone')}
                        className="text-brand hover:text-brand/80 transition ml-1"
                      >
                        {copied === 'phone' ? (
                          <CheckCircle className="size-3 text-green-500" />
                        ) : (
                          <Copy className="size-3" />
                        )}
                      </button>
                    </div>
                  )}
                  {(!selectedBooking.user_email || selectedBooking.user_email === '') && 
                   (!selectedBooking.user_phone || selectedBooking.user_phone === '') && (
                    <p className="text-sm text-muted-foreground">No contact information available</p>
                  )}
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Campus</p>
                <p className="font-medium">{selectedBooking.campus === 'UMP' ? 'University of Mpumalanga' : 'TUT Nelspruit'}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Collection Date</p>
                <p className="font-medium">{new Date(selectedBooking.collection_date).toLocaleDateString()}</p>
              </div>

              {/* Address Section */}
              <div className="bg-muted/30 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="size-4 text-brand" />
                  <p className="text-sm font-medium">Address</p>
                </div>
                {selectedBooking.residence_name || selectedBooking.address_line ? (
                  <div className="space-y-1">
                    {selectedBooking.residence_name && (
                      <p className="text-sm">
                        <span className="font-medium">Residence:</span> {selectedBooking.residence_name}
                      </p>
                    )}
                    {selectedBooking.room_number && (
                      <p className="text-sm">
                        <span className="font-medium">Room:</span> {selectedBooking.room_number}
                      </p>
                    )}
                    {selectedBooking.address_line && (
                      <p className="text-sm">
                        <span className="font-medium">Address:</span> {selectedBooking.address_line}
                      </p>
                    )}
                    {selectedBooking.city && (
                      <p className="text-sm">
                        <span className="font-medium">City:</span> {selectedBooking.city}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No address provided</p>
                )}
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Items</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {selectedBooking.items?.map((item, i) => (
                    <span key={i} className="bg-muted px-3 py-1 rounded-lg text-sm">{item}</span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="font-display text-xl font-bold">R{Number(selectedBooking.total_amount).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Deposit</p>
                  <p className="font-display text-xl font-bold text-green-600">R{Number(selectedBooking.deposit_amount).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Balance</p>
                  <p className={`font-display text-xl font-bold ${selectedBooking.balance_status === 'PAID' ? 'text-green-600' : 'text-amber-600'}`}>
                    R{Number(selectedBooking.balance_amount).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="font-medium">{selectedBooking.status}</p>
                </div>
              </div>

              {/* Quick Contact Buttons - FIXED with proper phone formatting */}
              {(selectedBooking.user_phone || selectedBooking.user_email) && (
                <div className="border-t pt-4">
                  <p className="text-sm font-medium mb-2">Quick Contact</p>
                  <div className="flex gap-2 flex-wrap">
                    {selectedBooking.user_phone && selectedBooking.user_phone !== '' && (
                      <>
                        <a
                          href={`tel:${formatPhoneNumber(selectedBooking.user_phone)}`}
                          className="flex-1 min-w-[100px] bg-green-500 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-green-600 transition flex items-center justify-center gap-2"
                        >
                          <Phone className="size-4" />
                          Call
                        </a>
                        <a
                          href={`https://wa.me/${formatPhoneNumber(selectedBooking.user_phone).replace('+', '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 min-w-[100px] bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition flex items-center justify-center gap-2"
                        >
                          <Phone className="size-4" />
                          WhatsApp
                        </a>
                      </>
                    )}
                    {selectedBooking.user_email && selectedBooking.user_email !== '' && (
                      <a
                        href={`mailto:${selectedBooking.user_email}`}
                        className="flex-1 min-w-[100px] bg-blue-500 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition flex items-center justify-center gap-2"
                      >
                        <Mail className="size-4" />
                        Email
                      </a>
                    )}
                  </div>
                </div>
              )}

              <div className="border-t pt-4">
                <p className="text-sm font-medium mb-2">Update Status</p>
                <div className="grid grid-cols-2 gap-2">
                  {['CONFIRMED', 'COLLECTED', 'IN_STORAGE', 'DELIVERED'].map((status) => (
                    <button
                      key={status}
                      onClick={() => updateBookingStatus(selectedBooking.id, status)}
                      disabled={isUpdating}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                        selectedBooking.status === status
                          ? 'bg-brand text-brand-foreground'
                          : 'bg-muted hover:bg-muted/70'
                      } disabled:opacity-50 flex items-center justify-center gap-2`}
                    >
                      {isUpdating ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        status.replace('_', ' ')
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => {
                  setBookingToDelete(selectedBooking.id)
                  setShowDeleteModal(true)
                  setShowBookingModal(false)
                }}
                disabled={isUpdating}
                className="w-full bg-red-500 text-white py-2 rounded-lg font-medium hover:bg-red-600 transition mt-2 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Trash2 className="size-4" />
                Delete Booking
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}