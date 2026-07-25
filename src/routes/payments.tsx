import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/shell/PageHeader";
import { ComingSoon } from "@/components/shell/ComingSoon";

export const Route = createFileRoute("/payments")({
  head: () => ({ meta: [
    { title: "תשלומים · Oriya OS" },
    { name: "description", content: "תשלומים ומקדמות" },
    { property: "og:title", content: "תשלומים · Oriya OS" },
    { property: "og:description", content: "תשלומים ומקדמות" },
  ]}),
  component: () => (<><PageHeader title="תשלומים" subtitle="תשלומים, מקדמות והחזרים" /><ComingSoon /></>),
});