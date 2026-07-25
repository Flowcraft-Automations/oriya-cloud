import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/shell/PageHeader";
import { ComingSoon } from "@/components/shell/ComingSoon";

export const Route = createFileRoute("/marketing-stats")({
  head: () => ({ meta: [
    { title: "סטטיסטיקות שיווק · Oriya OS" },
    { name: "description", content: "ביצועי שיווק והמרות" },
    { property: "og:title", content: "סטטיסטיקות שיווק · Oriya OS" },
    { property: "og:description", content: "ביצועי שיווק" },
  ]}),
  component: () => (<><PageHeader title="סטטיסטיקות שיווק" subtitle="ביצועי ערוצים והמרות" /><ComingSoon /></>),
});