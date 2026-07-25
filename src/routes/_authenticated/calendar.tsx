import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Plus, X } from "lucide-react";
import { PageHeader, ActionButton } from "@/components/shell/PageHeader";
import { CalendarToolbar } from "@/components/calendar/CalendarToolbar";
import { CalendarGrid } from "@/components/calendar/CalendarGrid";
import { listPropertiesWithUnits, listReservations, createReservation } from "@/lib/data.functions";
import { channelLabel, type Channel } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/calendar")({
  head: () => ({
    meta: [
      { title: "יומן · Oriya OS" },
      { name: "description", content: "יומן רב-יחידתי עם הזמנות וחסימות" },
      { property: "og:title", content: "יומן · Oriya OS" },
      { property: "og:description", content: "יומן רב-יחידתי" },
    ],
  }),
  component: CalendarPage,
  errorComponent: ({ error }) => <div className="p-6 text-sm text-red-700">{error.message}</div>,
});

function CalendarPage() {
  const [view, setView] = useState<"day" | "week" | "twoweek" | "month">("twoweek");
  const [open, setOpen] = useState(false);
  const pu = useServerFn(listPropertiesWithUnits);
  const lr = useServerFn(listReservations);
  const props = useSuspenseQuery({ queryKey: ["properties-units"], queryFn: () => pu() });
  const res = useSuspenseQuery({ queryKey: ["reservations"], queryFn: () => lr() });

  return (
    <>
      <PageHeader
        title="יומן"
        subtitle="תצוגה רב-יחידתית · לחץ על הזמנה לפרטים"
        action={<ActionButton variant="gold" onClick={() => setOpen(true)}><Plus size={16} />הזמנה חדשה</ActionButton>}
      />
      <CalendarToolbar view={view} onView={setView} />
      <CalendarGrid
        properties={props.data.properties}
        units={props.data.units}
        reservations={res.data}
      />
      {open && <NewReservation units={props.data.units} onClose={() => setOpen(false)} />}
    </>
  );
}

function NewReservation({ units, onClose }: { units: { id: string; name: string }[]; onClose: () => void }) {
  const qc = useQueryClient();
  const fn = useServerFn(createReservation);
  const [form, setForm] = useState({
    unit_id: units[0]?.id ?? "",
    guest_name: "",
    phone: "",
    channel: "direct" as Channel,
    check_in: new Date().toISOString().slice(0, 10),
    check_out: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    total_amount: 0,
  });
  const m = useMutation({
    mutationFn: (v: typeof form) => fn({ data: v }),
    onSuccess: () => { qc.invalidateQueries(); onClose(); },
  });

  if (units.length === 0) {
    return (
      <Modal onClose={onClose} title="הזמנה חדשה">
        <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
          צור יחידת אירוח לפני יצירת הזמנה.
        </div>
      </Modal>
    );
  }

  return (
    <Modal onClose={onClose} title="הזמנה חדשה">
      <form
        className="space-y-3"
        onSubmit={(e) => { e.preventDefault(); m.mutate(form); }}
      >
        <Field label="יחידה">
          <select className="w-full rounded-md border px-2 py-1.5 text-sm" style={{ borderColor: "var(--border)" }}
            value={form.unit_id} onChange={(e) => setForm({ ...form, unit_id: e.target.value })}>
            {units.map((u) => (<option key={u.id} value={u.id}>{u.name}</option>))}
          </select>
        </Field>
        <Field label="שם אורח">
          <input className="w-full rounded-md border px-2 py-1.5 text-sm" style={{ borderColor: "var(--border)" }}
            required value={form.guest_name} onChange={(e) => setForm({ ...form, guest_name: e.target.value })} />
        </Field>
        <Field label="טלפון">
          <input className="ltr-num w-full rounded-md border px-2 py-1.5 text-sm" dir="ltr" style={{ borderColor: "var(--border)" }}
            value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </Field>
        <Field label="ערוץ">
          <select className="w-full rounded-md border px-2 py-1.5 text-sm" style={{ borderColor: "var(--border)" }}
            value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value as Channel })}>
            {Object.entries(channelLabel).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="צ'ק-אין">
            <input type="date" className="w-full rounded-md border px-2 py-1.5 text-sm" style={{ borderColor: "var(--border)" }}
              value={form.check_in} onChange={(e) => setForm({ ...form, check_in: e.target.value })} required />
          </Field>
          <Field label="צ'ק-אאוט">
            <input type="date" className="w-full rounded-md border px-2 py-1.5 text-sm" style={{ borderColor: "var(--border)" }}
              value={form.check_out} onChange={(e) => setForm({ ...form, check_out: e.target.value })} required />
          </Field>
        </div>
        <Field label="סה״כ ₪">
          <input type="number" min={0} className="ltr-num w-full rounded-md border px-2 py-1.5 text-sm" dir="ltr" style={{ borderColor: "var(--border)" }}
            value={form.total_amount} onChange={(e) => setForm({ ...form, total_amount: Number(e.target.value) })} />
        </Field>
        {m.error && <div className="text-xs text-red-600">{(m.error as Error).message}</div>}
        <button type="submit" disabled={m.isPending}
          className="w-full rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          style={{ backgroundColor: "var(--navy-900)" }}>
          {m.isPending ? "…" : "צור הזמנה"}
        </button>
      </form>
    </Modal>
  );
}

function Modal({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={onClose}>
      <div className="card-shadow w-[380px] rounded-xl border bg-white p-5" style={{ borderColor: "var(--border)" }} onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>{title}</h3>
          <button onClick={onClose}><X size={16} style={{ color: "var(--text-secondary)" }} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium" style={{ color: "var(--text-secondary)" }}>{label}</span>
      {children}
    </label>
  );
}
