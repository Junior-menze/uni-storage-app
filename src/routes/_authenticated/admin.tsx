import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminListBookings, adminUpdateBooking, getMyProfile } from "@/lib/bookings.functions";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatZAR, CAMPUS_LABELS } from "@/lib/pricing";
import { toast } from "sonner";
import { ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin — StashSpace" },
      { name: "description", content: "Manage all student storage bookings." },
      { property: "og:title", content: "Admin — StashSpace" },
      { property: "og:description", content: "Internal admin dashboard for StashSpace bookings." },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const profileFn = useServerFn(getMyProfile);
  const listFn = useServerFn(adminListBookings);
  const updateFn = useServerFn(adminUpdateBooking);
  const qc = useQueryClient();

  const profileQ = useQuery({ queryKey: ["me"], queryFn: () => profileFn() });
  const isAdmin = profileQ.data?.isAdmin;
  const listQ = useQuery({
    queryKey: ["admin-bookings"],
    queryFn: () => listFn(),
    enabled: !!isAdmin,
  });

  const updateMut = useMutation({
    mutationFn: (args: { booking_id: string; status?: any; deposit_status?: any; balance_status?: any }) =>
      updateFn({ data: args }),
    onSuccess: () => { toast.success("Updated"); qc.invalidateQueries({ queryKey: ["admin-bookings"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (profileQ.isLoading) return <AppShell><p>Loading…</p></AppShell>;
  if (!isAdmin) {
    return (
      <AppShell userEmail={profileQ.data?.profile?.email}>
        <Card><CardContent className="py-12 text-center">
          <ShieldAlert className="size-10 mx-auto text-destructive mb-3" />
          <p className="font-semibold">Admin access required.</p>
          <p className="text-sm text-muted-foreground mt-1">Your account isn't marked as admin.</p>
        </CardContent></Card>
      </AppShell>
    );
  }

  return (
    <AppShell isAdmin userEmail={profileQ.data?.profile?.email}>
      <h1 className="font-display text-3xl font-bold mb-6">Admin — All bookings</h1>
      <div className="grid gap-4">
        {listQ.data?.map((b) => {
          const profile = (b as any).profiles ?? {};
          return (
            <Card key={b.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div>
                    <CardTitle className="text-base">
                      {profile.full_name ?? "—"} <span className="text-muted-foreground font-normal">· {profile.student_number ?? "—"}</span>
                    </CardTitle>
                    <div className="text-sm text-muted-foreground">{CAMPUS_LABELS[b.campus]} · {profile.phone_number ?? ""} · {profile.email ?? ""}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-display text-xl font-bold">{formatZAR(Number(b.total_amount))}</div>
                    <div className="text-xs text-muted-foreground">{b.total_items} items · #{b.id.slice(0, 8)}</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid sm:grid-cols-2 gap-2 text-sm">
                  <div>Collection: <span className="font-medium">{b.collection_date}</span></div>
                  <div>Delivery: <span className="font-medium">{b.delivery_date}</span></div>
                </div>
                <div className="grid sm:grid-cols-3 gap-3">
                  <AdminField label="Status" value={b.status} options={["CONFIRMED", "COLLECTED", "IN_STORAGE", "DELIVERED", "CANCELLED"]}
                    onChange={(v) => updateMut.mutate({ booking_id: b.id, status: v as any })}
                  />
                  <AdminField label="Deposit" value={b.deposit_status} options={["PENDING", "PAID", "FAILED"]}
                    onChange={(v) => updateMut.mutate({ booking_id: b.id, deposit_status: v as any })}
                  />
                  <AdminField label="Balance" value={b.balance_status} options={["PENDING", "PAID", "FAILED"]}
                    onChange={(v) => updateMut.mutate({ booking_id: b.id, balance_status: v as any })}
                  />
                </div>
                <div className="flex gap-2 text-xs">
                  <Badge variant="outline">Deposit {formatZAR(Number(b.deposit_amount))}</Badge>
                  <Badge variant="outline">Balance {formatZAR(Number(b.balance_amount))}</Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {listQ.data && listQ.data.length === 0 && <p className="text-muted-foreground">No bookings yet.</p>}
      </div>
    </AppShell>
  );
}

function AdminField({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          {options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}
