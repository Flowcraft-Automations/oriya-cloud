import { useEffect, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Trash2, CheckCircle2 } from "lucide-react";

export type DetailTab = { key: string; label: string; count?: number };

export type Tone = "success" | "info" | "gold" | "neutral" | "danger" | "purple" | "warning";
const toneStyles: Record<Tone, { fg: string; bg: string; bd: string }> = {
  success: { fg: "var(--success)", bg: "var(--success-bg)", bd: "var(--success)" },
  info: { fg: "var(--info)", bg: "var(--info-bg)", bd: "var(--info)" },
  gold: { fg: "var(--gold-600)", bg: "var(--gold-100)", bd: "var(--gold-600)" },
  neutral: { fg: "var(--text-secondary)", bg: "var(--bg-subtle)", bd: "var(--border)" },
  danger: { fg: "var(--danger)", bg: "var(--danger-bg)", bd: "var(--danger)" },
  purple: { fg: "var(--ch-tzimmerer)", bg: "#F2ECFB", bd: "var(--ch-tzimmerer)" },
  warning: { fg: "var(--warning)", bg: "var(--warning-bg)", bd: "var(--warning)" },
};

export function TonePill({ label, tone }: { label: string; tone: Tone }) {
  const s = toneStyles[tone];
  return (
    <span
      className="inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium"
      style={{ borderColor: s.bd, color: s.fg, backgroundColor: s.bg }}
    >
      {label}
    </span>
  );
}

