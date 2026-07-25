import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/shell/PageHeader";
import { ComingSoon } from "@/components/shell/ComingSoon";

export const Route = createFileRoute("/expenses")({
  head: () => ({ meta: [
    { title: "הוצאות · Oriya OS" },
    { name: "description", content: "הוצאות תפעוליות" },
    { property: "og:title", content: "הוצאות · Oriya OS" },
    { property: "og:description", content: "הוצאות תפעוליות" },
  ]}),
  component: () => (<><PageHeader title="הוצאות" subtitle="מעקב הוצאות תפעוליות" /><ComingSoon /></>),
});