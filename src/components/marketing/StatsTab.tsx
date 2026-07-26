import { useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMessagingStats } from "@/lib/wa.functions";
import { FunnelBar } from "./FunnelBar";

export function StatsTab() {
  const fn = useServerFn(getMessagingStats);
  const q = useSuspenseQuery({ queryKey: ["wa-stats"], queryFn: () => fn() });
  const { steps, campaigns, byStep, byCampaign } = q.data;

  const stepsByJourney = new Map<string, typeof steps>();
  for (const s of steps) {
    const key = (s as any).wa_journeys?.name_he ?? "—";
    if (!stepsByJourney.has(key)) stepsByJourney.set(key, [] as any);
    (stepsByJourney.get(key) as any).push(s);
  }

  return (
    <div className="space-y-8" dir="rtl">
      {[...stepsByJourney.entries()].map(([journeyName, sList]) => (
        <section key={journeyName}>
          <h3 className="mb-3 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{journeyName}</h3>
          <div className="rounded-lg border" style={{ borderColor: "var(--border)", backgroundColor: "white" }}>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-right text-[11px] uppercase" style={{ color: "var(--text-secondary)" }}>
                  <th className="px-4 py-2.5 w-24">שלב</th>
                  <th className="px-4 py-2.5">שם</th>
                  <th className="px-4 py-2.5 w-[320px]">משפך</th>
                </tr>
              </thead>
              <tbody>
                {(sList as any[]).map((s) => (
                  <tr key={s.id} className="border-t" style={{ borderColor: "var(--border)" }}>
                    <td className="px-4 py-2.5 font-mono text-[12px]" style={{ color: "var(--gold-600)" }}>{s.step_code}</td>
                    <td className="px-4 py-2.5">{s.name_he}</td>
                    <td className="px-4 py-2.5"><FunnelBar f={byStep[s.id] ?? {}} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}

      <section>
        <h3 className="mb-3 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>קמפיינים פעילים</h3>
        <div className="rounded-lg border" style={{ borderColor: "var(--border)", backgroundColor: "white" }}>
          {campaigns.length === 0 ? (
            <div className="p-6 text-center text-sm" style={{ color: "var(--text-secondary)" }}>אין קמפיינים.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-right text-[11px] uppercase" style={{ color: "var(--text-secondary)" }}>
                  <th className="px-4 py-2.5">שם</th>
                  <th className="px-4 py-2.5">סטטוס</th>
                  <th className="px-4 py-2.5 w-[320px]">משפך</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c: any) => (
                  <tr key={c.id} className="border-t" style={{ borderColor: "var(--border)" }}>
                    <td className="px-4 py-2.5">{c.name_he}</td>
                    <td className="px-4 py-2.5">{c.status}</td>
                    <td className="px-4 py-2.5"><FunnelBar f={byCampaign[c.id] ?? {}} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
