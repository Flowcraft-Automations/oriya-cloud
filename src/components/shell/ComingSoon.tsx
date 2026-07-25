import { OCard } from "@/components/ui-oriya/Card";

export function ComingSoon({ note }: { note?: string }) {
  return (
    <OCard className="p-10 text-center">
      <div
        className="mx-auto flex h-12 w-12 items-center justify-center rounded-full"
        style={{ backgroundColor: "var(--gold-100)", color: "var(--gold-600)" }}
      >
        <span className="text-sm font-bold">בקרוב</span>
      </div>
      <p className="mt-4 text-sm" style={{ color: "var(--text-secondary)" }}>
        {note ?? "המודול בפיתוח — יתווסף בשלב הבא."}
      </p>
    </OCard>
  );
}