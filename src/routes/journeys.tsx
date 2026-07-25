import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/shell/PageHeader";
import { ComingSoon } from "@/components/shell/ComingSoon";

export const Route = createFileRoute("/journeys")({
  head: () => ({ meta: [
    { title: "מסעות לקוח · Oriya OS" },
    { name: "description", content: "מסעות לקוח אוטומטיים" },
    { property: "og:title", content: "מסעות לקוח · Oriya OS" },
    { property: "og:description", content: "מסעות לקוח" },
  ]}),
  component: () => (<><PageHeader title="מסעות לקוח" subtitle="אוטומציות שיווק" /><ComingSoon /></>),
});