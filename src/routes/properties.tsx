import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/shell/PageHeader";
import { ComingSoon } from "@/components/shell/ComingSoon";

export const Route = createFileRoute("/properties")({
  head: () => ({
    meta: [
      { title: "נכסים · Oriya OS" },
      { name: "description", content: "ניהול נכסים ויחידות" },
      { property: "og:title", content: "נכסים · Oriya OS" },
      { property: "og:description", content: "ניהול נכסים" },
    ],
  }),
  component: () => (<><PageHeader title="נכסים ומחירונים" subtitle="פורטפוליו, יחידות, עונות ומחירונים" /><ComingSoon /></>),
});