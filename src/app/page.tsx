'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { 
  PackageOpen, Truck, Warehouse, ShieldCheck, 
  Sparkles, GraduationCap, MapPin, Calendar 
} from 'lucide-react'

function calculatePrice(items: number) {
  const base = 450
  const extraRate = 50
  const extraItems = Math.max(0, items - 2)
  const total = base + (extraItems * extraRate)
  return {
    base,
    extras: extraItems * extraRate,
    extraItems,
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
  const price = calculatePrice(items)

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur sticky top-0 z-40">
        <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
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
              <span className="text-[10px] text-muted-foreground hidden sm:block">
                Your Belongings, Safely Stored
              </span>
            </div>
          </Link>
          <nav className="flex items-center gap-2">
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground hidden sm:inline">Pricing</a>
            <a href="#how" className="text-sm text-muted-foreground hover:text-foreground hidden sm:inline">How it works</a>
            <Link href="/auth" className="px-3 py-1.5 text-sm hover:bg-muted rounded-lg transition">Sign in</Link>
            <Link href="/auth" className="bg-brand text-brand-foreground px-4 py-1.5 rounded-lg hover:opacity-90 transition text-sm">Book now</Link>
          </nav>
        </div>
      </header>

      <section className="gradient-hero">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-24 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <div className="inline-flex items-center gap-1 bg-secondary px-3 py-1 rounded-full text-sm font-medium mb-4">
              <PackageOpen className="size-3.5" /> Built for UMP & TUT Nelspruit
            </div>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
              Your Belongings, <span className="text-primary">Safely Stored.</span>
            </h1>
            <p className="mt-5 text-lg text-muted-foreground max-w-lg">
              We collect from your res on Friday, store your stuff safely in Nelspruit,
              and coordinate delivery with you directly. From <span className="font-semibold text-foreground">R450</span> for up to 2 items.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/auth" className="bg-brand text-brand-foreground px-6 py-3 rounded-lg hover:opacity-90 transition">
                Book your storage
              </Link>
              <a href="#pricing" className="border border-input px-6 py-3 rounded-lg hover:bg-secondary transition">
                See pricing
              </a>
            </div>
            <div className="mt-8 flex flex-wrap gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2"><ShieldCheck className="size-4 text-primary" /> Insured & secure</div>
              <div className="flex items-center gap-2"><Calendar className="size-4 text-primary" /> Friday collections</div>
              <div className="flex items-center gap-2"><MapPin className="size-4 text-primary" /> Nelspruit local</div>
            </div>
          </div>

          <div id="pricing" className="bg-card rounded-2xl shadow-xl border p-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              {/* <Sparkles className="size-5 text-primary" /> */}
              Live price calculator 
            </h2>
            <p className="text-sm text-muted-foreground mb-6">See exactly what you'll pay. No hidden fees.</p>
            
            <div className="space-y-6">
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
                  className="w-full accent-primary"
                />
                <p className="text-xs text-muted-foreground mt-2">e.g. boxes, suitcases, mini-fridge, etc.</p>
              </div>
              
              <div className="rounded-lg bg-muted/40 p-4 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>Base package (up to 2 items)</span>
                  <span className="font-medium">{formatZAR(price.base)}</span>
                </div>
                <div className={`flex items-center justify-between ${price.extras === 0 ? 'text-muted-foreground' : ''}`}>
                  <span>Extra items ({price.extraItems} × R50)</span>
                  <span className="font-medium">{formatZAR(price.extras)}</span>
                </div>
                <div className="border-t pt-2 mt-2 flex items-center justify-between">
                  <span className="font-semibold">Total</span>
                  <span className="font-display text-2xl font-bold text-primary">{formatZAR(price.total)}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border p-3">
                  <div className="text-xs text-muted-foreground">50% Deposit</div>
                  <div className="font-display text-xl font-bold">{formatZAR(price.deposit)}</div>
                  <div className="text-xs text-muted-foreground">Due to book</div>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="text-xs text-muted-foreground">50% Balance</div>
                  <div className="font-display text-xl font-bold">{formatZAR(price.balance)}</div>
                  <div className="text-xs text-muted-foreground">Due before delivery</div>
                </div>
              </div>
              
              <Link href="/auth" className="block bg-brand text-brand-foreground text-center py-3 rounded-lg hover:opacity-90 transition w-full">
                Book for {formatZAR(price.total)}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="how" className="py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-center">Three easy steps</h2>
          <p className="text-center text-muted-foreground mt-3 max-w-xl mx-auto">
            From your res door to secure storage and back again — we do the heavy lifting.
          </p>
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            {[
              { icon: Truck, title: 'Friday collection', text: 'Pick a Friday from the calendar. Our team collects from your UMP or TUT residence.' },
              { icon: Warehouse, title: 'Secure storage', text: 'Your items are stored in our monitored Nelspruit facility for the whole break.' },
              { icon: PackageOpen, title: 'Flexible delivery', text: 'When you need your items back, we coordinate delivery via WhatsApp at a time that suits you.' }
            ].map((step, i) => (
              <div key={i} className="rounded-xl border bg-card p-6">
                <div className="flex items-center gap-3">
                  <div className="size-11 rounded-lg gradient-brand grid place-items-center">
                    <step.icon className="size-6" />
                  </div>
                  <div className="text-xs font-semibold text-muted-foreground">STEP {i + 1}</div>
                </div>
                <h3 className="font-display text-xl font-semibold mt-4">{step.title}</h3>
                <p className="text-sm text-muted-foreground mt-2">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-muted/40 border-y">
        <div className="mx-auto max-w-6xl px-4 grid md:grid-cols-2 gap-6">
          {Object.entries(CAMPUS_LABELS).map(([key, value]) => (
            <div key={key} className="rounded-xl border bg-card p-6 flex items-start gap-4">
              <div className="size-12 rounded-lg gradient-brand grid place-items-center flex-shrink-0">
                <PackageOpen className="size-6" />
              </div>
              <div>
                <div className="font-display text-xl font-semibold">{value}</div>
                <div className="text-sm text-muted-foreground mt-1">Friday pickups from res gates. Delivery coordinated with you via WhatsApp.</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold">Ready to head home?</h2>
          <p className="mt-3 text-muted-foreground">Book your storage in under 2 minutes. Pay 50% now, the rest before delivery.</p>
          <Link href="/auth" className="inline-block bg-brand text-brand-foreground px-8 py-3 rounded-lg hover:opacity-90 transition mt-6">
            Start a booking
          </Link>
        </div>
      </section>

      <footer className="border-t py-10 text-sm text-muted-foreground">
        <div className="mx-auto max-w-6xl px-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="relative size-6 rounded overflow-hidden">
              <Image
                src="/images/logo.jpg"
                alt="Uni-Storage Logo"
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </div>
            <span className="font-semibold text-foreground">Uni-Storage</span>
            <span className="mx-1">·</span>
            <span>Your Belongings, Safely Stored</span>
            <span className="mx-1">·</span>
            <span>© {new Date().getFullYear()}</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/auth" className="hover:text-foreground">Sign in</Link>
            <Link href="/auth" className="hover:text-foreground">Book</Link>
          </div>
        </div>
      </footer>

      {/* WhatsApp Floating Button */}
<a
        href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}?text=Hi%20Uni-Storage%20Team%2C%20I%20have%20a%20question%20about%20your%20storage%20service.`}
  target="_blank"
  rel="noopener noreferrer"
  className="fixed bottom-8 right-8 z-50 group flex items-center gap-3 bg-green-500 hover:bg-green-600 text-white pl-3 pr-5 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
  aria-label="Chat on WhatsApp"
>
  {/* WhatsApp Icon */}
  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      className="w-6 h-6"
      fill="white"
    >
      <path d="M24.004 4.5C13.406 4.5 4.5 13.406 4.5 24.004c0 3.625 1.015 7.07 2.89 10.045L4.5 43.5l9.451-2.89c2.975 1.875 6.42 2.89 10.053 2.89 10.598 0 19.504-8.906 19.504-19.496S34.602 4.5 24.004 4.5z"/>
      <path d="M24.004 4.5C13.406 4.5 4.5 13.406 4.5 24.004c0 3.625 1.015 7.07 2.89 10.045L4.5 43.5l9.451-2.89c2.975 1.875 6.42 2.89 10.053 2.89 10.598 0 19.504-8.906 19.504-19.496S34.602 4.5 24.004 4.5z" fill="#25D366"/>
      <path d="M17.65 14.65c-.405-.87-.83-.875-1.215-.875-.315 0-.675.035-1.035.035s-1.105.45-1.685 1.315c-.58.865-2.215 2.145-2.215 5.235s2.27 6.115 2.585 6.535c.315.42 4.465 6.84 10.785 9.19 1.19.445 2.61.935 3.985.935 1.375 0 2.655-.55 3.62-1.45.965-.9 1.63-2.105 1.855-3.44.225-1.335.115-2.55-.155-2.91-.27-.36-.77-.59-1.545-1.035-.775-.445-3.78-1.855-4.355-2.07-.575-.215-1.085-.31-1.545.305-.46.615-1.865 2.08-2.29 2.55-.425.47-.775.565-1.545.1-.77-.465-3.315-1.215-6.305-3.89-2.33-2.085-3.895-4.66-4.345-5.45-.45-.79-.03-1.18.345-1.56.335-.335.775-.86 1.135-1.285.36-.425.49-.73.715-1.225.225-.495.115-.935-.07-1.29z" fill="#FFF"/>
    </svg>
  </div>
  
  {/* Text */}
  <span className="text-sm font-medium whitespace-nowrap">Let's Chat</span>
</a>
    </div>
  )
}