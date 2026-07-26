import { useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Wallet, AlertCircle, Clock, TrendingUp, PieChart as PieIcon, Receipt } from "lucide-react";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { OCard, OCardBody, OCardHeader, OCardTitle } from "@/components/ui-oriya/Card";
import { TonePill } from "@/components/detail/DetailLayout";
import { getFinancialDashboard, type DrillKey } from "@/lib/data.functions";
import { KpiDrillDrawer } from "@/components/dashboard/KpiDrillDrawer";
import { channelLabel, channelTone, type Channel } from "@/lib/types";

const statusLabel: Record<string, string> = { draft: "טיוטה", sent: "נשלח", paid: "שולם", overdue: "בפיגור", cancelled: "בוטל" };
const statusToneMap: Record<string, "info" | "gold" | "success" | "danger" | "neutral"> = {
  draft: "neutral", sent: "info", paid: "success", overdue: "danger", cancelled: "neutral",
};

export function FinancialTab() {
  const fn = useServerFn(getFinancialDashboard);
  const { data } = useSuspenseQuery({ queryKey: ["dash-fin"], queryFn: () => fn() });
  const nav = useNavigate();
  const [drill, setDrill] = useState<DrillKey | null>(null);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <KpiCard label="הכנסות החודש" value={`₪${data.kpis.monthRevenue.toLocaleString()}`} sub={`${data.kpis.paidCount} חשבוניות`} icon={Wallet} tone="gold" onClick={() => setDrill("revenue_month")} />
        <KpiCard label="יתרת גבייה" value={`₪${data.kpis.outstandingSum.toLocaleString()}`} sub="פתוח" icon={Clock} tone="navy" onClick={() => setDrill("outstanding")} />
        <KpiCard label="בפיגור" value={`₪${data.kpis.overdueSum.toLocaleString()}`} sub="לתשלום מיידי" icon={AlertCircle} tone="gold" onClick={() => setDrill("overdue")} />
        <KpiCard label="ADR" value={`₪${data.kpis.adr}`} sub="לילה ממוצע" icon={TrendingUp} tone="navy" onClick={() => setDrill("adr")} />
        <KpiCard label="RevPAR" value={`₪${data.kpis.revpar}`} sub="הכנסה ליחידה" icon={PieIcon} tone="navy" onClick={() => setDrill("revpar")} />
        <KpiCard label="ח״ם פתוחות" value={data.outstandingList.length} sub="לגבייה" icon={Receipt} tone="navy" onClick={() => setDrill("open_invoices")} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <OCard className="lg:col-span-2">
          <OCardHeader>
            <OCardTitle>הכנסות לפי חודש</OCardTitle>
            <span className="text-xs" style={{ color: "var(--text-secondary)" }}>₪</span>
          </OCardHeader>
          <OCardBody>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.revenueByMonth}>
                  <CartesianGrid vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="month" reversed tickLine={false} axisLine={false} tick={{ fill: "var(--text-secondary)", fontSize: 12 }} />
                  <YAxis orientation="right" tickLine={false} axisLine={false} tick={{ fill: "var(--text-secondary)", fontSize: 11 }} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                  <Tooltip contentStyle={{ border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} formatter={(v: number) => [`₪${v.toLocaleString()}`, "הכנסות"]} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {data.revenueByMonth.map((d, i) => <Cell key={i} fill={d.current ? "var(--gold-600)" : "var(--navy-700)"} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </OCardBody>
        </OCard>

        <OCard>
          <OCardHeader><OCardTitle>שולם מול פתוח</OCardTitle></OCardHeader>
          <OCardBody>
            {data.donut.length === 0 ? (
              <div className="py-8 text-center text-sm" style={{ color: "var(--text-secondary)" }}>אין נתונים.</div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="h-40 w-40 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={data.donut} dataKey="value" innerRadius={44} outerRadius={64} paddingAngle={2} stroke="none">
                        {data.donut.map((c, i) => <Cell key={i} fill={c.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{ border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} formatter={(v: number, n) => [`₪${v.toLocaleString()}`, n]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <ul className="flex-1 space-y-2 text-sm">
                  {data.donut.map((c) => (
                    <li key={c.name} className="flex items-center justify-between">
                      <span className="flex items-center gap-2" style={{ color: "var(--text-secondary)" }}>
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                        {c.name}
                      </span>
                      <span className="ltr-num font-semibold" style={{ color: "var(--text-primary)" }}>₪{c.value.toLocaleString()}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </OCardBody>
        </OCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <OCard>
          <OCardHeader><OCardTitle>הכנסות לפי ערוץ (החודש)</OCardTitle></OCardHeader>
          <OCardBody>
            {data.revenueByChannel.length === 0 ? (
              <div className="py-6 text-center text-sm" style={{ color: "var(--text-secondary)" }}>אין נתונים.</div>
            ) : (
              <ul className="space-y-2.5">
                {data.revenueByChannel.map((c) => {
                  const max = Math.max(...data.revenueByChannel.map((x) => x.value), 1);
                  const pct = (c.value / max) * 100;
                  return (
                    <li key={c.channel}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <TonePill label={channelLabel[c.channel as Channel] ?? c.channel} tone={channelTone[c.channel as Channel] ?? "neutral"} />
                        <span className="ltr-num font-semibold" style={{ color: "var(--text-primary)" }}>₪{c.value.toLocaleString()}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full" style={{ backgroundColor: "var(--bg-subtle)" }}>
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: "var(--gold-600)" }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </OCardBody>
        </OCard>

        <OCard>
          <OCardHeader><OCardTitle>לקוחות מובילים (90 יום)</OCardTitle></OCardHeader>
          <OCardBody className="p-0">
            {data.topCustomers.length === 0 ? (
              <div className="p-6 text-center text-sm" style={{ color: "var(--text-secondary)" }}>אין נתונים.</div>
            ) : (
              <ul className="divide-y" style={{ borderColor: "var(--border)" }}>
                {data.topCustomers.map((c, i) => (
                  <li key={c.id} onClick={() => nav({ to: "/customers/$id", params: { id: c.id } })}
                    className="flex cursor-pointer items-center justify-between px-4 py-2.5 hover:bg-[var(--bg-subtle)]">
                    <div className="flex items-center gap-3">
                      <span className="ltr-num inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold"
                        style={{ backgroundColor: "var(--gold-100)", color: "var(--gold-600)" }}>{i + 1}</span>
                      <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{c.name}</span>
                    </div>
                    <span className="ltr-num font-semibold" style={{ color: "var(--gold-600)" }}>₪{c.total.toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            )}
          </OCardBody>
        </OCard>
      </div>

      <OCard>
        <OCardHeader><OCardTitle>חשבוניות פתוחות</OCardTitle></OCardHeader>
        <OCardBody className="p-0">
          {data.outstandingList.length === 0 ? (
            <div className="p-6 text-center text-sm" style={{ color: "var(--text-secondary)" }}>אין חשבוניות פתוחות.</div>
          ) : (
            <table className="w-full text-sm" dir="rtl">
              <thead>
                <tr className="text-right text-[11px] uppercase" style={{ color: "var(--text-secondary)" }}>
                  <th className="px-3 py-2">מספר</th><th className="px-3 py-2">לקוח</th>
                  <th className="px-3 py-2">לתשלום עד</th><th className="px-3 py-2">ימי פיגור</th>
                  <th className="px-3 py-2">סכום</th><th className="px-3 py-2">סטטוס</th>
                </tr>
              </thead>
              <tbody>
                {data.outstandingList.map((i) => (
                  <tr key={i.id} onClick={() => nav({ to: "/payments/$id", params: { id: i.id } })}
                    className="cursor-pointer border-t hover:bg-[var(--bg-subtle)]" style={{ borderColor: "var(--border)" }}>
                    <td className="ltr-num px-3 py-2 font-medium">{i.invoice_number}</td>
                    <td className="px-3 py-2">{i.customer_name ?? "—"}</td>
                    <td className="ltr-num px-3 py-2">{i.due_date ?? "—"}</td>
                    <td className="ltr-num px-3 py-2" style={{ color: i.days_overdue > 0 ? "var(--danger)" : "var(--text-secondary)" }}>
                      {i.days_overdue > 0 ? i.days_overdue : "—"}
                    </td>
                    <td className="ltr-num px-3 py-2">₪{i.total.toLocaleString()}</td>
                    <td className="px-3 py-2"><TonePill label={statusLabel[i.status] ?? i.status} tone={statusToneMap[i.status] ?? "neutral"} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </OCardBody>
      </OCard>
      <KpiDrillDrawer drillKey={drill} onClose={() => setDrill(null)} />
    </div>
  );
}