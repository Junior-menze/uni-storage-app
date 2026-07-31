import { createFileRoute, Link } from "@tanstack/react-router";
import { calculatePrice, formatZAR, CAMPUS_LABELS } from "@/lib/pricing";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { useState } from "react";
import { PackageOpen, Truck, Warehouse, ShieldCheck, Sparkles, GraduationCap, MapPin, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "StashSpace — Student Storage & Delivery for UMP & TUT Nelspruit" },
      { name: "description", content: "Affordable storage for UMP and TUT Nelspruit students. Friday collection, secure storage, doorstep delivery. From R400 for up to 2 items — pay 50% deposit to book." },
      { property: "og:title", content: "StashSpace — Student Storage in Nelspruit" },
      { property: "og:description", content: "R400 base includes 2 items, Friday collection, secure storage, and delivery — for UMP & TUT students." },
    ],
  }),
  component: Landing,
});

function Landing() {
  const [items, setItems] = useState(2);
  const price = calculatePrice(items);
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="size-9 rounded-lg gradient-brand grid place-items-center">
              <PackageOpen className="size-5" />
            </div>
            <span className="font-display text-xl font-bold">StashSpace</span>
          </Link>
          <nav className="flex items-center gap-2">
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground hidden sm:inline">Pricing</a>
            <a href="#how" className="text-sm text-muted-foreground hover:text-foreground hidden sm:inline">How it works</a>
            <Button asChild variant="ghost" size="sm"><Link to="/auth">Sign in</Link></Button>
            <Button asChild size="sm"><Link to="/book">Book now</Link></Button>
          </nav>
        </div>
      </header>

      {/* HERO */}
      <section className="gradient-hero">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-24 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <Badge variant="secondary" className="mb-4">
              <GraduationCap className="size-3.5 mr-1" /> Built for UMP & TUT Nelspruit
            </Badge>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
              Vacation storage <span className="text-primary">without the headache.</span>
            </h1>
            <p className="mt-5 text-lg text-muted-foreground max-w-lg">
              We collect from your res on Friday, store your stuff safely in Nelspruit,
              and deliver it back when the term starts. From <span className="font-semibold text-foreground">R400</span> for up to 2 items.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg"><Link to="/book">Book your storage</Link></Button>
              <Button asChild size="lg" variant="outline"><a href="#pricing">See pricing</a></Button>
            </div>
            <div className="mt-8 flex flex-wrap gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2"><ShieldCheck className="size-4 text-primary" /> Insured & secure</div>
              <div className="flex items-center gap-2"><Calendar className="size-4 text-primary" /> Friday collections</div>
              <div className="flex items-center gap-2"><MapPin className="size-4 text-primary" /> Nelspruit local</div>
            </div>
          </div>

          {/* Calculator card */}
          <Card id="pricing" className="shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Sparkles className="size-5 text-primary" /> Live price calculator</CardTitle>
              <CardDescription>See exactly what you'll pay. No hidden fees.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Number of items</span>
                  <span className="text-2xl font-display font-bold">{items}</span>
                </div>
                <Slider min={1} max={12} step={1} value={[items]} onValueChange={(v) => setItems(v[0])} />
                <p className="text-xs text-muted-foreground mt-2">e.g. boxes, suitcases, mini-fridge, etc.</p>
              </div>
              <div className="rounded-lg border bg-muted/40 p-4 space-y-2 text-sm">
                <Row label="Base package (up to 2 items)" value={formatZAR(price.base)} />
                <Row label={`Extra items (${price.extraItems} × R30)`} value={formatZAR(price.extras)} muted={price.extras === 0} />
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
                  <div className="text-xs text-muted-foreground">7 days before delivery</div>
                </div>
              </div>
              <Button asChild className="w-full" size="lg"><Link to="/book">Book for {formatZAR(price.total)}</Link></Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-center">Three easy steps</h2>
          <p className="text-center text-muted-foreground mt-3 max-w-xl mx-auto">
            From your res door to secure storage and back again — we do the heavy lifting.
          </p>
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <Step icon={<Truck className="size-6" />} n={1} title="Friday collection"
              text="Pick a Friday from the calendar. Our team collects from your UMP or TUT residence." />
            <Step icon={<Warehouse className="size-6" />} n={2} title="Secure storage"
              text="Your items are stored in our monitored Nelspruit facility for the whole break." />
            <Step icon={<PackageOpen className="size-6" />} n={3} title="Doorstep delivery"
              text="Pay the balance 7 days before delivery, and we drop everything back at your door." />
          </div>
        </div>
      </section>

      {/* CAMPUSES */}
      <section className="py-16 bg-muted/40 border-y">
        <div className="mx-auto max-w-6xl px-4 grid md:grid-cols-2 gap-6">
          {Object.entries(CAMPUS_LABELS).map(([k, v]) => (
            <div key={k} className="rounded-xl border bg-card p-6 flex items-start gap-4">
              <div className="size-12 rounded-lg gradient-brand grid place-items-center flex-shrink-0">
                <GraduationCap className="size-6" />
              </div>
              <div>
                <div className="font-display text-xl font-semibold">{v}</div>
                <div className="text-sm text-muted-foreground mt-1">Friday pickups from res gates. Delivery back on your chosen weekday.</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold">Ready to head home?</h2>
          <p className="mt-3 text-muted-foreground">Book your storage in under 2 minutes. Pay 50% now, the rest before delivery.</p>
          <Button asChild size="lg" className="mt-6"><Link to="/book">Start a booking</Link></Button>
        </div>
      </section>

      <footer className="border-t py-10 text-sm text-muted-foreground">
        <div className="mx-auto max-w-6xl px-4 flex flex-wrap items-center justify-between gap-4">
          <div>© {new Date().getFullYear()} StashSpace Nelspruit</div>
          <div className="flex items-center gap-4">
            <Link to="/auth" className="hover:text-foreground">Sign in</Link>
            <Link to="/book" className="hover:text-foreground">Book</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className={`flex items-center justify-between ${muted ? "text-muted-foreground" : ""}`}>
      <span>{label}</span><span className="font-medium">{value}</span>
    </div>
  );
}

function Step({ icon, n, title, text }: { icon: React.ReactNode; n: number; title: string; text: string }) {
  return (
    <div className="rounded-xl border bg-card p-6">
      <div className="flex items-center gap-3">
        <div className="size-11 rounded-lg gradient-brand grid place-items-center">{icon}</div>
        <div className="text-xs font-semibold text-muted-foreground">STEP {n}</div>
      </div>
      <h3 className="font-display text-xl font-semibold mt-4">{title}</h3>
      <p className="text-sm text-muted-foreground mt-2">{text}</p>
    </div>
  );
}
