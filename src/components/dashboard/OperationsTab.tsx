import { useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Users, LogIn, LogOut, PieChart, Clock, XCircle } from "lucide-react";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { OCard, OCardBody, OCardHeader, OCardTitle } from "@/components/ui-oriya/Card";
import { TonePill } from "@/components/detail/DetailLayout";
import { getOperationsDashboard, type DrillKey } from "@/lib/data.functions";
import { KpiDrillDrawer } from "@/components/dashboard/KpiDrillDrawer";
import { channelLabel, channelTone, statusLabel, statusTone, type Channel, type ReservationStatus } from "@/lib/types";

export function OperationsTab() {
  const fn = useServerFn(getOperationsDashboard);
  const { data } = useSuspenseQuery({ queryKey: ["dash-ops"], queryFn: () => fn() });
  const nav = useNavigate();
  const [drill, setDrill] = useState<DrillKey | null>(null);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <KpiCard label="שוהים עכשיו" value={data.kpis.stayingNow} sub="במלון" icon={Users} tone="navy" onClick={() => setDrill("staying_now")} />
        <KpiCard label="הגעות היום" value={data.kpis.arrivingToday} sub="Check-in" icon={LogIn} tone="gold" onClick={() => setDrill("arrivals_today")} />
        <KpiCard label="עזיבות היום" value={data.kpis.departingToday} sub="Check-out" icon={LogOut} tone="navy" onClick={() => setDrill("departures_today")} />
        <KpiCard label="תפוסה חודש" value={`${data.kpis.occupancyPct}%`} sub="לילות תפוסים" icon={PieChart} tone="navy" onClick={() => setDrill("occupancy_month")} />
        <KpiCard label="שהות ממוצעת" value={`${data.kpis.avgStay}`} sub="לילות · 30 יום" icon={Clock} tone="navy" onClick={() => setDrill("avg_stay")} />
        <KpiCard label="שיעור ביטולים" value={`${data.kpis.cancelRate}%`} sub="30 יום אחרונים" icon={XCircle} tone="gold" onClick={() => setDrill("cancel_rate")} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <OCard className="lg:col-span-2">
          <OCardHeader>
            <OCardTitle>תנועה 7 ימים</OCardTitle>
            <span className="text-xs" style={{ color: "var(--text-secondary)" }}>הגעות · עזיבות</span>
          </OCardHeader>
          <OCardBody>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.series}>
                  <CartesianGrid vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="label" reversed tickLine={false} axisLine={false} tick={{ fill: "var(--text-secondary)", fontSize: 12 }} />
                  <YAxis orientation="right" tickLine={false} axisLine={false} tick={{ fill: "var(--text-secondary)", fontSize: 11 }} />
                  <Tooltip contentStyle={{ border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="arrivals" name="הגעות" fill="var(--navy-700)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="departures" name="עזיבות" fill="var(--gold-600)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </OCardBody>
        </OCard>

        <OCard>
          <OCardHeader><OCardTitle>סטטוס יחידות</OCardTitle></OCardHeader>
          <OCardBody>
            <ul className="space-y-2">
              {data.unitStatus.map((u) => {
                const tone = u.state === "occupied" ? "success" : u.state === "arriving" ? "gold" : "neutral";
                const label = u.state === "occupied" ? "תפוס" : u.state === "arriving" ? "מגיע היום" : "פנוי";
                return (
                  <li key={u.id} className="flex items-center justify-between gap-2 rounded-md border p-2" style={{ borderColor: "var(--border)" }}>
                    <div className="min-w-0">
                      <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{u.label}</div>
                      {u.guest && <div className="text-[11px]" style={{ color: "var(--text-secondary)" }}>{u.guest}</div>}
                    </div>
                    <TonePill label={label} tone={tone} />
                  </li>
                );
              })}
            </ul>
          </OCardBody>
        </OCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ArrivalsList title="הגעות היום" rows={data.arrivalsToday} onOpen={(id) => nav({ to: "/reservations/$id", params: { id } })} />
        <ArrivalsList title="עזיבות היום" rows={data.departuresToday} onOpen={(id) => nav({ to: "/reservations/$id", params: { id } })} />
      </div>

      <OCard>
        <OCardHeader><OCardTitle>הגעות בשבוע הקרוב</OCardTitle></OCardHeader>
        <OCardBody className="p-0">
          {data.upcoming.length === 0 ? (
            <div className="p-8 text-center text-sm" style={{ color: "var(--text-secondary)" }}>אין הגעות מתוכננות.</div>
          ) : (
            <table className="w-full text-sm" dir="rtl">
              <thead>
                <tr className="text-right text-[11px] uppercase" style={{ color: "var(--text-secondary)" }}>
                  <th className="px-3 py-2">תאריך</th><th className="px-3 py-2">יחידה</th><th className="px-3 py-2">אורח</th>
                  <th className="px-3 py-2">ערוץ</th><th className="px-3 py-2">סטטוס</th>
                </tr>
              </thead>
              <tbody>
                {data.upcoming.map((r) => (
                  <tr key={r.id} onClick={() => nav({ to: "/reservations/$id", params: { id: r.id } })}
                    className="cursor-pointer border-t hover:bg-[var(--bg-subtle)]" style={{ borderColor: "var(--border)" }}>
                    <td className="ltr-num px-3 py-2">{r.check_in}</td>
                    <td className="px-3 py-2">{r.unit_label}</td>
                    <td className="px-3 py-2">{r.guest_name}</td>
                    <td className="px-3 py-2"><TonePill label={channelLabel[r.channel as Channel]} tone={channelTone[r.channel as Channel]} /></td>
                    <td className="px-3 py-2"><TonePill label={statusLabel[r.status as ReservationStatus]} tone={statusTone[r.status as ReservationStatus]} /></td>
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

function ArrivalsList({ title, rows, onOpen }: {
  title: string;
  rows: { id: string; guest_name: string; phone: string | null; channel: string; status: string; unit_label: string }[];
  onOpen: (id: string) => void;
}) {
  return (
    <OCard>
      <OCardHeader><OCardTitle>{title}</OCardTitle></OCardHeader>
      <OCardBody>
        {rows.length === 0 ? (
          <div className="py-6 text-center text-sm" style={{ color: "var(--text-secondary)" }}>אין רשומות היום.</div>
        ) : (
          <ul className="divide-y" style={{ borderColor: "var(--border)" }}>
            {rows.map((r) => (
              <li key={r.id} onClick={() => onOpen(r.id)}
                className="flex cursor-pointer items-center justify-between gap-3 py-2.5 hover:bg-[var(--bg-subtle)]">
                <div className="min-w-0">
                  <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{r.guest_name}</div>
                  <div className="text-[11px]" style={{ color: "var(--text-secondary)" }}>{r.unit_label}{r.phone ? ` · ${r.phone}` : ""}</div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <TonePill label={channelLabel[r.channel as Channel]} tone={channelTone[r.channel as Channel]} />
                  <TonePill label={statusLabel[r.status as ReservationStatus]} tone={statusTone[r.status as ReservationStatus]} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </OCardBody>
    </OCard>
  );
}