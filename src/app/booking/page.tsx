'use client'

import Image from 'next/image'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { RESIDENCES, getResidencesByCampus } from '@/data/residences'
import { 
  ChevronLeft, 
  CheckCircle, 
  Loader2,
  Package,
  Calendar,
  GraduationCap,
  Sparkles,
  ArrowRight,
  AlertCircle,
  X,
  Clock,
  Phone,
  Building2,
  Copy,
  MapPin,
  Home,
  Search,
  Check
} from 'lucide-react'

function generateBookingReference() {
  const date = new Date()
  const year = date.getFullYear().toString().slice(-2)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0')
  return `UNI-${year}${month}${day}-${random}`
}

function getAvailableFridays(): Date[] {
  const fridays: Date[] = []
  const today = new Date()
  const currentDay = today.getDay()
  
  if (currentDay === 5) {
    fridays.push(new Date(today))
    for (let i = 1; i <= 3; i++) {
      const nextFriday = new Date(today)
      nextFriday.setDate(today.getDate() + (i * 7))
      fridays.push(nextFriday)
    }
  } else {
    const daysUntilFriday = (5 - currentDay + 7) % 7
    const nextFriday = new Date(today)
    nextFriday.setDate(today.getDate() + daysUntilFriday)
    
    for (let i = 0; i < 4; i++) {
      const friday = new Date(nextFriday)
      friday.setDate(nextFriday.getDate() + (i * 7))
      fridays.push(friday)
    }
  }
  
  return fridays
}

function isDateInPast(date: Date): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const checkDate = new Date(date)
  checkDate.setHours(0, 0, 0, 0)
  return checkDate < today
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-ZA', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
}

const BANK_DETAILS = {
  bankName: 'Standard Bank',
  accountName: 'Faith Makutu',
  accountNumber: '10151432730',
  branchCode: '051001',
  branchName: 'Nelspruit Branch',
  reference: 'UNI-BOOKING-REF',
  whatsapp: '27791170930',
  email: 'makutufaith@gmail.com'
}

