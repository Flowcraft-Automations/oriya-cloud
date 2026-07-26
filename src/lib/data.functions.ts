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
        .select("id, source, unit_id, property_id, check_in, check_out, guests, nights, message, page_url, form_name, referrer, utm_source, utm_campaign, utm_medium, guest_name, phone, email, created_at")
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
  .inputValidator((d: { lead_id: string; source: string; unit_id?: string | null; property_id?: string | null; check_in?: string | null; check_out?: string | null; guests?: number | null; message?: string | null; page_url?: string | null; form_name?: string | null; referrer?: string | null; utm_source?: string | null; utm_campaign?: string | null }) =>
    z.object({
      lead_id: z.string().uuid(),
      source: z.string().min(1),
      unit_id: z.string().uuid().nullable().optional(),
      property_id: z.string().uuid().nullable().optional(),
      check_in: z.string().nullable().optional(),
      check_out: z.string().nullable().optional(),
      guests: z.number().int().positive().nullable().optional(),
      message: z.string().nullable().optional(),
      page_url: z.string().nullable().optional(),
      form_name: z.string().nullable().optional(),
      referrer: z.string().nullable().optional(),
      utm_source: z.string().nullable().optional(),
      utm_campaign: z.string().nullable().optional(),
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

// ---------- Tabbed Dashboards ----------

const HE_MONTHS = ["ינו", "פבר", "מרץ", "אפר", "מאי", "יונ", "יול", "אוג", "ספט", "אוק", "נוב", "דצמ"];
const isoDay = (d: Date) => d.toISOString().slice(0, 10);

export const getOperationsDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const rangeStart = new Date(today); rangeStart.setDate(today.getDate() - 3);
    const rangeEnd = new Date(today); rangeEnd.setDate(today.getDate() + 7);
    const days30 = new Date(today); days30.setDate(today.getDate() - 30);

    const [{ data: units }, { data: properties }, { data: res30 }, { data: resWindow }] = await Promise.all([
      context.supabase.from("units").select("id, name, property_id"),
      context.supabase.from("properties").select("id, name"),
      context.supabase
        .from("reservations")
        .select("id, status, check_in, check_out, nights, channel")
        .gte("check_in", isoDay(days30)),
      context.supabase
        .from("reservations")
        .select("id, unit_id, customer_id, guest_name, phone, channel, status, check_in, check_out, nights")
        .lte("check_in", isoDay(rangeEnd))
        .gte("check_out", isoDay(rangeStart)),
    ]);

    const unitMap = new Map((units ?? []).map((u) => [u.id, u]));
    const propMap = new Map((properties ?? []).map((p) => [p.id, p.name]));
    const unitLabel = (id: string) => {
      const u = unitMap.get(id); if (!u) return "—";
      return `${propMap.get(u.property_id) ?? ""} · ${u.name}`.trim();
    };
    const todayStr = isoDay(today);
    const reservations = resWindow ?? [];
    const active = reservations.filter((r) => r.status !== "cancelled" && r.channel !== "block");

    const stayingNow = active.filter((r) => r.check_in <= todayStr && r.check_out > todayStr);
    const arrivingToday = active.filter((r) => r.check_in === todayStr);
    const departingToday = active.filter((r) => r.check_out === todayStr);

    // Occupancy this month from window (roughly; window includes near-term)
    let occ = 0;
    for (const r of active) {
      const ci = new Date(r.check_in), co = new Date(r.check_out);
      const s = ci < monthStart ? monthStart : ci;
      const e = co > monthEnd ? monthEnd : co;
      occ += Math.max(0, Math.round((e.getTime() - s.getTime()) / 86400000));
    }
    const capacity = (units?.length ?? 0) * daysInMonth;
    const occPct = capacity > 0 ? Math.round((occ / capacity) * 100) : 0;

    // Avg stay + cancellation rate (last 30d)
    const r30 = res30 ?? [];
    const stays = r30.filter((r) => r.status !== "cancelled" && r.channel !== "block");
    const avgStay = stays.length ? Math.round((stays.reduce((a, r) => a + (r.nights ?? 0), 0) / stays.length) * 10) / 10 : 0;
    const cancelRate = r30.length ? Math.round((r30.filter((r) => r.status === "cancelled").length / r30.length) * 100) : 0;

    // 7-day series (today ± 3)
    const series: { date: string; label: string; arrivals: number; departures: number }[] = [];
    for (let i = -3; i <= 3; i++) {
      const d = new Date(today); d.setDate(today.getDate() + i);
      const ds = isoDay(d);
      series.push({
        date: ds,
        label: `${d.getDate()}/${d.getMonth() + 1}`,
        arrivals: active.filter((r) => r.check_in === ds).length,
        departures: active.filter((r) => r.check_out === ds).length,
      });
    }

    const upcoming = active
      .filter((r) => r.check_in > todayStr && r.check_in <= isoDay(rangeEnd))
      .sort((a, b) => a.check_in.localeCompare(b.check_in))
      .slice(0, 10)
      .map((r) => ({
        id: r.id, check_in: r.check_in, check_out: r.check_out, guest_name: r.guest_name,
        phone: r.phone, channel: r.channel, status: r.status, unit_label: unitLabel(r.unit_id),
      }));

    const unitStatus = (units ?? []).map((u) => {
      const occupied = active.find((r) => r.unit_id === u.id && r.check_in <= todayStr && r.check_out > todayStr);
      const arriving = active.find((r) => r.unit_id === u.id && r.check_in === todayStr);
      return {
        id: u.id,
        label: `${propMap.get(u.property_id) ?? ""} · ${u.name}`,
        state: occupied ? "occupied" : arriving ? "arriving" : "free",
        guest: occupied?.guest_name ?? arriving?.guest_name ?? null,
        until: occupied?.check_out ?? null,
      } as const;
    });

    return {
      kpis: {
        stayingNow: stayingNow.length,
        arrivingToday: arrivingToday.length,
        departingToday: departingToday.length,
        occupancyPct: occPct,
        avgStay,
        cancelRate,
      },
      series,
      arrivalsToday: arrivingToday.map((r) => ({
        id: r.id, guest_name: r.guest_name, phone: r.phone, channel: r.channel, status: r.status, unit_label: unitLabel(r.unit_id),
      })),
      departuresToday: departingToday.map((r) => ({
        id: r.id, guest_name: r.guest_name, phone: r.phone, channel: r.channel, status: r.status, unit_label: unitLabel(r.unit_id),
      })),
      upcoming,
      unitStatus,
    };
  });

export const getLeadsDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const weekStart = new Date(today); weekStart.setDate(today.getDate() - 7);

    const [{ data: leads }, { data: inquiries }, { data: properties }] = await Promise.all([
      context.supabase.from("leads").select("id, full_name, source, stage, interest, created_at"),
      context.supabase.from("lead_inquiries").select("id, lead_id, source, property_id, unit_id, check_in, check_out, guests, guest_name, created_at").order("created_at", { ascending: false }),
      context.supabase.from("properties").select("id, name"),
    ]);

    const L = leads ?? [];
    const I = inquiries ?? [];
    const propMap = new Map((properties ?? []).map((p) => [p.id, p.name]));

    const newThisMonth = L.filter((l) => new Date(l.created_at) >= monthStart).length;
    const open = L.filter((l) => !["booked", "lost"].includes(l.stage)).length;
    const closed = L.filter((l) => ["booked", "lost"].includes(l.stage));
    const booked = L.filter((l) => l.stage === "booked").length;
    const conversionPct = closed.length ? Math.round((booked / closed.length) * 100) : 0;
    const inquiriesThisWeek = I.filter((i) => new Date(i.created_at) >= weekStart).length;

    const stages = ["new", "contacted", "quoted", "booked", "lost"] as const;
    const funnel = stages.map((s) => ({ stage: s, count: L.filter((l) => l.stage === s).length }));

    const sourceCounts: Record<string, number> = {};
    for (const l of L) sourceCounts[l.source] = (sourceCounts[l.source] ?? 0) + 1;
    const sourceMix = Object.entries(sourceCounts).map(([k, v]) => ({ source: k, count: v }));

    const propCounts: Record<string, number> = {};
    for (const i of I) if (i.property_id) propCounts[i.property_id] = (propCounts[i.property_id] ?? 0) + 1;
    const inquiriesByProperty = Object.entries(propCounts)
      .map(([id, count]) => ({ property_id: id, name: propMap.get(id) ?? "—", count }))
      .sort((a, b) => b.count - a.count);

    const recentInquiries = I.slice(0, 8).map((i) => ({
      id: i.id,
      lead_id: i.lead_id,
      source: i.source,
      guest_name: i.guest_name ?? null,
      property_name: i.property_id ? propMap.get(i.property_id) ?? null : null,
      check_in: i.check_in,
      check_out: i.check_out,
      created_at: i.created_at,
    }));

    const newest = [...L].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 5).map((l) => ({
      id: l.id, full_name: l.full_name, source: l.source, stage: l.stage, interest: l.interest, created_at: l.created_at,
    }));

    return {
      kpis: { newThisMonth, open, conversionPct, inquiriesThisWeek, totalLeads: L.length, booked },
      funnel,
      sourceMix,
      inquiriesByProperty,
      recentInquiries,
      newest,
    };
  });

export const getFinancialDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todayStr = isoDay(today);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 5, 1);
    const days90 = new Date(today); days90.setDate(today.getDate() - 90);

    const [{ data: invoices }, { data: customers }, { data: reservations }] = await Promise.all([
      context.supabase
        .from("invoices")
        .select("id, invoice_number, customer_id, reservation_id, issue_date, due_date, total, amount, tax, status")
        .gte("issue_date", isoDay(sixMonthsAgo)),
      context.supabase.from("customers").select("id, full_name"),
      context.supabase
        .from("reservations")
        .select("id, channel, status, check_in, check_out, total_amount, nights")
        .gte("check_in", isoDay(sixMonthsAgo)),
    ]);

    const inv = invoices ?? [];
    const custMap = new Map((customers ?? []).map((c) => [c.id, c.full_name]));
    const res = reservations ?? [];

    // KPIs
    const paidThisMonth = inv.filter((i) => i.status === "paid" && i.issue_date >= isoDay(monthStart) && i.issue_date < isoDay(monthEnd));
    const monthRevenue = paidThisMonth.reduce((a, i) => a + Number(i.total), 0);
    const outstanding = inv.filter((i) => i.status === "sent" || i.status === "overdue");
    const outstandingSum = outstanding.reduce((a, i) => a + Number(i.total), 0);
    const overdueSum = inv
      .filter((i) => (i.status === "sent" || i.status === "overdue") && i.due_date && i.due_date < todayStr)
      .reduce((a, i) => a + Number(i.total), 0);

    // ADR / RevPAR (this month, from reservations)
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const unitsQ = await context.supabase.from("units").select("id");
    const unitCount = unitsQ.data?.length ?? 0;
    let occNights = 0, mRes = 0;
    for (const r of res) {
      if (r.status === "cancelled" || r.channel === "block") continue;
      const ci = new Date(r.check_in), co = new Date(r.check_out);
      const s = ci < monthStart ? monthStart : ci;
      const e = co > monthEnd ? monthEnd : co;
      const ov = Math.max(0, Math.round((e.getTime() - s.getTime()) / 86400000));
      occNights += ov;
      if (ov > 0 && (r.nights ?? 0) > 0) mRes += (Number(r.total_amount) * ov) / (r.nights ?? 1);
    }
    const adr = occNights > 0 ? Math.round(mRes / occNights) : 0;
    const revpar = unitCount > 0 ? Math.round(mRes / (unitCount * daysInMonth)) : 0;

    // Revenue by month (last 6)
    const revenueByMonth: { month: string; value: number; current?: boolean }[] = [];
    for (let i = 5; i >= 0; i--) {
      const m = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const mEnd = new Date(m.getFullYear(), m.getMonth() + 1, 1);
      const value = inv
        .filter((v) => v.status === "paid" && v.issue_date >= isoDay(m) && v.issue_date < isoDay(mEnd))
        .reduce((a, v) => a + Number(v.total), 0);
      revenueByMonth.push({ month: HE_MONTHS[m.getMonth()], value: Math.round(value), current: i === 0 ? true : undefined });
    }

    // Paid vs outstanding donut
    const donut = [
      { name: "שולם החודש", value: Math.round(monthRevenue), color: "var(--success)" },
      { name: "יתרת גבייה", value: Math.round(outstandingSum), color: "var(--gold-600)" },
      { name: "בפיגור", value: Math.round(overdueSum), color: "var(--danger)" },
    ].filter((d) => d.value > 0);

    // Revenue by channel (this month, from reservations)
    const chSum: Record<string, number> = {};
    for (const r of res) {
      if (r.status === "cancelled" || r.channel === "block") continue;
      const ci = new Date(r.check_in), co = new Date(r.check_out);
      const s = ci < monthStart ? monthStart : ci;
      const e = co > monthEnd ? monthEnd : co;
      const ov = Math.max(0, Math.round((e.getTime() - s.getTime()) / 86400000));
      if (ov > 0 && (r.nights ?? 0) > 0) chSum[r.channel] = (chSum[r.channel] ?? 0) + (Number(r.total_amount) * ov) / (r.nights ?? 1);
    }
    const revenueByChannel = Object.entries(chSum).map(([channel, v]) => ({ channel, value: Math.round(v) }));

    // Outstanding invoices list
    const outstandingList = outstanding
      .sort((a, b) => (a.due_date ?? "").localeCompare(b.due_date ?? ""))
      .slice(0, 10)
      .map((i) => ({
        id: i.id,
        invoice_number: i.invoice_number,
        customer_name: i.customer_id ? custMap.get(i.customer_id) ?? null : null,
        due_date: i.due_date,
        total: Number(i.total),
        status: i.status,
        days_overdue: i.due_date && i.due_date < todayStr ? Math.round((today.getTime() - new Date(i.due_date).getTime()) / 86400000) : 0,
      }));

    // Top customers by revenue last 90d
    const custSum = new Map<string, number>();
    for (const i of inv) {
      if (i.status !== "paid") continue;
      if (i.issue_date < isoDay(days90)) continue;
      if (!i.customer_id) continue;
      custSum.set(i.customer_id, (custSum.get(i.customer_id) ?? 0) + Number(i.total));
    }
    const topCustomers = [...custSum.entries()]
      .map(([id, v]) => ({ id, name: custMap.get(id) ?? "—", total: Math.round(v) }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    return {
      kpis: {
        monthRevenue: Math.round(monthRevenue),
        outstandingSum: Math.round(outstandingSum),
        overdueSum: Math.round(overdueSum),
        paidCount: paidThisMonth.length,
        adr,
        revpar,
      },
      revenueByMonth,
      donut,
      revenueByChannel,
      outstandingList,
      topCustomers,
    };
  });

// ---------- Dashboard KPI drill-through ----------

export type DrillKey =
  | "staying_now" | "arrivals_today" | "departures_today"
  | "occupancy_month" | "avg_stay" | "cancel_rate"
  | "new_leads_month" | "open_leads" | "conversion" | "inquiries_week" | "total_inquiries"
  | "revenue_month" | "outstanding" | "overdue" | "adr" | "revpar" | "open_invoices";

export type DrillLinkTo = "reservation" | "lead" | "inquiry" | "invoice" | "customer";
export type DrillRow = {
  id: string;
  primary: string;
  secondary?: string | null;
  pill?: { label: string; tone: string } | null;
  amount?: string | null;
  linkTo: DrillLinkTo;
  linkId: string;
};

const drillKeys = [
  "staying_now","arrivals_today","departures_today","occupancy_month","avg_stay","cancel_rate",
  "new_leads_month","open_leads","conversion","inquiries_week","total_inquiries",
  "revenue_month","outstanding","overdue","adr","revpar","open_invoices",
] as const;

const drillTitles: Record<DrillKey, string> = {
  staying_now: "שוהים עכשיו",
  arrivals_today: "הגעות היום",
  departures_today: "עזיבות היום",
  occupancy_month: "הזמנות פעילות החודש",
  avg_stay: "שהיות ב-30 יום",
  cancel_rate: "ביטולים ב-30 יום",
  new_leads_month: "לידים חדשים החודש",
  open_leads: "לידים פתוחים",
  conversion: "לידים שהומרו להזמנה",
  inquiries_week: "פניות בשבוע האחרון",
  total_inquiries: "כל הפניות",
  revenue_month: "חשבוניות ששולמו החודש",
  outstanding: "חשבוניות פתוחות",
  overdue: "חשבוניות בפיגור",
  adr: "לילות מוזמנים (30 יום)",
  revpar: "לילות מוזמנים (30 יום)",
  open_invoices: "חשבוניות פתוחות",
};

const resStatusHe: Record<string, string> = { pending: "ממתין", confirmed: "מאושר", checkin: "צ׳ק-אין", checkout: "צ׳ק-אאוט", cancelled: "בוטל", block: "חסום" };
const resStatusTone: Record<string, string> = { pending: "warning", confirmed: "info", checkin: "success", checkout: "neutral", cancelled: "danger", block: "neutral" };
const chHe: Record<string, string> = { direct: "ישיר", airbnb: "Airbnb", booking: "Booking", vrbo: "Vrbo", tzimmerer: "צימרר", other: "אחר", block: "חסום" };
const chTone: Record<string, string> = { direct: "gold", airbnb: "danger", booking: "info", vrbo: "warning", tzimmerer: "success", other: "neutral", block: "neutral" };
const srcHe: Record<string, string> = { website: "אתר", whatsapp: "וואטסאפ", tzimmerer: "צימרר", instagram: "אינסטגרם", referral: "המלצה", bot: "בוט", other: "אחר" };
const srcTone: Record<string, string> = { website: "info", whatsapp: "success", tzimmerer: "gold", instagram: "danger", referral: "warning", bot: "neutral", other: "neutral" };
const stageHe: Record<string, string> = { new: "חדש", contacted: "נוצר קשר", quoted: "הצעה", booked: "הוזמן", lost: "אבוד" };
const stageTone: Record<string, string> = { new: "info", contacted: "warning", quoted: "gold", booked: "success", lost: "danger" };
const invStatusHe: Record<string, string> = { draft: "טיוטה", sent: "נשלח", paid: "שולם", overdue: "בפיגור", cancelled: "בוטל" };
const invStatusTone: Record<string, string> = { draft: "neutral", sent: "info", paid: "success", overdue: "danger", cancelled: "neutral" };

