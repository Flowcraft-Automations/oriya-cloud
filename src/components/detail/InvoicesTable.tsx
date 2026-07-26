type Row = {
  id: string;
  invoice_number: string;
  issue_date: string;
  due_date: string | null;
  total: number | string;
  status: string;
};

const invoiceStatusLabel: Record<string, string> = {
  draft: "טיוטה",
  sent: "נשלח",
  paid: "שולם",
  overdue: "בפיגור",
  cancelled: "בוטל",
};

export function invoiceStatusPill(status: string) {
  const map: Record<string, { bg: string; fg: string }> = {
    paid: { bg: "var(--success-bg)", fg: "var(--success)" },
    sent: { bg: "var(--info-bg)", fg: "var(--info)" },
    draft: { bg: "var(--bg-subtle)", fg: "var(--text-secondary)" },
    overdue: { bg: "var(--danger-bg)", fg: "var(--danger)" },
    cancelled: { bg: "var(--bg-subtle)", fg: "var(--text-secondary)" },
  };
  const s = map[status] ?? map.draft;
  return { backgroundColor: s.bg, color: s.fg };
}

export function statusPillFor(status: string) {
  return {
    backgroundColor: status === "cancelled" ? "var(--danger-bg)" : status === "confirmed" ? "var(--success-bg)" : "var(--info-bg)",
    color: status === "cancelled" ? "var(--danger)" : status === "confirmed" ? "var(--success)" : "var(--info)",
  };
}

export function InvoicesTable({ invoices, onOpen, emptyText = "אין חשבוניות." }: {
  invoices: Row[];
  onOpen: (id: string) => void;
  emptyText?: string;
}) {
  if (invoices.length === 0) {
    return <div className="p-10 text-center text-sm" style={{ color: "var(--text-secondary)" }}>{emptyText}</div>;
  }
  return (
    <table className="w-full text-sm" dir="rtl">
      <thead>
        <tr className="text-right text-[11px] uppercase" style={{ color: "var(--text-secondary)" }}>
          <th className="px-4 py-2.5">חשבונית</th>
          <th className="px-4 py-2.5">תאריך</th>
          <th className="px-4 py-2.5">לתשלום עד</th>
          <th className="px-4 py-2.5">סכום</th>
          <th className="px-4 py-2.5">סטטוס</th>
        </tr>
      </thead>
      <tbody>
        {invoices.map((i) => (
          <tr key={i.id} className="cursor-pointer border-t hover:bg-[var(--bg-subtle)]"
            style={{ borderColor: "var(--border)" }} onClick={() => onOpen(i.id)}>
            <td className="ltr-num px-4 py-2.5 font-medium">{i.invoice_number}</td>
            <td className="ltr-num px-4 py-2.5">{i.issue_date}</td>
            <td className="ltr-num px-4 py-2.5">{i.due_date ?? "—"}</td>
            <td className="ltr-num px-4 py-2.5">₪{Number(i.total).toLocaleString()}</td>
            <td className="px-4 py-2.5">
              <span className="rounded-full px-2 py-0.5 text-[11px]" style={invoiceStatusPill(i.status)}>
                {invoiceStatusLabel[i.status] ?? i.status}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}