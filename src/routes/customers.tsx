import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/shell/PageHeader";
import { ComingSoon } from "@/components/shell/ComingSoon";

export const Route = createFileRoute("/customers")({
  head: () => ({
    meta: [
      { title: "לקוחות · Oriya OS" },
      { name: "description", content: "כרטיסי לקוח, תגיות והיסטוריית שהיות" },
      { property: "og:title", content: "לקוחות · Oriya OS" },
      { property: "og:description", content: "כרטיסי לקוח" },
    ],
  }),
  component: () => (<><PageHeader title="לקוחות" subtitle="כרטיסי לקוח והיסטוריה" /><ComingSoon /></>),
});