import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Mail, MessageCircle, Plus, ExternalLink, Globe } from "lucide-react";
import { getLeadDetail, updateLead, deleteLead, addLeadInquiry, listPropertiesWithUnits } from "@/lib/data.functions";
import { sourceLabel, stageLabel, sourceTone, stageTone, type LeadSource, type LeadStage } from "@/lib/types";
import { DetailLayout, SectionBar, FieldRow, EditableRow, EmptyState, TonePill } from "@/components/detail/DetailLayout";
import { MarketingPanel } from "@/components/marketing/MarketingPanel";

export const Route = createFileRoute("/_authenticated/leads/$id")({
  head: () => ({ meta: [{ title: "כרטיס ליד · Oriya OS" }] }),
  component: LeadDetailPage,
  errorComponent: ({ error }) => <div className="p-6 text-sm text-red-700">{error.message}</div>,
});

type Tab = "profile" | "inquiries" | "marketing";

const warmthLabel: Record<string, string> = { cold: "קר", warm: "פושר", hot: "חם" };
const warmthTone: Record<string, "neutral" | "gold" | "danger"> = { cold: "neutral", warm: "gold", hot: "danger" };

function LeadDetailPage() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const qc = useQueryClient();
  const get = useServerFn(getLeadDetail);
  const upd = useServerFn(updateLead);
  const del = useServerFn(deleteLead);
  const addInq = useServerFn(addLeadInquiry);
  const listPU = useServerFn(listPropertiesWithUnits);

  const q = useSuspenseQuery({ queryKey: ["lead", id], queryFn: () => get({ data: { id } }) });
  const pu = useSuspenseQuery({ queryKey: ["properties-units"], queryFn: () => listPU() });
  const { lead, inquiries } = q.data;

  const updM = useMutation({ mutationFn: (p: Record<string, unknown>) => upd({ data: { id, ...p } }), onSuccess: () => qc.invalidateQueries({ queryKey: ["lead", id] }) });
  const delM = useMutation({ mutationFn: () => del({ data: { id } }), onSuccess: () => nav({ to: "/leads" }) });
  const inqM = useMutation({
    mutationFn: (v: { source: string; unit_id?: string | null; check_in?: string | null; check_out?: string | null; guests?: number | null; message?: string | null }) =>
      addInq({ data: { lead_id: id, ...v } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lead", id] }),
  });

  const [tab, setTab] = useState<Tab>("profile");
  const [newInq, setNewInq] = useState({ source: lead.source as string, unit_id: "", check_in: "", check_out: "", guests: "", message: "" });
  const unitName = (uid: string | null) => pu.data.units.find((u) => u.id === uid)?.name ?? null;

  return (
    <DetailLayout
      kicker="ליד"
      title={lead.full_name}
      statusPill={{ label: stageLabel[lead.stage as LeadStage], tone: stageTone[lead.stage as LeadStage] ?? "neutral" }}
      onDelete={() => { if (confirm("למחוק ליד?")) delM.mutate(); }}
      tags={<>
        <TonePill label={sourceLabel[lead.source as LeadSource]} tone={sourceTone[lead.source as LeadSource] ?? "neutral"} />
        <TonePill label={`חמימות: ${warmthLabel[(lead as any).warmth ?? "cold"]}`} tone={warmthTone[(lead as any).warmth ?? "cold"]} />
      </>}
      toolbar={<>
        {lead.phone && (
          <a href={`https://wa.me/${lead.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs"
            style={{ borderColor: "var(--success)", color: "var(--success)" }}>
            <MessageCircle size={12} /> WhatsApp
          </a>
        )}
        {lead.email && (
          <a href={`mailto:${lead.email}`} className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs"
            style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}>
            <Mail size={12} /> אימייל
          </a>
        )}
      </>}
      tabs={[
        { key: "profile", label: "פרופיל" },
        { key: "inquiries", label: "פניות", count: inquiries.length },
        { key: "marketing", label: "שיווק" },
      ]}
      activeTab={tab}
      onTabChange={(k) => setTab(k as Tab)}
    >
      {tab === "profile" && (
        <div className="divide-y" style={{ borderColor: "var(--border)" }}>
          <SectionBar title="זהות" accent="var(--gold-100)" barColor="var(--gold-500)">
            <EditableRow label="שם מלא" value={lead.full_name} onSave={(v) => updM.mutate({ full_name: v })} />
            <EditableRow label="אימייל" type="email" ltr value={lead.email} onSave={(v) => updM.mutate({ email: v })} />
            <EditableRow label="טלפון" type="tel" ltr value={lead.phone} onSave={(v) => updM.mutate({ phone: v })} />
          </SectionBar>
          <SectionBar title="מקור וסטטוס" accent="var(--info-bg)" barColor="var(--info)">
            <EditableRow label="מקור" type="select" value={lead.source}
              options={(Object.keys(sourceLabel) as LeadSource[]).map((s) => ({ value: s, label: sourceLabel[s] }))}
              display={<TonePill label={sourceLabel[lead.source as LeadSource]} tone={sourceTone[lead.source as LeadSource] ?? "neutral"} />}
              onSave={(v) => updM.mutate({ source: v as LeadSource })} />
            <EditableRow label="שלב" type="select" value={lead.stage}
              options={(Object.keys(stageLabel) as LeadStage[]).map((s) => ({ value: s, label: stageLabel[s] }))}
              display={<TonePill label={stageLabel[lead.stage as LeadStage]} tone={stageTone[lead.stage as LeadStage] ?? "neutral"} />}
              onSave={(v) => updM.mutate({ stage: v as LeadStage })} />
            <EditableRow label="עניין" value={lead.interest} onSave={(v) => updM.mutate({ interest: v })} />
            <FieldRow label="נוצר" value={new Date(lead.created_at).toLocaleDateString("he-IL")} />
          </SectionBar>
          <SectionBar title="בוט WhatsApp" accent="var(--success-bg)" barColor="var(--success)">
            <EditableRow label="חמימות" type="select" value={(lead as any).warmth ?? "cold"}
              options={[{ value: "cold", label: "קר" }, { value: "warm", label: "פושר" }, { value: "hot", label: "חם" }]}
              display={<TonePill label={warmthLabel[(lead as any).warmth ?? "cold"]} tone={warmthTone[(lead as any).warmth ?? "cold"]} />}
              onSave={(v) => updM.mutate({ warmth: v })} />
            <FieldRow label="שלב אחרון בבוט" value={(lead as any).bot_stage ?? "—"} />
            <FieldRow label="פעילות אחרונה בבוט" value={(lead as any).last_bot_event_at ? new Date((lead as any).last_bot_event_at).toLocaleString("he-IL") : "—"} />
          </SectionBar>
          <SectionBar title="הערות" accent="var(--bg-subtle)" barColor="var(--border)">
            <EditableRow label="הערות" type="textarea" value={lead.notes} onSave={(v) => updM.mutate({ notes: v })} />
          </SectionBar>
        </div>
      )}

      {tab === "inquiries" && (
        <div className="space-y-4 p-4">
          <form className="grid gap-2 sm:grid-cols-6" onSubmit={(e) => {
            e.preventDefault();
            inqM.mutate({
              source: newInq.source,
              unit_id: newInq.unit_id || null,
              check_in: newInq.check_in || null,
              check_out: newInq.check_out || null,
              guests: newInq.guests ? Number(newInq.guests) : null,
              message: newInq.message || null,
            });
            setNewInq({ ...newInq, unit_id: "", check_in: "", check_out: "", guests: "", message: "" });
          }}>
            <select className="rounded-md border px-2 py-1.5 text-sm" style={{ borderColor: "var(--border)" }}
              value={newInq.source} onChange={(e) => setNewInq({ ...newInq, source: e.target.value })}>
              {Object.entries(sourceLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <select className="rounded-md border px-2 py-1.5 text-sm" style={{ borderColor: "var(--border)" }}
              value={newInq.unit_id} onChange={(e) => setNewInq({ ...newInq, unit_id: e.target.value })}>
              <option value="">יחידה (לא רלוונטי)</option>
              {pu.data.units.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
            <input type="date" className="ltr-num rounded-md border px-2 py-1.5 text-sm" style={{ borderColor: "var(--border)" }}
              value={newInq.check_in} onChange={(e) => setNewInq({ ...newInq, check_in: e.target.value })} />
            <input type="date" className="ltr-num rounded-md border px-2 py-1.5 text-sm" style={{ borderColor: "var(--border)" }}
              value={newInq.check_out} onChange={(e) => setNewInq({ ...newInq, check_out: e.target.value })} />
            <input type="number" placeholder="אורחים" className="ltr-num rounded-md border px-2 py-1.5 text-sm" style={{ borderColor: "var(--border)" }}
              value={newInq.guests} onChange={(e) => setNewInq({ ...newInq, guests: e.target.value })} />
            <button className="inline-flex items-center justify-center gap-1 rounded-md px-3 text-sm font-semibold text-white" style={{ backgroundColor: "var(--navy-900)" }}>
              <Plus size={14} />הוסף
            </button>
            <input placeholder="הודעה / בקשה" className="rounded-md border px-2 py-1.5 text-sm sm:col-span-6" style={{ borderColor: "var(--border)" }}
              value={newInq.message} onChange={(e) => setNewInq({ ...newInq, message: e.target.value })} />
          </form>

          {inquiries.length === 0 ? <EmptyState text="אין פניות מתועדות." /> : (
            <ul className="divide-y" style={{ borderColor: "var(--border)" }}>
              {inquiries.map((i: Record<string, string | number | null>) => {
                const src = (i.source as LeadSource) ?? "other";
                return (
                  <li key={i.id as string} className="py-3">
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <TonePill label={sourceLabel[src] ?? String(i.source)} tone={sourceTone[src] ?? "neutral"} />
                      {i.bot_event && (
                        <span className="inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium"
                          style={{ borderColor: "var(--success)", color: "var(--success)", backgroundColor: "var(--success-bg)" }}>
                          bot · {String(i.bot_event)}
                        </span>
                      )}
                      {i.bot_stage && (
                        <span className="text-[11px]" style={{ color: "var(--text-secondary)" }}>
                          {String(i.bot_stage)}
                        </span>
                      )}
                      {i.form_name && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium" style={{ color: "var(--navy-700)" }}>
                          <Globe size={12} /> {String(i.form_name)}
                        </span>
                      )}
                      {unitName(i.unit_id as string | null) && <span className="font-medium">{unitName(i.unit_id as string | null)}</span>}
                      {(i.check_in || i.check_out) && (
                        <span className="ltr-num text-xs" style={{ color: "var(--text-secondary)" }}>
                          {(i.check_in as string) ?? "—"} → {(i.check_out as string) ?? "—"}
                        </span>
                      )}
                      {i.guests && <span className="ltr-num text-xs" style={{ color: "var(--text-secondary)" }}>{i.guests} אורחים</span>}
                      {i.nights && <span className="ltr-num text-xs" style={{ color: "var(--text-secondary)" }}>· {i.nights} לילות</span>}
                      <span className="ltr-num ms-auto text-[11px]" style={{ color: "var(--text-secondary)" }}>{new Date(i.created_at as string).toLocaleString("he-IL")}</span>
                    </div>
                    {i.message && <div className="mt-1.5 rounded-md border p-2 text-sm" style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-subtle)", color: "var(--text-primary)" }}>{String(i.message)}</div>}
                    {src === "website" && (
                      <div className="mt-1.5 grid gap-1 text-[11px]" style={{ color: "var(--text-secondary)" }}>
                        {i.page_url && (
                          <a href={String(i.page_url)} target="_blank" rel="noreferrer"
                            className="ltr-num inline-flex items-center gap-1 truncate underline"
                            style={{ color: "var(--info)" }} dir="ltr">
                            <ExternalLink size={11} /> {String(i.page_url)}
                          </a>
                        )}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 ltr-num" dir="ltr">
                          {i.referrer && <span>ref: {String(i.referrer)}</span>}
                          {i.utm_source && <span>utm_source: {String(i.utm_source)}</span>}
                          {i.utm_campaign && <span>utm_campaign: {String(i.utm_campaign)}</span>}
                          {i.guest_name && <span dir="rtl" style={{ color: "var(--text-primary)" }}>שם: {String(i.guest_name)}</span>}
                          {i.phone && <span>{String(i.phone)}</span>}
                          {i.email && <span>{String(i.email)}</span>}
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {tab === "marketing" && (
        <div className="p-4">
          <MarketingPanel mode="lead" phone={lead.phone} displayName={lead.full_name} />
        </div>
      )}
    </DetailLayout>
  );
}