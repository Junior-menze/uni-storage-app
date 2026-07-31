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
  Search
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
  const [errorMessage, setErrorMessage] = useState('')
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [availableFridays, setAvailableFridays] = useState<Date[]>([])
  const [originalBooking, setOriginalBooking] = useState<any>(null)

  // Address-related states
  const [selectedResidence, setSelectedResidence] = useState<string>('')
  const [roomNumber, setRoomNumber] = useState('')
  const [manualAddress, setManualAddress] = useState('')
  const [addressMethod, setAddressMethod] = useState<'residence' | 'manual'>('residence')
  const [searchQuery, setSearchQuery] = useState('')
  const [originalAddressMethod, setOriginalAddressMethod] = useState<'residence' | 'manual'>('residence')

  useEffect(() => {
    async function loadBooking() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          router.push('/auth')
          return
        }
        
        setUser(user)

        // Fetch booking details
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

        // Fetch booking items
        const { data: itemsData, error: itemsError } = await supabase
          .from('booking_items')
          .select('item_type')
          .eq('booking_id', bookingId)

        if (itemsError) throw itemsError

        // Get available Fridays
        const fridays = getAvailableFridays()
        setAvailableFridays(fridays)

        setOriginalBooking(bookingData)
        setBooking(bookingData)
        setSelectedCampus(bookingData.campus)
        
        // Set the collection date
        const currentDate = new Date(bookingData.collection_date)
        if (currentDate.getDay() === 5 && !isDateInPast(currentDate)) {
          setCollectionDate(currentDate)
        } else {
          const firstAvailable = fridays.find(d => !isDateInPast(d))
          setCollectionDate(firstAvailable || null)
        }
        
        setSelectedItems(itemsData.map(item => item.item_type))

        // Set address data
        if (bookingData.residence_name) {
          // Check if it's a residence from our list
          const foundResidence = RESIDENCES.find(r => r.name === bookingData.residence_name)
          if (foundResidence) {
            setSelectedResidence(foundResidence.id)
            setAddressMethod('residence')
            setOriginalAddressMethod('residence')
          } else {
            setManualAddress(bookingData.address_line || '')
            setAddressMethod('manual')
            setOriginalAddressMethod('manual')
          }
        } else if (bookingData.address_line) {
          setManualAddress(bookingData.address_line)
          setAddressMethod('manual')
          setOriginalAddressMethod('manual')
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

  const getTotalPrice = () => {
    const basePrice = 450
    const extraItemPrice = 50
    const itemCount = selectedItems.length
    const extraItems = Math.max(0, itemCount - 2)
    return basePrice + (extraItems * extraItemPrice)
  }

  const isSaveDisabled = (): boolean => {
    if (saving) return true
    if (!collectionDate) return true
    if (isDateInPast(collectionDate)) return true
    if (!selectedCampus) return true
    if (selectedItems.length === 0) return true
    // Address validation
    if (addressMethod === 'residence' && !selectedResidence) return true
    if (addressMethod === 'manual' && !manualAddress) return true
    return false
  }

  const handleSaveChanges = async () => {
    setSaving(true)
    setErrorMessage('')
    
    try {
      if (!collectionDate) {
        throw new Error('Please select a collection date')
      }

      if (collectionDate.getDay() !== 5) {
        throw new Error('Collection must be on a Friday')
      }

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
      const depositAmount = totalAmount / 2
      const balanceAmount = totalAmount / 2

      // Update booking with address fields
      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          campus: selectedCampus,
          collection_date: collectionDateStr,
          total_items: selectedItems.length,
          total_amount: totalAmount,
          deposit_amount: depositAmount,
          balance_amount: balanceAmount,
          residence_name: residenceName || null,
          room_number: roomNumber || null,
          address_line: addressLine || manualAddress || null,
          city: 'Nelspruit'
        })
        .eq('id', bookingId)
        .eq('user_id', user.id)

      if (updateError) throw updateError

      // Delete existing items
      const { error: deleteError } = await supabase
        .from('booking_items')
        .delete()
        .eq('booking_id', bookingId)

      if (deleteError) throw deleteError

      // Insert updated items
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

          {/* Collection Date */}
          <div className="space-y-6 mb-8">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-lg bg-brand/10 text-brand grid place-items-center">
                <Calendar className="size-5" />
              </div>
              <div>
                <h2 className="font-display text-xl font-semibold">Collection Date</h2>
                <p className="text-sm text-muted-foreground">Select a Friday collection date</p>
              </div>
            </div>

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

            {/* Address Method Toggle */}
            <div className="flex gap-2 bg-muted/30 rounded-lg p-1">
              <button
                onClick={() => setAddressMethod('residence')}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition ${
                  addressMethod === 'residence'
                    ? 'bg-brand text-brand-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <Home className="size-4 inline mr-2" />
                Select Residence
              </button>
              <button
                onClick={() => setAddressMethod('manual')}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition ${
                  addressMethod === 'manual'
                    ? 'bg-brand text-brand-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <Building2 className="size-4 inline mr-2" />
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

          {/* Summary */}
          <div className="bg-muted/30 rounded-xl p-6 space-y-4 mb-8">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Items</span>
              <span className="font-medium">{selectedItems.length}</span>
            </div>
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between">
                <span>Base Package (up to 2 items)</span>
                <span className="font-medium">R450.00</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Extra items ({Math.max(0, selectedItems.length - 2)} × R50)</span>
                <span>R{Math.max(0, selectedItems.length - 2) * 50}.00</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-4">
                <span>Total</span>
                <span className="text-brand">R{getTotalPrice()}.00</span>
              </div>
            </div>
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
              
              <h2 className="font-display text-2xl font-bold text-green-600 mb-2">Booking Updated! ✅</h2>
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