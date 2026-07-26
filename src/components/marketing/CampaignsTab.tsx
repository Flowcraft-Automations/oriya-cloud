import { useState } from "react";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listCampaigns, upsertCampaign, previewCampaignSegment, launchCampaign, listTemplates } from "@/lib/wa.functions";
import { TonePill, type Tone } from "@/components/detail/DetailLayout";

const statusTone: Record<string, Tone> = {
  draft: "neutral", scheduled: "info", running: "gold", completed: "success", cancelled: "danger",
};

const LIFECYCLES = ["lead", "guest", "vip", "dormant"];
const TAG_OPTIONS = ["repeat_guest", "family", "couples", "high_value"];

export function CampaignsTab() {
  const list = useServerFn(listCampaigns);
  const upsert = useServerFn(upsertCampaign);
  const preview = useServerFn(previewCampaignSegment);
  const launch = useServerFn(launchCampaign);
  const listT = useServerFn(listTemplates);

  const qc = useQueryClient();
  const q = useSuspenseQuery({ queryKey: ["wa-campaigns"], queryFn: () => list() });
  const tpls = useSuspenseQuery({ queryKey: ["wa-templates"], queryFn: () => listT() });

  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState<any>({});
  const [previewData, setPreviewData] = useState<{ count: number; sample: any[] } | null>(null);

  const upsertM = useMutation({
    mutationFn: (p: any) => upsert({ data: p }),
    onSuccess: (row: any) => { qc.invalidateQueries({ queryKey: ["wa-campaigns"] }); setEditing(row); setForm(row); },
  });
  const previewM = useMutation({
    mutationFn: (seg: any) => preview({ data: { segment: seg } }),
    onSuccess: (r) => setPreviewData(r),
  });
  const launchM = useMutation({
    mutationFn: (id: string) => launch({ data: { id } }),
    onSuccess: (r) => { qc.invalidateQueries({ queryKey: ["wa-campaigns"] }); alert(`הוזמנו ${r.queued} מתוך ${r.audience}`); setEditing(null); },
  });

  const open = (c: any | null) => {
    const val = c ?? { name_he: "", template_id: null, segment: { lifecycle: [], tags: [] }, coupon_code: "", scheduled_at: null, status: "draft" };
    setEditing(val); setForm(val); setPreviewData(null);
  };

  const toggle = (key: "lifecycle" | "tags", v: string) => {
    const arr: string[] = (form.segment?.[key] as string[]) ?? [];
    const next = arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
    setForm({ ...form, segment: { ...(form.segment ?? {}), [key]: next } });
  };

  const approvedTpls = tpls.data.filter((t) => t.status === "approved");

  return (
    <div dir="rtl">
      <div className="mb-4 flex justify-end">
        <button className="rounded px-3 py-1.5 text-xs text-white" style={{ backgroundColor: "var(--navy-700)" }}
          onClick={() => open(null)}>+ קמפיין חדש</button>
      </div>

      <div className="rounded-lg border overflow-hidden" style={{ borderColor: "var(--border)", backgroundColor: "white" }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-right text-[11px] uppercase" style={{ color: "var(--text-secondary)" }}>
              <th className="px-4 py-2.5">שם</th>
              <th className="px-4 py-2.5">תבנית</th>
              <th className="px-4 py-2.5">קופון</th>
              <th className="px-4 py-2.5">מתוזמן ל</th>
              <th className="px-4 py-2.5">סטטוס</th>
              <th className="px-4 py-2.5">בתור</th>
            </tr>
          </thead>
          <tbody>
            {q.data.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-sm" style={{ color: "var(--text-secondary)" }}>אין קמפיינים.</td></tr>
            )}
            {q.data.map((c: any) => (
              <tr key={c.id} className="cursor-pointer border-t hover:bg-[var(--bg-subtle)]" style={{ borderColor: "var(--border)" }} onClick={() => open(c)}>
                <td className="px-4 py-2.5">{c.name_he}</td>
                <td className="px-4 py-2.5 font-mono text-[12px]">{c.wa_templates?.name ?? "—"}</td>
                <td className="px-4 py-2.5 ltr-num" dir="ltr">{c.coupon_code ?? "—"}</td>
                <td className="px-4 py-2.5 ltr-num" dir="ltr">{c.scheduled_at ? new Date(c.scheduled_at).toLocaleString("he-IL") : "—"}</td>
                <td className="px-4 py-2.5"><TonePill label={c.status} tone={statusTone[c.status] ?? "neutral"} /></td>
                <td className="px-4 py-2.5 ltr-num" dir="ltr">{c.stats?.queued ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex justify-start bg-black/40" onClick={() => setEditing(null)}>
          <div dir="rtl" className="ml-auto flex h-full w-[520px] flex-col bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="border-b p-4" style={{ borderColor: "var(--border)" }}>
              <h4 className="text-sm font-semibold">{editing.id ? "עריכת קמפיין" : "קמפיין חדש"}</h4>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto p-4 text-sm">
              <label className="block">
                <span className="mb-1 block text-xs" style={{ color: "var(--text-secondary)" }}>שם קמפיין</span>
                <input className="w-full rounded border px-3 py-2" value={form.name_he ?? ""}
                  onChange={(e) => setForm({ ...form, name_he: e.target.value })} />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs" style={{ color: "var(--text-secondary)" }}>תבנית (אישור נדרש)</span>
                <select className="w-full rounded border px-3 py-2" value={form.template_id ?? ""}
                  onChange={(e) => setForm({ ...form, template_id: e.target.value || null })}>
                  <option value="">— בחר —</option>
                  {approvedTpls.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </label>

              <div>
                <div className="mb-1 text-xs" style={{ color: "var(--text-secondary)" }}>סגמנט · מחזור חיים</div>
                <div className="flex flex-wrap gap-2">
                  {LIFECYCLES.map((l) => {
                    const on = (form.segment?.lifecycle ?? []).includes(l);
                    return (
                      <button key={l} onClick={() => toggle("lifecycle", l)}
                        className="rounded-full border px-2.5 py-0.5 text-[11px]"
                        style={{ borderColor: on ? "var(--navy-700)" : "var(--border)", backgroundColor: on ? "var(--navy-700)" : "transparent", color: on ? "white" : "var(--text-primary)" }}>
                        {l}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="mb-1 text-xs" style={{ color: "var(--text-secondary)" }}>סגמנט · תגיות</div>
                <div className="flex flex-wrap gap-2">
                  {TAG_OPTIONS.map((l) => {
                    const on = (form.segment?.tags ?? []).includes(l);
                    return (
                      <button key={l} onClick={() => toggle("tags", l)}
                        className="rounded-full border px-2.5 py-0.5 text-[11px]"
                        style={{ borderColor: on ? "var(--gold-600)" : "var(--border)", backgroundColor: on ? "var(--gold-100)" : "transparent", color: on ? "var(--gold-600)" : "var(--text-primary)" }}>
                        {l}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-2">
                <label className="flex-1">
                  <span className="mb-1 block text-xs" style={{ color: "var(--text-secondary)" }}>קוד קופון</span>
                  <input className="w-full rounded border px-3 py-2 ltr-num" dir="ltr" value={form.coupon_code ?? ""}
                    onChange={(e) => setForm({ ...form, coupon_code: e.target.value })} />
                </label>
                <label className="flex-1">
                  <span className="mb-1 block text-xs" style={{ color: "var(--text-secondary)" }}>מתוזמן ל</span>
                  <input type="datetime-local" className="w-full rounded border px-3 py-2 ltr-num" dir="ltr"
                    value={form.scheduled_at ? form.scheduled_at.slice(0, 16) : ""}
                    onChange={(e) => setForm({ ...form, scheduled_at: e.target.value ? new Date(e.target.value).toISOString() : null })} />
                </label>
              </div>

              <div className="rounded border p-3" style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-subtle)" }}>
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>קהל</div>
                  <button className="rounded border px-2 py-0.5 text-[11px]" style={{ borderColor: "var(--border)" }}
                    onClick={() => previewM.mutate(form.segment ?? {})}>חשב</button>
                </div>
                <div className="ltr-num text-lg font-semibold" dir="ltr">{previewData?.count ?? "—"}</div>
                {previewData && previewData.sample.length > 0 && (
                  <div className="mt-2 max-h-32 overflow-y-auto text-xs" style={{ color: "var(--text-secondary)" }}>
                    {previewData.sample.slice(0, 8).map((s) => <div key={s.id}>· {s.full_name}</div>)}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between gap-2 border-t p-4" style={{ borderColor: "var(--border)" }}>
              <button className="rounded border px-3 py-1.5 text-xs" onClick={() => setEditing(null)}>סגור</button>
              <div className="flex gap-2">
                <button className="rounded border px-3 py-1.5 text-xs" style={{ borderColor: "var(--navy-700)", color: "var(--navy-700)" }}
                  onClick={() => upsertM.mutate(form)}>שמור טיוטה</button>
                {editing.id && form.template_id && (
                  <button className="rounded px-3 py-1.5 text-xs text-white" style={{ backgroundColor: "var(--gold-600)" }}
                    onClick={() => { if (confirm("להוציא את הקמפיין לפועל?")) launchM.mutate(editing.id); }}>הפעל</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
