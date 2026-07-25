import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { PageHeader, ActionButton } from "@/components/shell/PageHeader";
import { CalendarToolbar } from "@/components/calendar/CalendarToolbar";
import { CalendarGrid } from "@/components/calendar/CalendarGrid";

export const Route = createFileRoute("/calendar")({
  head: () => ({
    meta: [
      { title: "יומן · Oriya OS" },
      { name: "description", content: "יומן רב-יחידתי עם הזמנות, חסימות והגעות" },
      { property: "og:title", content: "יומן · Oriya OS" },
      { property: "og:description", content: "יומן רב-יחידתי" },
    ],
  }),
  component: CalendarPage,
});

function CalendarPage() {
  const [view, setView] = useState<"day" | "week" | "twoweek" | "month">("twoweek");
  return (
    <>
      <PageHeader
        title="יומן"
        subtitle="תצוגה רב-יחידתית · לחץ על הזמנה לפרטים"
        action={
          <ActionButton variant="gold">
            <Plus size={16} />
            הזמנה חדשה
          </ActionButton>
        }
      />
      <CalendarToolbar view={view} onView={setView} />
      <CalendarGrid />
    </>
  );
}