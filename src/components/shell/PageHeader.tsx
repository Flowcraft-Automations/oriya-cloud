import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
};

export function PageHeader({ title, subtitle, action }: Props) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold leading-tight" style={{ color: "var(--text-primary)" }}>
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "navy" | "gold" | "outline";
};

export function ActionButton({ variant = "navy", className, ...props }: BtnProps) {
  const base =
    "inline-flex items-center gap-1.5 rounded-[10px] px-4 py-2.5 text-sm font-medium transition-colors";
  const styles: Record<string, React.CSSProperties> = {
    navy: { backgroundColor: "var(--navy-700)", color: "#fff" },
    gold: { backgroundColor: "var(--gold-600)", color: "#fff" },
    outline: {
      backgroundColor: "transparent",
      color: "var(--navy-700)",
      border: "1px solid var(--navy-700)",
    },
  };
  return (
    <button
      {...props}
      className={cn(base, "hover:opacity-90", className)}
      style={{ ...styles[variant], ...(props.style ?? {}) }}
    />
  );
}