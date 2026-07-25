import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/shell/PageHeader";
import { ComingSoon } from "@/components/shell/ComingSoon";

export const Route = createFileRoute("/cancellation-policy")({
  head: () => ({ meta: [
    { title: "מדיניות ביטול · Oriya OS" },
    { name: "description", content: "מדיניות ביטולים" },
    { property: "og:title", content: "מדיניות ביטול · Oriya OS" },
    { property: "og:description", content: "מדיניות ביטולים" },
  ]}),
  component: () => (<><PageHeader title="מדיניות ביטול" subtitle="הגדרת מדיניות ביטולים" /><ComingSoon /></>),
});