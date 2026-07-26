import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate } from "@tanstack/react-router";
import { X } from "lucide-react";
import { getDashboardDrill, type DrillKey, type DrillLinkTo } from "@/lib/data.functions";
import { TonePill, type Tone } from "@/components/detail/DetailLayout";

const routeFor: Record<DrillLinkTo, "/reservations/$id" | "/leads/$id" | "/payments/$id" | "/customers/$id"> = {
  reservation: "/reservations/$id",
  lead: "/leads/$id",
  inquiry: "/leads/$id",
  invoice: "/payments/$id",
  customer: "/customers/$id",
};

export function KpiDrillDrawer({ drillKey, onClose }: { drillKey: DrillKey | null; onClose: () => void }) {
  const fn = useServerFn(getDashboardDrill);
  const nav = useNavigate();
  const open = drillKey !== null;

  const { data, isFetching } = useQuery({
    queryKey: ["dash-drill", drillKey],
    queryFn: () => fn({ data: { key: drillKey! } }),
    enabled: open,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/30 transition-opacity ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
        aria-hidden
      />
      <aside
        dir="rtl"
        className={`fixed inset-y-0 start-0 z-50 flex w-full max-w-[440px] flex-col border-e bg-white shadow-2xl transition-transform ${open ? "translate-x-0" : "-translate-x-full rtl:translate-x-full"}`}
        style={{ borderColor: "var(--border)" }}
      >
        <header className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: "var(--border)" }}>
          <div>
            <div className="text-[11px] uppercase tracking-wide" style={{ color: "var(--text-secondary)" }}>רשומות</div>
            <div className="mt-0.5 text-base font-semibold" style={{ color: "var(--text-primary)" }}>
              {data?.title ?? "…"}
              {data && <span className="ltr-num ms-2 text-sm font-normal" style={{ color: "var(--text-secondary)" }}>({data.count})</span>}
            </div>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 hover:bg-[var(--bg-subtle)]" aria-label="סגור">
            <X size={18} />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto">
          {isFetching && !data && (
            <div className="p-8 text-center text-sm" style={{ color: "var(--text-secondary)" }}>טוען…</div>
          )}
          {data && data.rows.length === 0 && (
            <div className="p-10 text-center text-sm" style={{ color: "var(--text-secondary)" }}>אין רשומות.</div>
          )}
          {data && data.rows.length > 0 && (
            <ul className="divide-y" style={{ borderColor: "var(--border)" }}>
              {data.rows.map((r) => (
                <li
                  key={r.id}
                  onClick={() => {
                    onClose();
                    nav({ to: routeFor[r.linkTo], params: { id: r.linkId } });
                  }}
                  className="cursor-pointer px-5 py-3 hover:bg-[var(--bg-subtle)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium" style={{ color: "var(--text-primary)" }}>{r.primary}</div>
                      {r.secondary && (
                        <div className="ltr-num mt-0.5 truncate text-[11px]" style={{ color: "var(--text-secondary)" }}>{r.secondary}</div>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      {r.pill && <TonePill label={r.pill.label} tone={r.pill.tone as Tone} />}
                      {r.amount && <span className="ltr-num text-xs font-semibold" style={{ color: "var(--gold-600)" }}>{r.amount}</span>}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
    </>
  );
}