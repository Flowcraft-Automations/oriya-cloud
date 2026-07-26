import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Mail, MessageCircle, Plus } from "lucide-react";
import { getLeadDetail, updateLead, deleteLead, addLeadInquiry, listPropertiesWithUnits } from "@/lib/data.functions";
import { sourceLabel, stageLabel, type LeadSource, type LeadStage } from "@/lib/types";
import { DetailLayout, SectionBar, FieldRow, EmptyState } from "@/components/detail/DetailLayout";

export const Route = createFileRoute("/_authenticated/leads/$id")({
  head: () => ({ meta: [{ title: "כרטיס ליד · Oriya OS" }] }),
  component: LeadDetailPage,
  errorComponent: ({ error }) => <div className="p-6 text-sm text-red-700">{error.message}</div>,
});

type Tab = "profile" | "inquiries";

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

  const stageTone: Record<string, "success" | "info" | "gold" | "neutral" | "danger"> = {
    new: "info", contacted: "gold", quoted: "gold", booked: "success", lost: "danger",
  };

  return (
    <DetailLayout
      kicker="ליד"
      title={lead.full_name}
      statusPill={{ label: stageLabel[lead.stage as LeadStage], tone: stageTone[lead.stage] ?? "neutral" }}
      onDelete={() => { if (confirm("למחוק ליד?")) delM.mutate(); }}
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
      ]}
      activeTab={tab}
      onTabChange={(k) => setTab(k as Tab)}
    >
      {tab === "profile" && (
        <div className="divide-y" style={{ borderColor: "var(--border)" }}>
          <SectionBar title="זהות" accent="var(--gold-100)" barColor="var(--gold-500)">
            <FieldRow label="שם מלא" value={lead.full_name} />
            <FieldRow label="אימייל" value={lead.email} ltr />
            <FieldRow label="טלפון" value={lead.phone} ltr />
          </SectionBar>
          <SectionBar title="מקור וסטטוס" accent="var(--info-bg)" barColor="var(--info)">
            <FieldRow label="מקור" value={sourceLabel[lead.source as LeadSource]} />
            <div className="flex items-center justify-between gap-6 px-5 py-3">
              <select value={lead.stage} onChange={(e) => updM.mutate({ stage: e.target.value as LeadStage })}
                className="rounded-md border px-2 py-1.5 text-sm" style={{ borderColor: "var(--border)" }}>
                {(Object.keys(stageLabel) as LeadStage[]).map((s) => <option key={s} value={s}>{stageLabel[s]}</option>)}
              </select>
              <div className="text-[11px] uppercase tracking-wide" style={{ color: "var(--text-secondary)" }}>שלב</div>
            </div>
            <FieldRow label="עניין" value={lead.interest} />
            <FieldRow label="נוצר" value={new Date(lead.created_at).toLocaleDateString("he-IL")} />
          </SectionBar>
          <SectionBar title="הערות" accent="var(--bg-subtle)" barColor="var(--border)">
            <div className="p-4">
              <textarea rows={4} defaultValue={lead.notes ?? ""}
                onBlur={(e) => e.target.value !== (lead.notes ?? "") && updM.mutate({ notes: e.target.value })}
                className="w-full rounded-md border p-3 text-sm" style={{ borderColor: "var(--border)" }} />
            </div>
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
              {inquiries.map((i) => (
                <li key={i.id} className="py-3">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="rounded-full px-2 py-0.5 text-[11px]" style={{ backgroundColor: "var(--info-bg)", color: "var(--info)" }}>
                      {sourceLabel[i.source as LeadSource] ?? i.source}
                    </span>
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
        </div>
      )}
    </DetailLayout>
  );
}