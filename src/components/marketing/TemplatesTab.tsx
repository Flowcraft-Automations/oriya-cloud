import { useState } from "react";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listTemplates, upsertTemplate } from "@/lib/wa.functions";
import { TonePill, type Tone } from "@/components/detail/DetailLayout";

const catTone: Record<string, Tone> = { utility: "info", marketing: "purple" };
const statTone: Record<string, Tone> = { approved: "success", pending: "warning", rejected: "danger", draft: "neutral" };

export function TemplatesTab() {
  const list = useServerFn(listTemplates);
  const upsert = useServerFn(upsertTemplate);
  const qc = useQueryClient();
  const q = useSuspenseQuery({ queryKey: ["wa-templates"], queryFn: () => list() });

  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState<any>({});

  const m = useMutation({
    mutationFn: (p: any) => upsert({ data: p }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["wa-templates"] }); setEditing(null); },
  });

  const open = (t: any) => { setEditing(t); setForm(t ?? { category: "utility", status: "draft", body_he: "", variables: [] }); };

  return (
    <div dir="rtl">
      <div className="mb-4 flex justify-end">
        <button
          className="rounded px-3 py-1.5 text-xs text-white"
          style={{ backgroundColor: "var(--navy-700)" }}
          onClick={() => open({ name: "", category: "utility", status: "draft", body_he: "", variables: [] })}
        >+ תבנית חדשה</button>
      </div>
      <div className="rounded-lg border overflow-hidden" style={{ borderColor: "var(--border)", backgroundColor: "white" }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-right text-[11px] uppercase" style={{ color: "var(--text-secondary)" }}>
              <th className="px-4 py-2.5">שם</th>
              <th className="px-4 py-2.5">קטגוריה</th>
              <th className="px-4 py-2.5">סטטוס</th>
              <th className="px-4 py-2.5">משתנים</th>
              <th className="px-4 py-2.5">תצוגה</th>
            </tr>
          </thead>
          <tbody>
            {q.data.map((t) => (
              <tr key={t.id} className="cursor-pointer border-t hover:bg-[var(--bg-subtle)]" style={{ borderColor: "var(--border)" }} onClick={() => open(t)}>
                <td className="px-4 py-2.5 font-mono text-[12px]">{t.name}</td>
                <td className="px-4 py-2.5"><TonePill label={t.category} tone={catTone[t.category] ?? "neutral"} /></td>
                <td className="px-4 py-2.5"><TonePill label={t.status} tone={statTone[t.status] ?? "neutral"} /></td>
                <td className="px-4 py-2.5 ltr-num" dir="ltr">{Array.isArray(t.variables) ? t.variables.length : 0}</td>
                <td className="px-4 py-2.5 max-w-[420px] truncate text-xs" style={{ color: "var(--text-secondary)" }}>{t.body_he}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex justify-start bg-black/40" onClick={() => setEditing(null)}>
          <div dir="rtl" className="ml-auto flex h-full w-[460px] flex-col bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="border-b p-4" style={{ borderColor: "var(--border)" }}>
              <h4 className="text-sm font-semibold">{editing.id ? "עריכת תבנית" : "תבנית חדשה"}</h4>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto p-4 text-sm">
              <label className="block">
                <span className="mb-1 block text-xs" style={{ color: "var(--text-secondary)" }}>שם (מזהה)</span>
                <input className="w-full rounded border px-3 py-2 text-sm ltr-num" dir="ltr"
                  value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </label>
              <div className="flex gap-2">
                <label className="flex-1">
                  <span className="mb-1 block text-xs" style={{ color: "var(--text-secondary)" }}>קטגוריה</span>
                  <select className="w-full rounded border px-3 py-2 text-sm" value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}>
                    <option value="utility">utility</option>
                    <option value="marketing">marketing</option>
                  </select>
                </label>
                <label className="flex-1">
                  <span className="mb-1 block text-xs" style={{ color: "var(--text-secondary)" }}>סטטוס</span>
                  <select className="w-full rounded border px-3 py-2 text-sm" value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    <option value="draft">draft</option>
                    <option value="pending">pending</option>
                    <option value="approved">approved</option>
                    <option value="rejected">rejected</option>
                  </select>
                </label>
              </div>
              <label className="block">
                <span className="mb-1 block text-xs" style={{ color: "var(--text-secondary)" }}>גוף ההודעה (משתנים כמו {"{{1}}"})</span>
                <textarea className="w-full min-h-[180px] rounded border px-3 py-2 text-sm" value={form.body_he ?? ""}
                  onChange={(e) => setForm({ ...form, body_he: e.target.value })} />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs" style={{ color: "var(--text-secondary)" }}>הערות</span>
                <input className="w-full rounded border px-3 py-2 text-sm" value={form.notes ?? ""}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </label>
            </div>
            <div className="flex items-center justify-between gap-2 border-t p-4" style={{ borderColor: "var(--border)" }}>
              <button className="rounded border px-3 py-1.5 text-xs" onClick={() => setEditing(null)}>סגור</button>
              <div className="flex gap-2">
                {editing.id && form.status === "draft" && (
                  <button className="rounded border px-3 py-1.5 text-xs" style={{ borderColor: "var(--warning)", color: "var(--warning)" }}
                    onClick={() => m.mutate({ ...form, status: "pending" })}>שלח לאישור</button>
                )}
                <button className="rounded px-3 py-1.5 text-xs text-white" style={{ backgroundColor: "var(--navy-700)" }}
                  onClick={() => m.mutate(form)}>שמור</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
