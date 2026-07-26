import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { checkQuietHours } from "./wa.server";

// ---------- Templates ----------

export const listTemplates = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("wa_templates")
      .select("*")
      .order("name");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const upsertTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    id?: string; name: string; category: "utility" | "marketing";
    status?: "draft" | "pending" | "approved" | "rejected";
    body_he: string; variables?: unknown; notes?: string;
  }) =>
    z.object({
      id: z.string().uuid().optional(),
      name: z.string().min(1),
      category: z.enum(["utility", "marketing"]),
      status: z.enum(["draft", "pending", "approved", "rejected"]).optional(),
      body_he: z.string().min(1),
      variables: z.any().optional(),
      notes: z.string().optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const payload = { ...data, variables: data.variables ?? [] };
    const q = data.id
      ? context.supabase.from("wa_templates").update(payload).eq("id", data.id).select().single()
      : context.supabase.from("wa_templates").insert(payload).select().single();
    const { data: row, error } = await q;
    if (error) throw new Error(error.message);
    return row;
  });

// ---------- Journeys ----------

export const listJourneys = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: journeys, error } = await context.supabase
      .from("wa_journeys")
      .select("*")
      .order("key");
    if (error) throw new Error(error.message);
    const { data: steps } = await context.supabase
      .from("wa_journey_steps")
      .select("*, wa_templates(name, category, status)")
      .order("order_index");
    return { journeys: journeys ?? [], steps: steps ?? [] };
  });

export const toggleJourney = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; is_active: boolean }) =>
    z.object({ id: z.string().uuid(), is_active: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("wa_journeys").update({ is_active: data.is_active }).eq("id", data.id);
    if (error) throw new Error(error.message);
    console.info("[TODO] outbound: toggle n8n workflow", data);
    return { ok: true };
  });

export const toggleJourneyStep = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; is_active: boolean }) =>
    z.object({ id: z.string().uuid(), is_active: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("wa_journey_steps").update({ is_active: data.is_active }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const sendJourneyTest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { step_id: string; to_phone: string }) =>
    z.object({ step_id: z.string().uuid(), to_phone: z.string().min(6) }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: step } = await context.supabase
      .from("wa_journey_steps").select("template_id, name_he").eq("id", data.step_id).single();
    const { error } = await context.supabase.from("messages_log").insert({
      phone: data.to_phone,
      template_id: step?.template_id ?? null,
      journey_step_id: data.step_id,
      status: "queued",
      direction: "out",
      payload: { test: true, step_name: step?.name_he },
    });
    if (error) throw new Error(error.message);
    console.info("[TODO] outbound: journey test send", data);
    return { ok: true };
  });

// ---------- Messages ----------

export const listCustomerEnrollments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { customer_id: string }) =>
    z.object({ customer_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("journey_enrollments")
      .select("*, wa_journeys(key, name_he)")
      .eq("customer_id", data.customer_id)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    const codes = Array.from(new Set((rows ?? []).map((r: any) => r.current_step_code).filter(Boolean)));
    let stepMap: Record<string, any> = {};
    if (codes.length) {
      const { data: steps } = await context.supabase
        .from("wa_journey_steps")
        .select("step_code, name_he, wait_hours, template_id, wa_templates(name, body_he, category)")
        .in("step_code", codes as string[]);
      stepMap = Object.fromEntries((steps ?? []).map((s: any) => [s.step_code, s]));
    }
    return (rows ?? []).map((r: any) => ({ ...r, step: stepMap[r.current_step_code] ?? null }));
  });

