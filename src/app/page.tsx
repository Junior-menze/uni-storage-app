'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Navbar } from '@/components/Navbar'
import { 
  PackageOpen, Truck, Warehouse, ShieldCheck, 
  Sparkles, GraduationCap, MapPin, Calendar 
} from 'lucide-react'

function calculatePrice(items: number) {
  const storageFee = 300
  const extraItemFee = 50
  const collectionFee = 150
  
  const extraItems = Math.max(0, items - 2)
  const storageTotal = storageFee + (extraItems * extraItemFee)
  const total = storageTotal + collectionFee
  
  return {
    storageFee,
    extraItemFee,
    extraItems,
    storageTotal,
    collectionFee,
    total,
    deposit: total * 0.5,
    balance: total * 0.5
  }
}

function formatZAR(amount: number) {
  return `R${amount.toFixed(2)}`
}

const CAMPUS_LABELS = {
  UMP: 'University of Mpumalanga',
  TUT: 'TUT Nelspruit Campus'
}

export default function Home() {
  const [items, setItems] = useState(2)
  const [user, setUser] = useState<any>(null)
  const price = calculatePrice(items)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
    })
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section - Now First (Visible on all devices) */}
      <section id="hero" className="gradient-hero section-padding">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Hero Content - Always first on mobile */}
            <div className="order-1">
              <div className="inline-flex items-center gap-1 bg-secondary px-3 py-1 rounded-full text-sm font-medium mb-4">
                <PackageOpen className="size-3.5" /> Built for UMP & TUT Nelspruit
              </div>
              <h1 className="heading-1">
                Your Belongings, <span className="text-primary">Safely Stored.</span>
              </h1>
              <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-lg">
                We collect from your res, store your stuff safely in Nelspruit,
                and coordinate delivery with you directly.
                <span className="block mt-2 text-sm text-foreground">
                  <span className="font-bold">R300</span> storage for up to 2 items + 
                  <span className="font-bold"> R150</span> collection & delivery = 
                  <span className="font-bold text-primary"> R450</span>
                </span>
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link 
                  href={user ? "/booking" : "/auth"} 
                  className="bg-brand text-brand-foreground px-6 py-3 rounded-lg hover:opacity-90 transition touch-target"
                >
                  {user ? 'Book your storage' : 'Get Started'}
                </Link>
                <a href="#pricing" className="border border-input px-6 py-3 rounded-lg hover:bg-secondary transition touch-target">
                  See pricing
                </a>
              </div>
              <div className="mt-6 flex flex-wrap gap-4 sm:gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2"><ShieldCheck className="size-4 text-primary" /> Insured & secure</div>
                <div className="flex items-center gap-2"><Calendar className="size-4 text-primary" /> Flexible collection</div>
                <div className="flex items-center gap-2"><MapPin className="size-4 text-primary" /> Nelspruit local</div>
              </div>
            </div>

            {/* Price Calculator - Second on mobile, right on desktop */}
            <div className="order-2">
              <div id="pricing" className="bg-card rounded-2xl shadow-xl border p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                  <Sparkles className="size-5 text-primary" />
                  Live price calculator
                </h2>
                <p className="text-sm text-muted-foreground mb-4 sm:mb-6">See exactly what you'll pay. No hidden fees.</p>
                
                <div className="space-y-4 sm:space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Number of items</span>
                      <span className="font-display text-2xl font-bold">{items}</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={12}
                      value={items}
                      onChange={(e) => setItems(parseInt(e.target.value))}
                      className="w-full accent-primary h-2"
                    />
                    <p className="text-xs text-muted-foreground mt-2">e.g. boxes, suitcases, mini-fridge, etc.</p>
                  </div>
                  
                  <div className="rounded-lg bg-muted/40 p-3 sm:p-4 space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span>Storage (up to 2 items)</span>
                      <span className="font-medium">{formatZAR(price.storageFee)}</span>
                    </div>
                    <div className={`flex items-center justify-between ${price.extraItems === 0 ? 'text-muted-foreground' : ''}`}>
                      <span>Extra items ({price.extraItems} × {formatZAR(price.extraItemFee)})</span>
                      <span className="font-medium">{formatZAR(price.extraItems * price.extraItemFee)}</span>
                    </div>
                    <div className="flex items-center justify-between border-t pt-2">
                      <span className="font-medium">Collection & Delivery</span>
                      <span className="font-medium">{formatZAR(price.collectionFee)}</span>
                    </div>
                    <div className="flex items-center justify-between border-t pt-2 mt-2">
                      <span className="font-semibold">Total</span>
                      <span className="font-display text-xl sm:text-2xl font-bold text-primary">{formatZAR(price.total)}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <p className="text-sm font-medium">Payment Options</p>
                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                      <div className="border rounded-lg p-2 sm:p-3 text-center hover:border-brand transition cursor-pointer">
                        <p className="text-xs text-muted-foreground">Pay in Full</p>
                        <p className="font-display text-lg sm:text-xl font-bold text-green-600">{formatZAR(price.total)}</p>
                        <p className="text-xs text-muted-foreground">One payment</p>
                      </div>
                      <div className="border rounded-lg p-2 sm:p-3 text-center hover:border-brand transition cursor-pointer">
                        <p className="text-xs text-muted-foreground">50% Deposit</p>
                        <p className="font-display text-lg sm:text-xl font-bold text-amber-600">{formatZAR(price.deposit)}</p>
                        <p className="text-xs text-muted-foreground">Balance before delivery</p>
                      </div>
                    </div>
                  </div>
                  
                  <Link 
                    href={user ? "/booking" : "/auth"} 
                    className="block bg-brand text-brand-foreground text-center py-3 rounded-lg hover:opacity-90 transition w-full text-sm sm:text-base"
                  >
                    {user ? `Book for ${formatZAR(price.total)}` : 'Sign in to book'}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="section-padding bg-muted/20">
        <div className="container-custom">
          <h2 className="heading-2 text-center">Three easy steps</h2>
          <p className="text-center text-muted-foreground mt-3 max-w-xl mx-auto text-sm sm:text-base">
            From your res door to secure storage and back again — we do the heavy lifting.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mt-8 sm:mt-12">
            {[
              { icon: Truck, title: 'Flexible collection', text: 'Pick a day that suits you. We normally collect on Fridays but can arrange other days.' },
              { icon: Warehouse, title: 'Secure storage', text: 'Your items are stored in our monitored Nelspruit facility for the whole break.' },
              { icon: PackageOpen, title: 'Flexible delivery', text: 'When you need your items back, we coordinate delivery via WhatsApp at a time that suits you.' }
            ].map((step, i) => (
              <div key={i} className="rounded-xl border bg-card p-4 sm:p-6 card-hover">
                <div className="flex items-center gap-3">
                  <div className="size-10 sm:size-11 rounded-lg gradient-brand grid place-items-center flex-shrink-0">
                    <step.icon className="size-5 sm:size-6" />
                  </div>
                  <div className="text-xs font-semibold text-muted-foreground">STEP {i + 1}</div>
                </div>
                <h3 className="font-display text-lg sm:text-xl font-semibold mt-3 sm:mt-4">{step.title}</h3>
                <p className="text-sm text-muted-foreground mt-1 sm:mt-2">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Campuses Section */}
      <section className="section-padding border-y">
        <div className="container-custom">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {Object.entries(CAMPUS_LABELS).map(([key, value]) => (
              <div key={key} className="rounded-xl border bg-card p-4 sm:p-6 flex items-start gap-3 sm:gap-4 card-hover">
                <div className="size-10 sm:size-12 rounded-lg gradient-brand grid place-items-center flex-shrink-0">
                  <GraduationCap className="size-5 sm:size-6" />
                </div>
                <div>
                  <div className="font-display text-base sm:text-xl font-semibold">{value}</div>
                  <div className="text-sm text-muted-foreground mt-1">Flexible pickups from res gates. Delivery coordinated with you via WhatsApp.</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding">
        <div className="container-custom text-center">
          <h2 className="heading-2">Ready to head home?</h2>
          <p className="mt-3 text-muted-foreground text-sm sm:text-base">Book your storage in under 2 minutes. Pay in full or 50% deposit.</p>
          <Link 
            href={user ? "/booking" : "/auth"} 
            className="inline-block bg-brand text-brand-foreground px-6 sm:px-8 py-3 rounded-lg hover:opacity-90 transition mt-6 touch-target"
          >
            {user ? 'Start a booking' : 'Sign in to start'}
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 sm:py-10 text-sm text-muted-foreground">
        <div className="container-custom flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="relative size-5 sm:size-6 rounded overflow-hidden">
              <Image
                src="/images/logo.jpg"
                alt="Uni-Storage Logo"
                fill
                className="object-contain"
                sizes="24px"
              />
            </div>
            <span className="font-semibold text-foreground text-sm sm:text-base">Uni-Storage</span>
            <span className="mx-1">·</span>
            <span className="text-xs sm:text-sm">Your Belongings, Safely Stored</span>
            <span className="mx-1">·</span>
            <span className="text-xs sm:text-sm">© {new Date().getFullYear()}</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/auth" className="hover:text-foreground transition text-sm">Sign in</Link>
            <Link href="/booking" className="hover:text-foreground transition text-sm">Book</Link>
          </div>
        </div>
      </footer>

      {/* WhatsApp Floating Button */}
      <a
        href="https://wa.me/27791170930?text=Hi%20Uni-Storage%20Team%2C%20I%20have%20a%20question%20about%20your%20storage%20service."
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-4 sm:bottom-6 md:bottom-8 right-4 sm:right-6 md:right-8 z-50 group flex items-center gap-2 sm:gap-3 bg-green-500 hover:bg-green-600 text-white pl-2 sm:pl-3 pr-3 sm:pr-5 py-2 sm:py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
        aria-label="Chat on WhatsApp"
      >
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 48 48"
            className="w-5 h-5 sm:w-6 sm:h-6"
            fill="white"
          >
            <path d="M24.004 4.5C13.406 4.5 4.5 13.406 4.5 24.004c0 3.625 1.015 7.07 2.89 10.045L4.5 43.5l9.451-2.89c2.975 1.875 6.42 2.89 10.053 2.89 10.598 0 19.504-8.906 19.504-19.496S34.602 4.5 24.004 4.5z"/>
            <path d="M24.004 4.5C13.406 4.5 4.5 13.406 4.5 24.004c0 3.625 1.015 7.07 2.89 10.045L4.5 43.5l9.451-2.89c2.975 1.875 6.42 2.89 10.053 2.89 10.598 0 19.504-8.906 19.504-19.496S34.602 4.5 24.004 4.5z" fill="#25D366"/>
            <path d="M17.65 14.65c-.405-.87-.83-.875-1.215-.875-.315 0-.675.035-1.035.035s-1.105.45-1.685 1.315c-.58.865-2.215 2.145-2.215 5.235s2.27 6.115 2.585 6.535c.315.42 4.465 6.84 10.785 9.19 1.19.445 2.61.935 3.985.935 1.375 0 2.655-.55 3.62-1.45.965-.9 1.63-2.105 1.855-3.44.225-1.335.115-2.55-.155-2.91-.27-.36-.77-.59-1.545-1.035-.775-.445-3.78-1.855-4.355-2.07-.575-.215-1.085-.31-1.545.305-.46.615-1.865 2.08-2.29 2.55-.425.47-.775.565-1.545.1-.77-.465-3.315-1.215-6.305-3.89-2.33-2.085-3.895-4.66-4.345-5.45-.45-.79-.03-1.18.345-1.56.335-.335.775-.86 1.135-1.285.36-.425.49-.73.715-1.225.225-.495.115-.935-.07-1.29z" fill="#FFF"/>
          </svg>
        </div>
        <span className="text-xs sm:text-sm font-medium whitespace-nowrap hidden sm:inline">Let's Chat</span>
        <span className="text-xs font-medium whitespace-nowrap sm:hidden">Chat</span>
      </a>
    </div>
  )
}