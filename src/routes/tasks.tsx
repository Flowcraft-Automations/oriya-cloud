import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/shell/PageHeader";
import { ComingSoon } from "@/components/shell/ComingSoon";

export const Route = createFileRoute("/tasks")({
  head: () => ({
    meta: [
      { title: "משימות וניקיון · Oriya OS" },
      { name: "description", content: "משימות ניקיון וטרנאובר" },
      { property: "og:title", content: "משימות וניקיון · Oriya OS" },
      { property: "og:description", content: "משימות ניקיון" },
    ],
  }),
  component: () => (<><PageHeader title="משימות וניקיון" subtitle="לוח משימות יומי" /><ComingSoon /></>),
});