export const listMessages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { customer_id?: string; reservation_id?: string; campaign_id?: string; phone?: string; limit?: number }) =>
    z.object({
      customer_id: z.string().uuid().optional(),
      reservation_id: z.string().uuid().optional(),
      campaign_id: z.string().uuid().optional(),
      phone: z.string().optional(),
      limit: z.number().int().positive().max(200).optional(),
    }).parse(d))
  .handler(async ({ data, context }) => {
    let q = context.supabase
      .from("messages_log")
      .select("*, wa_templates(name, category)")
      .order("created_at", { ascending: false })
      .limit(data.limit ?? 50);
    if (data.customer_id) q = q.eq("customer_id", data.customer_id);
    if (data.reservation_id) q = q.eq("reservation_id", data.reservation_id);
    if (data.campaign_id) q = q.eq("campaign_id", data.campaign_id);
    if (data.phone) q = q.eq("phone", data.phone);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export async function insertMessageWithGuards(
  supabase: any,
  args: { customer_id?: string | null; reservation_id?: string | null; template_name: string; phone: string; campaign_id?: string | null; journey_step_id?: string | null; vars?: Record<string, string> },
): Promise<{ ok: boolean; skipped_reason?: string; scheduled_for?: string }> {
  const { data: tpl } = await supabase.from("wa_templates").select("id, category, status").eq("name", args.template_name).maybeSingle();
  if (!tpl) return { ok: false, skipped_reason: "template_not_found" };
  if (tpl.status !== "approved") return { ok: false, skipped_reason: "template_not_approved" };

  if (args.customer_id) {
    const { data: consent } = await supabase.from("contact_consent").select("opted_in").eq("customer_id", args.customer_id).maybeSingle();
    if (tpl.category === "marketing" && consent && consent.opted_in === false) {
      return { ok: false, skipped_reason: "opted_out" };
    }
  }

  // Dedupe: same template to same phone within 48h
  const since = new Date(Date.now() - 48 * 3600 * 1000).toISOString();
  const { data: dup } = await supabase
    .from("messages_log")
    .select("id")
    .eq("template_id", tpl.id)
    .eq("phone", args.phone)
    .gte("created_at", since)
    .limit(1);
  if (dup && dup.length > 0) return { ok: false, skipped_reason: "duplicate_48h" };

  const quiet = checkQuietHours();
  const payload: Record<string, unknown> = { vars: args.vars ?? {} };
  if (!quiet.allowed) payload.deferred = { reason: quiet.reason, scheduled_for: quiet.scheduled_for };

  const { error } = await supabase.from("messages_log").insert({
    customer_id: args.customer_id ?? null,
    reservation_id: args.reservation_id ?? null,
    campaign_id: args.campaign_id ?? null,
    template_id: tpl.id,
    journey_step_id: args.journey_step_id ?? null,
    phone: args.phone,
    direction: "out",
    status: "queued",
    payload,
  });
  if (error) return { ok: false, skipped_reason: error.message };

  console.info("[TODO] outbound to ManyChat:", args.template_name, args.phone, payload);
  return { ok: true, scheduled_for: quiet.scheduled_for };
}

export const sendTemplateToCustomer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { customer_id: string; template_name: string; reservation_id?: string; vars?: Record<string, string> }) =>
    z.object({
      customer_id: z.string().uuid(),
      template_name: z.string().min(1),
      reservation_id: z.string().uuid().optional(),
      vars: z.record(z.string(), z.string()).optional(),
    }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: cust } = await context.supabase.from("customers").select("phone").eq("id", data.customer_id).single();
    if (!cust?.phone) throw new Error("Customer has no phone number");
    return insertMessageWithGuards(context.supabase, {
      customer_id: data.customer_id,
      reservation_id: data.reservation_id ?? null,
      template_name: data.template_name,
      phone: cust.phone,
      vars: data.vars,
    });
  });

export const sendTemplateBulk = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { customer_ids: string[]; template_name: string }) =>
    z.object({
      customer_ids: z.array(z.string().uuid()).min(1).max(500),
      template_name: z.string().min(1),
    }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: rows } = await context.supabase
      .from("customers").select("id, phone").in("id", data.customer_ids);
    let queued = 0;
    const skipped: Array<{ id: string; reason: string }> = [];
    for (const c of rows ?? []) {
      if (!c.phone) { skipped.push({ id: c.id, reason: "no_phone" }); continue; }
      const r = await insertMessageWithGuards(context.supabase, {
        customer_id: c.id, phone: c.phone, template_name: data.template_name,
      });
      if (r.ok) queued++; else skipped.push({ id: c.id, reason: r.skipped_reason! });
    }
    return { queued, skipped };
  });

// ---------- Tags ----------

export const listCustomerTags = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { customer_id: string }) => z.object({ customer_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: rows } = await context.supabase
      .from("contact_tags").select("*").eq("customer_id", data.customer_id).order("tag");
    return rows ?? [];
  });

export const syncCustomerTags = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { customer_id: string; add?: string[]; remove?: string[] }) =>
    z.object({
      customer_id: z.string().uuid(),
      add: z.array(z.string().min(1)).optional(),
      remove: z.array(z.string().min(1)).optional(),
    }).parse(d))
  .handler(async ({ data, context }) => {
    if (data.add?.length) {
      await context.supabase.from("contact_tags").upsert(
        data.add.map((t) => ({ customer_id: data.customer_id, tag: t, source: "manual" })),
        { onConflict: "customer_id,tag" },
      );
    }
    if (data.remove?.length) {
      await context.supabase.from("contact_tags")
        .delete().eq("customer_id", data.customer_id).in("tag", data.remove);
    }
    console.info("[TODO] outbound: mirror tags to ManyChat", data);
    return { ok: true };
  });

// ---------- Campaigns ----------

