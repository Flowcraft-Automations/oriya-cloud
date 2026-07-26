type Funnel = { sent?: number; delivered?: number; read?: number; replied?: number; failed?: number; queued?: number };

export function FunnelBar({ f }: { f: Funnel }) {
  const stages: Array<[string, number, string]> = [
    ["נשלח", (f.sent ?? 0) + (f.delivered ?? 0) + (f.read ?? 0) + (f.replied ?? 0), "var(--navy-700)"],
    ["נמסר", (f.delivered ?? 0) + (f.read ?? 0) + (f.replied ?? 0), "var(--info)"],
    ["נקרא", (f.read ?? 0) + (f.replied ?? 0), "var(--gold-600)"],
    ["השיב", f.replied ?? 0, "var(--success)"],
  ];
  const max = Math.max(1, ...stages.map((s) => s[1]));
  return (
    <div className="flex items-end gap-2 ltr-num" dir="ltr">
      {stages.map(([label, n, color]) => (
        <div key={label} className="flex flex-col items-center gap-1" style={{ minWidth: 44 }}>
          <div className="text-[10px] font-semibold" style={{ color }}>{n}</div>
          <div className="w-full rounded-sm" style={{ height: 6 + (n / max) * 34, backgroundColor: color, opacity: 0.85 }} />
          <div className="text-[9px] uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>{label}</div>
        </div>
      ))}
      {(f.failed ?? 0) > 0 && (
        <div className="flex flex-col items-center gap-1" style={{ minWidth: 44 }}>
          <div className="text-[10px] font-semibold" style={{ color: "var(--danger)" }}>{f.failed}</div>
          <div className="w-full rounded-sm" style={{ height: 6, backgroundColor: "var(--danger)", opacity: 0.85 }} />
          <div className="text-[9px] uppercase tracking-wider" style={{ color: "var(--danger)" }}>נכשל</div>
        </div>
      )}
    </div>
  );
}
