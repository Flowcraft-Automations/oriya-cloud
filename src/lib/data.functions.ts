import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

// ---------- Properties + Units ----------

export const listPropertiesWithUnits = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: properties } = await context.supabase
      .from("properties")
      .select("id, name, address, notes")
      .order("created_at", { ascending: true });
    const { data: units } = await context.supabase
      .from("units")
      .select("id, property_id, name, capacity, base_price, notes")
      .order("created_at", { ascending: true });
    return { properties: properties ?? [], units: units ?? [] };
  });

export const createProperty = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { name: string; address?: string; notes?: string }) =>
    z.object({ name: z.string().min(1), address: z.string().optional(), notes: z.string().optional() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("properties")
      .insert({ ...data, owner_id: context.userId })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteProperty = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("properties").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const createUnit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { property_id: string; name: string; capacity?: number; base_price?: number }) =>
    z
      .object({
        property_id: z.string().uuid(),
        name: z.string().min(1),
        capacity: z.number().int().positive().optional(),
        base_price: z.number().nonnegative().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("units")
      .insert({ ...data, owner_id: context.userId })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteUnit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("units").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateUnit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; capacity?: number; base_price?: number; name?: string }) =>
    z
      .object({
        id: z.string().uuid(),
        capacity: z.number().int().positive().optional(),
        base_price: z.number().nonnegative().optional(),
        name: z.string().min(1).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { id, ...patch } = data;
    const { error } = await context.supabase.from("units").update(patch).eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Reservations ----------

export const listReservations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("reservations")
      .select(
        "id, unit_id, customer_id, guest_name, phone, channel, status, check_in, check_out, nights, adults, children, total_amount, paid_amount, notes",
      )
      .order("check_in", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const createReservation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      unit_id: string;
      guest_name: string;
      phone?: string;
      channel: string;
      status?: string;
      check_in: string;
      check_out: string;
      adults?: number;
      children?: number;
      total_amount?: number;
      paid_amount?: number;
      notes?: string;
    }) =>
      z
        .object({
          unit_id: z.string().uuid(),
          guest_name: z.string().min(1),
          phone: z.string().optional(),
          channel: z.enum(["booking", "direct", "tzimmerer", "airbnb", "vrbo", "block"]),
          status: z.enum(["pending", "confirmed", "checkin", "checkout", "cancelled"]).optional(),
          check_in: z.string(),
          check_out: z.string(),
          adults: z.number().int().nonnegative().optional(),
          children: z.number().int().nonnegative().optional(),
          total_amount: z.number().nonnegative().optional(),
          paid_amount: z.number().nonnegative().optional(),
          notes: z.string().optional(),
        })
        .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("reservations")
      .insert({ ...data, owner_id: context.userId })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const updateReservationStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; status: string }) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["pending", "confirmed", "checkin", "checkout", "cancelled"]),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("reservations")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteReservation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("reservations").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Customers ----------

