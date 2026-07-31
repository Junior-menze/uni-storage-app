'use client'

import Image from 'next/image'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Package, 
  Calendar, 
  ChevronLeft,
  Loader2,
  Clock,
  CheckCircle,
  AlertCircle,
  PackageOpen,
  Edit,
  Trash2,
  X,
  Building2,
  Phone,
  Copy,
  Check
} from 'lucide-react'

interface Booking {
  id: string
  campus: string
  collection_date: string
  delivery_date: string
  total_items: number
  total_amount: number
  deposit_amount: number
  balance_amount: number
  deposit_status: string
  balance_status: string
  status: string
  created_at: string
  payment_reference?: string
  deposit_paid?: boolean
}

const BANK_DETAILS = {
  bankName: 'Standard Bank',
  accountName: 'Faith Makutu',
  accountNumber: '10151432730',
  branchCode: '051001',
  branchName: 'Nelspruit Branch',
  reference: 'UNI-BOOKING-REF',
  whatsapp: '0791170930',
  email: 'info@uni-storage.co.za'
}

export default function BookingsPage() {
  const [user, setUser] = useState<any>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [bookingToCancel, setBookingToCancel] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [bookingToDelete, setBookingToDelete] = useState<string | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedBookingForPayment, setSelectedBookingForPayment] = useState<Booking | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    async function loadBookings() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          router.push('/auth')
          return
        }
        
        setUser(user)
        
        const { data: bookingsData, error: bookingsError } = await supabase
          .from('bookings')
          .select('*')
          .eq('user_id', user.id)
          .neq('status', 'CANCELLED')
          .order('created_at', { ascending: false })
        
        if (bookingsError) throw bookingsError
        
        setBookings(bookingsData || [])
        
      } catch (error) {
        console.error('Error loading bookings:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadBookings()
  }, [router])

  async function handleCancelBooking(bookingId: string) {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'CANCELLED' })
        .eq('id', bookingId)
        .eq('user_id', user.id)

      if (error) throw error

      const { data: bookingsData, error: fetchError } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', user.id)
        .neq('status', 'CANCELLED')
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError
      
      setBookings(bookingsData || [])
      setShowCancelModal(false)
      setBookingToCancel(null)
      
    } catch (error) {
      console.error('Error cancelling booking:', error)
      alert('Failed to cancel booking. Please try again.')
    }
  }

  async function handleDeleteBooking(bookingId: string) {
    try {
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', bookingId)
        .eq('user_id', user.id)

      if (error) throw error

      const { data: bookingsData, error: fetchError } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', user.id)
        .neq('status', 'CANCELLED')
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError
      
      setBookings(bookingsData || [])
      setShowDeleteModal(false)
      setBookingToDelete(null)
      
    } catch (error) {
      console.error('Error deleting booking:', error)
      alert('Failed to delete booking. Please try again.')
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

  function getPaymentStatus(booking: Booking) {
    if (booking.deposit_paid && booking.balance_status === 'PAID') {
      return { label: 'Fully Paid', color: 'bg-green-100 text-green-700' }
    } else if (booking.deposit_paid) {
      return { label: 'Deposit Paid (50%)', color: 'bg-blue-100 text-blue-700' }
    } else {
      return { label: 'Pending Payment', color: 'bg-amber-100 text-amber-700' }
    }
  }

  function getCampusName(campus: string) {
    if (campus === 'UMP') return 'University of Mpumalanga'
    if (campus === 'TUT Nelspruit') return 'TUT Nelspruit'
    return campus
  }

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopied(field)
    setTimeout(() => setCopied(null), 2000)
  }

  const openPaymentModal = (booking: Booking) => {
    setSelectedBookingForPayment(booking)
    setShowPaymentModal(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="size-12 animate-spin text-brand mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your bookings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="relative size-8 rounded-lg overflow-hidden flex-shrink-0">
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
                <span className="font-display text-lg font-bold">Uni-Storage</span>
                <span className="text-[9px] text-muted-foreground hidden sm:block">
                  Your Belongings, Safely Stored
                </span>
              </div>
            </Link>
          </div>
          <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition flex items-center gap-1">
            <ChevronLeft className="size-4" />
            Dashboard
          </Link>
        </div>

        <div className="bg-card border rounded-2xl shadow-xl p-8">
          <h1 className="font-display text-2xl font-bold mb-2">My Bookings</h1>
          <p className="text-muted-foreground text-sm mb-6">
            View all your active storage bookings and their status
          </p>

          {bookings.length > 0 ? (
            <div className="space-y-4">
              {bookings.map((booking) => {
                const status = getStatusBadge(booking.status)
                const StatusIcon = status.icon
                const paymentStatus = getPaymentStatus(booking)
                const isCancelled = booking.status === 'CANCELLED'
                const needsPayment = !booking.deposit_paid && booking.status !== 'CANCELLED' && booking.status !== 'DELIVERED'
                
                return (
                  <div key={booking.id} className="border rounded-xl p-6 hover:shadow-md transition">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold">{getCampusName(booking.campus)}</h3>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                            <StatusIcon className="size-3" />
                            {status.label}
                          </span>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${paymentStatus.color}`}>
                            {paymentStatus.label}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="size-4" />
                            Collection: {new Date(booking.collection_date).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Package className="size-4" />
                            {booking.total_items} items
                          </span>
                          {booking.payment_reference && (
                            <span className="flex items-center gap-1 text-xs">
                              Ref: {booking.payment_reference}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 flex-wrap">
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Total</p>
                          <p className="font-display text-lg font-bold">R{booking.total_amount.toFixed(2)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Deposit</p>
                          <p className={`font-display text-lg font-bold ${booking.deposit_paid ? 'text-green-600' : 'text-amber-600'}`}>
                            R{booking.deposit_amount.toFixed(2)}
                          </p>
                        </div>
                        {needsPayment && (
                          <button
                            onClick={() => openPaymentModal(booking)}
                            className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition flex items-center gap-1"
                          >
                            <Building2 className="size-4" />
                            Pay Now
                          </button>
                        )}
                        {booking.status !== 'DELIVERED' && (
                          <div className="flex gap-1">
                            <Link
                              href={`/booking/edit/${booking.id}`}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                              title="Edit Booking"
                            >
                              <Edit className="size-4" />
                            </Link>
                            <button
                              onClick={() => {
                                setBookingToCancel(booking.id)
                                setShowCancelModal(true)
                              }}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="Cancel Booking"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="size-16 rounded-full bg-muted/50 grid place-items-center mx-auto mb-4">
                <PackageOpen className="size-8 text-muted-foreground/50" />
              </div>
              <h3 className="font-display font-semibold">No active bookings</h3>
              <p className="text-sm text-muted-foreground mt-1">
                You don't have any active storage bookings.
              </p>
              <Link 
                href="/booking"
                className="inline-block mt-4 bg-brand text-brand-foreground px-6 py-2 rounded-lg hover:opacity-90 transition text-sm"
              >
                Book your first storage
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Payment Details Modal */}
      {showPaymentModal && selectedBookingForPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowPaymentModal(false)}
          />
          
          <div className="relative bg-card rounded-2xl shadow-2xl max-w-2xl w-full p-8 animate-in fade-in zoom-in duration-300 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowPaymentModal(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition"
            >
              <X className="size-5" />
            </button>

            <div className="text-center mb-6">
              <div className="size-16 rounded-full bg-blue-500/10 border-2 border-blue-500 flex items-center justify-center mx-auto mb-4">
                <Building2 className="size-8 text-blue-500" />
              </div>
              <h2 className="font-display text-2xl font-bold">Payment Details</h2>
              <p className="text-muted-foreground text-sm mt-1">
                Please make a 50% deposit of <span className="font-bold text-brand">R{selectedBookingForPayment.deposit_amount.toFixed(2)}</span> to confirm your booking
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Reference: <span className="font-mono font-medium">{selectedBookingForPayment.payment_reference || selectedBookingForPayment.id.slice(0, 8)}</span>
              </p>
            </div>

            <div className="bg-muted/30 rounded-xl p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-background rounded-lg p-4 border">
                  <p className="text-xs text-muted-foreground">Bank Name</p>
                  <p className="font-semibold">{BANK_DETAILS.bankName}</p>
                </div>
                <div className="bg-background rounded-lg p-4 border">
                  <p className="text-xs text-muted-foreground">Account Holder</p>
                  <p className="font-semibold">{BANK_DETAILS.accountName}</p>
                </div>
                <div className="bg-background rounded-lg p-4 border">
                  <p className="text-xs text-muted-foreground">Account Number</p>
                  <div className="flex items-center justify-between">
                    <p className="font-mono font-semibold">{BANK_DETAILS.accountNumber}</p>
                    <button
                      onClick={() => copyToClipboard(BANK_DETAILS.accountNumber, 'account')}
                      className="text-brand hover:text-brand/80 transition"
                    >
                      {copied === 'account' ? <Check className="size-4" /> : <Copy className="size-4" />}
                    </button>
                  </div>
                </div>
                <div className="bg-background rounded-lg p-4 border">
                  <p className="text-xs text-muted-foreground">Branch Code</p>
                  <div className="flex items-center justify-between">
                    <p className="font-mono font-semibold">{BANK_DETAILS.branchCode}</p>
                    <button
                      onClick={() => copyToClipboard(BANK_DETAILS.branchCode, 'branch')}
                      className="text-brand hover:text-brand/80 transition"
                    >
                      {copied === 'branch' ? <Check className="size-4" /> : <Copy className="size-4" />}
                    </button>
                  </div>
                </div>
                <div className="bg-background rounded-lg p-4 border md:col-span-2">
                  <p className="text-xs text-muted-foreground">Branch Name</p>
                  <p className="font-semibold">{BANK_DETAILS.branchName}</p>
                </div>
                <div className="bg-background rounded-lg p-4 border md:col-span-2">
                  <p className="text-xs text-muted-foreground">Payment Reference</p>
                  <div className="flex items-center justify-between">
                    <p className="font-mono font-semibold text-brand">{selectedBookingForPayment.payment_reference || selectedBookingForPayment.id.slice(0, 8)}</p>
                    <button
                      onClick={() => copyToClipboard(selectedBookingForPayment.payment_reference || selectedBookingForPayment.id.slice(0, 8), 'reference')}
                      className="text-brand hover:text-brand/80 transition"
                    >
                      {copied === 'reference' ? <Check className="size-4" /> : <Copy className="size-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Please use this reference when making the payment</p>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
                <p className="font-semibold"> Important:</p>
                <ul className="list-disc list-inside mt-1 space-y-1 text-xs">
                  <li>Send exactly <span className="font-bold">R{selectedBookingForPayment.deposit_amount.toFixed(2)}</span> (50% deposit)</li>
                  <li>Use the reference <span className="font-mono font-bold">{selectedBookingForPayment.payment_reference || selectedBookingForPayment.id.slice(0, 8)}</span></li>
                  <li>After payment, contact us via WhatsApp with proof of payment</li>
                  <li>Your booking will be confirmed once we verify the payment</li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    const whatsappNumber = BANK_DETAILS.whatsapp
                    const message = `Hello Uni-Storage, I've made a deposit of R${selectedBookingForPayment.deposit_amount.toFixed(2)} for booking ${selectedBookingForPayment.payment_reference || selectedBookingForPayment.id.slice(0, 8)}`
                    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank')
                  }}
                  className="flex-1 bg-green-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-600 transition flex items-center justify-center gap-2"
                >
                  <Phone className="size-5" />
                  Contact via WhatsApp
                </button>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 border border-border px-6 py-3 rounded-lg font-medium hover:bg-muted/50 transition"
                >
                  Close
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
                  className="flex-1 bg-red-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-red-700 transition"
                >
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}