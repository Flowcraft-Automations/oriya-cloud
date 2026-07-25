import { createFileRoute } from "@tanstack/react-router";
import { MessageCircle, Users, PieChart, Wallet, Plus } from "lucide-react";
import { PageHeader, ActionButton } from "@/components/shell/PageHeader";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { OccupancyChart } from "@/components/dashboard/OccupancyChart";
import { ChannelMixChart } from "@/components/dashboard/ChannelMixChart";
import { ActivityListCard } from "@/components/dashboard/ActivityListCard";
import { kpis, arrivalsToday, departuresToday, newLeads } from "@/lib/mock/dashboard";

const iconMap = { conversations: MessageCircle, staying: Users, occupancy: PieChart, revenue: Wallet } as const;

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "דשבורד · Oriya OS" },
      { name: "description", content: "תמונת מצב יומית של הפורטפוליו — תפוסה, הכנסות, שיחות ולידים" },
      { property: "og:title", content: "דשבורד · Oriya OS" },
      { property: "og:description", content: "תמונת מצב יומית של הפורטפוליו" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const dateStr = new Intl.DateTimeFormat("he-IL", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date());

  return (
    <>
      <PageHeader
        title="בוקר טוב, דוד"
        subtitle={`${dateStr} · תמונת מצב של הפורטפוליו`}
        action={
          <ActionButton variant="gold">
            <Plus size={16} />
            הזמנה חדשה
          </ActionButton>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <KpiCard
            key={k.key}
            label={k.label}
            value={k.value}
            sub={k.sub}
            icon={iconMap[k.key as keyof typeof iconMap]}
            tone={k.tone}
          />
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RevenueChart />
        </div>
        <OccupancyChart />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <ChannelMixChart />
        <ActivityListCard
          title="הגעות היום"
          rows={arrivalsToday.map((a) => ({ primary: a.name, secondary: a.unit, meta: a.time, metaTone: "navy" }))}
        />
        <ActivityListCard
          title="עזיבות היום"
          rows={departuresToday.map((a) => ({ primary: a.name, secondary: a.unit, meta: a.time, metaTone: "muted" }))}
        />
      </div>

      <div className="mt-4">
        <ActivityListCard
          title="לידים חדשים"
          rows={newLeads.map((l) => ({ primary: l.name, secondary: `${l.source} · ${l.interest}`, meta: "חדש", metaTone: "gold" }))}
        />
      </div>
    </>
  );
}
