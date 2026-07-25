import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Tone = "success" | "warning" | "danger" | "info" | "neutral" | "gold";

const toneStyles: Record<Tone, React.CSSProperties> = {
  success: { backgroundColor: "var(--success-bg)", color: "var(--success)" },
  warning: { backgroundColor: "var(--warning-bg)", color: "var(--warning)" },
  danger: { backgroundColor: "var(--danger-bg)", color: "var(--danger)" },
  info: { backgroundColor: "var(--info-bg)", color: "var(--info)" },
  neutral: { backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)" },
  gold: { backgroundColor: "var(--gold-100)", color: "var(--gold-600)" },
};

export function OBadge({
  tone = "neutral",
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      {...props}
      className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium", className)}
      style={{ ...toneStyles[tone], ...(props.style ?? {}) }}
    />
  );
}