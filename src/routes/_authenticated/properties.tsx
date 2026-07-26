import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Plus, Trash2 } from "lucide-react";
import { PageHeader, ActionButton } from "@/components/shell/PageHeader";
import { OCard } from "@/components/ui-oriya/Card";
import {
  listPropertiesWithUnits, createProperty, deleteProperty, createUnit, deleteUnit,
} from "@/lib/data.functions";

export const Route = createFileRoute("/_authenticated/properties")({
  head: () => ({
    meta: [
      { title: "נכסים ומחירונים · Oriya OS" },
      { name: "description", content: "פורטפוליו נכסים, יחידות ומחירים" },
      { property: "og:title", content: "נכסים ומחירונים · Oriya OS" },
      { property: "og:description", content: "פורטפוליו נכסים" },
    ],
  }),
  component: PropertiesPage,
  errorComponent: ({ error }) => <div className="p-6 text-sm text-red-700">{error.message}</div>,
});

function PropertiesPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const list = useServerFn(listPropertiesWithUnits);
  const cp = useServerFn(createProperty);
  const dp = useServerFn(deleteProperty);
  const cu = useServerFn(createUnit);
  const du = useServerFn(deleteUnit);
  const q = useSuspenseQuery({ queryKey: ["properties-units"], queryFn: () => list() });

  const [pf, setPf] = useState({ name: "", address: "" });
  const addProp = useMutation({
    mutationFn: () => cp({ data: { name: pf.name, address: pf.address || undefined } }),
    onSuccess: () => { qc.invalidateQueries(); setPf({ name: "", address: "" }); setOpen(false); },
  });
  const delProp = useMutation({ mutationFn: (id: string) => dp({ data: { id } }), onSuccess: () => qc.invalidateQueries() });
  const addUnit = useMutation({
    mutationFn: (v: { property_id: string; name: string; capacity: number; base_price: number }) => cu({ data: v }),
    onSuccess: () => qc.invalidateQueries(),
  });
  const delUnit = useMutation({ mutationFn: (id: string) => du({ data: { id } }), onSuccess: () => qc.invalidateQueries() });

  return (
    <>
      <PageHeader
        title="נכסים ומחירונים"
        subtitle="פורטפוליו · יחידות · תעריפים"
        action={<ActionButton variant="gold" onClick={() => setOpen(!open)}><Plus size={16} />נכס חדש</ActionButton>}
      />

      {open && (
        <OCard className="mb-4 p-4">
          <form className="grid gap-3 sm:grid-cols-3" onSubmit={(e) => { e.preventDefault(); addProp.mutate(); }}>
            <input required placeholder="שם הנכס" className="rounded-md border px-2 py-1.5 text-sm" style={{ borderColor: "var(--border)" }}
              value={pf.name} onChange={(e) => setPf({ ...pf, name: e.target.value })} />
            <input placeholder="כתובת" className="rounded-md border px-2 py-1.5 text-sm" style={{ borderColor: "var(--border)" }}
              value={pf.address} onChange={(e) => setPf({ ...pf, address: e.target.value })} />
            <button disabled={addProp.isPending} type="submit"
              className="rounded-md px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-60"
              style={{ backgroundColor: "var(--navy-900)" }}>הוסף</button>
          </form>
        </OCard>
      )}

      {q.data.properties.length === 0 && (
        <OCard className="p-10 text-center text-sm" >
          <div style={{ color: "var(--text-secondary)" }}>אין נכסים עדיין. הוסף את הנכס הראשון.</div>
        </OCard>
      )}

      <div className="space-y-4">
        {q.data.properties.map((p) => {
          const units = q.data.units.filter((u) => u.property_id === p.id);
          return (
            <OCard key={p.id} className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <div className="text-base font-semibold" style={{ color: "var(--navy-700)" }}>{p.name}</div>
                  {p.address && <div className="text-xs" style={{ color: "var(--text-secondary)" }}>{p.address}</div>}
                </div>
                <button
                  onClick={() => { if (confirm("למחוק את הנכס וכל יחידותיו?")) delProp.mutate(p.id); }}
                  className="rounded p-1.5 hover:bg-[var(--bg-subtle)]"
                >
                  <Trash2 size={14} style={{ color: "var(--danger)" }} />
                </button>
              </div>

              <div className="mb-3 grid gap-2">
                {units.map((u) => (
                  <div key={u.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm" style={{ borderColor: "var(--border)" }}>
                    <div>
                      <div className="font-medium" style={{ color: "var(--text-primary)" }}>{u.name}</div>
                      <div className="ltr-num text-[11px]" style={{ color: "var(--text-secondary)" }}>
                        {u.capacity} אורחים · ₪{Number(u.base_price).toLocaleString()} / לילה
                      </div>
                    </div>
                    <button onClick={() => { if (confirm("למחוק יחידה?")) delUnit.mutate(u.id); }}>
                      <Trash2 size={12} style={{ color: "var(--danger)" }} />
                    </button>
                  </div>
                ))}
                {units.length === 0 && <div className="text-xs" style={{ color: "var(--text-secondary)" }}>אין יחידות בנכס זה</div>}
              </div>

              <AddUnitForm propertyId={p.id} onAdd={(v) => addUnit.mutate(v)} pending={addUnit.isPending} />
            </OCard>
          );
        })}
      </div>
    </>
  );
}

function AddUnitForm({ propertyId, onAdd, pending }: { propertyId: string; onAdd: (v: { property_id: string; name: string; capacity: number; base_price: number }) => void; pending: boolean }) {
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState("");
  const [price, setPrice] = useState("");
  return (
    <form
      className="grid items-end gap-2 sm:grid-cols-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!name) return;
        onAdd({ property_id: propertyId, name, capacity: capacity ? Number(capacity) : 2, base_price: price ? Number(price) : 0 });
        setName("");
        setCapacity("");
        setPrice("");
      }}
    >
      <label className="grid gap-1 text-[11px]" style={{ color: "var(--text-secondary)" }}>
        שם היחידה
        <input required placeholder="לדוגמה: סוויטה A" className="rounded-md border px-2 py-1 text-xs" style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
          value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <label className="grid gap-1 text-[11px]" style={{ color: "var(--text-secondary)" }}>
        קיבולת (אורחים)
        <input type="number" min={1} placeholder="2" className="ltr-num rounded-md border px-2 py-1 text-xs" dir="ltr" style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
          value={capacity} onChange={(e) => setCapacity(e.target.value)} />
      </label>
      <label className="grid gap-1 text-[11px]" style={{ color: "var(--text-secondary)" }}>
        מחיר בסיס ללילה (₪)
        <input type="number" min={0} placeholder="500" className="ltr-num rounded-md border px-2 py-1 text-xs" dir="ltr" style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
          value={price} onChange={(e) => setPrice(e.target.value)} />
      </label>
      <button disabled={pending} type="submit" className="rounded-md px-2 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
        style={{ backgroundColor: "var(--navy-700)" }}>+ יחידה</button>
    </form>
  );
}