export function DetailLayout({
  kicker,
  title,
  statusPill,
  flag,
  toolbar,
  tags,
  tabs,
  activeTab,
  onTabChange,
  onDelete,
  verifiedLabel = "מאומת",
  footer,
  children,
}: {
  kicker?: string;
  title: string;
  statusPill?: { label: string; tone: Tone };
  flag?: ReactNode;
  toolbar?: ReactNode;
  tags?: ReactNode;
  tabs: DetailTab[];
  activeTab: string;
  onTabChange: (k: string) => void;
  onDelete?: () => void;
  verifiedLabel?: string;
  footer?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-[1200px]" dir="rtl">
      {/* Top strip — kicker on right (start), actions on left (end) */}
      <div className="mb-2 flex items-center justify-between text-sm" style={{ color: "var(--text-secondary)" }}>
        {kicker ? <div className="text-[11px] tracking-widest">{kicker}</div> : <div />}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-xs font-medium" style={{ color: "var(--success)" }}>
            <CheckCircle2 size={14} /> {verifiedLabel}
          </span>
          <button className="rounded p-1 hover:bg-[var(--bg-subtle)]" aria-label="הקודם"><ChevronRight size={16} /></button>
          <button className="rounded p-1 hover:bg-[var(--bg-subtle)]" aria-label="הבא"><ChevronLeft size={16} /></button>
          {onDelete && (
            <button onClick={onDelete}
              className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs"
              style={{ borderColor: "var(--danger)", color: "var(--danger)" }}>
              <Trash2 size={12} /> מחק
            </button>
          )}
        </div>
      </div>

      {/* Title row — title + pill + flag together on right (start) */}
      <div className="flex items-center gap-3 border-b pb-4" style={{ borderColor: "var(--border)" }}>
        <h1 className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>{title}</h1>
        {statusPill && (
          <span className="rounded-full border px-3 py-1 text-xs font-medium"
            style={{
              borderColor: toneStyles[statusPill.tone].bd,
              color: toneStyles[statusPill.tone].fg,
              backgroundColor: toneStyles[statusPill.tone].bg,
            }}>
            {statusPill.label}
          </span>
        )}
        {flag && <span className="text-lg">{flag}</span>}
      </div>

      {toolbar && <div className="mt-4 flex flex-wrap items-center gap-2">{toolbar}</div>}
      {tags && <div className="mt-3 flex flex-wrap items-center gap-2">{tags}</div>}

      {/* Tabs bar — first tab on right in RTL */}
      <div className="mt-5 rounded-t-lg border border-b-0 bg-[var(--bg-subtle)] px-1 pt-1"
        style={{ borderColor: "var(--border)" }}>
        <div className="flex flex-wrap items-end gap-1">
          {tabs.map((t) => {
            const active = activeTab === t.key;
            return (
              <button key={t.key} onClick={() => onTabChange(t.key)}
                className="inline-flex items-center gap-1.5 rounded-t-md px-3 py-2 text-xs font-medium transition-colors"
                style={{
                  backgroundColor: active ? "#fff" : "transparent",
                  color: active ? "var(--text-primary)" : "var(--text-secondary)",
                  border: active ? "1px solid var(--border)" : "1px solid transparent",
                  borderBottom: active ? "1px solid #fff" : "1px solid transparent",
                  marginBottom: active ? "-1px" : 0,
                }}>
                {t.label}
                {typeof t.count === "number" && (
                  <span className="ltr-num rounded-full px-1.5 text-[10px]"
                    style={{
                      backgroundColor: active ? "var(--bg-subtle)" : "transparent",
                      color: "var(--text-secondary)",
                    }}>{t.count}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="rounded-b-lg border bg-white" style={{ borderColor: "var(--border)" }}>
        {children}
      </div>

      {footer && <div className="mt-3 text-xs" style={{ color: "var(--text-secondary)" }}>{footer}</div>}
    </div>
  );
}

export function SectionBar({
  title, accent, barColor, children,
}: { title: string; accent: string; barColor: string; children: ReactNode }) {
  return (
    <section className="grid grid-cols-[6px_1fr] items-stretch">
      <div style={{ backgroundColor: barColor }} />
      <div>
        <header className="px-5 py-2.5 text-right text-sm font-semibold"
          style={{ backgroundColor: accent, color: "var(--text-primary)" }}>
          {title}
        </header>
        <div className="divide-y" style={{ borderColor: "var(--border)" }}>
          {children}
        </div>
      </div>
    </section>
  );
}

export function FieldRow({ label, value, ltr }: { label: string; value: ReactNode | null | undefined; ltr?: boolean }) {
  const hasValue = value != null && value !== "";
  return (
    <div className="flex items-baseline justify-between gap-6 px-5 py-3">
      <div className={"text-sm " + (ltr ? "ltr-num" : "")}
        dir={ltr ? "ltr" : undefined}
        style={{ color: hasValue ? "var(--text-primary)" : "var(--text-secondary)" }}>
        {hasValue ? value : "—"}
      </div>
      <div className="text-[11px] uppercase tracking-wide" style={{ color: "var(--text-secondary)" }}>
        {label}
      </div>
    </div>
  );
}

type EditableType = "text" | "number" | "date" | "email" | "tel" | "textarea" | "select";
export function EditableRow({
  label, value, type = "text", ltr, options, placeholder, onSave, display,
}: {
  label: string;
  value: string | number | null | undefined;
  type?: EditableType;
  ltr?: boolean;
  options?: { value: string; label: string }[];
  placeholder?: string;
  onSave: (v: string | number | null) => void;
  display?: ReactNode; // optional custom read display (e.g. TonePill for select)
}) {
  const initial = value == null ? "" : String(value);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(initial);
  useEffect(() => { setDraft(initial); }, [initial]);

  const commit = () => {
    setEditing(false);
    if (draft === initial) return;
    if (type === "number") onSave(draft === "" ? null : Number(draft));
    else onSave(draft === "" ? null : draft);
  };

  const inputClass = "w-full rounded-md border bg-white px-2 py-1.5 text-sm outline-none focus:border-[var(--info)]";
  const inputStyle = { borderColor: "var(--border)" } as const;

  const editor =
    type === "textarea" ? (
      <textarea autoFocus rows={3} value={draft} onChange={(e) => setDraft(e.target.value)} onBlur={commit}
        placeholder={placeholder} className={inputClass} style={inputStyle} />
    ) : type === "select" ? (
      <select autoFocus value={draft} onChange={(e) => { setDraft(e.target.value); }}
        onBlur={commit} className={inputClass} style={inputStyle}>
        {options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    ) : (
      <input autoFocus type={type} value={draft} placeholder={placeholder}
        onChange={(e) => setDraft(e.target.value)} onBlur={commit}
        onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); if (e.key === "Escape") { setDraft(initial); setEditing(false); } }}
        dir={ltr ? "ltr" : undefined}
        className={inputClass + (ltr ? " ltr-num" : "")} style={inputStyle} />
    );

  const hasValue = value != null && value !== "";
  return (
    <div className="group flex items-center justify-between gap-6 px-5 py-3">
      <div className="min-w-0 flex-1">
        {editing ? (
          <div className="max-w-md">{editor}</div>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className={"w-full max-w-md rounded-md border border-transparent px-2 py-1 text-start text-sm transition-colors hover:border-[var(--border)] hover:bg-[var(--bg-subtle)] " + (ltr ? "ltr-num" : "")}
            dir={ltr ? "ltr" : undefined}
            style={{ color: hasValue ? "var(--text-primary)" : "var(--text-secondary)" }}
            title="לחץ לעריכה">
            {display ?? (hasValue ? String(value) : placeholder ?? "—")}
          </button>
        )}
      </div>
      <div className="text-[11px] uppercase tracking-wide" style={{ color: "var(--text-secondary)" }}>
        {label}
      </div>
    </div>
  );
}

export function EmptyState({ text }: { text: string }) {
  return <div className="p-10 text-center text-sm" style={{ color: "var(--text-secondary)" }}>{text}</div>;
}

export function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase" style={{ color: "var(--text-secondary)" }}>{label}</div>
      <div className="ltr-num mt-1 text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>{value}</div>
    </div>
  );
}