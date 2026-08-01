'use client'

import Image from 'next/image'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { RESIDENCES, getResidencesByCampus } from '@/data/residences'
import { 
  ChevronLeft, 
  CheckCircle, 
  Loader2,
  Package,
  Calendar,
  GraduationCap,
  Save,
  X,
  AlertCircle,
  MapPin,
  Home,
  Building2,
  Search,
  Phone,
  Copy,
  Sparkles,
  Clock
} from 'lucide-react'

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-ZA', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
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

const BANK_DETAILS = {
  bankName: 'Standard Bank',
  accountName: 'Faith Makutu',
  accountNumber: '10151432730',
  branchCode: '051001',
  branchName: 'Nelspruit Branch',
  whatsapp: '27791170930',
  email: 'makutufaith@gmail.com'
}

export default function EditBookingPage() {
  const router = useRouter()
  const params = useParams()
  const bookingId = params.id as string
  
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [booking, setBooking] = useState<any>(null)
  const [selectedCampus, setSelectedCampus] = useState<string | null>(null)
  const [collectionDate, setCollectionDate] = useState<Date | null>(null)
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [paymentOption, setPaymentOption] = useState<'full' | 'deposit'>('deposit')
  const [errorMessage, setErrorMessage] = useState('')
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [availableFridays, setAvailableFridays] = useState<Date[]>([])
  const [showCustomDate, setShowCustomDate] = useState(false)
  const [customDate, setCustomDate] = useState<Date | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  // Address-related states
  const [selectedResidence, setSelectedResidence] = useState<string>('')
  const [roomNumber, setRoomNumber] = useState('')
  const [manualAddress, setManualAddress] = useState('')
  const [addressMethod, setAddressMethod] = useState<'residence' | 'manual'>('residence')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    async function loadBooking() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          router.push('/auth')
          return
        }
        
        setUser(user)

        const { data: bookingData, error: bookingError } = await supabase
          .from('bookings')
          .select('*')
          .eq('id', bookingId)
          .eq('user_id', user.id)
          .single()

        if (bookingError) throw bookingError
        
        if (!bookingData) {
          router.push('/dashboard')
          return
        }

        const { data: itemsData, error: itemsError } = await supabase
          .from('booking_items')
          .select('item_type')
          .eq('booking_id', bookingId)

        if (itemsError) throw itemsError

        const fridays = getAvailableFridays()
        setAvailableFridays(fridays)

        setBooking(bookingData)
        setSelectedCampus(bookingData.campus)
        
        const currentDate = new Date(bookingData.collection_date)
        // Check if it's a Friday and not in the past
        if (currentDate.getDay() === 5 && !isDateInPast(currentDate)) {
          setCollectionDate(currentDate)
        } else {
          const firstAvailable = fridays.find(d => !isDateInPast(d))
          setCollectionDate(firstAvailable || null)
        }
        
        setSelectedItems(itemsData.map(item => item.item_type))

        // Set payment option based on booking
        if (bookingData.deposit_paid && bookingData.balance_amount === 0) {
          setPaymentOption('full')
        } else {
          setPaymentOption('deposit')
        }

        // Set address data
        if (bookingData.residence_name) {
          const foundResidence = RESIDENCES.find(r => r.name === bookingData.residence_name)
          if (foundResidence) {
            setSelectedResidence(foundResidence.id)
            setAddressMethod('residence')
          } else {
            setManualAddress(bookingData.address_line || '')
            setAddressMethod('manual')
          }
        } else if (bookingData.address_line) {
          setManualAddress(bookingData.address_line)
          setAddressMethod('manual')
        }
        
        if (bookingData.room_number) {
          setRoomNumber(bookingData.room_number)
        }
        
      } catch (error) {
        console.error('Error loading booking:', error)
        router.push('/dashboard')
      } finally {
        setLoading(false)
      }
    }
    
    loadBooking()
  }, [bookingId, router])

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

  const isSaveDisabled = (): boolean => {
    if (saving) return true
    if (!collectionDate) return true
    if (isDateInPast(collectionDate)) return true
    if (!selectedCampus) return true
    if (selectedItems.length === 0) return true
    if (addressMethod === 'residence' && !selectedResidence) return true
    if (addressMethod === 'manual' && !manualAddress) return true
    return false
  }

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopied(field)
    setTimeout(() => setCopied(null), 2000)
  }

  const handleSaveChanges = async () => {
    setSaving(true)
    setErrorMessage('')
    
    try {
      if (!collectionDate) {
        throw new Error('Please select a collection date')
      }

      if (isDateInPast(collectionDate)) {
        throw new Error('Collection date cannot be in the past')
      }

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

      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          campus: selectedCampus,
          collection_date: collectionDateStr,
          total_items: selectedItems.length,
          total_amount: totalAmount,
          deposit_amount: depositAmount,
          balance_amount: balanceAmount,
          deposit_status: paymentOption === 'full' ? 'PAID' : 'PENDING',
          deposit_paid: paymentOption === 'full',
          residence_name: residenceName || null,
          room_number: roomNumber || null,
          address_line: addressLine || manualAddress || null,
          city: 'Nelspruit'
        })
        .eq('id', bookingId)
        .eq('user_id', user.id)

      if (updateError) throw updateError

      const { error: deleteError } = await supabase
        .from('booking_items')
        .delete()
        .eq('booking_id', bookingId)

      if (deleteError) throw deleteError

      const itemsToInsert = selectedItems.map(item => ({
        booking_id: bookingId,
        item_type: item,
        description: `${item} storage`
      }))

      const { error: itemsError } = await supabase
        .from('booking_items')
        .insert(itemsToInsert)

      if (itemsError) throw itemsError

      setShowSuccessModal(true)
      
    } catch (error: any) {
      console.error('Update error:', error)
      setErrorMessage(error.message || 'Failed to update booking. Please try again.')
      setShowErrorModal(true)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="size-12 animate-spin text-brand mx-auto mb-4" />
          <p className="text-muted-foreground">Loading booking details...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
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
              <h1 className="font-display text-2xl font-bold">Edit Booking</h1>
              <span className="text-sm text-muted-foreground">Ref: {booking?.id?.slice(0, 8)}</span>
            </div>
            <div className="flex gap-2">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className="h-2 flex-1 rounded-full bg-brand"
                />
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Update your booking details below. All fields are editable.
            </p>
          </div>

          {/* Campus Selection */}
          <div className="space-y-6 mb-8">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-lg bg-brand/10 text-brand grid place-items-center">
                <GraduationCap className="size-5" />
              </div>
              <div>
                <h2 className="font-display text-xl font-semibold">Campus</h2>
                <p className="text-sm text-muted-foreground">Update your pickup location</p>
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
          </div>

          {/* Collection Date - Flexible */}
          <div className="space-y-6 mb-8">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-lg bg-brand/10 text-brand grid place-items-center">
                <Calendar className="size-5" />
              </div>
              <div>
                <h2 className="font-display text-xl font-semibold">Collection Date</h2>
                <p className="text-sm text-muted-foreground">Select any date that works for you</p>
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
                  const displayDate = formatDate(date.toISOString())
                  const isToday = date.toDateString() === new Date().toDateString()
                  
                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => !isPast && setCollectionDate(date)}
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
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {index === 0 && !isPast ? 'Next available ' : 
                             isPast ? ' This date has passed' :
                             `${index + 1} weeks from now`}
                          </p>
                        </div>
                        {isSelected && !isPast && (
                          <CheckCircle className="size-5 text-brand" />
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
          </div>

          {/* Address Section */}
          <div className="space-y-6 mb-8">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-lg bg-brand/10 text-brand grid place-items-center">
                <MapPin className="size-5" />
              </div>
              <div>
                <h2 className="font-display text-xl font-semibold">Address</h2>
                <p className="text-sm text-muted-foreground">Update your residence address</p>
              </div>
            </div>

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
          </div>

          {/* Items */}
          <div className="space-y-6 mb-8">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-lg bg-brand/10 text-brand grid place-items-center">
                <Package className="size-5" />
              </div>
              <div>
                <h2 className="font-display text-xl font-semibold">Items</h2>
                <p className="text-sm text-muted-foreground">
                  Update what you're storing. Base package includes up to 2 items. Extra items +R50 each.
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
          </div>

          {/* Summary with Payment Options */}
          <div className="bg-muted/30 rounded-xl p-6 space-y-4 mb-8">
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

            <div className="space-y-3">
              <p className="text-sm font-medium">Choose Payment Option</p>
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

            {paymentOption === 'deposit' && (
              <button
                onClick={() => setShowPaymentModal(true)}
                className="w-full mt-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition flex items-center justify-center gap-2 text-sm"
              >
                <Building2 className="size-4" />
                View Banking Details
              </button>
            )}
          </div>

          <div className="flex gap-4">
            <Link
              href="/dashboard"
              className="flex-1 border border-border px-6 py-3 rounded-lg font-medium hover:bg-muted/50 transition text-center"
            >
              Cancel
            </Link>
            <button
              onClick={handleSaveChanges}
              disabled={isSaveDisabled()}
              className="flex-1 bg-brand text-brand-foreground px-6 py-3 rounded-lg font-medium hover:opacity-90 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  Save Changes
                  <Save className="size-4" />
                </>
              )}
            </button>
          </div>
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
                Please make a 50% deposit of <span className="font-bold text-brand">R{(getTotalPrice() / 2).toFixed(2)}</span> to confirm your booking
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Reference: <span className="font-mono font-medium">{booking?.id?.slice(0, 8)}</span>
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
                      {copied === 'account' ? <CheckCircle className="size-4" /> : <Copy className="size-4" />}
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
                      {copied === 'branch' ? <CheckCircle className="size-4" /> : <Copy className="size-4" />}
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
                    <p className="font-mono font-semibold text-brand">{booking?.id?.slice(0, 8)}</p>
                    <button
                      onClick={() => copyToClipboard(booking?.id?.slice(0, 8) || '', 'reference')}
                      className="text-brand hover:text-brand/80 transition"
                    >
                      {copied === 'reference' ? <CheckCircle className="size-4" /> : <Copy className="size-4" />}
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
                  <li>Send exactly <span className="font-bold">R{(getTotalPrice() / 2).toFixed(2)}</span> (50% deposit)</li>
                  <li>Use the reference <span className="font-mono font-bold">{booking?.id?.slice(0, 8)}</span></li>
                  <li><strong>Send proof of payment to WhatsApp: 0791170930</strong></li>
                  <li>Your booking will be confirmed once we verify the payment</li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    const whatsappNumber = BANK_DETAILS.whatsapp
                    const message = `Hello Uni-Storage, I've made a deposit of R${(getTotalPrice() / 2).toFixed(2)} for booking ${booking?.id?.slice(0, 8)}`
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

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowSuccessModal(false)} />
          
          <div className="relative bg-card rounded-2xl shadow-2xl max-w-md w-full p-8 animate-in fade-in zoom-in duration-300">
            <button
              onClick={() => setShowSuccessModal(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition"
            >
              <X className="size-5" />
            </button>

            <div className="text-center">
              <div className="size-16 rounded-full bg-green-500/10 border-2 border-green-500 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="size-8 text-green-500" />
              </div>
              
              <h2 className="font-display text-2xl font-bold text-green-600 mb-2">Booking Updated!</h2>
              <p className="text-muted-foreground text-sm">
                Your booking has been successfully updated.
              </p>
              
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => {
                    setShowSuccessModal(false)
                    router.push('/dashboard')
                  }}
                  className="flex-1 bg-brand text-brand-foreground px-4 py-2.5 rounded-lg font-medium hover:opacity-90 transition"
                >
                  Go to Dashboard
                </button>
                <button
                  onClick={() => {
                    setShowSuccessModal(false)
                    router.push('/bookings')
                  }}
                  className="flex-1 border border-border px-4 py-2.5 rounded-lg font-medium hover:bg-muted/50 transition"
                >
                  View Bookings
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowErrorModal(false)} />
          
          <div className="relative bg-card rounded-2xl shadow-2xl max-w-md w-full p-8 animate-in fade-in zoom-in duration-300">
            <button
              onClick={() => setShowErrorModal(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition"
            >
              <X className="size-5" />
            </button>

            <div className="text-center">
              <div className="size-16 rounded-full bg-red-500/10 border-2 border-red-500 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="size-8 text-red-500" />
              </div>
              
              <h2 className="font-display text-2xl font-bold text-red-600 mb-2">Update Failed</h2>
              <div className="bg-red-50 dark:bg-red-950/20 rounded-xl p-4 mb-4">
                <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
              </div>
              
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => {
                    setShowErrorModal(false)
                  }}
                  className="flex-1 border border-border px-4 py-2.5 rounded-lg font-medium hover:bg-muted/50 transition"
                >
                  Try Again
                </button>
                <button
                  onClick={() => {
                    setShowErrorModal(false)
                    router.push('/dashboard')
                  }}
                  className="flex-1 bg-brand text-brand-foreground px-4 py-2.5 rounded-lg font-medium hover:opacity-90 transition"
                >
                  Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}