export const listCustomers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("customers")
      .select("id, full_name, phone, email, id_number, tags, notes, created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const createCustomer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: { full_name: string; phone?: string; email?: string; id_number?: string; tags?: string[]; notes?: string }) =>
      z
        .object({
          full_name: z.string().min(1),
          phone: z.string().optional(),
          email: z.string().optional(),
          id_number: z.string().optional(),
          tags: z.array(z.string()).optional(),
          notes: z.string().optional(),
        })
        .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("customers")
      .insert({ ...data, owner_id: context.userId })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteCustomer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("customers").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Leads ----------

export const listLeads = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("leads")
      .select("id, full_name, phone, email, source, interest, stage, property_id, notes, created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const createLead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: { full_name: string; phone?: string; email?: string; source: string; interest?: string; stage?: string }) =>
      z
        .object({
          full_name: z.string().min(1),
          phone: z.string().optional(),
          email: z.string().optional(),
          source: z.enum(["whatsapp", "website", "tzimmerer", "instagram", "referral", "other"]),
          interest: z.string().optional(),
          stage: z.enum(["new", "contacted", "quoted", "booked", "lost"]).optional(),
        })
        .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("leads")
      .insert({ ...data, owner_id: context.userId })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const updateLeadStage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; stage: string }) =>
    z
      .object({
        id: z.string().uuid(),
        stage: z.enum(["new", "contacted", "quoted", "booked", "lost"]),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("leads").update({ stage: data.stage }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteLead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("leads").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Detail fetchers & updates ----------

export const getCustomerDetail = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const [{ data: customer }, { data: reservations }, { data: communications }] = await Promise.all([
      context.supabase.from("customers").select("*").eq("id", data.id).single(),
      context.supabase
        .from("reservations")
        .select("id, unit_id, guest_name, channel, status, check_in, check_out, nights, total_amount, paid_amount, rating, review")
        .eq("customer_id", data.id)
        .order("check_in", { ascending: false }),
      context.supabase
        .from("communications")
        .select("id, channel, direction, subject, body, status, sent_at, campaign_id")
        .eq("customer_id", data.id)
        .order("sent_at", { ascending: false }),
    ]);
    if (!customer) throw new Error("Customer not found");
    return { customer, reservations: reservations ?? [], communications: communications ?? [] };
  });

export const updateCustomer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; full_name?: string; phone?: string; email?: string; notes?: string; tags?: string[] }) =>
    z.object({
      id: z.string().uuid(),
      full_name: z.string().min(1).optional(),
      phone: z.string().nullable().optional(),
      email: z.string().nullable().optional(),
      notes: z.string().nullable().optional(),
      tags: z.array(z.string()).optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { id, ...patch } = data;
    const { error } = await context.supabase.from("customers").update(patch).eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getLeadDetail = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const [{ data: lead }, { data: inquiries }, { data: communications }] = await Promise.all([
      context.supabase.from("leads").select("*").eq("id", data.id).single(),
      context.supabase
        .from("lead_inquiries")
        .select("id, source, unit_id, property_id, check_in, check_out, guests, message, created_at")
        .eq("lead_id", data.id)
        .order("created_at", { ascending: false }),
      context.supabase
        .from("communications")
        .select("id, channel, direction, subject, body, status, sent_at, campaign_id")
        .eq("lead_id", data.id)
        .order("sent_at", { ascending: false }),
    ]);
    if (!lead) throw new Error("Lead not found");
    return { lead, inquiries: inquiries ?? [], communications: communications ?? [] };
  });

export const updateLead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; full_name?: string; phone?: string; email?: string; stage?: string; source?: string; interest?: string; notes?: string; property_id?: string | null }) =>
    z.object({
      id: z.string().uuid(),
      full_name: z.string().min(1).optional(),
      phone: z.string().nullable().optional(),
      email: z.string().nullable().optional(),
      stage: z.enum(["new", "contacted", "quoted", "booked", "lost"]).optional(),
      source: z.enum(["whatsapp", "website", "tzimmerer", "instagram", "referral", "other"]).optional(),
      interest: z.string().nullable().optional(),
      notes: z.string().nullable().optional(),
      property_id: z.string().uuid().nullable().optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { id, ...patch } = data;
    const { error } = await context.supabase.from("leads").update(patch).eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const addLeadInquiry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { lead_id: string; source: string; unit_id?: string | null; property_id?: string | null; check_in?: string | null; check_out?: string | null; guests?: number | null; message?: string | null }) =>
    z.object({
      lead_id: z.string().uuid(),
      source: z.string().min(1),
      unit_id: z.string().uuid().nullable().optional(),
      property_id: z.string().uuid().nullable().optional(),
      check_in: z.string().nullable().optional(),
      check_out: z.string().nullable().optional(),
      guests: z.number().int().positive().nullable().optional(),
      message: z.string().nullable().optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("lead_inquiries").insert({ ...data, owner_id: context.userId });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getReservationDetail = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: reservation } = await context.supabase
      .from("reservations")
      .select("*")
      .eq("id", data.id)
      .single();
    if (!reservation) throw new Error("Reservation not found");
    const [{ data: unit }, { data: customer }, { data: communications }] = await Promise.all([
      context.supabase.from("units").select("id, name, property_id, capacity, base_price").eq("id", reservation.unit_id).single(),
      reservation.customer_id
        ? context.supabase.from("customers").select("id, full_name, phone, email").eq("id", reservation.customer_id).single()
        : Promise.resolve({ data: null }),
      reservation.customer_id
        ? context.supabase
            .from("communications")
            .select("id, channel, direction, subject, body, sent_at, status")
            .eq("customer_id", reservation.customer_id)
            .order("sent_at", { ascending: false })
            .limit(20)
        : Promise.resolve({ data: [] as { id: string; channel: string; direction: string; subject: string | null; body: string | null; sent_at: string; status: string | null }[] }),
    ]);
    let property: { id: string; name: string } | null = null;
    if (unit) {
      const { data: p } = await context.supabase.from("properties").select("id, name").eq("id", unit.property_id).single();
      property = p;
    }
    return { reservation, unit, property, customer, communications: communications ?? [] };
  });

