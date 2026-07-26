import { Suspense, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/shell/PageHeader";
import { StatsTab } from "@/components/marketing/StatsTab";
import { JourneysTab } from "@/components/marketing/JourneysTab";
import { TemplatesTab } from "@/components/marketing/TemplatesTab";
import { CampaignsTab } from "@/components/marketing/CampaignsTab";

export const Route = createFileRoute("/_authenticated/marketing")({
  head: () => ({ meta: [
    { title: "שיווק · Oriya OS" },
    { name: "description", content: "ניהול תבניות WhatsApp, מסעות, קמפיינים וסטטיסטיקות שליחה." },
  ]}),
  component: MarketingPage,
});

type Tab = "stats" | "journeys" | "templates" | "campaigns";
const TABS: { key: Tab; label: string }[] = [
  { key: "stats", label: "סקירה" },
  { key: "journeys", label: "מסעות" },
  { key: "templates", label: "תבניות" },
  { key: "campaigns", label: "קמפיינים" },
];

function MarketingPage() {
  const [tab, setTab] = useState<Tab>("stats");
  return (
    <div dir="rtl">
      <PageHeader title="שיווק ותקשורת" subtitle="WhatsApp · ManyChat · מסעות אוטומטיים" />
      <div className="mb-6 flex gap-1 border-b" style={{ borderColor: "var(--border)" }}>
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="relative px-4 py-2.5 text-sm"
            style={{
              color: tab === t.key ? "var(--navy-700)" : "var(--text-secondary)",
              fontWeight: tab === t.key ? 600 : 400,
            }}>
            {t.label}
            {tab === t.key && (
              <span className="absolute inset-x-2 -bottom-px h-0.5" style={{ backgroundColor: "var(--gold-600)" }} />
            )}
          </button>
        ))}
      </div>
      <Suspense fallback={<div className="p-8 text-center text-sm" style={{ color: "var(--text-secondary)" }}>טוען…</div>}>
        {tab === "stats" && <StatsTab />}
        {tab === "journeys" && <JourneysTab />}
        {tab === "templates" && <TemplatesTab />}
        {tab === "campaigns" && <CampaignsTab />}
      </Suspense>
    </div>
  );
}
