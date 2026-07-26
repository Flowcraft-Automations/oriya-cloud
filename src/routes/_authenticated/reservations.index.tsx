import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Plus, Trash2 } from "lucide-react";
import { PageHeader, ActionButton } from "@/components/shell/PageHeader";
import { OCard } from "@/components/ui-oriya/Card";
import { OBadge } from "@/components/ui-oriya/Badge";
import { FilterChips } from "@/components/shell/FilterChips";
import { listReservations, listPropertiesWithUnits, deleteReservation } from "@/lib/data.functions";
import { channelLabel, statusLabel, type Channel, type Reservation, type ReservationStatus } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/reservations")({
  head: () => ({
    meta: [
      { title: "הזמנות · Oriya OS" },
      { name: "description", content: "ניהול הזמנות, מקדמות וטפסי הורים" },
      { property: "og:title", content: "הזמנות · Oriya OS" },
      { property: "og:description", content: "ניהול הזמנות" },
    ],
  }),
  component: ReservationsPage,
  errorComponent: ({ error }) => <div className="p-6 text-sm text-red-700">{error.message}</div>,
});

function ReservationsPage() {
  const qc = useQueryClient();
  const nav = useNavigate();
  const [statusFilter, setStatusFilter] = useState<"all" | ReservationStatus>("all");
  const lr = useServerFn(listReservations);
  const pu = useServerFn(listPropertiesWithUnits);
  const del = useServerFn(deleteReservation);
  const res = useSuspenseQuery({ queryKey: ["reservations"], queryFn: () => lr() });
  const props = useSuspenseQuery({ queryKey: ["properties-units"], queryFn: () => pu() });
  const delM = useMutation({ mutationFn: (id: string) => del({ data: { id } }), onSuccess: () => qc.invalidateQueries() });

  const unitName = useMemo(() => {
    const map = new Map<string, string>();
    for (const u of props.data.units) map.set(u.id, u.name);
    return map;
  }, [props.data.units]);

  const rows = res.data.filter((r) => statusFilter === "all" || r.status === statusFilter);

  return (
    <>
      <PageHeader
        title="הזמנות"
        subtitle={`${res.data.length} הזמנות סה״כ`}
        action={<ActionButton variant="gold" onClick={() => (window.location.href = "/calendar")}><Plus size={16} />הזמנה חדשה</ActionButton>}
      />
      <FilterChips
        chips={[
          { key: "all", label: `הכול (${res.data.length})` },
          ...(Object.keys(statusLabel) as ReservationStatus[]).map((s) => ({
            key: s,
            label: `${statusLabel[s]} (${res.data.filter((r) => r.status === s).length})`,
          })),
        ]}
        value={statusFilter}
        onChange={(k) => setStatusFilter(k as typeof statusFilter)}
      />
      <OCard className="mt-3 overflow-hidden">
        {rows.length === 0 ? (
          <div className="p-10 text-center text-sm" style={{ color: "var(--text-secondary)" }}>אין הזמנות להצגה.</div>
        ) : (
          <table className="w-full text-sm" dir="rtl">
            <thead>
              <tr className="text-right text-[11px] uppercase" style={{ color: "var(--text-secondary)" }}>
                <Th>אורח</Th><Th>יחידה</Th><Th>ערוץ</Th><Th>תאריכים</Th><Th>לילות</Th><Th>סכום</Th><Th>סטטוס</Th><Th>{" "}</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r: Reservation) => (
                <tr
                  key={r.id}
                  onClick={() => nav({ to: "/reservations/$id", params: { id: r.id } })}
                  className="cursor-pointer border-t hover:bg-[var(--bg-subtle)]"
                  style={{ borderColor: "var(--border)" }}
                >
                  <Td>
                    <span className="font-medium" style={{ color: "var(--text-primary)" }}>{r.guest_name}</span>
                    {r.phone && <div className="ltr-num text-[11px]" style={{ color: "var(--text-secondary)" }}>{r.phone}</div>}
                  </Td>
                  <Td>{unitName.get(r.unit_id) ?? "—"}</Td>
                  <Td>{channelLabel[r.channel as Channel]}</Td>
                  <Td><span className="ltr-num text-xs">{r.check_in} → {r.check_out}</span></Td>
                  <Td><span className="ltr-num">{r.nights}</span></Td>
                  <Td><span className="ltr-num">₪{Number(r.total_amount).toLocaleString()}</span></Td>
                  <Td><OBadge tone={r.status === "confirmed" ? "success" : r.status === "cancelled" ? "danger" : "info"}>{statusLabel[r.status as ReservationStatus]}</OBadge></Td>
                  <Td>
                    <button
                      onClick={(e) => { e.stopPropagation(); if (confirm("למחוק?")) delM.mutate(r.id); }}
                      className="rounded p-1.5 hover:bg-[var(--bg-subtle)]"
                      aria-label="מחק"
                    >
                      <Trash2 size={14} style={{ color: "var(--danger)" }} />
                    </button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </OCard>
    </>
  );
}

function Th({ children }: { children: React.ReactNode }) { return <th className="px-3 py-2.5 font-semibold">{children}</th>; }
function Td({ children }: { children: React.ReactNode }) { return <td className="px-3 py-2.5" style={{ color: "var(--text-primary)" }}>{children}</td>; }