export const updateReservation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    id: string;
    guest_name?: string;
    phone?: string | null;
    check_in?: string;
    check_out?: string;
    adults?: number;
    children?: number;
    total_amount?: number;
    paid_amount?: number;
    status?: string;
    notes?: string | null;
    rating?: number | null;
    review?: string | null;
    customer_id?: string | null;
  }) =>
    z.object({
      id: z.string().uuid(),
      guest_name: z.string().min(1).optional(),
      phone: z.string().nullable().optional(),
      check_in: z.string().optional(),
      check_out: z.string().optional(),
      adults: z.number().int().nonnegative().optional(),
      children: z.number().int().nonnegative().optional(),
      total_amount: z.number().nonnegative().optional(),
      paid_amount: z.number().nonnegative().optional(),
      status: z.enum(["pending", "confirmed", "checkin", "checkout", "cancelled"]).optional(),
      notes: z.string().nullable().optional(),
      rating: z.number().int().min(1).max(5).nullable().optional(),
      review: z.string().nullable().optional(),
      customer_id: z.string().uuid().nullable().optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { id, ...patch } = data;
    const { error } = await context.supabase.from("reservations").update(patch).eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const addCommunication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { customer_id?: string | null; lead_id?: string | null; channel: string; direction?: string; subject?: string | null; body?: string | null }) =>
    z.object({
      customer_id: z.string().uuid().nullable().optional(),
      lead_id: z.string().uuid().nullable().optional(),
      channel: z.enum(["whatsapp", "email", "sms"]),
      direction: z.enum(["outbound", "inbound"]).optional(),
      subject: z.string().nullable().optional(),
      body: z.string().nullable().optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("communications").insert({ ...data, owner_id: context.userId });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Dashboard ----------

export const getDashboardData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const yearAgo = new Date(today.getFullYear(), today.getMonth() - 6, 1);
    const iso = (d: Date) => d.toISOString().slice(0, 10);

    const [{ data: units }, { data: allRes }] = await Promise.all([
      context.supabase.from("units").select("id"),
      context.supabase
        .from("reservations")
        .select(
          "id, unit_id, guest_name, channel, status, check_in, check_out, nights, total_amount",
        )
        .gte("check_out", iso(yearAgo)),
    ]);

    const unitCount = units?.length ?? 0;
    const reservations = allRes ?? [];
    const todayStr = iso(today);

    const stayingNow = reservations.filter(
      (r) => r.check_in <= todayStr && r.check_out > todayStr && r.status !== "cancelled" && r.channel !== "block",
    );
    const arrivingToday = reservations.filter((r) => r.check_in === todayStr && r.channel !== "block");
    const departingToday = reservations.filter((r) => r.check_out === todayStr && r.channel !== "block");

    // Month occupancy: sum of overlapping nights in current month / (unit_count * days_in_month)
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    let occupiedNights = 0;
    let monthRevenue = 0;
    for (const r of reservations) {
      if (r.status === "cancelled" || r.channel === "block") continue;
      const ci = new Date(r.check_in);
      const co = new Date(r.check_out);
      const s = ci < monthStart ? monthStart : ci;
      const e = co > monthEnd ? monthEnd : co;
      const ov = Math.max(0, Math.round((e.getTime() - s.getTime()) / 86400000));
      occupiedNights += ov;
      if (ov > 0 && (r.nights ?? 0) > 0) monthRevenue += (Number(r.total_amount) * ov) / (r.nights ?? 1);
    }
    const capacity = unitCount * daysInMonth;
    const occPct = capacity > 0 ? Math.round((occupiedNights / capacity) * 100) : 0;
    const adr = occupiedNights > 0 ? Math.round(monthRevenue / occupiedNights) : 0;
    const revpar = capacity > 0 ? Math.round(monthRevenue / capacity) : 0;

    // Revenue by month (last 7 months)
    const revenueByMonth: { month: string; value: number; current?: boolean }[] = [];
    const monthNames = ["ינו", "פבר", "מרץ", "אפר", "מאי", "יונ", "יול", "אוג", "ספט", "אוק", "נוב", "דצמ"];
    for (let i = 6; i >= 0; i--) {
      const m = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const mEnd = new Date(m.getFullYear(), m.getMonth() + 1, 1);
      let val = 0;
      for (const r of reservations) {
        if (r.status === "cancelled" || r.channel === "block") continue;
        const ci = new Date(r.check_in);
        const co = new Date(r.check_out);
        const s = ci < m ? m : ci;
        const e = co > mEnd ? mEnd : co;
        const ov = Math.max(0, Math.round((e.getTime() - s.getTime()) / 86400000));
        if (ov > 0 && (r.nights ?? 0) > 0) val += (Number(r.total_amount) * ov) / (r.nights ?? 1);
      }
      revenueByMonth.push({
        month: monthNames[m.getMonth()],
        value: Math.round(val),
        current: i === 0 ? true : undefined,
      });
    }

    // Occupancy trend last 7 months
    const occupancyTrend: { month: string; value: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const m = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const mEnd = new Date(m.getFullYear(), m.getMonth() + 1, 1);
      const dim = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();
      let occ = 0;
      for (const r of reservations) {
        if (r.status === "cancelled" || r.channel === "block") continue;
        const ci = new Date(r.check_in);
        const co = new Date(r.check_out);
        const s = ci < m ? m : ci;
        const e = co > mEnd ? mEnd : co;
        occ += Math.max(0, Math.round((e.getTime() - s.getTime()) / 86400000));
      }
      const cap = unitCount * dim;
      occupancyTrend.push({ month: monthNames[m.getMonth()], value: cap > 0 ? Math.round((occ / cap) * 100) : 0 });
    }

    // Channel mix by month reservation count
    const chColors: Record<string, string> = {
      booking: "var(--ch-booking)",
      direct: "var(--ch-direct)",
      tzimmerer: "var(--ch-tzimmerer)",
      airbnb: "var(--ch-booking)",
      vrbo: "var(--ch-direct)",
    };
    const chLabels: Record<string, string> = {
      booking: "Booking",
      direct: "ישיר",
      tzimmerer: "צימרר",
      airbnb: "Airbnb",
      vrbo: "Vrbo",
    };
    const chCounts: Record<string, number> = {};
    for (const r of reservations) {
      if (r.channel === "block") continue;
      const ci = new Date(r.check_in);
      if (ci < monthStart || ci >= monthEnd) continue;
      chCounts[r.channel] = (chCounts[r.channel] ?? 0) + 1;
    }
    const totalCh = Object.values(chCounts).reduce((a, b) => a + b, 0);
    const channelMix = Object.entries(chCounts).map(([k, v]) => ({
      name: chLabels[k] ?? k,
      value: totalCh > 0 ? Math.round((v / totalCh) * 100) : 0,
      color: chColors[k] ?? "var(--navy-500)",
    }));

    // New leads (5 most recent, not booked/lost)
    const { data: leads } = await context.supabase
      .from("leads")
      .select("id, full_name, source, interest")
      .in("stage", ["new", "contacted", "quoted"])
      .order("created_at", { ascending: false })
      .limit(5);

    return {
      kpis: {
        stayingNow: stayingNow.length,
        arrivingCount: arrivingToday.length,
        departingCount: departingToday.length,
        occupancyPct: occPct,
        unitCount,
        monthRevenue: Math.round(monthRevenue),
        adr,
        revpar,
      },
      revenueByMonth,
      occupancyTrend,
      channelMix,
      arrivalsToday: arrivingToday.map((r) => ({ id: r.id, name: r.guest_name, unit_id: r.unit_id, time: "15:00" })),
      departuresToday: departingToday.map((r) => ({ id: r.id, name: r.guest_name, unit_id: r.unit_id, time: "11:00" })),
      newLeads:
        leads?.map((l) => ({
          id: l.id,
          name: l.full_name,
          source: l.source,
          interest: l.interest ?? "",
        })) ?? [],
    };
  });

// ---------- Invoices ----------

export const listInvoices = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [{ data: invoices, error }, { data: customers }] = await Promise.all([
      context.supabase
        .from("invoices")
        .select("id, invoice_number, customer_id, reservation_id, issue_date, due_date, amount, tax, total, status, created_at")
        .order("issue_date", { ascending: false }),
      context.supabase.from("customers").select("id, full_name"),
    ]);
    if (error) throw new Error(error.message);
    const cMap = new Map((customers ?? []).map((c) => [c.id, c.full_name]));
    return (invoices ?? []).map((inv) => ({
      ...inv,
      customer_name: inv.customer_id ? cMap.get(inv.customer_id) ?? null : null,
    }));
  });

