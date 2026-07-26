import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { User, BookMarked } from "lucide-react";
import { getInvoice, updateInvoice, deleteInvoice } from "@/lib/data.functions";
import { DetailLayout, SectionBar, FieldRow } from "@/components/detail/DetailLayout";
import { channelLabel, statusLabel as resStatusLabel, type Channel, type ReservationStatus } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/payments/$id")({
  head: () => ({ meta: [{ title: "חשבונית · Oriya OS" }] }),
  component: PaymentDetailPage,
  errorComponent: ({ error }) => <div className="p-6 text-sm text-red-700">{error.message}</div>,
});

type Tab = "details" | "client" | "reservation";

const invStatusLabel: Record<string, string> = {
  draft: "טיוטה", sent: "נשלח", paid: "שולם", overdue: "בפיגור", cancelled: "בוטל",
};

function PaymentDetailPage() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const qc = useQueryClient();
  const get = useServerFn(getInvoice);
  const upd = useServerFn(updateInvoice);
  const del = useServerFn(deleteInvoice);
  const q = useSuspenseQuery({ queryKey: ["invoice", id], queryFn: () => get({ data: { id } }) });
  const { invoice, customer, reservation } = q.data;

  const updM = useMutation({ mutationFn: (p: Record<string, unknown>) => upd({ data: { id, ...p } }), onSuccess: () => qc.invalidateQueries({ queryKey: ["invoice", id] }) });
  const delM = useMutation({ mutationFn: () => del({ data: { id } }), onSuccess: () => nav({ to: "/payments" }) });

  const [tab, setTab] = useState<Tab>("details");

  const tone = ({
    paid: "success", sent: "info", draft: "neutral", overdue: "danger", cancelled: "neutral",
  } as const)[invoice.status as "paid" | "sent" | "draft" | "overdue" | "cancelled"] ?? "neutral";

  return (
    <DetailLayout
      kicker="חשבונית"
      title={invoice.invoice_number}
      statusPill={{ label: invStatusLabel[invoice.status] ?? invoice.status, tone }}
      onDelete={() => { if (confirm("למחוק חשבונית?")) delM.mutate(); }}
      tabs={[
        { key: "details", label: "פרטים" },
        { key: "client", label: "לקוח" },
        { key: "reservation", label: "הזמנה" },
      ]}
      activeTab={tab}
      onTabChange={(k) => setTab(k as Tab)}
    >
      {tab === "details" && (
        <div className="divide-y" style={{ borderColor: "var(--border)" }}>
          <SectionBar title="פרטי חשבונית" accent="var(--gold-100)" barColor="var(--gold-500)">
            <div className="flex items-center justify-between gap-6 px-5 py-3">
              <input defaultValue={invoice.invoice_number}
                onBlur={(e) => e.target.value !== invoice.invoice_number && updM.mutate({ invoice_number: e.target.value })}
                className="ltr-num w-64 rounded-md border px-2 py-1.5 text-sm" style={{ borderColor: "var(--border)" }} />
              <div className="text-[11px] uppercase tracking-wide" style={{ color: "var(--text-secondary)" }}>מספר</div>
            </div>
            <FieldRow label="תאריך הפקה" value={invoice.issue_date} ltr />
            <div className="flex items-center justify-between gap-6 px-5 py-3">
              <input type="date" defaultValue={invoice.due_date ?? ""}
                onBlur={(e) => e.target.value !== (invoice.due_date ?? "") && updM.mutate({ due_date: e.target.value || null })}
                className="ltr-num w-48 rounded-md border px-2 py-1.5 text-sm" style={{ borderColor: "var(--border)" }} />
              <div className="text-[11px] uppercase tracking-wide" style={{ color: "var(--text-secondary)" }}>לתשלום עד</div>
            </div>
            <div className="flex items-center justify-between gap-6 px-5 py-3">
              <select value={invoice.status} onChange={(e) => updM.mutate({ status: e.target.value })}
                className="rounded-md border px-2 py-1.5 text-sm" style={{ borderColor: "var(--border)" }}>
                {Object.entries(invStatusLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <div className="text-[11px] uppercase tracking-wide" style={{ color: "var(--text-secondary)" }}>סטטוס</div>
            </div>
          </SectionBar>

          <SectionBar title="סכומים" accent="#F2E9DA" barColor="var(--gold-600)">
            <div className="flex items-center justify-between gap-6 px-5 py-3">
              <input type="number" defaultValue={invoice.amount}
                onBlur={(e) => {
                  const v = Number(e.target.value);
                  if (v !== Number(invoice.amount)) {
                    const tax = Math.round(v * 0.17 * 100) / 100;
                    updM.mutate({ amount: v, tax, total: Math.round((v + tax) * 100) / 100 });
                  }
                }}
                className="ltr-num w-40 rounded-md border px-2 py-1.5 text-sm" style={{ borderColor: "var(--border)" }} />
              <div className="text-[11px] uppercase tracking-wide" style={{ color: "var(--text-secondary)" }}>סכום לפני מע״מ</div>
            </div>
            <FieldRow label="מע״מ (17%)" value={`₪${Number(invoice.tax).toLocaleString()}`} ltr />
            <FieldRow label="סה״כ" value={<span className="text-lg font-bold">₪{Number(invoice.total).toLocaleString()}</span>} ltr />
          </SectionBar>

          <SectionBar title="הערות" accent="var(--bg-subtle)" barColor="var(--border)">
            <div className="p-4">
              <textarea rows={3} defaultValue={invoice.notes ?? ""}
                onBlur={(e) => e.target.value !== (invoice.notes ?? "") && updM.mutate({ notes: e.target.value })}
                className="w-full rounded-md border p-2 text-sm" style={{ borderColor: "var(--border)" }} />
            </div>
          </SectionBar>
        </div>
      )}

      {tab === "client" && (
        <div className="divide-y" style={{ borderColor: "var(--border)" }}>
          <SectionBar title="לקוח" accent="var(--info-bg)" barColor="var(--info)">
            {customer ? (
              <>
                <div className="flex items-center justify-between gap-6 px-5 py-3">
                  <Link to="/customers/$id" params={{ id: customer.id }}
                    className="inline-flex items-center gap-1.5 font-semibold" style={{ color: "var(--navy-700)" }}>
                    <User size={14} /> {customer.full_name}
                  </Link>
                  <div className="text-[11px] uppercase tracking-wide" style={{ color: "var(--text-secondary)" }}>שם</div>
                </div>
                <FieldRow label="טלפון" value={customer.phone} ltr />
                <FieldRow label="אימייל" value={customer.email} ltr />
              </>
            ) : (
              <div className="p-6 text-sm" style={{ color: "var(--text-secondary)" }}>חשבונית ללא לקוח מקושר.</div>
            )}
          </SectionBar>
        </div>
      )}

      {tab === "reservation" && (
        <div className="divide-y" style={{ borderColor: "var(--border)" }}>
          <SectionBar title="הזמנה מקושרת" accent="var(--gold-100)" barColor="var(--gold-500)">
            {reservation ? (
              <>
                <div className="flex items-center justify-between gap-6 px-5 py-3">
                  <Link to="/reservations/$id" params={{ id: reservation.id }}
                    className="inline-flex items-center gap-1.5 font-semibold" style={{ color: "var(--navy-700)" }}>
                    <BookMarked size={14} /> {reservation.guest_name}
                  </Link>
                  <div className="text-[11px] uppercase tracking-wide" style={{ color: "var(--text-secondary)" }}>אורח</div>
                </div>
                <FieldRow label="תאריכים" value={`${reservation.check_in} → ${reservation.check_out}`} ltr />
                <FieldRow label="לילות" value={String(reservation.nights)} ltr />
                <FieldRow label="ערוץ" value={channelLabel[reservation.channel as Channel]} />
                <FieldRow label="סטטוס הזמנה" value={resStatusLabel[reservation.status as ReservationStatus]} />
                <FieldRow label="סכום הזמנה" value={`₪${Number(reservation.total_amount).toLocaleString()}`} ltr />
              </>
            ) : (
              <div className="p-6 text-sm" style={{ color: "var(--text-secondary)" }}>חשבונית ללא הזמנה מקושרת.</div>
            )}
          </SectionBar>
        </div>
      )}
    </DetailLayout>
  );
}