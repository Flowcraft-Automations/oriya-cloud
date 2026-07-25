import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/shell/PageHeader";
import { ComingSoon } from "@/components/shell/ComingSoon";

export const Route = createFileRoute("/leads")({
  head: () => ({
    meta: [
      { title: "לידים · Oriya OS" },
      { name: "description", content: "צינור לידים — קנבן ומעקב המרות" },
      { property: "og:title", content: "לידים · Oriya OS" },
      { property: "og:description", content: "צינור לידים" },
    ],
  }),
  component: () => (<><PageHeader title="לידים ושיווק" subtitle="צינור לידים, קמפיינים ומסעות לקוח" /><ComingSoon /></>),
});