import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listMyBookings, getMyProfile } from "@/lib/bookings.functions";
import { initPayfastCheckout } from "@/lib/payfast.functions";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatZAR, CAMPUS_LABELS } from "@/lib/pricing";
import { toast } from "sonner";
import { useEffect } from "react";
import { Calendar, Package, Truck, CheckCircle2 } from "lucide-react";
import { z } from "zod";

const searchSchema = z.object({
  payment: z.enum(["success", "cancelled"]).optional(),
  booking: z.string().optional(),
}).partial();

export const Route = createFileRoute("/_authenticated/dashboard")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Dashboard — StashSpace" },
      { name: "description", content: "Track your storage bookings and payments." },
      { property: "og:title", content: "Your bookings — StashSpace" },
      { property: "og:description", content: "Track collection, storage, and delivery for your student storage." },
    ],
  }),
  component: Dashboard,
});

function statusVariant(s: string): "default" | "secondary" | "outline" | "destructive" {
  if (s === "PAID" || s === "DELIVERED") return "default";
  if (s === "PENDING" || s === "CONFIRMED") return "secondary";
  if (s === "FAILED" || s === "CANCELLED") return "destructive";
  return "outline";
}

function Dashboard() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/_authenticated/dashboard" });
  const qc = useQueryClient();
  const listFn = useServerFn(listMyBookings);
  const profileFn = useServerFn(getMyProfile);
  const initPay = useServerFn(initPayfastCheckout);

  const profileQ = useQuery({ queryKey: ["me"], queryFn: () => profileFn() });
  const bookingsQ = useQuery({ queryKey: ["bookings"], queryFn: () => listFn() });

  useEffect(() => {
    if (search.payment === "success") toast.success("Payment received — updating your booking.");
    if (search.payment === "cancelled") toast.info("Payment cancelled.");
    if (search.payment) {
      qc.invalidateQueries({ queryKey: ["bookings"] });
      // strip query params
      setTimeout(() => navigate({ to: "/dashboard", search: {}, replace: true }), 500);
    }
  }, [search.payment, qc, navigate]);

  const payMut = useMutation({
    mutationFn: (args: { booking_id: string; kind: "DEPOSIT" | "BALANCE" | "FULL" }) =>
      initPay({ data: args }),
    onSuccess: (res) => {
      // Auto-submit form to PayFast
      const form = document.createElement("form");
      form.method = "POST";
      form.action = res.processUrl;
      Object.entries(res.fields).forEach(([k, v]) => {
        const input = document.createElement("input");
        input.type = "hidden"; input.name = k; input.value = v as string;
        form.appendChild(input);
      });
      document.body.appendChild(form);
      form.submit();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AppShell isAdmin={profileQ.data?.isAdmin} userEmail={profileQ.data?.profile?.email}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl font-bold">Your bookings</h1>
          <p className="text-muted-foreground">Track collection, storage, and delivery.</p>
        </div>
        <Button asChild><Link to="/book">New booking</Link></Button>
      </div>

      {bookingsQ.isLoading && <p className="text-muted-foreground">Loading…</p>}
      {bookingsQ.data && bookingsQ.data.length === 0 && (
        <Card><CardContent className="py-10 text-center">
          <Package className="size-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No bookings yet.</p>
          <Button asChild className="mt-4"><Link to="/book">Book your first storage</Link></Button>
        </CardContent></Card>
      )}

      <div className="grid gap-4">
        {bookingsQ.data?.map((b) => (
          <Card key={b.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    Booking #{b.id.slice(0, 8)}
                    <Badge variant={statusVariant(b.status)}>{b.status}</Badge>
                  </CardTitle>
                  <CardDescription>{CAMPUS_LABELS[b.campus]}</CardDescription>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-display font-bold">{formatZAR(Number(b.total_amount))}</div>
                  <div className="text-xs text-muted-foreground">{b.total_items} items</div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2"><Truck className="size-4 text-primary" /> Collection: <span className="font-medium">{b.collection_date}</span></div>
                <div className="flex items-center gap-2"><Calendar className="size-4 text-primary" /> Delivery: <span className="font-medium">{b.delivery_date}</span></div>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <PaymentRow
                  label="Deposit (50%)"
                  amount={Number(b.deposit_amount)}
                  status={b.deposit_status}
                  onPay={() => payMut.mutate({ booking_id: b.id, kind: "DEPOSIT" })}
                  busy={payMut.isPending}
                />
                <PaymentRow
                  label="Balance (50%)"
                  amount={Number(b.balance_amount)}
                  status={b.balance_status}
                  disabled={b.deposit_status !== "PAID"}
                  onPay={() => payMut.mutate({ booking_id: b.id, kind: "BALANCE" })}
                  busy={payMut.isPending}
                />
              </div>
              {b.status === "DELIVERED" && (
                <div className="flex items-center gap-2 text-sm text-primary"><CheckCircle2 className="size-4" /> Delivered — thanks for using StashSpace!</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}

function PaymentRow({ label, amount, status, onPay, disabled, busy }: {
  label: string; amount: number; status: string; onPay: () => void; disabled?: boolean; busy?: boolean;
}) {
  return (
    <div className="rounded-lg border p-3 flex items-center justify-between">
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="font-display text-lg font-bold">{formatZAR(amount)}</div>
        <Badge variant={statusVariant(status)} className="mt-1">{status}</Badge>
      </div>
      {status !== "PAID" && (
        <Button size="sm" onClick={onPay} disabled={disabled || busy}>
          {busy ? "…" : disabled ? "Pay deposit first" : "Pay now"}
        </Button>
      )}
    </div>
  );
}
