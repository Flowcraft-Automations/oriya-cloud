import { useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { UserPlus, Inbox, TrendingUp, MessageSquare } from "lucide-react";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { OCard, OCardBody, OCardHeader, OCardTitle } from "@/components/ui-oriya/Card";
import { TonePill } from "@/components/detail/DetailLayout";
import { getLeadsDashboard } from "@/lib/data.functions";
import { sourceLabel, sourceTone, stageLabel, stageTone, type LeadSource, type LeadStage } from "@/lib/types";

export function LeadsTab() {
  const fn = useServerFn(getLeadsDashboard);
  const { data } = useSuspenseQuery({ queryKey: ["dash-leads"], queryFn: () => fn() });
  const nav = useNavigate();

  const funnelData = data.funnel.map((f) => ({ ...f, label: stageLabel[f.stage as LeadStage] }));
  const stageColor: Record<LeadStage, string> = {
    new: "var(--info)", contacted: "var(--gold-600)", quoted: "var(--warning)", booked: "var(--success)", lost: "var(--danger)",
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard label="לידים חדשים החודש" value={data.kpis.newThisMonth} sub={`${data.kpis.totalLeads} סה״כ`} icon={UserPlus} tone="navy" />
        <KpiCard label="לידים פתוחים" value={data.kpis.open} sub="בטיפול" icon={Inbox} tone="navy" />
        <KpiCard label="שיעור המרה" value={`${data.kpis.conversionPct}%`} sub={`${data.kpis.booked} הוזמנו`} icon={TrendingUp} tone="gold" />
        <KpiCard label="פניות השבוע" value={data.kpis.inquiriesThisWeek} sub="לטופס האתר" icon={MessageSquare} tone="navy" />
        <KpiCard label="סה״כ פניות" value={data.recentInquiries.length > 0 ? data.recentInquiries.length + "+" : "0"} sub="בהיסטוריה" icon={MessageSquare} tone="navy" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <OCard>
          <OCardHeader><OCardTitle>משפך מכירות</OCardTitle></OCardHeader>
          <OCardBody>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelData} layout="vertical" margin={{ left: 20, right: 20 }}>
                  <CartesianGrid horizontal={false} stroke="var(--border)" />
                  <XAxis type="number" tickLine={false} axisLine={false} tick={{ fill: "var(--text-secondary)", fontSize: 11 }} />
                  <YAxis dataKey="label" type="category" orientation="right" tickLine={false} axisLine={false} tick={{ fill: "var(--text-primary)", fontSize: 12 }} width={80} />
                  <Tooltip contentStyle={{ border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} formatter={(v: number) => [v, "לידים"]} />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                    {funnelData.map((d, i) => <Cell key={i} fill={stageColor[d.stage as LeadStage]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </OCardBody>
        </OCard>

        <OCard>
          <OCardHeader><OCardTitle>מקור לידים</OCardTitle></OCardHeader>
          <OCardBody>
            <ul className="space-y-2.5">
              {data.sourceMix.map((s) => {
                const max = Math.max(...data.sourceMix.map((x) => x.count), 1);
                const pct = (s.count / max) * 100;
                return (
                  <li key={s.source}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <TonePill label={sourceLabel[s.source as LeadSource] ?? s.source} tone={sourceTone[s.source as LeadSource] ?? "neutral"} />
                      <span className="ltr-num font-semibold" style={{ color: "var(--text-primary)" }}>{s.count}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full" style={{ backgroundColor: "var(--bg-subtle)" }}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: "var(--navy-500)" }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          </OCardBody>
        </OCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <OCard>
          <OCardHeader><OCardTitle>פניות לפי נכס</OCardTitle></OCardHeader>
          <OCardBody>
            {data.inquiriesByProperty.length === 0 ? (
              <div className="py-6 text-center text-sm" style={{ color: "var(--text-secondary)" }}>אין פניות מקושרות לנכס.</div>
            ) : (
              <ul className="space-y-2">
                {data.inquiriesByProperty.map((p) => (
                  <li key={p.property_id} className="flex items-center justify-between text-sm">
                    <span style={{ color: "var(--text-primary)" }}>{p.name}</span>
                    <span className="ltr-num font-semibold" style={{ color: "var(--gold-600)" }}>{p.count}</span>
                  </li>
                ))}
              </ul>
            )}
          </OCardBody>
        </OCard>

        <OCard className="lg:col-span-2">
          <OCardHeader><OCardTitle>פניות אחרונות</OCardTitle></OCardHeader>
          <OCardBody className="p-0">
            {data.recentInquiries.length === 0 ? (
              <div className="p-6 text-center text-sm" style={{ color: "var(--text-secondary)" }}>אין פניות.</div>
            ) : (
              <ul className="divide-y" style={{ borderColor: "var(--border)" }}>
                {data.recentInquiries.map((i) => (
                  <li key={i.id} onClick={() => nav({ to: "/leads/$id", params: { id: i.lead_id } })}
                    className="flex cursor-pointer items-center justify-between gap-3 px-4 py-2.5 hover:bg-[var(--bg-subtle)]">
                    <div className="min-w-0">
                      <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                        {i.guest_name ?? "—"} {i.property_name && <span style={{ color: "var(--text-secondary)" }}>· {i.property_name}</span>}
                      </div>
                      <div className="ltr-num text-[11px]" style={{ color: "var(--text-secondary)" }}>
                        {i.check_in ? `${i.check_in} → ${i.check_out ?? "?"}` : new Date(i.created_at).toLocaleDateString("he-IL")}
                      </div>
                    </div>
                    <TonePill label={sourceLabel[i.source as LeadSource] ?? i.source} tone={sourceTone[i.source as LeadSource] ?? "neutral"} />
                  </li>
                ))}
              </ul>
            )}
          </OCardBody>
        </OCard>
      </div>

      <OCard>
        <OCardHeader><OCardTitle>לידים חדשים</OCardTitle></OCardHeader>
        <OCardBody className="p-0">
          <ul className="divide-y" style={{ borderColor: "var(--border)" }}>
            {data.newest.map((l) => (
              <li key={l.id} onClick={() => nav({ to: "/leads/$id", params: { id: l.id } })}
                className="flex cursor-pointer items-center justify-between gap-3 px-4 py-2.5 hover:bg-[var(--bg-subtle)]">
                <div className="min-w-0">
                  <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{l.full_name}</div>
                  <div className="text-[11px]" style={{ color: "var(--text-secondary)" }}>{l.interest ?? ""}</div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <TonePill label={sourceLabel[l.source as LeadSource]} tone={sourceTone[l.source as LeadSource]} />
                  <TonePill label={stageLabel[l.stage as LeadStage]} tone={stageTone[l.stage as LeadStage]} />
                </div>
              </li>
            ))}
          </ul>
        </OCardBody>
      </OCard>
    </div>
  );
}