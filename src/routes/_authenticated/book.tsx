import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { calculatePrice, formatZAR, CAMPUS_LABELS, ITEM_TYPES, nextFridays, type ItemTypeUI } from "@/lib/pricing";
import { createBooking, getMyProfile } from "@/lib/bookings.functions";
import { initPayfastCheckout } from "@/lib/payfast.functions";
import { toast } from "sonner";
import { Trash2, Plus, ChevronRight, ChevronLeft } from "lucide-react";

export const Route = createFileRoute("/_authenticated/book")({
  head: () => ({
    meta: [
      { title: "New booking — StashSpace" },
      { name: "description", content: "Create a new storage booking for UMP or TUT Nelspruit." },
      { property: "og:title", content: "New booking — StashSpace" },
      { property: "og:description", content: "Book storage in 4 quick steps." },
    ],
  }),
  component: BookingWizard,
});

type Item = { item_type: ItemTypeUI; description: string };

function BookingWizard() {
  const navigate = useNavigate();
  const profileFn = useServerFn(getMyProfile);
  const createFn = useServerFn(createBooking);
  const initPay = useServerFn(initPayfastCheckout);
  const profileQ = useQuery({ queryKey: ["me"], queryFn: () => profileFn() });

  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState("");
  const [studentNumber, setStudentNumber] = useState("");
  const [campus, setCampus] = useState<"UMP" | "TUT_NELSPRUIT" | "">("");
  const [phone, setPhone] = useState("");
  const [collectionDate, setCollectionDate] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [items, setItems] = useState<Item[]>([
    { item_type: "Box", description: "" },
    { item_type: "Box", description: "" },
  ]);
  const [paymentChoice, setPaymentChoice] = useState<"DEPOSIT" | "FULL">("DEPOSIT");

  // Prefill from profile
  useState(() => {
    if (profileQ.data?.profile) {
      const p = profileQ.data.profile;
      if (p.full_name && !fullName) setFullName(p.full_name);
      if (p.student_number && !studentNumber) setStudentNumber(p.student_number);
      if (p.campus && !campus) setCampus(p.campus as "UMP" | "TUT_NELSPRUIT");
      if (p.phone_number && !phone) setPhone(p.phone_number);
    }
  });

  const price = calculatePrice(items.length);
  const fridays = nextFridays(10);

  const mut = useMutation({
    mutationFn: async () => {
      const res = await createFn({
        data: {
          full_name: fullName,
          student_number: studentNumber,
          campus: campus as "UMP" | "TUT_NELSPRUIT",
          phone_number: phone,
          collection_date: collectionDate,
          delivery_date: deliveryDate,
          items,
          payment_choice: paymentChoice,
        },
      });
      const pay = await initPay({ data: { booking_id: res.bookingId, kind: paymentChoice } });
      return pay;
    },
    onSuccess: (res) => {
      toast.success("Booking created — redirecting to PayFast…");
      const form = document.createElement("form");
      form.method = "POST"; form.action = res.processUrl;
      Object.entries(res.fields).forEach(([k, v]) => {
        const i = document.createElement("input");
        i.type = "hidden"; i.name = k; i.value = v as string;
        form.appendChild(i);
      });
      document.body.appendChild(form); form.submit();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function next() { setStep((s) => Math.min(4, s + 1)); }
  function prev() { setStep((s) => Math.max(1, s - 1)); }

  const canStep1 = fullName.length > 1 && studentNumber.length > 1 && campus && phone.length > 5;
  const canStep2 = collectionDate && deliveryDate && new Date(deliveryDate) > new Date(collectionDate);
  const canStep3 = items.length >= 1 && items.every((i) => i.item_type);

  return (
    <AppShell isAdmin={profileQ.data?.isAdmin} userEmail={profileQ.data?.profile?.email}>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className={`flex-1 h-2 rounded-full ${n <= step ? "bg-primary" : "bg-muted"}`} />
          ))}
        </div>
        <div className="mb-2 text-sm text-muted-foreground">Step {step} of 4</div>

        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Your details</CardTitle>
              <CardDescription>Where should we collect from?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field label="Full name"><Input value={fullName} onChange={(e) => setFullName(e.target.value)} /></Field>
              <Field label="Student number"><Input value={studentNumber} onChange={(e) => setStudentNumber(e.target.value)} /></Field>
              <Field label="Campus">
                <Select value={campus} onValueChange={(v) => setCampus(v as "UMP" | "TUT_NELSPRUIT")}>
                  <SelectTrigger><SelectValue placeholder="Select your campus" /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(CAMPUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Phone number (WhatsApp)"><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+27 …" /></Field>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Choose dates</CardTitle>
              <CardDescription>Collection is Fridays only. Delivery any day after storage.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field label="Collection Friday">
                <Select value={collectionDate} onValueChange={setCollectionDate}>
                  <SelectTrigger><SelectValue placeholder="Pick a Friday" /></SelectTrigger>
                  <SelectContent>
                    {fridays.map((d) => <SelectItem key={d} value={d}>{new Date(d + "T00:00:00").toLocaleDateString("en-ZA", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Delivery date">
                <Input type="date" value={deliveryDate} min={collectionDate || undefined} onChange={(e) => setDeliveryDate(e.target.value)} />
              </Field>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Your items</CardTitle>
              <CardDescription>Base R400 includes 2 items. Extra items: R30 each.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {items.map((it, idx) => (
                <div key={idx} className="grid grid-cols-[1fr_2fr_auto] gap-2 items-end">
                  <div>
                    <Label className="text-xs">Type</Label>
                    <Select value={it.item_type} onValueChange={(v) => {
                      const copy = [...items]; copy[idx].item_type = v as ItemTypeUI; setItems(copy);
                    }}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ITEM_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Description (optional)</Label>
                    <Input value={it.description} onChange={(e) => {
                      const copy = [...items]; copy[idx].description = e.target.value; setItems(copy);
                    }} />
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setItems(items.filter((_, i) => i !== idx))} disabled={items.length <= 1}>
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" onClick={() => setItems([...items, { item_type: "Box", description: "" }])}>
                <Plus className="size-4 mr-1" /> Add item
              </Button>
              <div className="rounded-lg border bg-muted/40 p-4 mt-4 space-y-1 text-sm">
                <div className="flex justify-between"><span>Base</span><span>{formatZAR(price.base)}</span></div>
                <div className="flex justify-between text-muted-foreground"><span>Extras ({price.extraItems})</span><span>{formatZAR(price.extras)}</span></div>
                <div className="flex justify-between font-semibold pt-1 border-t"><span>Total</span><span className="text-primary text-lg">{formatZAR(price.total)}</span></div>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 4 && (
          <Card>
            <CardHeader>
              <CardTitle>Review & pay</CardTitle>
              <CardDescription>Choose deposit or full payment. Both are handled by PayFast.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border p-4 space-y-2 text-sm">
                <Line label="Name" value={fullName} />
                <Line label="Student #" value={studentNumber} />
                <Line label="Campus" value={CAMPUS_LABELS[campus] ?? ""} />
                <Line label="Phone" value={phone} />
                <Line label="Collection" value={collectionDate} />
                <Line label="Delivery" value={deliveryDate} />
                <Line label="Items" value={`${items.length}`} />
                <div className="border-t pt-2 flex justify-between font-semibold"><span>Total</span><span className="text-primary">{formatZAR(price.total)}</span></div>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <PayOption
                  active={paymentChoice === "DEPOSIT"}
                  onClick={() => setPaymentChoice("DEPOSIT")}
                  title="Pay 50% deposit"
                  amount={price.deposit}
                  hint="Balance due 7 days before delivery"
                />
                <PayOption
                  active={paymentChoice === "FULL"}
                  onClick={() => setPaymentChoice("FULL")}
                  title="Pay in full"
                  amount={price.total}
                  hint="Done and dusted"
                />
              </div>
              <Button className="w-full" size="lg" onClick={() => mut.mutate()} disabled={mut.isPending}>
                {mut.isPending ? "Creating booking…" : `Confirm & pay ${formatZAR(paymentChoice === "FULL" ? price.total : price.deposit)}`}
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-between mt-6">
          <Button variant="outline" onClick={prev} disabled={step === 1}><ChevronLeft className="size-4 mr-1" />Back</Button>
          {step < 4 && (
            <Button onClick={next} disabled={
              (step === 1 && !canStep1) || (step === 2 && !canStep2) || (step === 3 && !canStep3)
            }>Next<ChevronRight className="size-4 ml-1" /></Button>
          )}
          {step === 4 && <Button variant="ghost" onClick={() => navigate({ to: "/dashboard" })}>Cancel</Button>}
        </div>
      </div>
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><Label className="mb-1.5 block">{label}</Label>{children}</div>;
}
function Line({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between"><span className="text-muted-foreground">{label}</span><span className="font-medium">{value}</span></div>;
}
function PayOption({ active, onClick, title, amount, hint }: { active: boolean; onClick: () => void; title: string; amount: number; hint: string }) {
  return (
    <button type="button" onClick={onClick} className={`text-left rounded-lg border-2 p-4 transition-colors ${active ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}>
      <div className="flex items-center justify-between">
        <span className="font-medium">{title}</span>
        {active && <Badge>Selected</Badge>}
      </div>
      <div className="font-display text-2xl font-bold mt-1">{formatZAR(amount)}</div>
      <div className="text-xs text-muted-foreground mt-1">{hint}</div>
    </button>
  );
}
