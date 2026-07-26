import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { User, Plus } from "lucide-react";
import { getReservationDetail, updateReservation, deleteReservation, listInvoicesByReservation, createInvoice } from "@/lib/data.functions";
import { channelLabel, statusLabel, statusTone, channelTone, type Channel, type ReservationStatus } from "@/lib/types";
import { DetailLayout, SectionBar, FieldRow, EditableRow, TonePill } from "@/components/detail/DetailLayout";
import { channelLabel as chLabel } from "@/lib/types";
import { InvoicesTable } from "@/components/detail/InvoicesTable";

export const Route = createFileRoute("/_authenticated/reservations/$id")({
  head: () => ({ meta: [{ title: "הזמנה · Oriya OS" }] }),
  component: ReservationDetailPage,
  errorComponent: ({ error }) => <div className="p-6 text-sm text-red-700">{error.message}</div>,
});

type Tab = "details" | "client" | "payments";

function ReservationDetailPage() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const qc = useQueryClient();
  const get = useServerFn(getReservationDetail);
  const upd = useServerFn(updateReservation);
  const del = useServerFn(deleteReservation);
  const listInv = useServerFn(listInvoicesByReservation);
  const createInv = useServerFn(createInvoice);

  const q = useSuspenseQuery({ queryKey: ["reservation", id], queryFn: () => get({ data: { id } }) });
  const inv = useSuspenseQuery({ queryKey: ["invoices", "reservation", id], queryFn: () => listInv({ data: { reservation_id: id } }) });
  const { reservation, unit, property, customer } = q.data;

  const updM = useMutation({ mutationFn: (p: Record<string, unknown>) => upd({ data: { id, ...p } }), onSuccess: () => qc.invalidateQueries() });
  const delM = useMutation({ mutationFn: () => del({ data: { id } }), onSuccess: () => { qc.invalidateQueries(); nav({ to: "/reservations" }); } });
  const createM = useMutation({
    mutationFn: () => createInv({ data: { customer_id: reservation.customer_id, reservation_id: id, amount: Math.round(Number(reservation.total_amount) / 1.17 * 100) / 100, status: "draft" } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["invoices", "reservation", id] }),
  });

  const [tab, setTab] = useState<Tab>("details");
  const [review, setReview] = useState(reservation.review ?? "");
  const balance = Number(reservation.total_amount ?? 0) - Number(reservation.paid_amount ?? 0);

  return (
    <DetailLayout
      kicker="הזמנה"
      title={reservation.guest_name}
      statusPill={{ label: statusLabel[reservation.status as ReservationStatus], tone: statusTone[reservation.status as ReservationStatus] ?? "neutral" }}
      tags={<TonePill label={channelLabel[reservation.channel as Channel]} tone={channelTone[reservation.channel as Channel] ?? "neutral"} />}
      onDelete={() => { if (confirm("למחוק הזמנה?")) delM.mutate(); }}
      tabs={[
        { key: "details", label: "פרטים" },
        { key: "client", label: "לקוח" },
        { key: "payments", label: "תשלומים", count: inv.data.length },
      ]}
      activeTab={tab}
      onTabChange={(k) => setTab(k as Tab)}
    >
      {tab === "details" && (
        <div className="divide-y" style={{ borderColor: "var(--border)" }}>
          <SectionBar title="נכס וערוץ" accent="var(--gold-100)" barColor="var(--gold-500)">
            <FieldRow label="נכס" value={property?.name} />
            <FieldRow label="יחידה" value={unit?.name} />
            <EditableRow label="ערוץ" type="select" value={reservation.channel}
              options={(Object.keys(chLabel) as Channel[]).map((c) => ({ value: c, label: chLabel[c] }))}
              display={<TonePill label={channelLabel[reservation.channel as Channel]} tone={channelTone[reservation.channel as Channel] ?? "neutral"} />}
              onSave={(v) => updM.mutate({ channel: v as Channel })} />
            <EditableRow label="סטטוס" type="select" value={reservation.status}
              options={(Object.keys(statusLabel) as ReservationStatus[]).map((s) => ({ value: s, label: statusLabel[s] }))}
              display={<TonePill label={statusLabel[reservation.status as ReservationStatus]} tone={statusTone[reservation.status as ReservationStatus] ?? "neutral"} />}
              onSave={(v) => updM.mutate({ status: v as ReservationStatus })} />
          </SectionBar>

          <SectionBar title="שהות" accent="var(--info-bg)" barColor="var(--info)">
            <EditableRow label="צ׳ק-אין" type="date" ltr value={reservation.check_in}
              onSave={(v) => v && updM.mutate({ check_in: v })} />
            <EditableRow label="צ׳ק-אאוט" type="date" ltr value={reservation.check_out}
              onSave={(v) => v && updM.mutate({ check_out: v })} />
            <EditableRow label="מבוגרים" type="number" ltr value={reservation.adults}
              onSave={(v) => updM.mutate({ adults: Number(v ?? 0) })} />
            <EditableRow label="ילדים" type="number" ltr value={reservation.children}
              onSave={(v) => updM.mutate({ children: Number(v ?? 0) })} />
            <EditableRow label="סה״כ (₪)" type="number" ltr value={reservation.total_amount}
              onSave={(v) => updM.mutate({ total_amount: Number(v ?? 0) })} />
            <EditableRow label="שולם (₪)" type="number" ltr value={reservation.paid_amount}
              onSave={(v) => updM.mutate({ paid_amount: Number(v ?? 0) })} />
            <FieldRow label="לילות" value={String(reservation.nights)} ltr />
          </SectionBar>

          <SectionBar title="דירוג וחוות דעת" accent="#F2E9DA" barColor="var(--gold-600)">
            <div className="flex items-center justify-between gap-6 px-5 py-3">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} onClick={() => updM.mutate({ rating: n })} className="text-2xl"
                    style={{ color: (reservation.rating ?? 0) >= n ? "var(--gold-600)" : "var(--border)" }}>★</button>
                ))}
                {reservation.rating && (
                  <button onClick={() => updM.mutate({ rating: null })} className="me-2 text-xs" style={{ color: "var(--text-secondary)" }}>נקה</button>
                )}
              </div>
              <div className="text-[11px] uppercase tracking-wide" style={{ color: "var(--text-secondary)" }}>דירוג האורח</div>
            </div>
            <div className="p-4">
              <textarea rows={3} value={review} onChange={(e) => setReview(e.target.value)}
                onBlur={() => review !== (reservation.review ?? "") && updM.mutate({ review })}
                placeholder="חוות דעת של האורח"
                className="w-full rounded-md border p-2 text-sm" style={{ borderColor: "var(--border)" }} />
            </div>
          </SectionBar>

          <SectionBar title="הערות" accent="var(--bg-subtle)" barColor="var(--border)">
            <EditableRow label="הערות" type="textarea" value={reservation.notes} onSave={(v) => updM.mutate({ notes: v })} />
          </SectionBar>
        </div>
      )}

      {tab === "client" && (
        <div className="divide-y" style={{ borderColor: "var(--border)" }}>
          <SectionBar title="פרטי אורח" accent="var(--info-bg)" barColor="var(--info)">
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
              <>
                <EditableRow label="שם אורח" value={reservation.guest_name} onSave={(v) => v && updM.mutate({ guest_name: v })} />
                <EditableRow label="טלפון" type="tel" ltr value={reservation.phone} onSave={(v) => updM.mutate({ phone: v })} />
              </>
            )}
          </SectionBar>
        </div>
      )}

      {tab === "payments" && (
        <>
          <div className="flex items-center justify-between gap-3 border-b px-4 py-3" style={{ borderColor: "var(--border)" }}>
            <button onClick={() => createM.mutate()}
              className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold text-white"
              style={{ backgroundColor: "var(--navy-900)" }}>
              <Plus size={14} /> צור חשבונית
            </button>
            <div className="text-xs" style={{ color: "var(--text-secondary)" }}>
              סה״כ הזמנה: <span className="ltr-num font-semibold" style={{ color: "var(--text-primary)" }}>₪{Number(reservation.total_amount).toLocaleString()}</span>
              {" · "}שולם: <span className="ltr-num">₪{Number(reservation.paid_amount).toLocaleString()}</span>
              {balance > 0 && <> {" · "}יתרה: <span className="ltr-num" style={{ color: "var(--warning)" }}>₪{balance.toLocaleString()}</span></>}
            </div>
          </div>
          <InvoicesTable invoices={inv.data} emptyText="אין חשבוניות להזמנה זו."
            onOpen={(iid) => nav({ to: "/payments/$id", params: { id: iid } })} />
        </>
      )}
    </DetailLayout>
  );
}