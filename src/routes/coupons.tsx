import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/shell/PageHeader";
import { ComingSoon } from "@/components/shell/ComingSoon";

export const Route = createFileRoute("/coupons")({
  head: () => ({ meta: [
    { title: "קודי קופון · Oriya OS" },
    { name: "description", content: "קודי הנחה וקופונים" },
    { property: "og:title", content: "קודי קופון · Oriya OS" },
    { property: "og:description", content: "קודי הנחה" },
  ]}),
  component: () => (<><PageHeader title="קודי קופון" subtitle="ניהול קודי הנחה" /><ComingSoon /></>),
});