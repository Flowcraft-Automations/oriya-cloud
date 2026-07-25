import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { ChannelLegend } from "./ChannelLegend";

type View = "day" | "week" | "twoweek" | "month";

type Props = {
  view: View;
  onView: (v: View) => void;
};

const views: { key: View; label: string }[] = [
  { key: "day", label: "היום" },
  { key: "week", label: "שבוע" },
  { key: "twoweek", label: "שבועיים" },
  { key: "month", label: "חודש" },
];

export function CalendarToolbar({ view, onView }: Props) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-[10px] p-0.5" style={{ backgroundColor: "var(--bg-subtle)" }}>
          {views.map((v) => {
            const active = v.key === view;
            return (
              <button
                key={v.key}
                onClick={() => onView(v.key)}
                className="rounded-[8px] px-3 py-1.5 text-xs font-medium transition-colors"
                style={
                  active
                    ? { backgroundColor: "#fff", color: "var(--navy-700)", boxShadow: "0 1px 2px rgba(16,24,40,.06)" }
                    : { color: "var(--text-secondary)" }
                }
              >
                {v.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-1">
          <button className="rounded-lg border p-1.5 hover:bg-[var(--bg-subtle)]" style={{ borderColor: "var(--border)" }}>
            <ChevronRight size={16} style={{ color: "var(--text-secondary)" }} />
          </button>
          <span className="min-w-[110px] px-1 text-center text-sm font-medium" style={{ color: "var(--text-primary)" }}>
            יולי 2026
          </span>
          <button className="rounded-lg border p-1.5 hover:bg-[var(--bg-subtle)]" style={{ borderColor: "var(--border)" }}>
            <ChevronLeft size={16} style={{ color: "var(--text-secondary)" }} />
          </button>
        </div>

        <select
          className="rounded-lg border px-3 py-1.5 text-xs"
          style={{ borderColor: "var(--border)", backgroundColor: "#fff", color: "var(--text-primary)" }}
          defaultValue="all"
        >
          <option value="all">נכסים — הכל</option>
          <option value="u360">U360</option>
          <option value="seaside">Seaside</option>
          <option value="royal">Royal Park</option>
          <option value="barlavi">Bar Lavi</option>
        </select>

        <div className="relative">
          <Search size={14} className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2" style={{ color: "var(--text-secondary)" }} />
          <input
            placeholder="חיפוש יחידה"
            className="w-40 rounded-lg border py-1.5 pr-8 pl-3 text-xs outline-none focus:ring-2"
            style={{ borderColor: "var(--border)", backgroundColor: "#fff", color: "var(--text-primary)" }}
          />
        </div>
      </div>

      <ChannelLegend />
    </div>
  );
}