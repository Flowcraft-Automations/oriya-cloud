import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/shell/PageHeader";
import { ComingSoon } from "@/components/shell/ComingSoon";

export const Route = createFileRoute("/campaigns")({
  head: () => ({ meta: [
    { title: "קמפיינים · Oriya OS" },
    { name: "description", content: "קמפיינים שיווקיים" },
    { property: "og:title", content: "קמפיינים · Oriya OS" },
    { property: "og:description", content: "קמפיינים שיווקיים" },
  ]}),
  component: () => (<><PageHeader title="קמפיינים" subtitle="ניהול קמפיינים שיווקיים" /><ComingSoon /></>),
});