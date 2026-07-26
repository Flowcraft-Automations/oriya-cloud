import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Plus, Trash2, LayoutGrid, List, ExternalLink, MessageSquare } from "lucide-react";
import { PageHeader, ActionButton } from "@/components/shell/PageHeader";
import { OCard } from "@/components/ui-oriya/Card";
import { listLeads, createLead, updateLeadStage, updateLead, deleteLead } from "@/lib/data.functions";
import { sourceLabel, stageLabel, sourceTone, stageTone, type Lead, type LeadSource, type LeadStage } from "@/lib/types";
import { TonePill } from "@/components/detail/DetailLayout";
import { supabase } from "@/integrations/supabase/client";

const MANYCHAT_WORKSPACE = "fb3418755";
const warmthLabel: Record<string, string> = { cold: "קר", warm: "פושר", hot: "חם" };
const warmthTone: Record<string, "neutral" | "gold" | "danger"> = { cold: "neutral", warm: "gold", hot: "danger" };
const warmthOptions = [
  { value: "cold", label: "קר" },
  { value: "warm", label: "פושר" },
  { value: "hot", label: "חם" },
];

export const Route = createFileRoute("/_authenticated/leads/")({
  head: () => ({
    meta: [
      { title: "לידים · Oriya OS" },
      { name: "description", content: "צינור לידים ושיווק" },
      { property: "og:title", content: "לידים · Oriya OS" },
      { property: "og:description", content: "צינור לידים ושיווק" },
    ],
  }),
  component: LeadsPage,
  errorComponent: ({ error }) => <div className="p-6 text-sm text-red-700">{error.message}</div>,
});

const stages: LeadStage[] = ["new", "contacted", "quoted", "booked", "lost"];
const sources: LeadSource[] = ["whatsapp", "website", "tzimmerer", "instagram", "referral", "other"];

