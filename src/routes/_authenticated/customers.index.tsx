import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Plus, Trash2 } from "lucide-react";
import { PageHeader, ActionButton } from "@/components/shell/PageHeader";
import { OCard } from "@/components/ui-oriya/Card";
import { MiniStatFilters } from "@/components/shell/MiniStatFilters";
import { listCustomers, createCustomer, deleteCustomer } from "@/lib/data.functions";
import type { Customer } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/customers/")({
  head: () => ({
    meta: [
      { title: "לקוחות · Oriya OS" },
      { name: "description", content: "כרטיסי לקוח, תגיות והיסטוריית שהיות" },
      { property: "og:title", content: "לקוחות · Oriya OS" },
      { property: "og:description", content: "כרטיסי לקוח" },
    ],
  }),
  component: CustomersPage,
  errorComponent: ({ error }) => <div className="p-6 text-sm text-red-700">{error.message}</div>,
});

function CustomersPage() {
  const qc = useQueryClient();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const [q2, setQ2] = useState("");
  const [statFilter, setStatFilter] = useState<string>("all");
  const list = useServerFn(listCustomers);
  const create = useServerFn(createCustomer);
  const del = useServerFn(deleteCustomer);
  const q = useSuspenseQuery({ queryKey: ["customers"], queryFn: () => list() });
  const delM = useMutation({ mutationFn: (id: string) => del({ data: { id } }), onSuccess: () => qc.invalidateQueries() });

  const [form, setForm] = useState({ full_name: "", phone: "", email: "" });
  const createM = useMutation({
    mutationFn: () => create({ data: form }),
    onSuccess: () => { qc.invalidateQueries(); setForm({ full_name: "", phone: "", email: "" }); setOpen(false); },
  });

  const now = Date.now();
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;
  const matchesStat = (c: Customer) => {
    if (statFilter === "all") return true;
    if (statFilter === "phone") return !!c.phone;
    if (statFilter === "email") return !!c.email;
    if (statFilter === "missing") return !c.phone || !c.email;
    if (statFilter === "recent") return c.created_at && now - new Date(c.created_at).getTime() <= thirtyDays;
    return true;
  };
  const rows = q.data.filter((c: Customer) =>
    matchesStat(c) && (!q2 || c.full_name.includes(q2) || c.phone?.includes(q2) || c.email?.includes(q2))
  );

  const withPhone = q.data.filter((c) => !!c.phone).length;
  const withEmail = q.data.filter((c) => !!c.email).length;
  const missing = q.data.filter((c) => !c.phone || !c.email).length;
  const recent = q.data.filter((c) => c.created_at && now - new Date(c.created_at).getTime() <= thirtyDays).length;

  return (
    <>
      <PageHeader
        title="לקוחות"
        subtitle={`${q.data.length} לקוחות בבסיס`}
        action={<ActionButton variant="gold" onClick={() => setOpen(!open)}><Plus size={16} />לקוח חדש</ActionButton>}
      />

      <MiniStatFilters
        value={statFilter}
        onChange={setStatFilter}
        stats={[
          { key: "all", label: "כל הלקוחות", count: q.data.length, tone: "neutral" },
          { key: "recent", label: "חדשים 30 יום", count: recent, tone: "info" },
          { key: "phone", label: "עם טלפון", count: withPhone, tone: "success" },
          { key: "email", label: "עם אימייל", count: withEmail, tone: "gold" },
          { key: "missing", label: "חסר פרטים", count: missing, tone: "warning" },
        ]}
      />

      {open && (
        <OCard className="mb-4 p-4">
          <form className="grid gap-3 sm:grid-cols-4" onSubmit={(e) => { e.preventDefault(); createM.mutate(); }}>
            <input required placeholder="שם מלא" className="rounded-md border px-2 py-1.5 text-sm" style={{ borderColor: "var(--border)" }}
              value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            <input placeholder="טלפון" dir="ltr" className="ltr-num rounded-md border px-2 py-1.5 text-sm" style={{ borderColor: "var(--border)" }}
              value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <input placeholder="אימייל" dir="ltr" className="ltr-num rounded-md border px-2 py-1.5 text-sm" style={{ borderColor: "var(--border)" }}
              value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <button type="submit" disabled={createM.isPending}
              className="rounded-md px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-60"
              style={{ backgroundColor: "var(--navy-900)" }}>הוסף</button>
          </form>
        </OCard>
      )}

      <div className="mb-3">
        <input
          value={q2}
          onChange={(e) => setQ2(e.target.value)}
          placeholder="חיפוש לפי שם, טלפון או אימייל"
          className="w-full max-w-md rounded-md border px-3 py-2 text-sm"
          style={{ borderColor: "var(--border)" }}
        />
      </div>

      <OCard className="overflow-hidden">
        {rows.length === 0 ? (
          <div className="p-10 text-center text-sm" style={{ color: "var(--text-secondary)" }}>אין לקוחות להצגה.</div>
        ) : (
          <table className="w-full text-sm" dir="rtl">
            <thead>
              <tr className="text-right text-[11px] uppercase" style={{ color: "var(--text-secondary)" }}>
                <th className="px-3 py-2.5">שם</th><th className="px-3 py-2.5">טלפון</th><th className="px-3 py-2.5">אימייל</th><th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c: Customer) => (
                <tr
                  key={c.id}
                  onClick={() => nav({ to: "/customers/$id", params: { id: c.id } })}
                  className="cursor-pointer border-t hover:bg-[var(--bg-subtle)]"
                  style={{ borderColor: "var(--border)" }}
                >
                  <td className="px-3 py-2.5 font-medium" style={{ color: "var(--text-primary)" }}>
                    {c.full_name}
                  </td>
                  <td className="ltr-num px-3 py-2.5" style={{ color: "var(--text-secondary)" }}>{c.phone ?? "—"}</td>
                  <td className="ltr-num px-3 py-2.5" style={{ color: "var(--text-secondary)" }}>{c.email ?? "—"}</td>
                  <td className="px-3 py-2.5">
                    <button onClick={(e) => { e.stopPropagation(); if (confirm("למחוק?")) delM.mutate(c.id); }} aria-label="מחק">
                      <Trash2 size={14} style={{ color: "var(--danger)" }} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </OCard>
    </>
  );
}
