import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/shell/PageHeader";
import { ComingSoon } from "@/components/shell/ComingSoon";

export const Route = createFileRoute("/pricing")({
  head: () => ({ meta: [
    { title: "מחירונים · Oriya OS" },
    { name: "description", content: "מחירונים ועונות" },
    { property: "og:title", content: "מחירונים · Oriya OS" },
    { property: "og:description", content: "מחירונים ועונות" },
  ]}),
  component: () => (<><PageHeader title="מחירונים" subtitle="ניהול מחירונים לפי עונה" /><ComingSoon /></>),
});