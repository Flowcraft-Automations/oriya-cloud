import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { MessageCircle, Users, PieChart, Wallet, Plus } from "lucide-react";
import { PageHeader, ActionButton } from "@/components/shell/PageHeader";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { OccupancyChart } from "@/components/dashboard/OccupancyChart";
import { ChannelMixChart } from "@/components/dashboard/ChannelMixChart";
import { ActivityListCard } from "@/components/dashboard/ActivityListCard";
import { getDashboardData } from "@/lib/data.functions";
import { sourceLabel } from "@/lib/types";

const dashKey = ["dashboard"] as const;

function useDash() {
  const fn = useServerFn(getDashboardData);
  return useSuspenseQuery(queryOptions({ queryKey: dashKey, queryFn: () => fn() }));
}

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "דשבורד · Oriya OS" },
      { name: "description", content: "תמונת מצב יומית של הפורטפוליו" },
      { property: "og:title", content: "דשבורד · Oriya OS" },
      { property: "og:description", content: "תמונת מצב יומית של הפורטפוליו" },
    ],
  }),
  component: Dashboard,
  errorComponent: ({ error }) => <div className="p-6 text-sm text-red-700">{error.message}</div>,
});

function Dashboard() {
  const { data } = useDash();
  const dateStr = new Intl.DateTimeFormat("he-IL", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date());
  const { kpis } = data;

  return (
    <>
      <PageHeader
        title="שלום"
        subtitle={`${dateStr} · תמונת מצב של הפורטפוליו`}
        action={<ActionButton variant="gold"><Plus size={16} />הזמנה חדשה</ActionButton>}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="שיחות פתוחות" value={0} sub="בהמשך" icon={MessageCircle} tone="navy" />
        <KpiCard label="שוהים עכשיו" value={kpis.stayingNow} sub={`${kpis.arrivingCount} מגיעים · ${kpis.departingCount} עוזבים`} icon={Users} tone="navy" />
        <KpiCard label="תפוסה החודש" value={`${kpis.occupancyPct}%`} sub={`${kpis.unitCount} יחידות`} icon={PieChart} tone="navy" />
        <KpiCard label="הכנסות החודש" value={`₪${kpis.monthRevenue.toLocaleString()}`} sub={`ADR ₪${kpis.adr} · RevPAR ₪${kpis.revpar}`} icon={Wallet} tone="gold" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2"><RevenueChart data={data.revenueByMonth} /></div>
        <OccupancyChart data={data.occupancyTrend} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <ChannelMixChart data={data.channelMix} />
        <ActivityListCard title="הגעות היום" rows={data.arrivalsToday.map((a) => ({ primary: a.name, secondary: "", meta: a.time, metaTone: "navy" }))} />
        <ActivityListCard title="עזיבות היום" rows={data.departuresToday.map((a) => ({ primary: a.name, secondary: "", meta: a.time, metaTone: "muted" }))} />
      </div>

      <div className="mt-4">
        <ActivityListCard
          title="לידים חדשים"
          rows={data.newLeads.map((l) => ({ primary: l.name, secondary: `${sourceLabel[l.source as keyof typeof sourceLabel] ?? l.source} · ${l.interest}`, meta: "חדש", metaTone: "gold" }))}
        />
      </div>
    </>
  );
}
