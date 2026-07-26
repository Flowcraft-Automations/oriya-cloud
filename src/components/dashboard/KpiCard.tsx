import type { LucideIcon } from "lucide-react";
import { ArrowUpLeft } from "lucide-react";
import { OCard } from "@/components/ui-oriya/Card";

type Props = {
  label: string;
  value: string | number;
  sub: string;
  icon: LucideIcon;
  tone?: "navy" | "gold";
  onClick?: () => void;
};

export function KpiCard({ label, value, sub, icon: Icon, tone = "navy", onClick }: Props) {
  const iconBg = tone === "gold" ? "var(--gold-100)" : "var(--navy-100)";
  const iconColor = tone === "gold" ? "var(--gold-600)" : "var(--navy-700)";
  const clickable = !!onClick;
  return (
    <OCard
      onClick={onClick}
      className={`group relative p-5 ${clickable ? "cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md" : ""}`}
    >
      {clickable && (
        <span
          className="absolute end-3 top-3 flex h-6 w-6 items-center justify-center rounded-full opacity-0 transition-opacity group-hover:opacity-100"
          style={{ backgroundColor: "var(--gold-100)", color: "var(--gold-600)" }}
          aria-hidden
        >
          <ArrowUpLeft size={13} />
        </span>
      )}
      <div className="flex items-start gap-4">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: iconBg }}
        >
          <Icon size={20} style={{ color: iconColor }} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
            {label}
          </div>
          <div
            className="ltr-num mt-1 text-[28px] font-bold leading-none"
            style={{ color: "var(--text-primary)" }}
          >
            {value}
          </div>
          <div className="mt-2 text-[12px]" style={{ color: "var(--text-secondary)" }}>
            {sub}
          </div>
        </div>
      </div>
    </OCard>
  );
}