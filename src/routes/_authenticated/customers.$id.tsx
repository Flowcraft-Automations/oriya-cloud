import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Mail, MessageCircle, Send, Star } from "lucide-react";
import { getCustomerDetail, updateCustomer, deleteCustomer, listInvoicesByCustomer } from "@/lib/data.functions";
import { channelLabel, statusLabel, statusTone, channelTone, type Channel, type ReservationStatus } from "@/lib/types";
import { DetailLayout, SectionBar, FieldRow, EditableRow, EmptyState, TonePill } from "@/components/detail/DetailLayout";
import { InvoicesTable } from "@/components/detail/InvoicesTable";
import { MarketingPanel } from "@/components/marketing/MarketingPanel";

export const Route = createFileRoute("/_authenticated/customers/$id")({
  head: () => ({ meta: [{ title: "כרטיס לקוח · Oriya OS" }] }),
  component: CustomerDetailPage,
  errorComponent: ({ error }) => <div className="p-6 text-sm text-red-700">{error.message}</div>,
});

type Tab = "profile" | "orders" | "payments" | "marketing";

function CustomerDetailPage() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const qc = useQueryClient();
  const get = useServerFn(getCustomerDetail);
  const upd = useServerFn(updateCustomer);
  const del = useServerFn(deleteCustomer);
  const listInv = useServerFn(listInvoicesByCustomer);

  const q = useSuspenseQuery({ queryKey: ["customer", id], queryFn: () => get({ data: { id } }) });
  const inv = useSuspenseQuery({ queryKey: ["invoices", "customer", id], queryFn: () => listInv({ data: { customer_id: id } }) });
  const { customer, reservations } = q.data;

  const updM = useMutation({ mutationFn: (p: Record<string, unknown>) => upd({ data: { id, ...p } }), onSuccess: () => qc.invalidateQueries({ queryKey: ["customer", id] }) });
  const delM = useMutation({ mutationFn: () => del({ data: { id } }), onSuccess: () => nav({ to: "/customers" }) });

  const totalSpent = reservations.reduce((a, r) => a + Number(r.total_amount ?? 0), 0);
  const totalNights = reservations.reduce((a, r) => a + Number(r.nights ?? 0), 0);
  const ratings = reservations.filter((r) => r.rating != null);
  const avgRating = ratings.length ? ratings.reduce((a, r) => a + Number(r.rating), 0) / ratings.length : null;
  const paidTotal = inv.data.filter((i) => i.status === "paid").reduce((a, i) => a + Number(i.total), 0);

  const [tab, setTab] = useState<Tab>("profile");

  return (
    <DetailLayout
      kicker="איש קשר"
      title={customer.full_name}
      statusPill={{ label: "לקוח", tone: "success" }}
      flag="🇮🇱"
      onDelete={() => { if (confirm("למחוק לקוח?")) delM.mutate(); }}
      toolbar={<>
        {customer.phone && (
          <a href={`https://wa.me/${customer.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs"
            style={{ borderColor: "var(--success)", color: "var(--success)" }}>
            <MessageCircle size={12} /> WhatsApp
          </a>
        )}
        {customer.email && (
          <a href={`mailto:${customer.email}`} className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs"
            style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}>
            <Mail size={12} /> אימייל
          </a>
        )}
        {customer.email && (
          <a href={`https://mail.google.com/mail/?view=cm&to=${customer.email}`} target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium"
            style={{ borderColor: "var(--danger)", color: "var(--danger)" }}>
            <Send size={12} /> פתח ב-Gmail
          </a>
        )}
      </>}
      tabs={[
        { key: "profile", label: "פרופיל" },
        { key: "orders", label: "הזמנות", count: reservations.length },
        { key: "payments", label: "תשלומים", count: inv.data.length },
        { key: "marketing", label: "שיווק" },
      ]}
      activeTab={tab}
      onTabChange={(k) => setTab(k as Tab)}
    >
      {tab === "profile" && (
        <div className="divide-y" style={{ borderColor: "var(--border)" }}>
          <SectionBar title="זהות" accent="var(--gold-100)" barColor="var(--gold-500)">
            <EditableRow label="שם מלא" value={customer.full_name} onSave={(v) => updM.mutate({ full_name: v })} />
            <EditableRow label="אימייל" type="email" ltr value={customer.email} onSave={(v) => updM.mutate({ email: v })} />
            <EditableRow label="טלפון" type="tel" ltr value={customer.phone} onSave={(v) => updM.mutate({ phone: v })} />
            <EditableRow label="מספר זהות" ltr value={customer.id_number} onSave={(v) => updM.mutate({ id_number: v })} />
            <FieldRow label="שפה מועדפת" value="עברית" />
          </SectionBar>
          <SectionBar title="פעילות" accent="var(--info-bg)" barColor="var(--info)">
            <FieldRow label="לקוח מאז" value={new Date(customer.created_at).toLocaleDateString("he-IL")} />
            <FieldRow label="סה״כ שהיות" value={String(reservations.length)} ltr />
            <FieldRow label="סה״כ לילות" value={String(totalNights)} ltr />
            <FieldRow label="דירוג ממוצע" value={avgRating != null ? `${avgRating.toFixed(1)} ★` : null} />
          </SectionBar>
          <SectionBar title="סיכום כספי" accent="#F2E9DA" barColor="var(--gold-600)">
            <FieldRow label="סה״כ הכנסה" value={`₪${totalSpent.toLocaleString()}`} ltr />
            <FieldRow label="שולם בפועל" value={`₪${paidTotal.toLocaleString()}`} ltr />
            <FieldRow label="ממוצע להזמנה" value={reservations.length ? `₪${Math.round(totalSpent / reservations.length).toLocaleString()}` : null} ltr />
          </SectionBar>
          <SectionBar title="הערות" accent="var(--bg-subtle)" barColor="var(--border)">
            <EditableRow label="הערות" type="textarea" value={customer.notes} placeholder="הערות פנימיות…"
              onSave={(v) => updM.mutate({ notes: v })} />
          </SectionBar>
        </div>
      )}

      {tab === "orders" && (
        reservations.length === 0 ? <EmptyState text="אין הזמנות עדיין." /> : (
          <table className="w-full text-sm" dir="rtl">
            <thead>
              <tr className="text-right text-[11px] uppercase" style={{ color: "var(--text-secondary)" }}>
                <th className="px-4 py-2.5">תאריכים</th><th className="px-4 py-2.5">לילות</th><th className="px-4 py-2.5">ערוץ</th><th className="px-4 py-2.5">סטטוס</th><th className="px-4 py-2.5">סכום</th><th className="px-4 py-2.5">דירוג</th>
              </tr>
            </thead>
            <tbody>
              {reservations.map((r) => (
                <tr key={r.id} className="cursor-pointer border-t hover:bg-[var(--bg-subtle)]" style={{ borderColor: "var(--border)" }}
                  onClick={() => nav({ to: "/reservations/$id", params: { id: r.id } })}>
                  <td className="ltr-num px-4 py-2.5">{r.check_in} → {r.check_out}</td>
                  <td className="ltr-num px-4 py-2.5">{r.nights}</td>
                  <td className="px-4 py-2.5">
                    <TonePill label={channelLabel[r.channel as Channel]} tone={channelTone[r.channel as Channel] ?? "neutral"} />
                  </td>
                  <td className="px-4 py-2.5">
                    <TonePill label={statusLabel[r.status as ReservationStatus]} tone={statusTone[r.status as ReservationStatus] ?? "neutral"} />
                  </td>
                  <td className="ltr-num px-4 py-2.5">₪{Number(r.total_amount).toLocaleString()}</td>
                  <td className="px-4 py-2.5">{r.rating ? <span className="inline-flex items-center gap-1"><Star size={12} style={{ color: "var(--gold-600)" }} />{r.rating}</span> : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      )}

      {tab === "payments" && (
        <InvoicesTable invoices={inv.data} emptyText="אין חשבוניות ללקוח זה." onOpen={(iid) => nav({ to: "/payments/$id", params: { id: iid } })} />
      )}

      {tab === "marketing" && (
        <div className="p-4">
          <MarketingPanel mode="customer" customerId={customer.id} phone={customer.phone} displayName={customer.full_name} />
        </div>
      )}
    </DetailLayout>
  );
}