export default function BookingPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState(1)
  const [selectedCampus, setSelectedCampus] = useState<string | null>(null)
  const [collectionDate, setCollectionDate] = useState<Date | null>(null)
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [bookingReference, setBookingReference] = useState('')
  const [bookingTotal, setBookingTotal] = useState(0)
  const [bookingDeposit, setBookingDeposit] = useState(0)
  const [errorMessage, setErrorMessage] = useState('')
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [availableFridays, setAvailableFridays] = useState<Date[]>([])
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [bookingId, setBookingId] = useState<string>('')
  const [paymentOption, setPaymentOption] = useState<'full' | 'deposit'>('deposit')
  const [showCustomDate, setShowCustomDate] = useState(false)
  const [customDate, setCustomDate] = useState<Date | null>(null)
  const router = useRouter()

  // Address-related states
  const [selectedResidence, setSelectedResidence] = useState<string>('')
  const [roomNumber, setRoomNumber] = useState('')
  const [manualAddress, setManualAddress] = useState('')
  const [addressMethod, setAddressMethod] = useState<'residence' | 'manual'>('residence')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    async function loadUser() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          router.push('/auth')
          return
        }
        
        const fridays = getAvailableFridays()
        setAvailableFridays(fridays)
        
        // Default to first available Friday
        const firstAvailable = fridays.find(d => !isDateInPast(d))
        if (firstAvailable) {
          setCollectionDate(firstAvailable)
        }
        
        // Check if user has a profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profileError && profileError.code === 'PGRST116') {
          await supabase
            .from('profiles')
            .insert({
              id: user.id,
              full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Student',
              student_number: `STU${Date.now().toString().slice(-6)}`,
              campus: 'UMP',
              phone_number: 'Not provided'
            })
        }
        
        setUser(user)
      } catch (error) {
        console.error('Error loading user:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadUser()
  }, [router])

  const handleItemToggle = (item: string) => {
    setSelectedItems(prev =>
      prev.includes(item)
        ? prev.filter(i => i !== item)
        : [...prev, item]
    )
  }

  const getStoragePrice = () => {
    const storageFee = 300
    const extraItemFee = 50
    const itemCount = selectedItems.length
    const extraItems = Math.max(0, itemCount - 2)
    return storageFee + (extraItems * extraItemFee)
  }

  const getTotalPrice = () => {
    const collectionFee = 150
    return getStoragePrice() + collectionFee
  }

  const isNextDisabled = (): boolean => {
    if (step === 1 && !selectedCampus) return true
    if (step === 2 && !collectionDate) return true
    if (step === 2 && collectionDate && isDateInPast(collectionDate)) return true
    if (step === 3 && selectedItems.length === 0) return true
    if (step === 4) {
      if (addressMethod === 'residence' && !selectedResidence) return true
      if (addressMethod === 'manual' && !manualAddress) return true
    }
    return false
  }

  const handleConfirmBooking = async () => {
    setIsSubmitting(true)
    setErrorMessage('')
    
    try {
      if (!collectionDate) {
        throw new Error('Please select a collection date')
      }

      // Allow any date (no longer restricted to Fridays only)
      if (isDateInPast(collectionDate)) {
        throw new Error('Collection date cannot be in the past')
      }

      // Get address details
      let addressLine = ''
      let residenceName = ''
      
      if (addressMethod === 'residence') {
        const residence = RESIDENCES.find(r => r.id === selectedResidence)
        if (residence) {
          residenceName = residence.name
          addressLine = residence.address
          if (roomNumber) {
            addressLine = `${roomNumber}, ${residence.address}`
          }
        }
      } else {
        addressLine = manualAddress
      }

      const collectionDateStr = collectionDate.toISOString().split('T')[0]
      const totalAmount = getTotalPrice()
      const depositAmount = paymentOption === 'deposit' ? totalAmount / 2 : totalAmount
      const balanceAmount = paymentOption === 'deposit' ? totalAmount / 2 : 0
      const reference = generateBookingReference()

      // Insert booking with address
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          user_id: user.id,
          campus: selectedCampus,
          collection_date: collectionDateStr,
          delivery_date: null,
          total_items: selectedItems.length,
          total_amount: totalAmount,
          deposit_amount: depositAmount,
          balance_amount: balanceAmount,
          deposit_status: paymentOption === 'full' ? 'PAID' : 'PENDING',
          balance_status: 'PENDING',
          status: 'CONFIRMED',
          payment_reference: reference,
          deposit_paid: paymentOption === 'full',
          residence_name: residenceName || null,
          room_number: roomNumber || null,
          address_line: addressLine || manualAddress || null,
          city: 'Nelspruit'
        })
        .select()
        .single()

      if (bookingError) throw bookingError

      const itemsToInsert = selectedItems.map(item => ({
        booking_id: booking.id,
        item_type: item,
        description: `${item} storage`
      }))

      const { error: itemsError } = await supabase
        .from('booking_items')
        .insert(itemsToInsert)

      if (itemsError) throw itemsError

      // Set booking details
      setBookingId(booking.id)
      setBookingReference(reference)
      setBookingTotal(totalAmount)
      setBookingDeposit(depositAmount)
      
      // Show payment modal
      setShowPaymentModal(true)
      setStep(6)
      
    } catch (error: any) {
      console.error('Booking error:', error)
      setErrorMessage(error.message || 'Failed to create booking. Please try again.')
      setShowErrorModal(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopied(field)
    setTimeout(() => setCopied(null), 2000)
  }

  const handlePaymentConfirmed = async () => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          deposit_paid: true,
          deposit_status: 'PAID',
          payment_date: new Date().toISOString(),
          payment_method: 'bank_transfer'
        })
        .eq('id', bookingId)

      if (error) throw error

      setShowPaymentModal(false)
      router.push('/dashboard')
    } catch (error) {
      console.error('Error updating payment status:', error)
      alert('Failed to update payment status. Please contact support.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="size-12 animate-spin text-brand mx-auto mb-4" />
          <p className="text-muted-foreground">Loading booking form...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="relative size-8 rounded-lg overflow-hidden flex-shrink-0">
              <Image
                src="/images/logo.jpg"
                alt="Uni-Storage Logo"
                fill
                className="object-contain"
                priority
                sizes="(max-width: 768px) 100vw, 33vw"
              />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-display text-lg font-bold">Uni-Storage</span>
              <span className="text-[9px] text-muted-foreground hidden sm:block">
                Your Belongings, Safely Stored
              </span>
            </div>
          </Link>
          <div className="flex-1" />
          <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition">
            ← Dashboard
          </Link>
        </div>

        <div className="bg-card border rounded-2xl shadow-xl p-8">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <h1 className="font-display text-2xl font-bold">Book Your Storage</h1>
              <span className="text-sm text-muted-foreground">Step {step} of 6</span>
            </div>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5, 6].map((s) => (
                <div
                  key={s}
                  className={`h-2 flex-1 rounded-full transition ${
                    s <= step ? 'bg-brand' : 'bg-muted'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Step 1: Campus Selection */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-lg bg-brand/10 text-brand grid place-items-center">
                  <GraduationCap className="size-5" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-semibold">Select Your Campus</h2>
                  <p className="text-sm text-muted-foreground">Choose where you need pickup from</p>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => setSelectedCampus('UMP')}
                  className={`w-full p-4 border-2 rounded-xl transition text-left ${
                    selectedCampus === 'UMP'
                      ? 'border-brand bg-brand/5'
                      : 'border-border hover:border-brand/50 hover:bg-muted/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-lg bg-blue-100 text-blue-600 grid place-items-center">
                      <GraduationCap className="size-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold">University of Mpumalanga</h3>
                      <p className="text-sm text-muted-foreground">Friday pickups from res gates</p>
                    </div>
                    {selectedCampus === 'UMP' && (
                      <CheckCircle className="size-5 text-brand ml-auto" />
                    )}
                  </div>
                </button>

                <button
                  onClick={() => setSelectedCampus('TUT Nelspruit')}
                  className={`w-full p-4 border-2 rounded-xl transition text-left ${
                    selectedCampus === 'TUT Nelspruit'
                      ? 'border-brand bg-brand/5'
                      : 'border-border hover:border-brand/50 hover:bg-muted/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-lg bg-purple-100 text-purple-600 grid place-items-center">
                      <GraduationCap className="size-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold">TUT Nelspruit Campus</h3>
                      <p className="text-sm text-muted-foreground">Friday pickups from res gates</p>
                    </div>
                    {selectedCampus === 'TUT Nelspruit' && (
                      <CheckCircle className="size-5 text-brand ml-auto" />
                    )}
                  </div>
                </button>
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={isNextDisabled()}
                className="w-full bg-brand text-brand-foreground px-6 py-3 rounded-lg font-medium hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                Next Step
                <ArrowRight className="size-4" />
              </button>
            </div>
          )}

          {/* Step 2: Select Collection Date - Flexible */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-lg bg-brand/10 text-brand grid place-items-center">
                  <Calendar className="size-5" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-semibold">Select Collection Date</h2>
                  <p className="text-sm text-muted-foreground">
                    Choose any date that works for you. Fridays are our regular collection days.
                  </p>
                </div>
              </div>

              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setShowCustomDate(false)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition ${
                    !showCustomDate
                      ? 'bg-brand text-brand-foreground shadow-sm'
                      : 'bg-muted hover:bg-muted/70'
                  }`}
                >
                  <Calendar className="size-4 inline mr-2" />
                  Suggested Fridays
                </button>
                <button
                  onClick={() => setShowCustomDate(true)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition ${
                    showCustomDate
                      ? 'bg-brand text-brand-foreground shadow-sm'
                      : 'bg-muted hover:bg-muted/70'
                  }`}
                >
                  <Clock className="size-4 inline mr-2" />
                  Pick Any Date
                </button>
              </div>

              {!showCustomDate ? (
                <div className="space-y-3">
                  {availableFridays.map((date, index) => {
                    const isPast = isDateInPast(date)
                    const isSelected = collectionDate && collectionDate.getTime() === date.getTime()
                    const displayDate = formatDate(date)
                    const isToday = date.toDateString() === new Date().toDateString()
                    
                    return (
                      <button
                        key={index}
                        type="button"
                        onClick={() => {
                          if (!isPast) {
                            setCollectionDate(date)
                            setCustomDate(null)
                          }
                        }}
                        disabled={isPast}
                        className={`w-full p-4 border-2 rounded-xl transition text-left ${
                          isSelected
                            ? 'border-brand bg-brand/5 ring-2 ring-brand/20'
                            : isPast
                            ? 'border-border bg-muted/30 opacity-50 cursor-not-allowed'
                            : 'border-border hover:border-brand/50 hover:bg-muted/30 cursor-pointer'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold flex items-center gap-2">
                              {displayDate}
                              {isToday && !isPast && (
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                  Today
                                </span>
                              )}
                              {isPast && (
                                <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                                  Past
                                </span>
                              )}
                              {isSelected && !isPast && (
                                <span className="text-xs bg-brand/20 text-brand px-2 py-0.5 rounded-full">
                                  Selected ✓
                                </span>
                              )}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {index === 0 && !isPast ? 'Next available ' : 
                               isPast ? '⚠️ This date has passed' :
                               `${index + 1} weeks from now`}
                            </p>
                          </div>
                          {isSelected && !isPast && (
                            <CheckCircle className="size-6 text-brand flex-shrink-0" />
                          )}
                          {!isSelected && !isPast && (
                            <div className="size-6 rounded-full border-2 border-muted-foreground/20 flex-shrink-0" />
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground/80">
                      Select Any Date
                    </label>
                    <input
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      value={customDate ? customDate.toISOString().split('T')[0] : ''}
                      onChange={(e) => {
                        if (e.target.value) {
                          const date = new Date(e.target.value)
                          setCustomDate(date)
                          setCollectionDate(date)
                        }
                      }}
                      className="w-full px-4 py-2.5 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand transition"
                    />
                    <p className="text-xs text-muted-foreground">
                      Note: We normally collect on Fridays. We'll confirm your requested date.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="border border-border px-6 py-3 rounded-lg font-medium hover:bg-muted/50 transition flex items-center gap-2"
                >
                  <ChevronLeft className="size-4" />
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (collectionDate && !isDateInPast(collectionDate)) {
                      setStep(3)
                    }
                  }}
                  disabled={!collectionDate || isDateInPast(collectionDate)}
                  className="flex-1 bg-brand text-brand-foreground px-6 py-3 rounded-lg font-medium hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  Next Step
                  <ArrowRight className="size-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Select Items */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-lg bg-brand/10 text-brand grid place-items-center">
                  <Package className="size-5" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-semibold">What are you storing?</h2>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">R300</span> storage for up to 2 items. 
                    <span className="font-medium"> R50</span> per extra item. 
                    <span className="font-medium"> R150</span> collection & delivery.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {['Box', 'Suitcase', 'Mini-Fridge', 'Other'].map((item) => (
                  <button
                    key={item}
                    onClick={() => handleItemToggle(item)}
                    className={`p-4 border-2 rounded-xl transition text-left ${
                      selectedItems.includes(item)
                        ? 'border-brand bg-brand/5'
                        : 'border-border hover:border-brand/50 hover:bg-muted/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{item}</span>
                      {selectedItems.includes(item) && (
                        <CheckCircle className="size-5 text-brand" />
                      )}
                    </div>
                  </button>
                ))}
              </div>

              <div className="bg-muted/30 rounded-xl p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Items selected:</span>
                  <span className="font-semibold">{selectedItems.length} / 12</span>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setStep(2)}
                  className="border border-border px-6 py-3 rounded-lg font-medium hover:bg-muted/50 transition flex items-center gap-2"
                >
                  <ChevronLeft className="size-4" />
                  Back
                </button>
                <button
                  onClick={() => setStep(4)}
                  disabled={isNextDisabled()}
                  className="flex-1 bg-brand text-brand-foreground px-6 py-3 rounded-lg font-medium hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  Next Step
                  <ArrowRight className="size-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Address Selection */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-lg bg-brand/10 text-brand grid place-items-center">
                  <MapPin className="size-5" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-semibold">Where are you staying?</h2>
                  <p className="text-sm text-muted-foreground">
                    We'll collect your items from your residence on the selected date.
                  </p>
                </div>
              </div>

              {/* Address Method Toggle - Improved visibility */}
              <div className="grid grid-cols-2 gap-2 bg-muted/30 rounded-lg p-1">
                <button
                  onClick={() => setAddressMethod('residence')}
                  className={`py-3 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2 ${
                    addressMethod === 'residence'
                      ? 'bg-brand text-brand-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  <Home className="size-4" />
                  Select Residence
                </button>
                <button
                  onClick={() => setAddressMethod('manual')}
                  className={`py-3 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2 ${
                    addressMethod === 'manual'
                      ? 'bg-brand text-brand-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  <Building2 className="size-4" />
                  Enter Address
                </button>
              </div>

              {/* Residence Selection */}
              {addressMethod === 'residence' && (
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search for your residence..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand transition"
                    />
                  </div>

                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {getResidencesByCampus(selectedCampus || 'UMP')
                      .filter(res => res.name.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map((residence) => (
                        <button
                          key={residence.id}
                          onClick={() => setSelectedResidence(residence.id)}
                          className={`w-full p-4 border-2 rounded-xl transition text-left ${
                            selectedResidence === residence.id
                              ? 'border-brand bg-brand/5'
                              : 'border-border hover:border-brand/50 hover:bg-muted/30'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-semibold">{residence.name}</h3>
                              <p className="text-sm text-muted-foreground">{residence.address}</p>
                            </div>
                            {selectedResidence === residence.id && (
                              <CheckCircle className="size-5 text-brand flex-shrink-0" />
                            )}
                          </div>
                        </button>
                      ))}
                    {getResidencesByCampus(selectedCampus || 'UMP').length === 0 && (
                      <p className="text-center text-muted-foreground py-4">
                        No residences found for this campus. Please enter your address manually.
                      </p>
                    )}
                  </div>

                  {/* Room Number */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground/80">
                      Room / Unit Number (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Room 101, Block A"
                      value={roomNumber}
                      onChange={(e) => setRoomNumber(e.target.value)}
                      className="w-full px-4 py-2.5 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand transition"
                    />
                  </div>
                </div>
              )}

              {/* Manual Address Entry */}
              {addressMethod === 'manual' && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground/80">
                      Full Address *
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. 123 College Street, Nelspruit"
                        value={manualAddress}
                        onChange={(e) => setManualAddress(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand transition"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Enter your full residence address for collection.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="border border-border px-6 py-3 rounded-lg font-medium hover:bg-muted/50 transition flex items-center gap-2"
                >
                  <ChevronLeft className="size-4" />
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(5)}
                  disabled={
                    (addressMethod === 'residence' && !selectedResidence) ||
                    (addressMethod === 'manual' && !manualAddress)
                  }
                  className="flex-1 bg-brand text-brand-foreground px-6 py-3 rounded-lg font-medium hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  Next Step
                  <ArrowRight className="size-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 5: Summary with Payment Options */}
          {step === 5 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-lg bg-brand/10 text-brand grid place-items-center">
                  <Sparkles className="size-5" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-semibold">Booking Summary</h2>
                  <p className="text-sm text-muted-foreground">Review your booking details</p>
                </div>
              </div>

              <div className="bg-muted/30 rounded-xl p-6 space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Campus</span>
                  <span className="font-medium">
                    {selectedCampus === 'UMP' ? 'University of Mpumalanga' : 'TUT Nelspruit'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Collection Date</span>
                  <span className="font-medium">
                    {collectionDate ? formatDate(collectionDate) : 'Not selected'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Address</span>
                  <span className="font-medium">
                    {addressMethod === 'residence' 
                      ? RESIDENCES.find(r => r.id === selectedResidence)?.name || 'Not selected'
                      : manualAddress || 'Not entered'
                    }
                  </span>
                </div>
                {roomNumber && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Room</span>
                    <span className="font-medium">{roomNumber}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Items</span>
                  <span className="font-medium">{selectedItems.join(', ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Items</span>
                  <span className="font-medium">{selectedItems.length}</span>
                </div>
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span>Storage (up to 2 items)</span>
                    <span className="font-medium">R300.00</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Extra items ({Math.max(0, selectedItems.length - 2)} × R50)</span>
                    <span>R{Math.max(0, selectedItems.length - 2) * 50}.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Collection & Delivery</span>
                    <span className="font-medium">R150.00</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-4">
                    <span>Total</span>
                    <span className="text-brand">R{getTotalPrice()}.00</span>
                  </div>
                </div>
              </div>

              {/* Payment Options - User chooses */}
              <div className="space-y-3">
                <p className="text-sm font-medium">Choose Your Payment Option</p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setPaymentOption('full')}
                    className={`border-2 rounded-xl p-4 text-center transition ${
                      paymentOption === 'full'
                        ? 'border-brand bg-brand/5 ring-2 ring-brand/20'
                        : 'border-border hover:border-brand/50'
                    }`}
                  >
                    <p className="text-sm text-muted-foreground">Pay in Full</p>
                    <p className="font-display text-xl font-bold text-green-600">R{getTotalPrice()}.00</p>
                    <p className="text-xs text-muted-foreground">✓ No balance due</p>
                  </button>
                  <button
                    onClick={() => setPaymentOption('deposit')}
                    className={`border-2 rounded-xl p-4 text-center transition ${
                      paymentOption === 'deposit'
                        ? 'border-brand bg-brand/5 ring-2 ring-brand/20'
                        : 'border-border hover:border-brand/50'
                    }`}
                  >
                    <p className="text-sm text-muted-foreground">50% Deposit</p>
                    <p className="font-display text-xl font-bold text-amber-600">R{getTotalPrice() / 2}.00</p>
                    <p className="text-xs text-muted-foreground">Balance before delivery</p>
                  </button>
                </div>
                {paymentOption === 'deposit' && (
                  <p className="text-xs text-center text-muted-foreground">
                    Balance of R{getTotalPrice() / 2}.00 due before delivery
                  </p>
                )}
                {paymentOption === 'full' && (
                  <p className="text-xs text-center text-green-600">
                     Pay once, no balance due
                  </p>
                )}
              </div>

              <div className="bg-brand/5 border border-brand/20 rounded-xl p-4">
                <p className="text-sm text-center text-muted-foreground">
                   Delivery will be arranged via WhatsApp between you and the Uni-Storage team.
                  We'll coordinate a convenient time for your items to be returned.
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setStep(4)}
                  className="border border-border px-6 py-3 rounded-lg font-medium hover:bg-muted/50 transition flex items-center gap-2"
                >
                  <ChevronLeft className="size-4" />
                  Back
                </button>
                <button
                  onClick={handleConfirmBooking}
                  disabled={isSubmitting}
                  className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Confirm Booking
                      <CheckCircle className="size-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 6: Confirmation */}
          {step === 6 && (
            <div className="text-center py-8 space-y-6">
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-green-500/20 rounded-full blur-2xl animate-pulse"></div>
                <div className="relative size-24 rounded-full bg-green-500/10 border-4 border-green-500 flex items-center justify-center mx-auto">
                  <CheckCircle className="size-12 text-green-500" />
                </div>
              </div>
              
              <div>
                <h2 className="font-display text-3xl font-bold">Booking Confirmed! </h2>
                <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
                  {paymentOption === 'full' 
                    ? 'Your storage has been booked and paid in full!'
                    : 'Your storage has been booked. Please make the deposit payment to confirm your booking.'
                  }
                </p>
              </div>

              <div className="bg-muted/30 rounded-xl p-6 max-w-sm mx-auto text-left space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Reference</span>
                  <span className="font-mono font-medium">{bookingReference}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Campus</span>
                  <span className="font-medium">{selectedCampus === 'UMP' ? 'University of Mpumalanga' : 'TUT Nelspruit'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Items</span>
                  <span className="font-medium">{selectedItems.length} items</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Collection</span>
                  <span className="font-medium">{collectionDate ? formatDate(collectionDate) : 'N/A'}</span>
                </div>
                <div className="flex justify-between text-sm border-t pt-2">
                  <span className="text-muted-foreground">Payment</span>
                  <span className={`font-medium ${paymentOption === 'full' ? 'text-green-600' : 'text-amber-600'}`}>
                    {paymentOption === 'full' ? 'Paid in Full' : `Deposit Due: R${bookingDeposit}.00`}
                  </span>
                </div>
              </div>

              {paymentOption === 'deposit' && (
                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="w-full max-w-sm mx-auto bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition flex items-center justify-center gap-2"
                >
                  <Building2 className="size-5" />
                  View Payment Details
                </button>
              )}

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="bg-brand text-brand-foreground px-8 py-3 rounded-lg font-medium hover:opacity-90 transition"
                >
                  Go to Dashboard
                </button>
                <button
                  onClick={() => router.push('/')}
                  className="border border-border px-8 py-3 rounded-lg font-medium hover:bg-muted/50 transition"
                >
                  Return Home
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 text-center text-xs text-muted-foreground/60">
          <p>Uni-Storage — Your Belongings, Safely Stored</p>
        </div>
      </div>

      {/* Payment Details Modal */}
      {showPaymentModal && (
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
                {paymentOption === 'deposit' 
                  ? `Please make a 50% deposit of R${bookingDeposit}.00 to confirm your booking`
                  : 'Payment confirmed! Thank you for paying in full.'
                }
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Reference: <span className="font-mono font-medium">{bookingReference}</span>
              </p>
            </div>

            {paymentOption === 'deposit' ? (
              <>
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
                        <p className="font-mono font-semibold text-brand">{bookingReference}</p>
                        <button
                          onClick={() => copyToClipboard(bookingReference, 'reference')}
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
                    <p className="font-semibold"> Proof of Payment Required:</p>
                    <ul className="list-disc list-inside mt-1 space-y-1 text-xs">
                      <li>Send exactly <span className="font-bold">R{bookingDeposit}.00</span></li>
                      <li>Use the reference <span className="font-mono font-bold">{bookingReference}</span></li>
                      <li><strong>Send proof of payment to WhatsApp: 0791170930</strong></li>
                      <li>Your booking will be confirmed once we verify the payment</li>
                    </ul>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={handlePaymentConfirmed}
                      className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="size-5" />
                      I've Made the Payment
                    </button>
                    <button
                      onClick={() => {
                        const whatsappNumber = BANK_DETAILS.whatsapp
                        const message = `Hello Uni-Storage, I've made a deposit of R${bookingDeposit} for booking ${bookingReference}`
                        window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank')
                      }}
                      className="flex-1 bg-green-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-600 transition flex items-center justify-center gap-2"
                    >
                      <Phone className="size-5" />
                      Contact via WhatsApp
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                <CheckCircle className="size-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-green-700">Payment Complete!</h3>
                <p className="text-green-600 mt-2">Your booking is fully paid and confirmed.</p>
                <p className="text-sm text-green-500 mt-1">Reference: {bookingReference}</p>
              </div>
            )}

            <button
              onClick={() => setShowPaymentModal(false)}
              className="w-full mt-4 border border-border px-6 py-2.5 rounded-lg font-medium hover:bg-muted/50 transition text-sm"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowErrorModal(false)}
          />
          
          <div className="relative bg-card rounded-2xl shadow-2xl max-w-md w-full p-8 animate-in fade-in zoom-in duration-300">
            <button
              onClick={() => setShowErrorModal(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition"
            >
              <X className="size-5" />
            </button>

            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="absolute inset-0 bg-red-500/20 rounded-full blur-xl animate-pulse"></div>
                <div className="relative size-20 rounded-full bg-red-500/10 border-2 border-red-500 flex items-center justify-center">
                  <AlertCircle className="size-10 text-red-500" />
                </div>
              </div>
            </div>

            <div className="text-center">
              <h2 className="font-display text-2xl font-bold text-red-600 mb-2">Booking Failed</h2>
              
              <div className="bg-red-50 dark:bg-red-950/20 rounded-xl p-4 mb-4">
                <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
              </div>

              <p className="text-sm text-muted-foreground">Here are a few things you can try:</p>
              <ul className="text-sm text-muted-foreground text-left list-disc list-inside mt-2 space-y-1">
                <li>Check your internet connection</li>
                <li>Make sure you're signed in</li>
                <li>Try selecting your items again</li>
              </ul>
              
              <div className="mt-6 flex flex-col gap-3">
                <button
                  onClick={() => {
                    setShowErrorModal(false)
                    setStep(3)
                  }}
                  className="w-full bg-brand text-brand-foreground py-2.5 rounded-lg font-medium hover:opacity-90 transition"
                >
                  Try Again
                </button>
                <button
                  onClick={() => {
                    setShowErrorModal(false)
                    router.push('/dashboard')
                  }}
                  className="w-full text-sm text-muted-foreground hover:text-foreground transition"
                >
                  Return to Dashboard →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}