export const getInvoice = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: invoice, error } = await context.supabase
      .from("invoices").select("*").eq("id", data.id).single();
    if (error || !invoice) throw new Error("Invoice not found");
    const [{ data: customer }, { data: reservation }] = await Promise.all([
      invoice.customer_id
        ? context.supabase.from("customers").select("id, full_name, phone, email").eq("id", invoice.customer_id).single()
        : Promise.resolve({ data: null }),
      invoice.reservation_id
        ? context.supabase.from("reservations").select("id, guest_name, check_in, check_out, nights, channel, status, total_amount, unit_id").eq("id", invoice.reservation_id).single()
        : Promise.resolve({ data: null }),
    ]);
    return { invoice, customer, reservation };
  });

export const createInvoice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    customer_id?: string | null; reservation_id?: string | null;
    invoice_number?: string; issue_date?: string; due_date?: string | null;
    amount: number; tax?: number; total?: number; status?: string; notes?: string | null;
  }) => z.object({
    customer_id: z.string().uuid().nullable().optional(),
    reservation_id: z.string().uuid().nullable().optional(),
    invoice_number: z.string().min(1).optional(),
    issue_date: z.string().optional(),
    due_date: z.string().nullable().optional(),
    amount: z.number().nonnegative(),
    tax: z.number().nonnegative().optional(),
    total: z.number().nonnegative().optional(),
    status: z.enum(["draft","sent","paid","overdue","cancelled"]).optional(),
    notes: z.string().nullable().optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const tax = data.tax ?? Math.round(data.amount * 0.17 * 100) / 100;
    const total = data.total ?? Math.round((data.amount + tax) * 100) / 100;
    const invoice_number = data.invoice_number ?? `INV-${new Date().toISOString().slice(0,7).replace("-","")}-${Math.floor(Math.random()*9000+1000)}`;
    const { data: row, error } = await context.supabase
      .from("invoices")
      .insert({ ...data, tax, total, invoice_number, owner_id: context.userId })
      .select().single();
    if (error) throw new Error(error.message);
    return row;
  });

