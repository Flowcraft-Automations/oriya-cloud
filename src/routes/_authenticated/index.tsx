import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { Suspense } from "react";
import { Plus, CalendarClock, Users, Wallet } from "lucide-react";
import { PageHeader, ActionButton } from "@/components/shell/PageHeader";
import { OperationsTab } from "@/components/dashboard/OperationsTab";
import { LeadsTab } from "@/components/dashboard/LeadsTab";
import { FinancialTab } from "@/components/dashboard/FinancialTab";

type Tab = "operations" | "leads" | "financial";
const tabSchema = z.object({ tab: z.enum(["operations", "leads", "financial"]).optional() });

export const Route = createFileRoute("/_authenticated/")({
  validateSearch: tabSchema,
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

const tabs: { key: Tab; label: string; icon: typeof Users }[] = [
  { key: "operations", label: "תפעול והזמנות", icon: CalendarClock },
  { key: "leads", label: "לידים ומכירות", icon: Users },
  { key: "financial", label: "פיננסי", icon: Wallet },
];

const subtitles: Record<Tab, string> = {
  operations: "מחזור צ׳ק-אין וצ׳ק-אאוט · תפוסה יומית",
  leads: "לידים, פניות ומשפך המרות",
  financial: "הכנסות, גבייה ורווחיות",
};

function Dashboard() {
  const { tab = "operations" } = Route.useSearch();
  const nav = Route.useNavigate();
  const dateStr = new Intl.DateTimeFormat("he-IL", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date());

  return (
    <>
      <PageHeader
        title="דשבורד"
        subtitle={`${dateStr} · ${subtitles[tab as Tab]}`}
        action={<ActionButton variant="gold"><Plus size={16} />הזמנה חדשה</ActionButton>}
      />

      <div className="mb-4 flex gap-1 border-b" dir="rtl" style={{ borderColor: "var(--border)" }}>
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => nav({ search: { tab: t.key === "operations" ? undefined : t.key } })}
              className="relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors"
              style={{ color: active ? "var(--text-primary)" : "var(--text-secondary)" }}
            >
              <Icon size={16} />
              {t.label}
              {active && (
                <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full" style={{ backgroundColor: "var(--gold-600)" }} />
              )}
            </button>
          );
        })}
      </div>

      <Suspense fallback={<div className="py-16 text-center text-sm" style={{ color: "var(--text-secondary)" }}>טוען…</div>}>
        {tab === "operations" && <OperationsTab />}
        {tab === "leads" && <LeadsTab />}
        {tab === "financial" && <FinancialTab />}
      </Suspense>
    </>
  );
}
