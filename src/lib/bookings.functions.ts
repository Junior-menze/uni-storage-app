import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { calculatePrice, ITEM_TYPES } from "@/lib/pricing";

const CampusEnum = z.enum(["UMP", "TUT_NELSPRUIT"]);
const ItemEnum = z.enum(ITEM_TYPES);

const CreateBookingInput = z.object({
  full_name: z.string().min(2).max(120),
  student_number: z.string().min(2).max(40),
  campus: CampusEnum,
  phone_number: z.string().min(6).max(20),
  collection_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  delivery_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  items: z.array(z.object({
    item_type: ItemEnum,
    description: z.string().max(200).optional().default(""),
  })).min(1).max(20),
  payment_choice: z.enum(["DEPOSIT", "FULL"]),
});

function isFridayISO(s: string) {
  const d = new Date(s + "T00:00:00Z");
  return d.getUTCDay() === 5;
}

export const createBooking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => CreateBookingInput.parse(raw))
  .handler(async ({ data, context }) => {
    if (!isFridayISO(data.collection_date)) {
      throw new Error("Collection date must be a Friday.");
    }
    if (new Date(data.delivery_date) <= new Date(data.collection_date)) {
      throw new Error("Delivery date must be after collection date.");
    }

    const { supabase, userId } = context;
    const price = calculatePrice(data.items.length);

    // Upsert profile
    await supabase.from("profiles").upsert({
      id: userId,
      full_name: data.full_name,
      student_number: data.student_number,
      campus: data.campus,
      phone_number: data.phone_number,
    });

    const { data: booking, error: bErr } = await supabase
      .from("bookings")
      .insert({
        user_id: userId,
        campus: data.campus,
        collection_date: data.collection_date,
        delivery_date: data.delivery_date,
        total_items: data.items.length,
        total_amount: price.total,
        deposit_amount: price.deposit,
        balance_amount: price.balance,
      })
      .select("*")
      .single();
    if (bErr || !booking) throw new Error(bErr?.message ?? "Could not create booking");

    const itemsPayload = data.items.map((it) => ({
      booking_id: booking.id,
      item_type: it.item_type,
      description: it.description || null,
    }));
    const { error: iErr } = await supabase.from("booking_items").insert(itemsPayload);
    if (iErr) throw new Error(iErr.message);

    return { bookingId: booking.id, price, paymentChoice: data.payment_choice };
  });

export const listMyBookings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("bookings")
      .select("*, booking_items(*)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
    if (error) throw new Error(error.message);
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    return { profile: data, isAdmin: (roles ?? []).some((r) => r.role === "admin") };
  });

// Admin: list all bookings
export const adminListBookings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");
    const { data, error } = await supabase
      .from("bookings")
      .select("*, booking_items(*), profiles!bookings_user_id_fkey(full_name, student_number, campus, phone_number, email)")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

const UpdateBookingStatusInput = z.object({
  booking_id: z.string().uuid(),
  status: z.enum(["CONFIRMED", "COLLECTED", "IN_STORAGE", "DELIVERED", "CANCELLED"]).optional(),
  deposit_status: z.enum(["PENDING", "PAID", "FAILED"]).optional(),
  balance_status: z.enum(["PENDING", "PAID", "FAILED"]).optional(),
});

export const adminUpdateBooking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => UpdateBookingStatusInput.parse(raw))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");

    const { booking_id, ...rest } = data;

    // Enforce: cannot mark DELIVERED unless balance is PAID
    if (rest.status === "DELIVERED") {
      const { data: b } = await supabase.from("bookings").select("balance_status").eq("id", booking_id).maybeSingle();
      const effectiveBalance = rest.balance_status ?? b?.balance_status;
      if (effectiveBalance !== "PAID") {
        throw new Error("Cannot release delivery: balance is not PAID.");
      }
    }

    const patch: {
      status?: typeof rest.status;
      deposit_status?: typeof rest.deposit_status;
      balance_status?: typeof rest.balance_status;
    } = {};
    if (rest.status) patch.status = rest.status;
    if (rest.deposit_status) patch.deposit_status = rest.deposit_status;
    if (rest.balance_status) patch.balance_status = rest.balance_status;

    const { error } = await supabase.from("bookings").update(patch).eq("id", booking_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
