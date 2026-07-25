import { ArrowLeft } from "lucide-react";
import { OCard, OCardBody, OCardHeader, OCardTitle } from "@/components/ui-oriya/Card";

type Row = {
  primary: string;
  secondary: string;
  meta?: string;
  metaTone?: "navy" | "gold" | "muted";
};

type Props = {
  title: string;
  rows: Row[];
  linkLabel?: string;
  emptyLabel?: string;
};

export function ActivityListCard({ title, rows, linkLabel = "הכל", emptyLabel = "אין נתונים" }: Props) {
  return (
    <OCard>
      <OCardHeader>
        <OCardTitle>{title}</OCardTitle>
        <button className="flex items-center gap-1 text-xs font-medium hover:underline" style={{ color: "var(--navy-500)" }}>
          {linkLabel}
          <ArrowLeft size={14} />
        </button>
      </OCardHeader>
      <OCardBody>
        {rows.length === 0 ? (
          <div className="py-6 text-center text-sm" style={{ color: "var(--text-secondary)" }}>{emptyLabel}</div>
        ) : (
          <ul className="divide-y" style={{ borderColor: "var(--border)" }}>
            {rows.map((r, i) => (
              <li key={i} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{r.primary}</div>
                  <div className="text-xs" style={{ color: "var(--text-secondary)" }}>{r.secondary}</div>
                </div>
                {r.meta && (
                  <span
                    className="ltr-num shrink-0 text-xs font-medium"
                    style={{
                      color:
                        r.metaTone === "gold"
                          ? "var(--gold-600)"
                          : r.metaTone === "muted"
                            ? "var(--text-secondary)"
                            : "var(--navy-700)",
                    }}
                  >
                    {r.meta}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </OCardBody>
    </OCard>
  );
}