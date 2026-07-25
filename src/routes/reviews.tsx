import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/shell/PageHeader";
import { ComingSoon } from "@/components/shell/ComingSoon";

export const Route = createFileRoute("/reviews")({
  head: () => ({
    meta: [
      { title: "ביקורות · Oriya OS" },
      { name: "description", content: "ביקורות מיובאות מ-OTAs" },
      { property: "og:title", content: "ביקורות · Oriya OS" },
      { property: "og:description", content: "ביקורות אורחים" },
    ],
  }),
  component: () => (<><PageHeader title="ביקורות" subtitle="ביקורות אורחים מכל הערוצים" /><ComingSoon /></>),
});