function LeadsPage() {
  const qc = useQueryClient();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const list = useServerFn(listLeads);
  const create = useServerFn(createLead);
  const updStage = useServerFn(updateLeadStage);
  const upd = useServerFn(updateLead);
  const del = useServerFn(deleteLead);
  const q = useSuspenseQuery({ queryKey: ["leads"], queryFn: () => list() });
  const stageM = useMutation({ mutationFn: (v: { id: string; stage: LeadStage }) => updStage({ data: v }), onSuccess: () => qc.invalidateQueries() });
  const updM = useMutation({ mutationFn: (v: Record<string, unknown> & { id: string }) => upd({ data: v }), onSuccess: () => qc.invalidateQueries() });
  const delM = useMutation({ mutationFn: (id: string) => del({ data: { id } }), onSuccess: () => qc.invalidateQueries() });

  const [view, setView] = useState<"kanban" | "table">("table");

  useEffect(() => {
    const channel = supabase
      .channel("leads-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "leads" },
        () => qc.invalidateQueries({ queryKey: ["leads"] }))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [qc]);

  const [form, setForm] = useState({ full_name: "", phone: "", source: "whatsapp" as LeadSource, interest: "" });
  const createM = useMutation({
    mutationFn: () => create({ data: form }),
    onSuccess: () => {
      qc.invalidateQueries();
      setForm({ full_name: "", phone: "", source: "whatsapp", interest: "" });
      setOpen(false);
    },
  });

  return (
    <>
      <PageHeader
        title="לידים ושיווק"
        subtitle="צינור לידים · קנבן לפי שלב"
        action={
          <div className="flex items-center gap-2">
            <div className="inline-flex overflow-hidden rounded-md border" style={{ borderColor: "var(--border)" }}>
              <button onClick={() => setView("table")} className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs"
                style={{ backgroundColor: view === "table" ? "var(--navy-900)" : "transparent", color: view === "table" ? "#fff" : "var(--text-secondary)" }}>
                <List size={12} /> טבלה
              </button>
              <button onClick={() => setView("kanban")} className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs"
                style={{ backgroundColor: view === "kanban" ? "var(--navy-900)" : "transparent", color: view === "kanban" ? "#fff" : "var(--text-secondary)" }}>
                <LayoutGrid size={12} /> קנבן
              </button>
            </div>
            <ActionButton variant="gold" onClick={() => setOpen(!open)}><Plus size={16} />ליד חדש</ActionButton>
          </div>
        }
      />

      {open && (
        <OCard className="mb-4 p-4">
          <form className="grid gap-3 sm:grid-cols-5" onSubmit={(e) => { e.preventDefault(); createM.mutate(); }}>
            <input required placeholder="שם מלא" className="rounded-md border px-2 py-1.5 text-sm" style={{ borderColor: "var(--border)" }}
              value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            <input placeholder="טלפון" dir="ltr" className="ltr-num rounded-md border px-2 py-1.5 text-sm" style={{ borderColor: "var(--border)" }}
              value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <select className="rounded-md border px-2 py-1.5 text-sm" style={{ borderColor: "var(--border)" }}
              value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value as LeadSource })}>
              {Object.entries(sourceLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <input placeholder="עניין" className="rounded-md border px-2 py-1.5 text-sm" style={{ borderColor: "var(--border)" }}
              value={form.interest} onChange={(e) => setForm({ ...form, interest: e.target.value })} />
            <button type="submit" disabled={createM.isPending}
              className="rounded-md px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-60"
              style={{ backgroundColor: "var(--navy-900)" }}>הוסף</button>
          </form>
        </OCard>
      )}

      {view === "table" ? (
        <LeadsTable
          leads={q.data}
          onOpen={(id) => nav({ to: "/leads/$id", params: { id } })}
          onPatch={(id, patch) => updM.mutate({ id, ...patch })}
          onDelete={(id) => { if (confirm("למחוק?")) delM.mutate(id); }}
        />
      ) : (
      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-5">
        {stages.map((s) => {
          const items = q.data.filter((l: Lead) => l.stage === s);
          return (
            <OCard key={s} className="p-3">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-sm font-semibold" style={{ color: "var(--navy-700)" }}>{stageLabel[s]}</div>
                <span className="ltr-num text-xs" style={{ color: "var(--text-secondary)" }}>{items.length}</span>
              </div>
              <div className="space-y-2">
                {items.map((l: Lead) => (
                  <div
                    key={l.id}
                    onClick={() => nav({ to: "/leads/$id", params: { id: l.id } })}
                    className="cursor-pointer rounded-md border p-2.5 hover:bg-[var(--bg-subtle)]"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{l.full_name}</div>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px]" style={{ color: "var(--text-secondary)" }}>
                          <TonePill label={sourceLabel[l.source as LeadSource]} tone={sourceTone[l.source as LeadSource] ?? "neutral"} />
                          <TonePill label={warmthLabel[l.warmth ?? "cold"]} tone={warmthTone[l.warmth ?? "cold"]} />
                          {l.interest && <span>· {l.interest}</span>}
                        </div>
                        {l.phone && <div className="ltr-num mt-0.5 text-[11px]" style={{ color: "var(--text-secondary)" }}>{l.phone}</div>}
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); if (confirm("למחוק?")) delM.mutate(l.id); }} aria-label="מחק">
                        <Trash2 size={12} style={{ color: "var(--danger)" }} />
                      </button>
                    </div>
                    <select
                      className="mt-2 w-full rounded border px-1.5 py-1 text-[11px]"
                      style={{ borderColor: "var(--border)" }}
                      value={l.stage}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => stageM.mutate({ id: l.id, stage: e.target.value as LeadStage })}
                    >
                      {stages.map((st) => <option key={st} value={st}>{stageLabel[st]}</option>)}
                    </select>
                  </div>
                ))}
                {items.length === 0 && <div className="text-center text-[11px]" style={{ color: "var(--text-secondary)" }}>—</div>}
              </div>
            </OCard>
          );
        })}
      </div>
      )}
    </>
  );
}

function LeadsTable({
  leads, onOpen, onPatch, onDelete,
}: {
  leads: Lead[];
  onOpen: (id: string) => void;
  onPatch: (id: string, patch: Record<string, unknown>) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <OCard className="overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="w-full text-sm" dir="rtl">
          <thead>
            <tr className="text-right text-[11px] uppercase tracking-wide" style={{ color: "var(--text-secondary)", backgroundColor: "var(--bg-subtle)" }}>
              <th className="px-3 py-2 font-medium">שם</th>
              <th className="px-3 py-2 font-medium">טלפון</th>
              <th className="px-3 py-2 font-medium">אימייל</th>
              <th className="px-3 py-2 font-medium">מקור</th>
              <th className="px-3 py-2 font-medium">חמימות</th>
              <th className="px-3 py-2 font-medium">שלב</th>
              <th className="px-3 py-2 font-medium">עניין</th>
              <th className="w-10 px-2 py-2"></th>
              <th className="w-10 px-2 py-2"></th>
              <th className="w-10 px-2 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {leads.map((l) => (
              <LeadRow key={l.id} lead={l} onOpen={onOpen} onPatch={onPatch} onDelete={onDelete} />
            ))}
            {leads.length === 0 && (
              <tr><td colSpan={10} className="p-8 text-center text-xs" style={{ color: "var(--text-secondary)" }}>אין לידים להצגה</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </OCard>
  );
}

