import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, Trash2, User } from "lucide-react";
import { PageHeader } from "@/components/shell/PageHeader";
import { OCard, OCardBody, OCardHeader, OCardTitle } from "@/components/ui-oriya/Card";
import { OBadge } from "@/components/ui-oriya/Badge";
import { getReservationDetail, updateReservation, deleteReservation } from "@/lib/data.functions";
import { channelLabel, statusLabel, type Channel, type ReservationStatus } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/reservations/$id")({
  head: () => ({ meta: [{ title: "הזמנה · Oriya OS" }] }),
  component: ReservationDetailPage,
  errorComponent: ({ error }) => <div className="p-6 text-sm text-red-700">{error.message}</div>,
});

function ReservationDetailPage() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const qc = useQueryClient();
  const get = useServerFn(getReservationDetail);
  const upd = useServerFn(updateReservation);
  const del = useServerFn(deleteReservation);
  const q = useSuspenseQuery({ queryKey: ["reservation", id], queryFn: () => get({ data: { id } }) });
  const { reservation, unit, property, customer, communications } = q.data;

  const updM = useMutation({
    mutationFn: (patch: Record<string, unknown>) => upd({ data: { id, ...patch } }),
    onSuccess: () => qc.invalidateQueries(),
  });
  const delM = useMutation({ mutationFn: () => del({ data: { id } }), onSuccess: () => { qc.invalidateQueries(); nav({ to: "/reservations" }); } });

  const [notes, setNotes] = useState(reservation.notes ?? "");
  const [review, setReview] = useState(reservation.review ?? "");
  const [paid, setPaid] = useState(String(reservation.paid_amount ?? 0));
  const balance = Number(reservation.total_amount ?? 0) - Number(reservation.paid_amount ?? 0);

  return (
    <>
      <button onClick={() => nav({ to: "/reservations" })} className="mb-3 inline-flex items-center gap-1 text-sm" style={{ color: "var(--text-secondary)" }}>
        <ArrowRight size={14} /> חזרה להזמנות
      </button>
      <PageHeader
        title={reservation.guest_name}
        subtitle={`${property?.name ?? ""} · ${unit?.name ?? ""}`}
        action={
          <button onClick={() => { if (confirm("למחוק הזמנה?")) delM.mutate(); }}
            className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm" style={{ borderColor: "var(--danger)", color: "var(--danger)" }}>
            <Trash2 size={14} /> מחיקה
          </button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <OCard>
          <OCardHeader><OCardTitle>סטטוס וערוץ</OCardTitle></OCardHeader>
          <OCardBody className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-[11px]" style={{ color: "var(--text-secondary)" }}>ערוץ:</span>
              <OBadge tone="neutral">{channelLabel[reservation.channel as Channel]}</OBadge>
            </div>
            <div>
              <div className="mb-1 text-[11px]" style={{ color: "var(--text-secondary)" }}>סטטוס</div>
              <select value={reservation.status} onChange={(e) => updM.mutate({ status: e.target.value as ReservationStatus })}
                className="w-full rounded-md border px-2 py-1.5 text-sm" style={{ borderColor: "var(--border)" }}>
                {(Object.keys(statusLabel) as ReservationStatus[]).map((s) => <option key={s} value={s}>{statusLabel[s]}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="text-[11px]" style={{ color: "var(--text-secondary)" }}>צ׳ק-אין</div>
                <input type="date" defaultValue={reservation.check_in} onBlur={(e) => e.target.value !== reservation.check_in && updM.mutate({ check_in: e.target.value })}
                  className="ltr-num w-full rounded-md border px-2 py-1.5 text-sm" style={{ borderColor: "var(--border)" }} />
              </div>
              <div>
                <div className="text-[11px]" style={{ color: "var(--text-secondary)" }}>צ׳ק-אאוט</div>
                <input type="date" defaultValue={reservation.check_out} onBlur={(e) => e.target.value !== reservation.check_out && updM.mutate({ check_out: e.target.value })}
                  className="ltr-num w-full rounded-md border px-2 py-1.5 text-sm" style={{ borderColor: "var(--border)" }} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="text-[11px]" style={{ color: "var(--text-secondary)" }}>מבוגרים</div>
                <input type="number" defaultValue={reservation.adults}
                  onBlur={(e) => Number(e.target.value) !== reservation.adults && updM.mutate({ adults: Number(e.target.value) })}
                  className="ltr-num w-full rounded-md border px-2 py-1.5 text-sm" style={{ borderColor: "var(--border)" }} />
              </div>
              <div>
                <div className="text-[11px]" style={{ color: "var(--text-secondary)" }}>ילדים</div>
                <input type="number" defaultValue={reservation.children}
                  onBlur={(e) => Number(e.target.value) !== reservation.children && updM.mutate({ children: Number(e.target.value) })}
                  className="ltr-num w-full rounded-md border px-2 py-1.5 text-sm" style={{ borderColor: "var(--border)" }} />
              </div>
            </div>
            <div className="ltr-num text-xs" style={{ color: "var(--text-secondary)" }}>{reservation.nights} לילות</div>
          </OCardBody>
        </OCard>

        <OCard>
          <OCardHeader><OCardTitle>תשלומים</OCardTitle></OCardHeader>
          <OCardBody className="space-y-3 text-sm">
            <div>
              <div className="text-[11px]" style={{ color: "var(--text-secondary)" }}>סה״כ</div>
              <input type="number" defaultValue={reservation.total_amount}
                onBlur={(e) => Number(e.target.value) !== Number(reservation.total_amount) && updM.mutate({ total_amount: Number(e.target.value) })}
                className="ltr-num w-full rounded-md border px-2 py-1.5 text-sm" style={{ borderColor: "var(--border)" }} />
            </div>
            <div>
              <div className="text-[11px]" style={{ color: "var(--text-secondary)" }}>שולם</div>
              <input type="number" value={paid} onChange={(e) => setPaid(e.target.value)}
                onBlur={() => Number(paid) !== Number(reservation.paid_amount) && updM.mutate({ paid_amount: Number(paid) })}
                className="ltr-num w-full rounded-md border px-2 py-1.5 text-sm" style={{ borderColor: "var(--border)" }} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px]" style={{ color: "var(--text-secondary)" }}>יתרה</span>
              <span className="ltr-num text-lg font-semibold" style={{ color: balance > 0 ? "var(--warning)" : "var(--success)" }}>
                ₪{balance.toLocaleString()}
              </span>
            </div>
            {balance > 0 && (
              <button onClick={() => { setPaid(String(reservation.total_amount)); updM.mutate({ paid_amount: Number(reservation.total_amount) }); }}
                className="w-full rounded-md px-3 py-1.5 text-sm font-semibold text-white" style={{ backgroundColor: "var(--gold-600)" }}>
                סמן כשולם במלואו
              </button>
            )}
          </OCardBody>
        </OCard>

        <OCard>
          <OCardHeader><OCardTitle>אורח</OCardTitle></OCardHeader>
          <OCardBody className="space-y-2 text-sm">
            {customer ? (
              <>
                <Link to="/customers/$id" params={{ id: customer.id }}
                  className="inline-flex items-center gap-1.5 font-semibold" style={{ color: "var(--navy-700)" }}>
                  <User size={14} /> {customer.full_name}
                </Link>
                {customer.phone && <div className="ltr-num" dir="ltr">{customer.phone}</div>}
                {customer.email && <div className="ltr-num" dir="ltr">{customer.email}</div>}
              </>
            ) : (
              <div style={{ color: "var(--text-secondary)" }}>לא משויך ללקוח בבסיס.</div>
            )}
            {reservation.phone && !customer && (
              <div className="ltr-num" dir="ltr">{reservation.phone}</div>
            )}
          </OCardBody>
        </OCard>
      </div>

      <OCard className="mt-4">
        <OCardHeader><OCardTitle>הערות</OCardTitle></OCardHeader>
        <OCardBody>
          <textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)}
            onBlur={() => notes !== (reservation.notes ?? "") && updM.mutate({ notes })}
            className="w-full rounded-md border p-2 text-sm" style={{ borderColor: "var(--border)" }} />
        </OCardBody>
      </OCard>

      <OCard className="mt-4">
        <OCardHeader><OCardTitle>דירוג וחוות דעת</OCardTitle></OCardHeader>
        <OCardBody className="space-y-3">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} onClick={() => updM.mutate({ rating: n })}
                className="text-2xl"
                style={{ color: (reservation.rating ?? 0) >= n ? "var(--gold-600)" : "var(--border)" }}>
                ★
              </button>
            ))}
            {reservation.rating && (
              <button onClick={() => updM.mutate({ rating: null })} className="me-2 text-xs" style={{ color: "var(--text-secondary)" }}>נקה</button>
            )}
          </div>
          <textarea rows={3} value={review} onChange={(e) => setReview(e.target.value)}
            onBlur={() => review !== (reservation.review ?? "") && updM.mutate({ review })}
            placeholder="חוות דעת של האורח"
            className="w-full rounded-md border p-2 text-sm" style={{ borderColor: "var(--border)" }} />
        </OCardBody>
      </OCard>

      <OCard className="mt-4">
        <OCardHeader><OCardTitle>תקשורת אחרונה</OCardTitle></OCardHeader>
        <OCardBody>
          {communications.length === 0 ? (
            <div className="py-4 text-center text-sm" style={{ color: "var(--text-secondary)" }}>אין תקשורת מתועדת.</div>
          ) : (
            <ul className="divide-y" style={{ borderColor: "var(--border)" }}>
              {communications.map((c) => (
                <li key={c.id} className="flex items-start gap-3 py-2.5">
                  <OBadge tone={c.channel === "whatsapp" ? "success" : "info"}>{c.channel}</OBadge>
                  <div className="flex-1">
                    {c.subject && <div className="text-sm font-medium">{c.subject}</div>}
                    <div className="text-sm" style={{ color: "var(--text-secondary)" }}>{c.body}</div>
                    <div className="ltr-num text-[11px]" style={{ color: "var(--text-secondary)" }}>{new Date(c.sent_at).toLocaleString("he-IL")}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </OCardBody>
      </OCard>
    </>
  );
}