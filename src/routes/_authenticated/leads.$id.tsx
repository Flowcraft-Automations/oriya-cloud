import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, MessageCircle, Plus } from "lucide-react";
import { PageHeader } from "@/components/shell/PageHeader";
import { OCard, OCardBody, OCardHeader, OCardTitle } from "@/components/ui-oriya/Card";
import { OBadge } from "@/components/ui-oriya/Badge";
import { getLeadDetail, updateLead, addLeadInquiry, addCommunication, listPropertiesWithUnits } from "@/lib/data.functions";
import { sourceLabel, stageLabel, type LeadSource, type LeadStage } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/leads/$id")({
  head: () => ({ meta: [{ title: "כרטיס ליד · Oriya OS" }] }),
  component: LeadDetailPage,
  errorComponent: ({ error }) => <div className="p-6 text-sm text-red-700">{error.message}</div>,
});

function LeadDetailPage() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const qc = useQueryClient();
  const get = useServerFn(getLeadDetail);
  const upd = useServerFn(updateLead);
  const addInq = useServerFn(addLeadInquiry);
  const addComm = useServerFn(addCommunication);
  const listPU = useServerFn(listPropertiesWithUnits);

  const q = useSuspenseQuery({ queryKey: ["lead", id], queryFn: () => get({ data: { id } }) });
  const pu = useSuspenseQuery({ queryKey: ["properties-units"], queryFn: () => listPU() });
  const { lead, inquiries, communications } = q.data;

  const updM = useMutation({ mutationFn: (patch: Record<string, unknown>) => upd({ data: { id, ...patch } }), onSuccess: () => qc.invalidateQueries({ queryKey: ["lead", id] }) });
  const inqM = useMutation({
    mutationFn: (v: { source: string; unit_id?: string | null; check_in?: string | null; check_out?: string | null; guests?: number | null; message?: string | null }) =>
      addInq({ data: { lead_id: id, ...v } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lead", id] }),
  });
  const commM = useMutation({
    mutationFn: (v: { channel: "whatsapp" | "email"; body: string }) => addComm({ data: { lead_id: id, ...v } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lead", id] }),
  });

  const [notes, setNotes] = useState(lead.notes ?? "");
  const [newInq, setNewInq] = useState({ source: lead.source, unit_id: "", check_in: "", check_out: "", guests: "", message: "" });
  const [commBody, setCommBody] = useState("");
  const [commChannel, setCommChannel] = useState<"whatsapp" | "email">("whatsapp");

  const unitName = (uid: string | null) => pu.data.units.find((u) => u.id === uid)?.name ?? null;

  return (
    <>
      <button onClick={() => nav({ to: "/leads" })} className="mb-3 inline-flex items-center gap-1 text-sm" style={{ color: "var(--text-secondary)" }}>
        <ArrowRight size={14} /> חזרה ללידים
      </button>
      <PageHeader
        title={lead.full_name}
        subtitle={`${sourceLabel[lead.source as LeadSource]} · נוצר ${new Date(lead.created_at).toLocaleDateString("he-IL")}`}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <OCard className="lg:col-span-1">
          <OCardHeader><OCardTitle>פרטים</OCardTitle></OCardHeader>
          <OCardBody className="space-y-3 text-sm">
            <Field label="טלפון">{lead.phone ? <a href={`tel:${lead.phone}`} className="ltr-num" dir="ltr">{lead.phone}</a> : "—"}</Field>
            {lead.phone && (
              <a href={`https://wa.me/${lead.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs"
                style={{ backgroundColor: "var(--success-bg)", color: "var(--success)" }}>
                <MessageCircle size={12} /> וואטסאפ
              </a>
            )}
            <Field label="אימייל">{lead.email ? <a className="ltr-num" dir="ltr" href={`mailto:${lead.email}`}>{lead.email}</a> : "—"}</Field>
            <div>
              <div className="mb-1 text-[11px]" style={{ color: "var(--text-secondary)" }}>שלב</div>
              <select value={lead.stage} onChange={(e) => updM.mutate({ stage: e.target.value as LeadStage })}
                className="w-full rounded-md border px-2 py-1.5 text-sm" style={{ borderColor: "var(--border)" }}>
                {(Object.keys(stageLabel) as LeadStage[]).map((s) => <option key={s} value={s}>{stageLabel[s]}</option>)}
              </select>
            </div>
            <div>
              <div className="mb-1 text-[11px]" style={{ color: "var(--text-secondary)" }}>הערות</div>
              <textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)}
                onBlur={() => notes !== (lead.notes ?? "") && updM.mutate({ notes })}
                className="w-full rounded-md border p-2 text-sm" style={{ borderColor: "var(--border)" }} />
            </div>
          </OCardBody>
        </OCard>

        <OCard className="lg:col-span-2">
          <OCardHeader><OCardTitle>פניות ({inquiries.length})</OCardTitle></OCardHeader>
          <OCardBody className="space-y-3">
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
            {inquiries.length === 0 ? (
              <div className="py-6 text-center text-sm" style={{ color: "var(--text-secondary)" }}>אין פניות מתועדות.</div>
            ) : (
              <ul className="divide-y" style={{ borderColor: "var(--border)" }}>
                {inquiries.map((i) => (
                  <li key={i.id} className="py-3">
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <OBadge tone="info">{sourceLabel[i.source as LeadSource] ?? i.source}</OBadge>
                      {unitName(i.unit_id) && <span className="font-medium">{unitName(i.unit_id)}</span>}
                      {(i.check_in || i.check_out) && (
                        <span className="ltr-num text-xs" style={{ color: "var(--text-secondary)" }}>
                          {i.check_in ?? "—"} → {i.check_out ?? "—"}
                        </span>
                      )}
                      {i.guests && <span className="ltr-num text-xs" style={{ color: "var(--text-secondary)" }}>{i.guests} אורחים</span>}
                      <span className="ltr-num ms-auto text-[11px]" style={{ color: "var(--text-secondary)" }}>{new Date(i.created_at).toLocaleString("he-IL")}</span>
                    </div>
                    {i.message && <div className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>{i.message}</div>}
                  </li>
                ))}
              </ul>
            )}
          </OCardBody>
        </OCard>
      </div>

      <OCard className="mt-4">
        <OCardHeader><OCardTitle>תקשורת</OCardTitle></OCardHeader>
        <OCardBody className="space-y-3">
          <form className="grid gap-2 sm:grid-cols-[120px_1fr_auto]"
            onSubmit={(e) => { e.preventDefault(); if (!commBody.trim()) return; commM.mutate({ channel: commChannel, body: commBody }); setCommBody(""); }}>
            <select className="rounded-md border px-2 py-1.5 text-sm" style={{ borderColor: "var(--border)" }}
              value={commChannel} onChange={(e) => setCommChannel(e.target.value as "whatsapp" | "email")}>
              <option value="whatsapp">וואטסאפ</option>
              <option value="email">אימייל</option>
            </select>
            <input value={commBody} onChange={(e) => setCommBody(e.target.value)} placeholder="תוכן ההודעה"
              className="rounded-md border px-2 py-1.5 text-sm" style={{ borderColor: "var(--border)" }} />
            <button className="rounded-md px-3 py-1.5 text-sm font-semibold text-white" style={{ backgroundColor: "var(--navy-900)" }}>הוסף</button>
          </form>
          {communications.length === 0 ? (
            <div className="py-4 text-center text-sm" style={{ color: "var(--text-secondary)" }}>אין תקשורת מתועדת.</div>
          ) : (
            <ul className="divide-y" style={{ borderColor: "var(--border)" }}>
              {communications.map((c) => (
                <li key={c.id} className="flex items-start gap-3 py-2.5">
                  <OBadge tone={c.channel === "whatsapp" ? "success" : "info"}>{c.channel}</OBadge>
                  <div className="flex-1">
                    {c.subject && <div className="text-sm font-medium">{c.subject}</div>}
                    <div className="text-sm" style={{ color: "var(--text-secondary)" }}>{c.body}</div>
                    <div className="ltr-num text-[11px]" style={{ color: "var(--text-secondary)" }}>{new Date(c.sent_at).toLocaleString("he-IL")}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </OCardBody>
      </OCard>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px]" style={{ color: "var(--text-secondary)" }}>{label}:</span>
      <span style={{ color: "var(--text-primary)" }}>{children}</span>
    </div>
  );
}