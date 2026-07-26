import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { PageHeader } from "@/components/shell/PageHeader";
import { FilterChips } from "@/components/shell/FilterChips";
import { listInvoices } from "@/lib/data.functions";
import { invoiceStatusPill } from "@/components/detail/InvoicesTable";

export const Route = createFileRoute("/_authenticated/payments/")({
  head: () => ({ meta: [{ title: "תשלומים · Oriya OS" }] }),
  component: PaymentsPage,
});

const chips = [
  { key: "all", label: "הכל" },
  { key: "draft", label: "טיוטה" },
  { key: "sent", label: "נשלח" },
  { key: "paid", label: "שולם" },
  { key: "overdue", label: "בפיגור" },
  { key: "cancelled", label: "בוטל" },
];

const statusLabel: Record<string, string> = {
  draft: "טיוטה", sent: "נשלח", paid: "שולם", overdue: "בפיגור", cancelled: "בוטל",
};

function PaymentsPage() {
  const nav = useNavigate();
  const list = useServerFn(listInvoices);
  const q = useSuspenseQuery({ queryKey: ["invoices"], queryFn: () => list() });
  const [filter, setFilter] = useState("all");

  const rows = q.data.filter((r) => filter === "all" || r.status === filter);
  const totalOutstanding = q.data
    .filter((r) => r.status === "sent" || r.status === "overdue")
    .reduce((a, r) => a + Number(r.total), 0);
  const totalPaid = q.data.filter((r) => r.status === "paid").reduce((a, r) => a + Number(r.total), 0);

  return (
    <>
      <PageHeader title="תשלומים" subtitle="חשבוניות והכנסות" />

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <StatCard label="שולם החודש" value={`₪${totalPaid.toLocaleString()}`} tone="success" />
        <StatCard label="יתרת גבייה" value={`₪${totalOutstanding.toLocaleString()}`} tone="warning" />
        <StatCard label="סה״כ חשבוניות" value={String(q.data.length)} tone="info" />
      </div>

      <FilterChips items={chips} value={filter} onChange={setFilter} />

      <div className="mt-4 overflow-hidden rounded-lg border bg-white" style={{ borderColor: "var(--border)" }}>
        {rows.length === 0 ? (
          <div className="p-10 text-center text-sm" style={{ color: "var(--text-secondary)" }}>אין חשבוניות תואמות.</div>
        ) : (
          <table className="w-full text-sm" dir="rtl">
            <thead>
              <tr className="text-right text-[11px] uppercase" style={{ color: "var(--text-secondary)" }}>
                <th className="px-4 py-3">מספר</th>
                <th className="px-4 py-3">לקוח</th>
                <th className="px-4 py-3">תאריך</th>
                <th className="px-4 py-3">לתשלום עד</th>
                <th className="px-4 py-3">סכום</th>
                <th className="px-4 py-3">סטטוס</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((i) => (
                <tr key={i.id} className="cursor-pointer border-t hover:bg-[var(--bg-subtle)]"
                  style={{ borderColor: "var(--border)" }}
                  onClick={() => nav({ to: "/payments/$id", params: { id: i.id } })}>
                  <td className="ltr-num px-4 py-3 font-medium">{i.invoice_number}</td>
                  <td className="px-4 py-3">{i.customer_name ?? "—"}</td>
                  <td className="ltr-num px-4 py-3">{i.issue_date}</td>
                  <td className="ltr-num px-4 py-3">{i.due_date ?? "—"}</td>
                  <td className="ltr-num px-4 py-3">₪{Number(i.total).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full px-2 py-0.5 text-[11px]" style={invoiceStatusPill(i.status)}>
                      {statusLabel[i.status] ?? i.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

function StatCard({ label, value, tone }: { label: string; value: string; tone: "success" | "warning" | "info" }) {
  const colors = {
    success: { bg: "var(--success-bg)", fg: "var(--success)" },
    warning: { bg: "var(--warning-bg, #FEF3C7)", fg: "var(--warning, #B45309)" },
    info: { bg: "var(--info-bg)", fg: "var(--info)" },
  }[tone];
  return (
    <div className="rounded-lg border p-4" style={{ borderColor: "var(--border)", backgroundColor: "#fff" }}>
      <div className="text-[11px] uppercase" style={{ color: "var(--text-secondary)" }}>{label}</div>
      <div className="ltr-num mt-1 text-2xl font-semibold" style={{ color: colors.fg }}>{value}</div>
    </div>
  );
}