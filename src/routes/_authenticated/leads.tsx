import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Plus, Trash2 } from "lucide-react";
import { PageHeader, ActionButton } from "@/components/shell/PageHeader";
import { OCard } from "@/components/ui-oriya/Card";
import { listLeads, createLead, updateLeadStage, deleteLead } from "@/lib/data.functions";
import { sourceLabel, stageLabel, type Lead, type LeadSource, type LeadStage } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/leads")({
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

function LeadsPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const list = useServerFn(listLeads);
  const create = useServerFn(createLead);
  const upd = useServerFn(updateLeadStage);
  const del = useServerFn(deleteLead);
  const q = useSuspenseQuery({ queryKey: ["leads"], queryFn: () => list() });
  const updM = useMutation({ mutationFn: (v: { id: string; stage: LeadStage }) => upd({ data: v }), onSuccess: () => qc.invalidateQueries() });
  const delM = useMutation({ mutationFn: (id: string) => del({ data: { id } }), onSuccess: () => qc.invalidateQueries() });

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
        action={<ActionButton variant="gold" onClick={() => setOpen(!open)}><Plus size={16} />ליד חדש</ActionButton>}
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
                  <div key={l.id} className="rounded-md border p-2.5 hover:bg-[var(--bg-subtle)]" style={{ borderColor: "var(--border)" }}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Link to="/leads/$id" params={{ id: l.id }} className="text-sm font-medium hover:underline" style={{ color: "var(--text-primary)" }}>{l.full_name}</Link>
                        <div className="text-[11px]" style={{ color: "var(--text-secondary)" }}>
                          {sourceLabel[l.source as LeadSource]} {l.interest && `· ${l.interest}`}
                        </div>
                        {l.phone && <div className="ltr-num mt-0.5 text-[11px]" style={{ color: "var(--text-secondary)" }}>{l.phone}</div>}
                      </div>
                      <button onClick={() => { if (confirm("למחוק?")) delM.mutate(l.id); }} aria-label="מחק">
                        <Trash2 size={12} style={{ color: "var(--danger)" }} />
                      </button>
                    </div>
                    <select
                      className="mt-2 w-full rounded border px-1.5 py-1 text-[11px]"
                      style={{ borderColor: "var(--border)" }}
                      value={l.stage}
                      onChange={(e) => updM.mutate({ id: l.id, stage: e.target.value as LeadStage })}
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
    </>
  );
}