function LeadRow({
  lead: l, onOpen, onPatch, onDelete,
}: {
  lead: Lead;
  onOpen: (id: string) => void;
  onPatch: (id: string, patch: Record<string, unknown>) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <tr className="border-t transition-colors hover:bg-[var(--bg-subtle)]" style={{ borderColor: "var(--border)" }}>
      <td className="px-2 py-1"><InlineText value={l.full_name} onSave={(v) => v && onPatch(l.id, { full_name: v })} bold /></td>
      <td className="px-2 py-1"><InlineText value={l.phone ?? ""} ltr onSave={(v) => onPatch(l.id, { phone: v || null })} /></td>
      <td className="px-2 py-1"><InlineText value={l.email ?? ""} ltr onSave={(v) => onPatch(l.id, { email: v || null })} /></td>
      <td className="px-2 py-1">
        <InlineSelect
          value={l.source}
          options={sources.map((s) => ({ value: s, label: sourceLabel[s] }))}
          onSave={(v) => onPatch(l.id, { source: v })}
          display={<TonePill label={sourceLabel[l.source as LeadSource]} tone={sourceTone[l.source as LeadSource] ?? "neutral"} />}
        />
      </td>
      <td className="px-2 py-1">
        <InlineSelect
          value={l.warmth ?? "cold"}
          options={warmthOptions}
          onSave={(v) => onPatch(l.id, { warmth: v })}
          display={<TonePill label={warmthLabel[l.warmth ?? "cold"]} tone={warmthTone[l.warmth ?? "cold"]} />}
        />
      </td>
      <td className="px-2 py-1">
        <InlineSelect
          value={l.stage}
          options={stages.map((s) => ({ value: s, label: stageLabel[s] }))}
          onSave={(v) => onPatch(l.id, { stage: v })}
          display={<TonePill label={stageLabel[l.stage as LeadStage]} tone={stageTone[l.stage as LeadStage] ?? "neutral"} />}
        />
      </td>
      <td className="px-2 py-1"><InlineText value={l.interest ?? ""} onSave={(v) => onPatch(l.id, { interest: v || null })} /></td>
      <td className="px-2 py-1 text-center">
        {l.manychat_subscriber_id ? (
          <a
            href={`https://app.manychat.com/${MANYCHAT_WORKSPACE}/chat/${l.manychat_subscriber_id}`}
            target="_blank" rel="noopener noreferrer"
            aria-label="פתח ב־ManyChat"
            title="פתח ב־ManyChat"
            className="inline-flex rounded p-1 hover:bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <MessageSquare size={13} style={{ color: "var(--success)" }} />
          </a>
        ) : (
          <span className="inline-flex p-1 opacity-25" title="אין subscriber ב־ManyChat">
            <MessageSquare size={13} />
          </span>
        )}
      </td>
      <td className="px-2 py-1 text-center">
        <button onClick={() => onOpen(l.id)} aria-label="פתח" className="rounded p-1 hover:bg-white">
          <ExternalLink size={13} style={{ color: "var(--navy-700)" }} />
        </button>
      </td>
      <td className="px-2 py-1 text-center">
        <button onClick={() => onDelete(l.id)} aria-label="מחק" className="rounded p-1 hover:bg-white">
          <Trash2 size={13} style={{ color: "var(--danger)" }} />
        </button>
      </td>
    </tr>
  );
}

function InlineText({ value, onSave, ltr, bold }: { value: string; onSave: (v: string) => void; ltr?: boolean; bold?: boolean }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  const commit = () => { setEditing(false); if (draft !== value) onSave(draft); };
  if (editing) {
    return (
      <input autoFocus value={draft} dir={ltr ? "ltr" : undefined}
        onChange={(e) => setDraft(e.target.value)} onBlur={commit}
        onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); if (e.key === "Escape") { setDraft(value); setEditing(false); } }}
        className={"w-full rounded border bg-white px-1.5 py-1 text-sm outline-none focus:border-[var(--info)] " + (ltr ? "ltr-num" : "")}
        style={{ borderColor: "var(--border)" }} />
    );
  }
  return (
    <button onClick={() => setEditing(true)}
      className={"w-full rounded border border-transparent px-1.5 py-1 text-start text-sm hover:border-[var(--border)] hover:bg-white " + (ltr ? "ltr-num" : "") + (bold ? " font-medium" : "")}
      dir={ltr ? "ltr" : undefined}
      style={{ color: value ? "var(--text-primary)" : "var(--text-secondary)" }}>
      {value || "—"}
    </button>
  );
}

function InlineSelect({ value, options, onSave, display }: {
  value: string; options: { value: string; label: string }[]; onSave: (v: string) => void; display: React.ReactNode;
}) {
  const [editing, setEditing] = useState(false);
  if (editing) {
    return (
      <select autoFocus value={value}
        onChange={(e) => { onSave(e.target.value); setEditing(false); }}
        onBlur={() => setEditing(false)}
        className="w-full rounded border bg-white px-1.5 py-1 text-sm outline-none focus:border-[var(--info)]"
        style={{ borderColor: "var(--border)" }}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    );
  }
  return (
    <button onClick={() => setEditing(true)} className="rounded px-1 py-1 hover:opacity-80">{display}</button>
  );
}