export const listCampaigns = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("campaigns")
      .select("*, wa_templates(name, category)")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const upsertCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    id?: string; name_he: string; template_id?: string | null;
    segment?: Record<string, unknown>; coupon_code?: string | null;
    scheduled_at?: string | null; status?: string;
  }) =>
    z.object({
      id: z.string().uuid().optional(),
      name_he: z.string().min(1),
      template_id: z.string().uuid().nullable().optional(),
      segment: z.record(z.string(), z.any()).optional(),
      coupon_code: z.string().nullable().optional(),
      scheduled_at: z.string().nullable().optional(),
      status: z.string().optional(),
    }).parse(d))
  .handler(async ({ data, context }) => {
    const base = {
      name_he: data.name_he,
      template_id: data.template_id ?? null,
      segment: (data.segment ?? {}) as any,
      coupon_code: data.coupon_code ?? null,
      scheduled_at: data.scheduled_at ?? null,
      ...(data.status ? { status: data.status as any } : {}),
    };
    const q = data.id
      ? context.supabase.from("campaigns").update(base).eq("id", data.id).select().single()
      : context.supabase.from("campaigns").insert({ ...base, owner_id: context.userId }).select().single();
    const { data: row, error } = await q;
    if (error) throw new Error(error.message);
    return row;
  });

async function resolveSegmentToCustomers(supabase: any, segment: Record<string, unknown>) {
  const lifecycle = (segment.lifecycle as string[] | undefined) ?? [];
  const tags = (segment.tags as string[] | undefined) ?? [];

  let q = supabase.from("customers").select("id, full_name, phone, lifecycle");
  if (lifecycle.length) q = q.in("lifecycle", lifecycle);
  const { data: custs } = await q;
  let list = (custs ?? []).filter((c: any) => !!c.phone);

  if (tags.length) {
    const { data: tagRows } = await supabase.from("contact_tags").select("customer_id").in("tag", tags);
    const allowed = new Set((tagRows ?? []).map((r: any) => r.customer_id));
    list = list.filter((c: any) => allowed.has(c.id));
  }
  return list;
}

export const previewCampaignSegment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { segment: Record<string, unknown> }) =>
    z.object({ segment: z.record(z.string(), z.any()) }).parse(d))
  .handler(async ({ data, context }) => {
    const list = await resolveSegmentToCustomers(context.supabase, data.segment);
    return { count: list.length, sample: list.slice(0, 20) };
  });

export const launchCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: campaign, error } = await context.supabase
      .from("campaigns").select("*, wa_templates(name, category, status)").eq("id", data.id).single();
    if (error) throw new Error(error.message);
    if (!campaign.template_id) throw new Error("Campaign has no template");
    const tpl = (campaign as any).wa_templates;
    if (tpl?.status !== "approved") throw new Error("Template not approved");

    const list = await resolveSegmentToCustomers(context.supabase, (campaign.segment ?? {}) as Record<string, unknown>);
    let queued = 0;
    for (const c of list) {
      const r = await insertMessageWithGuards(context.supabase, {
        customer_id: c.id, phone: c.phone, template_name: tpl.name, campaign_id: data.id,
      });
      if (r.ok) queued++;
    }

    await context.supabase.from("campaigns").update({
      status: "running",
      launched_at: new Date().toISOString(),
      stats: { queued, audience: list.length },
    }).eq("id", data.id);

    console.info("[TODO] outbound: launch campaign", data.id, "queued", queued);
    return { ok: true, queued, audience: list.length };
  });

// ---------- Stats ----------

export const getMessagingStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const since = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
    const { data: msgs } = await context.supabase
      .from("messages_log")
      .select("status, template_id, journey_step_id, campaign_id, created_at")
      .gte("created_at", since);
    const { data: steps } = await context.supabase
      .from("wa_journey_steps").select("id, step_code, name_he, wa_journeys(key, name_he)");
    const { data: campaigns } = await context.supabase
      .from("campaigns").select("id, name_he, status");

    const emptyFunnel = () => ({ sent: 0, delivered: 0, read: 0, replied: 0, failed: 0, queued: 0 });
    const byStep: Record<string, ReturnType<typeof emptyFunnel>> = {};
    const byCampaign: Record<string, ReturnType<typeof emptyFunnel>> = {};

    for (const m of msgs ?? []) {
      const key = m.status as keyof ReturnType<typeof emptyFunnel>;
      if (m.journey_step_id) {
        (byStep[m.journey_step_id] ??= emptyFunnel())[key] += 1;
      }
      if (m.campaign_id) {
        (byCampaign[m.campaign_id] ??= emptyFunnel())[key] += 1;
      }
    }
    return { steps: steps ?? [], campaigns: campaigns ?? [], byStep, byCampaign };
  });

export const getCustomerConsent = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { customer_id: string }) => z.object({ customer_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: row } = await context.supabase
      .from("contact_consent").select("opted_in, reason, updated_at").eq("customer_id", data.customer_id).maybeSingle();
    return row ?? { opted_in: true, reason: null, updated_at: null };
  });

// ---------- Send by phone (used for leads without a customer row) ----------

export const sendTemplateByPhone = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { phone: string; template_name: string; vars?: Record<string, string> }) =>
    z.object({
      phone: z.string().min(6),
      template_name: z.string().min(1),
      vars: z.record(z.string(), z.string()).optional(),
    }).parse(d))
  .handler(async ({ data, context }) => {
    return insertMessageWithGuards(context.supabase, {
      phone: data.phone,
      template_name: data.template_name,
      vars: data.vars,
    });
  });
