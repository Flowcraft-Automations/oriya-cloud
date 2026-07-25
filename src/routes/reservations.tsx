import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { PageHeader, ActionButton } from "@/components/shell/PageHeader";
import { ComingSoon } from "@/components/shell/ComingSoon";

export const Route = createFileRoute("/reservations")({
  head: () => ({
    meta: [
      { title: "הזמנות · Oriya OS" },
      { name: "description", content: "ניהול הזמנות, מקדמות וטפסי הורים" },
      { property: "og:title", content: "הזמנות · Oriya OS" },
      { property: "og:description", content: "ניהול הזמנות" },
    ],
  }),
  component: () => (
    <>
      <PageHeader
        title="הזמנות"
        subtitle="כל ההזמנות · פילטרים לפי סטטוס וערוץ"
        action={<ActionButton variant="gold"><Plus size={16} />הזמנה חדשה</ActionButton>}
      />
      <ComingSoon />
    </>
  ),
});