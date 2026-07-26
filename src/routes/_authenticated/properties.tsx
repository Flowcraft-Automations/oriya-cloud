import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Plus, Trash2 } from "lucide-react";
import { PageHeader, ActionButton } from "@/components/shell/PageHeader";
import { OCard } from "@/components/ui-oriya/Card";
import {
  listPropertiesWithUnits, createProperty, deleteProperty, deleteUnit, updateUnit,
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
  const du = useServerFn(deleteUnit);
  const uu = useServerFn(updateUnit);
  const q = useSuspenseQuery({ queryKey: ["properties-units"], queryFn: () => list() });

  const [pf, setPf] = useState({ name: "", address: "" });
  const addProp = useMutation({
    mutationFn: () => cp({ data: { name: pf.name, address: pf.address || undefined } }),
    onSuccess: () => { qc.invalidateQueries(); setPf({ name: "", address: "" }); setOpen(false); },
  });
  const delProp = useMutation({ mutationFn: (id: string) => dp({ data: { id } }), onSuccess: () => qc.invalidateQueries() });
  const delUnit = useMutation({ mutationFn: (id: string) => du({ data: { id } }), onSuccess: () => qc.invalidateQueries() });
  const editUnit = useMutation({
    mutationFn: (v: { id: string; capacity?: number; base_price?: number }) => uu({ data: v }),
    onSuccess: () => qc.invalidateQueries(),
  });

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
                  <UnitRow
                    key={u.id}
                    id={u.id}
                    name={u.name}
                    capacity={u.capacity}
                    basePrice={Number(u.base_price)}
                    onSave={(patch) => editUnit.mutate({ id: u.id, ...patch })}
                    onDelete={() => { if (confirm("למחוק יחידה?")) delUnit.mutate(u.id); }}
                  />
                ))}
                {units.length === 0 && <div className="text-xs" style={{ color: "var(--text-secondary)" }}>אין יחידות בנכס זה</div>}
              </div>
            </OCard>
          );
        })}
      </div>
    </>
  );
}

function UnitRow({
  id, name, capacity, basePrice, onSave, onDelete,
}: { id: string; name: string; capacity: number; basePrice: number; onSave: (patch: { capacity?: number; base_price?: number }) => void; onDelete: () => void }) {
  const [cap, setCap] = useState(String(capacity));
  const [price, setPrice] = useState(String(basePrice));
  useEffect(() => { setCap(String(capacity)); }, [capacity]);
  useEffect(() => { setPrice(String(basePrice)); }, [basePrice]);

  const commit = () => {
    const patch: { capacity?: number; base_price?: number } = {};
    const c = Number(cap);
    const p = Number(price);
    if (Number.isFinite(c) && c > 0 && c !== capacity) patch.capacity = c;
    if (Number.isFinite(p) && p >= 0 && p !== basePrice) patch.base_price = p;
    if (Object.keys(patch).length) onSave(patch);
  };

  return (
    <div className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm" style={{ borderColor: "var(--border)" }} key={id}>
      <div className="min-w-0 flex-1 font-medium" style={{ color: "var(--text-primary)" }}>{name}</div>
      <label className="flex items-center gap-1.5 text-[11px]" style={{ color: "var(--text-secondary)" }}>
        אורחים
        <input
          type="number" min={1} dir="ltr"
          className="ltr-num w-16 rounded-md border px-2 py-1 text-xs"
          style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
          value={cap}
          onChange={(e) => setCap(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
        />
      </label>
      <label className="flex items-center gap-1.5 text-[11px]" style={{ color: "var(--text-secondary)" }}>
        ₪ / לילה
        <input
          type="number" min={0} dir="ltr"
          className="ltr-num w-24 rounded-md border px-2 py-1 text-xs"
          style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
        />
      </label>
      <button onClick={onDelete} className="rounded p-1.5 hover:bg-[var(--bg-subtle)]">
        <Trash2 size={12} style={{ color: "var(--danger)" }} />
      </button>
    </div>
  );
}
