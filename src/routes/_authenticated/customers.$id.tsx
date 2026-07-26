import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, Mail, MessageCircle, Phone, Star } from "lucide-react";
import { PageHeader } from "@/components/shell/PageHeader";
import { OCard, OCardBody, OCardHeader, OCardTitle } from "@/components/ui-oriya/Card";
import { OBadge } from "@/components/ui-oriya/Badge";
import { getCustomerDetail, updateCustomer, addCommunication } from "@/lib/data.functions";
import { channelLabel, statusLabel, type Channel, type ReservationStatus } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/customers/$id")({
  head: () => ({ meta: [{ title: "כרטיס לקוח · Oriya OS" }] }),
  component: CustomerDetailPage,
  errorComponent: ({ error }) => <div className="p-6 text-sm text-red-700">{error.message}</div>,
});

function CustomerDetailPage() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const qc = useQueryClient();
  const get = useServerFn(getCustomerDetail);
  const upd = useServerFn(updateCustomer);
  const addComm = useServerFn(addCommunication);
  const q = useSuspenseQuery({ queryKey: ["customer", id], queryFn: () => get({ data: { id } }) });
  const { customer, reservations, communications } = q.data;

  const updM = useMutation({
    mutationFn: (patch: Record<string, unknown>) => upd({ data: { id, ...patch } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customer", id] }),
  });
  const commM = useMutation({
    mutationFn: (v: { channel: "whatsapp" | "email"; subject?: string; body: string }) =>
      addComm({ data: { customer_id: id, ...v } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customer", id] }),
  });

  const totalSpent = reservations.reduce((a, r) => a + Number(r.total_amount ?? 0), 0);
  const totalNights = reservations.reduce((a, r) => a + Number(r.nights ?? 0), 0);
  const ratings = reservations.filter((r) => r.rating != null);
  const avgRating = ratings.length ? ratings.reduce((a, r) => a + Number(r.rating), 0) / ratings.length : null;

  const [notes, setNotes] = useState(customer.notes ?? "");
  const [comm, setComm] = useState<{ channel: "whatsapp" | "email"; subject: string; body: string }>({
    channel: "whatsapp",
    subject: "",
    body: "",
  });

  return (
    <>
      <button onClick={() => nav({ to: "/customers" })} className="mb-3 inline-flex items-center gap-1 text-sm" style={{ color: "var(--text-secondary)" }}>
        <ArrowRight size={14} /> חזרה ללקוחות
      </button>
      <PageHeader
        title={customer.full_name}
        subtitle={`לקוח מאז ${new Date(customer.created_at).toLocaleDateString("he-IL")}`}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <OCard className="lg:col-span-1">
          <OCardHeader><OCardTitle>פרטי קשר</OCardTitle></OCardHeader>
          <OCardBody className="space-y-3 text-sm">
            <Row icon={<Phone size={14} />} label="טלפון">
              {customer.phone ? (
                <a href={`tel:${customer.phone}`} className="ltr-num" dir="ltr">{customer.phone}</a>
              ) : "—"}
            </Row>
            {customer.phone && (
              <a href={`https://wa.me/${customer.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs"
                style={{ backgroundColor: "var(--success-bg)", color: "var(--success)" }}>
                <MessageCircle size={12} /> וואטסאפ
              </a>
            )}
            <Row icon={<Mail size={14} />} label="אימייל">
              {customer.email ? <a href={`mailto:${customer.email}`} className="ltr-num" dir="ltr">{customer.email}</a> : "—"}
            </Row>
            {customer.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {customer.tags.map((t: string) => <OBadge key={t} tone="gold">{t}</OBadge>)}
              </div>
            )}
            <div>
              <div className="mb-1 text-[11px]" style={{ color: "var(--text-secondary)" }}>הערות</div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onBlur={() => notes !== (customer.notes ?? "") && updM.mutate({ notes })}
                rows={4}
                className="w-full rounded-md border p-2 text-sm"
                style={{ borderColor: "var(--border)" }}
              />
            </div>
          </OCardBody>
        </OCard>

        <OCard className="lg:col-span-2">
          <OCardHeader><OCardTitle>סטטיסטיקה</OCardTitle></OCardHeader>
          <OCardBody className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat label="סה״כ שהיות" value={String(reservations.length)} />
            <Stat label="סה״כ לילות" value={String(totalNights)} />
            <Stat label="סה״כ הכנסה" value={`₪${totalSpent.toLocaleString()}`} />
            <Stat label="דירוג ממוצע" value={avgRating != null ? `${avgRating.toFixed(1)} ★` : "—"} />
          </OCardBody>
        </OCard>
      </div>

      <OCard className="mt-4 overflow-hidden">
        <OCardHeader><OCardTitle>היסטוריית שהיות</OCardTitle></OCardHeader>
        {reservations.length === 0 ? (
          <div className="p-8 text-center text-sm" style={{ color: "var(--text-secondary)" }}>אין הזמנות עדיין.</div>
        ) : (
          <table className="w-full text-sm" dir="rtl">
            <thead>
              <tr className="text-right text-[11px] uppercase" style={{ color: "var(--text-secondary)" }}>
                <th className="px-4 py-2">תאריכים</th><th className="px-4 py-2">לילות</th><th className="px-4 py-2">ערוץ</th><th className="px-4 py-2">סטטוס</th><th className="px-4 py-2">סכום</th><th className="px-4 py-2">דירוג</th>
              </tr>
            </thead>
            <tbody>
              {reservations.map((r) => (
                <tr key={r.id} className="cursor-pointer border-t hover:bg-[var(--bg-subtle)]" style={{ borderColor: "var(--border)" }}
                  onClick={() => nav({ to: "/reservations/$id", params: { id: r.id } })}>
                  <td className="ltr-num px-4 py-2.5">{r.check_in} → {r.check_out}</td>
                  <td className="ltr-num px-4 py-2.5">{r.nights}</td>
                  <td className="px-4 py-2.5">{channelLabel[r.channel as Channel]}</td>
                  <td className="px-4 py-2.5"><OBadge tone={r.status === "confirmed" ? "success" : r.status === "cancelled" ? "danger" : "info"}>{statusLabel[r.status as ReservationStatus]}</OBadge></td>
                  <td className="ltr-num px-4 py-2.5">₪{Number(r.total_amount).toLocaleString()}</td>
                  <td className="px-4 py-2.5">{r.rating ? <span className="inline-flex items-center gap-1"><Star size={12} style={{ color: "var(--gold-600)" }} />{r.rating}</span> : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </OCard>

      <OCard className="mt-4">
        <OCardHeader><OCardTitle>תקשורת (וואטסאפ ומייל)</OCardTitle></OCardHeader>
        <OCardBody className="space-y-3">
          <form
            className="grid gap-2 sm:grid-cols-[120px_1fr_auto]"
            onSubmit={(e) => { e.preventDefault(); if (!comm.body.trim()) return; commM.mutate(comm); setComm({ ...comm, subject: "", body: "" }); }}
          >
            <select className="rounded-md border px-2 py-1.5 text-sm" style={{ borderColor: "var(--border)" }}
              value={comm.channel} onChange={(e) => setComm({ ...comm, channel: e.target.value as "whatsapp" | "email" })}>
              <option value="whatsapp">וואטסאפ</option>
              <option value="email">אימייל</option>
            </select>
            <input placeholder={comm.channel === "email" ? "נושא + תוכן" : "תוכן הודעה"} className="rounded-md border px-2 py-1.5 text-sm" style={{ borderColor: "var(--border)" }}
              value={comm.body} onChange={(e) => setComm({ ...comm, body: e.target.value })} />
            <button type="submit" className="rounded-md px-3 py-1.5 text-sm font-semibold text-white" style={{ backgroundColor: "var(--navy-900)" }}>הוסף לתיעוד</button>
          </form>
          {communications.length === 0 ? (
            <div className="py-6 text-center text-sm" style={{ color: "var(--text-secondary)" }}>אין תקשורת מתועדת עדיין.</div>
          ) : (
            <ul className="divide-y" style={{ borderColor: "var(--border)" }}>
              {communications.map((c) => (
                <li key={c.id} className="flex items-start gap-3 py-2.5">
                  <OBadge tone={c.channel === "whatsapp" ? "success" : "info"}>{c.channel === "whatsapp" ? "WhatsApp" : c.channel === "email" ? "Email" : "SMS"}</OBadge>
                  <div className="flex-1 min-w-0">
                    {c.subject && <div className="text-sm font-medium">{c.subject}</div>}
                    <div className="text-sm" style={{ color: "var(--text-secondary)" }}>{c.body}</div>
                    <div className="ltr-num mt-0.5 text-[11px]" style={{ color: "var(--text-secondary)" }}>{new Date(c.sent_at).toLocaleString("he-IL")} · {c.direction === "inbound" ? "נכנס" : "יוצא"}</div>
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

function Row({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span style={{ color: "var(--text-secondary)" }}>{icon}</span>
      <span className="text-[11px]" style={{ color: "var(--text-secondary)" }}>{label}:</span>
      <span style={{ color: "var(--text-primary)" }}>{children}</span>
    </div>
  );
}
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase" style={{ color: "var(--text-secondary)" }}>{label}</div>
      <div className="ltr-num mt-1 text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>{value}</div>
    </div>
  );
}