export const updateInvoice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; amount?: number; tax?: number; total?: number; status?: string; due_date?: string | null; notes?: string | null; invoice_number?: string }) =>
    z.object({
      id: z.string().uuid(),
      amount: z.number().nonnegative().optional(),
      tax: z.number().nonnegative().optional(),
      total: z.number().nonnegative().optional(),
      status: z.enum(["draft","sent","paid","overdue","cancelled"]).optional(),
      due_date: z.string().nullable().optional(),
      notes: z.string().nullable().optional(),
      invoice_number: z.string().min(1).optional(),
    }).parse(d))
  .handler(async ({ data, context }) => {
    const { id, ...patch } = data;
    const { error } = await context.supabase.from("invoices").update(patch).eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteInvoice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("invoices").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listInvoicesByCustomer = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { customer_id: string }) => z.object({ customer_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("invoices")
      .select("id, invoice_number, issue_date, due_date, total, status, reservation_id")
      .eq("customer_id", data.customer_id)
      .order("issue_date", { ascending: false });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const listInvoicesByReservation = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { reservation_id: string }) => z.object({ reservation_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("invoices")
      .select("id, invoice_number, issue_date, due_date, total, status")
      .eq("reservation_id", data.reservation_id)
      .order("issue_date", { ascending: false });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });