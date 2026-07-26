import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { insertMessageWithGuards } from "./wa.functions";

// deno-lint-ignore-file no-explicit-any

function randomToken(): string {
  const bytes = new Uint8Array(18);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function loadReservationContext(supabase: any, reservation_id: string) {
  const { data: r, error } = await supabase
    .from("reservations")
    .select("id, customer_id, guest_name, phone, check_in, check_out, nights, adults, children, total_amount, paid_amount, unit_id")
    .eq("id", reservation_id).single();
  if (error || !r) throw new Error("Reservation not found");
  const [{ data: unit }, { data: customer }] = await Promise.all([
    r.unit_id
      ? supabase.from("units").select("id, name, property_id").eq("id", r.unit_id).single()
      : Promise.resolve({ data: null }),
    r.customer_id
      ? supabase.from("customers").select("id, full_name, phone, email").eq("id", r.customer_id).single()
      : Promise.resolve({ data: null }),
  ]);
  const { data: property } = unit?.property_id
    ? await supabase.from("properties").select("id, name").eq("id", unit.property_id).single()
    : { data: null };
  return { reservation: r, unit, property, customer };
}

async function ensureInvoiceWithToken(
  supabase: any,
  ctx: { reservation: any; customer: any },
  ownerId: string,
): Promise<{ id: string; token: string; amount: number; total: number; url: string }> {
  const total = Number(ctx.reservation.total_amount ?? 0);
  const paid = Number(ctx.reservation.paid_amount ?? 0);
  const outstanding = Math.max(total - paid, 0);

  // Try to reuse an unpaid invoice on this reservation
  const { data: existing } = await supabase
    .from("invoices")
    .select("id, payment_link_token, total, amount, status")
    .eq("reservation_id", ctx.reservation.id)
    .neq("status", "paid")
    .order("created_at", { ascending: false })
    .limit(1);

  let invoice = existing?.[0];
  if (!invoice) {
    const amount = Math.round((outstanding || total) / 1.17 * 100) / 100;
    const tax = Math.round((outstanding || total) * (0.17 / 1.17) * 100) / 100;
    const invoice_number = `INV-${new Date().toISOString().slice(0, 7).replace("-", "")}-${Math.floor(Math.random() * 9000 + 1000)}`;
    const { data: created, error } = await supabase.from("invoices").insert({
      owner_id: ownerId,
      customer_id: ctx.customer?.id ?? ctx.reservation.customer_id ?? null,
      reservation_id: ctx.reservation.id,
      invoice_number,
      amount,
      tax,
      total: outstanding || total,
      status: "draft",
    }).select("id, payment_link_token, total").single();
    if (error || !created) throw new Error(error?.message || "Could not create invoice");
    invoice = created;
  }

  let token = invoice.payment_link_token as string | null;
  if (!token) {
    token = randomToken();
    const { error } = await supabase
      .from("invoices")
      .update({ payment_link_token: token, payment_link_created_at: new Date().toISOString(), status: "sent" })
      .eq("id", invoice.id);
    if (error) throw new Error(error.message);
  }

  const url = `${appOrigin()}/pay/${token}`;
  return { id: invoice.id, token, amount: Number(invoice.total ?? total), total: Number(invoice.total ?? total), url };
}

function appOrigin(): string {
  const site = process.env.PUBLIC_SITE_URL || process.env.VITE_SITE_URL;
  if (site) return site.replace(/\/$/, "");
  return "https://oriya-os-dash.lovable.app";
}

function fmtDate(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

// ---------- Payment link (generate + return) ----------

export const generatePaymentLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { reservation_id: string }) =>
    z.object({ reservation_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const ctx = await loadReservationContext(context.supabase, data.reservation_id);
    const inv = await ensureInvoiceWithToken(context.supabase, ctx, context.userId);
    return { url: inv.url, token: inv.token, invoice_id: inv.id, amount: inv.total };
  });

// ---------- Send payment link via WhatsApp ----------

export const sendPaymentLinkWhatsapp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { reservation_id: string }) =>
    z.object({ reservation_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const ctx = await loadReservationContext(context.supabase, data.reservation_id);
    const phone = ctx.customer?.phone || ctx.reservation.phone;
    if (!phone) throw new Error("אין מספר טלפון להזמנה זו");
    const inv = await ensureInvoiceWithToken(context.supabase, ctx, context.userId);
    const name = (ctx.customer?.full_name || ctx.reservation.guest_name || "").split(" ")[0] || "אורח/ת";
    const res = await insertMessageWithGuards(context.supabase, {
      customer_id: ctx.customer?.id ?? null,
      reservation_id: ctx.reservation.id,
      template_name: "payment_link",
      phone,
      vars: {
        name,
        property: ctx.property?.name ?? "",
        unit: ctx.unit?.name ?? "",
        amount: Number(inv.total).toLocaleString(),
        link: inv.url,
      },
    });
    return { ...res, url: inv.url };
  });

// ---------- Send booking confirmation via WhatsApp ----------

export const sendBookingConfirmationWhatsapp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { reservation_id: string }) =>
    z.object({ reservation_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const ctx = await loadReservationContext(context.supabase, data.reservation_id);
    const phone = ctx.customer?.phone || ctx.reservation.phone;
    if (!phone) throw new Error("אין מספר טלפון להזמנה זו");
    const guests = Number(ctx.reservation.adults ?? 0) + Number(ctx.reservation.children ?? 0);
    const name = (ctx.customer?.full_name || ctx.reservation.guest_name || "").split(" ")[0] || "אורח/ת";
    return insertMessageWithGuards(context.supabase, {
      customer_id: ctx.customer?.id ?? null,
      reservation_id: ctx.reservation.id,
      template_name: "booking_confirmation",
      phone,
      vars: {
        name,
        property: ctx.property?.name ?? "",
        unit: ctx.unit?.name ?? "",
        check_in: fmtDate(ctx.reservation.check_in),
        check_out: fmtDate(ctx.reservation.check_out),
        guests: String(guests),
        nights: String(ctx.reservation.nights ?? 0),
        amount: Number(ctx.reservation.total_amount ?? 0).toLocaleString(),
      },
    });
  });

// ---------- Email sends (logged to communications; wired to a real ESP later) ----------

async function logEmail(
  supabase: any,
  ctx: { reservation: any; customer: any; property: any; unit: any },
  subject: string,
  body: string,
): Promise<{ ok: boolean; skipped_reason?: string }> {
  const email = ctx.customer?.email;
  if (!email) return { ok: false, skipped_reason: "no_email" };
  const { error } = await supabase.from("communications").insert({
    customer_id: ctx.customer?.id ?? null,
    channel: "email",
    direction: "out",
    subject,
    body: `${body}\n\n— נשלח אל ${email}`,
    status: "queued",
    sent_at: new Date().toISOString(),
  });
  if (error) return { ok: false, skipped_reason: error.message };
  return { ok: true };
}

export const sendPaymentLinkEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { reservation_id: string }) =>
    z.object({ reservation_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const ctx = await loadReservationContext(context.supabase, data.reservation_id);
    const inv = await ensureInvoiceWithToken(context.supabase, ctx, context.userId);
    const name = ctx.customer?.full_name || ctx.reservation.guest_name || "אורח/ת";
    return logEmail(context.supabase, ctx,
      `קישור לתשלום הזמנה · ${ctx.property?.name ?? ""}`,
      `שלום ${name},\n\nלתשלום ההזמנה שלך ב־${ctx.property?.name ?? ""} (${ctx.unit?.name ?? ""}) בסך ${Number(inv.total).toLocaleString()} ₪ אנא היכנס/י לקישור:\n${inv.url}\n\nתודה,\nצוות אוריה`);
  });

export const sendBookingConfirmationEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { reservation_id: string }) =>
    z.object({ reservation_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const ctx = await loadReservationContext(context.supabase, data.reservation_id);
    const name = ctx.customer?.full_name || ctx.reservation.guest_name || "אורח/ת";
    const guests = Number(ctx.reservation.adults ?? 0) + Number(ctx.reservation.children ?? 0);
    return logEmail(context.supabase, ctx,
      `אישור הזמנה · ${ctx.property?.name ?? ""}`,
      `שלום ${name},\n\nההזמנה שלך אושרה:\n${ctx.property?.name ?? ""} · ${ctx.unit?.name ?? ""}\nצ׳ק־אין ${fmtDate(ctx.reservation.check_in)} · צ׳ק־אאוט ${fmtDate(ctx.reservation.check_out)}\n${guests} אורחים · ${ctx.reservation.nights ?? 0} לילות\nסה״כ: ${Number(ctx.reservation.total_amount ?? 0).toLocaleString()} ₪\n\nנשמח לראותך!`);
  });

// ---------- Public payment page lookup ----------

export const getInvoiceByPaymentToken = createServerFn({ method: "GET" })
  .inputValidator((d: { token: string }) =>
    z.object({ token: z.string().min(10).max(80) }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: inv, error } = await supabaseAdmin
      .from("invoices")
      .select("id, invoice_number, total, status, reservation_id, customer_id")
      .eq("payment_link_token", data.token)
      .maybeSingle();
    if (error || !inv) return { found: false as const };
    const [{ data: customer }, { data: reservation }] = await Promise.all([
      inv.customer_id
        ? supabaseAdmin.from("customers").select("full_name").eq("id", inv.customer_id).single()
        : Promise.resolve({ data: null }),
      inv.reservation_id
        ? supabaseAdmin.from("reservations").select("guest_name, check_in, check_out, unit_id").eq("id", inv.reservation_id).single()
        : Promise.resolve({ data: null }),
    ]);
    let unitName: string | null = null;
    let propertyName: string | null = null;
    if (reservation?.unit_id) {
      const { data: unit } = await supabaseAdmin.from("units").select("name, property_id").eq("id", reservation.unit_id).single();
      unitName = unit?.name ?? null;
      if (unit?.property_id) {
        const { data: prop } = await supabaseAdmin.from("properties").select("name").eq("id", unit.property_id).single();
        propertyName = prop?.name ?? null;
      }
    }
    return {
      found: true as const,
      invoice_number: inv.invoice_number,
      total: Number(inv.total ?? 0),
      status: inv.status as string,
      guest_name: customer?.full_name ?? reservation?.guest_name ?? "",
      property: propertyName,
      unit: unitName,
      check_in: reservation?.check_in ?? null,
      check_out: reservation?.check_out ?? null,
    };
  });

export const markPaymentTokenPaid = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string }) =>
    z.object({ token: z.string().min(10).max(80) }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: inv } = await supabaseAdmin
      .from("invoices")
      .select("id, total, reservation_id, status")
      .eq("payment_link_token", data.token)
      .maybeSingle();
    if (!inv) return { ok: false };
    await supabaseAdmin.from("invoices").update({ status: "paid" }).eq("id", inv.id);
    if (inv.reservation_id) {
      await supabaseAdmin.from("reservations").update({ paid_amount: Number(inv.total ?? 0), status: "confirmed" }).eq("id", inv.reservation_id);
    }
    return { ok: true };
  });