export const getDashboardDrill = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { key: DrillKey }) => z.object({ key: z.enum(drillKeys) }).parse(d))
  .handler(async ({ data, context }) => {
    const key = data.key;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todayStr = isoDay(today);
    const monthStart = isoDay(new Date(today.getFullYear(), today.getMonth(), 1));
    const monthEnd = isoDay(new Date(today.getFullYear(), today.getMonth() + 1, 1));
    const weekAgo = isoDay(new Date(today.getTime() - 7 * 86400000));
    const days30 = isoDay(new Date(today.getTime() - 30 * 86400000));

    const rows: DrillRow[] = [];
    const title = drillTitles[key];

    const unitLabelMap = async () => {
      const [{ data: units }, { data: props }] = await Promise.all([
        context.supabase.from("units").select("id, name, property_id"),
        context.supabase.from("properties").select("id, name"),
      ]);
      const pm = new Map((props ?? []).map((p) => [p.id, p.name]));
      return new Map((units ?? []).map((u) => [u.id, `${pm.get(u.property_id) ?? ""} · ${u.name}`]));
    };

    // Reservations-based drills
    if (["staying_now", "arrivals_today", "departures_today", "occupancy_month", "avg_stay", "cancel_rate", "adr", "revpar"].includes(key)) {
      const uMap = await unitLabelMap();
      let q = context.supabase.from("reservations").select("id, unit_id, guest_name, phone, channel, status, check_in, check_out, nights, total_amount");
      if (key === "staying_now") q = q.lte("check_in", todayStr).gt("check_out", todayStr).neq("status", "cancelled");
      else if (key === "arrivals_today") q = q.eq("check_in", todayStr).neq("status", "cancelled");
      else if (key === "departures_today") q = q.eq("check_out", todayStr).neq("status", "cancelled");
      else if (key === "occupancy_month") q = q.lt("check_in", monthEnd).gt("check_out", monthStart).neq("status", "cancelled").neq("channel", "block");
      else if (key === "avg_stay" || key === "adr" || key === "revpar") q = q.gte("check_in", days30).neq("status", "cancelled").neq("channel", "block");
      else if (key === "cancel_rate") q = q.gte("check_in", days30).eq("status", "cancelled");
      const { data } = await q.order("check_in", { ascending: false }).limit(100);
      for (const r of data ?? []) {
        rows.push({
          id: r.id,
          primary: r.guest_name ?? "—",
          secondary: `${uMap.get(r.unit_id) ?? ""} · ${r.check_in} → ${r.check_out} · ${r.nights ?? 0} לילות`,
          pill: { label: chHe[r.channel] ?? r.channel, tone: chTone[r.channel] ?? "neutral" },
          amount: r.total_amount ? `₪${Number(r.total_amount).toLocaleString()}` : null,
          linkTo: "reservation",
          linkId: r.id,
        });
      }
    }

    // Leads
    else if (["new_leads_month", "open_leads", "conversion"].includes(key)) {
      let q = context.supabase.from("leads").select("id, full_name, phone, source, stage, interest, created_at");
      if (key === "new_leads_month") q = q.gte("created_at", monthStart);
      else if (key === "open_leads") q = q.not("stage", "in", "(booked,lost)");
      else if (key === "conversion") q = q.eq("stage", "booked");
      const { data } = await q.order("created_at", { ascending: false }).limit(100);
      for (const l of data ?? []) {
        rows.push({
          id: l.id,
          primary: l.full_name,
          secondary: `${l.interest ?? ""} ${l.phone ? `· ${l.phone}` : ""}`.trim() || null,
          pill: { label: stageHe[l.stage] ?? l.stage, tone: stageTone[l.stage] ?? "neutral" },
          amount: srcHe[l.source] ?? l.source,
          linkTo: "lead",
          linkId: l.id,
        });
      }
    }

    // Inquiries
    else if (key === "inquiries_week" || key === "total_inquiries") {
      const uMap = await unitLabelMap();
      const { data: props } = await context.supabase.from("properties").select("id, name");
      const pMap = new Map((props ?? []).map((p) => [p.id, p.name]));
      let q = context.supabase.from("lead_inquiries").select("id, lead_id, source, property_id, unit_id, guest_name, check_in, check_out, created_at");
      if (key === "inquiries_week") q = q.gte("created_at", weekAgo);
      const { data } = await q.order("created_at", { ascending: false }).limit(100);
      for (const i of data ?? []) {
        const loc = i.unit_id ? uMap.get(i.unit_id) : i.property_id ? pMap.get(i.property_id) : null;
        rows.push({
          id: i.id,
          primary: i.guest_name ?? "פנייה",
          secondary: [loc, i.check_in && `${i.check_in} → ${i.check_out ?? "?"}`, new Date(i.created_at).toLocaleDateString("he-IL")].filter(Boolean).join(" · "),
          pill: { label: srcHe[i.source] ?? i.source, tone: srcTone[i.source] ?? "neutral" },
          amount: null,
          linkTo: "lead",
          linkId: i.lead_id,
        });
      }
    }

    // Invoices
    else if (["revenue_month", "outstanding", "overdue", "open_invoices"].includes(key)) {
      let q = context.supabase.from("invoices").select("id, invoice_number, customer_id, issue_date, due_date, total, status");
      if (key === "revenue_month") q = q.eq("status", "paid").gte("issue_date", monthStart).lt("issue_date", monthEnd);
      else if (key === "outstanding" || key === "open_invoices") q = q.in("status", ["sent", "overdue"]);
      else if (key === "overdue") q = q.in("status", ["sent", "overdue"]).lt("due_date", todayStr);
      const { data } = await q.order("issue_date", { ascending: false }).limit(100);
      const { data: customers } = await context.supabase.from("customers").select("id, full_name");
      const cMap = new Map((customers ?? []).map((c) => [c.id, c.full_name]));
      for (const i of data ?? []) {
        rows.push({
          id: i.id,
          primary: (i.customer_id ? cMap.get(i.customer_id) : null) ?? "—",
          secondary: `${i.invoice_number} · ${i.due_date ? `לתשלום ${i.due_date}` : `הופק ${i.issue_date}`}`,
          pill: { label: invStatusHe[i.status] ?? i.status, tone: invStatusTone[i.status] ?? "neutral" },
          amount: `₪${Number(i.total).toLocaleString()}`,
          linkTo: "invoice",
          linkId: i.id,
        });
      }
    }

    return { title, count: rows.length, rows };
  });