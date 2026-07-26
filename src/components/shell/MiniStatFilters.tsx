import { cn } from "@/lib/utils";
import type { Tone } from "@/lib/types";

export type MiniStat = {
  key: string;
  label: string;
  count: number;
  tone?: Tone;
  hint?: string;
};

const toneAccent: Record<Tone, string> = {
  success: "var(--success)",
  info: "var(--info)",
  gold: "var(--gold-600)",
  neutral: "var(--navy-700)",
  danger: "var(--danger)",
  purple: "#7C3AED",
  warning: "#B45309",
};

type Props = {
  stats: MiniStat[];
  value: string;
  onChange: (key: string) => void;
  className?: string;
};

export function MiniStatFilters({ stats, value, onChange, className }: Props) {
  return (
    <div
      className={cn(
        "mb-5 grid gap-2",
        "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6",
        className,
      )}
    >
      {stats.map((s) => {
        const active = s.key === value;
        const accent = toneAccent[s.tone ?? "neutral"];
        return (
          <button
            key={s.key}
            onClick={() => onChange(s.key)}
            aria-pressed={active}
            className={cn(
              "group relative overflow-hidden rounded-lg border px-3 py-2 text-right transition-all",
              "hover:-translate-y-[1px] hover:shadow-sm",
            )}
            style={{
              borderColor: active ? accent : "var(--border)",
              backgroundColor: active ? "#fff" : "var(--bg-subtle)",
              boxShadow: active ? `inset 0 -2px 0 ${accent}` : undefined,
            }}
          >
            <span
              className="absolute inset-y-0 right-0 w-[3px]"
              style={{ backgroundColor: accent, opacity: active ? 1 : 0.35 }}
            />
            <div
              className="text-[10.5px] font-medium uppercase tracking-wide"
              style={{ color: "var(--text-secondary)" }}
            >
              {s.label}
            </div>
            <div
              className="ltr-num mt-0.5 text-lg font-semibold leading-tight"
              style={{ color: active ? accent : "var(--text-primary)" }}
            >
              {s.count}
            </div>
            {s.hint && (
              <div
                className="mt-0.5 text-[10px]"
                style={{ color: "var(--text-secondary)" }}
              >
                {s.hint}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}