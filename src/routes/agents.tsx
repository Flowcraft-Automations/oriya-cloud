import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/shell/PageHeader";
import { ComingSoon } from "@/components/shell/ComingSoon";

export const Route = createFileRoute("/agents")({
  head: () => ({
    meta: [
      { title: "סוכנים · Oriya OS" },
      { name: "description", content: "סוכני הפצה ועמלות" },
      { property: "og:title", content: "סוכנים · Oriya OS" },
      { property: "og:description", content: "סוכני הפצה" },
    ],
  }),
  component: () => (<><PageHeader title="סוכנים" subtitle="ניהול סוכנים ועמלות" /><ComingSoon /></>),
});