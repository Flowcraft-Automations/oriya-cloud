import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  CheckCircle2, ChevronLeft, ChevronRight, Mail, MessageCircle, Send,
  Star, Tag as TagIcon, Trash2, X,
} from "lucide-react";
import { getCustomerDetail, updateCustomer, addCommunication } from "@/lib/data.functions";
import { channelLabel, statusLabel, type Channel, type ReservationStatus } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/customers/$id")({
  head: () => ({ meta: [{ title: "כרטיס לקוח · Oriya OS" }] }),
  component: CustomerDetailPage,
  errorComponent: ({ error }) => <div className="p-6 text-sm text-red-700">{error.message}</div>,
});

type TabKey = "profile" | "ai" | "company" | "reservations" | "comms" | "campaigns" | "notes" | "timeline" | "money";

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
  const [tab, setTab] = useState<TabKey>("profile");
  const [comm, setComm] = useState<{ channel: "whatsapp" | "email"; subject: string; body: string }>({
    channel: "whatsapp", subject: "", body: "",
  });

  const tabs: { key: TabKey; label: string; count?: number }[] = [
    { key: "profile", label: "פרופיל" },
    { key: "ai", label: "פרופיל לקוח AI", count: 1 },
    { key: "company", label: "חברה", count: 0 },
    { key: "reservations", label: "הזמנות", count: reservations.length },
    { key: "comms", label: "תכתובות", count: communications.length },
    { key: "campaigns", label: "קמפיינים" },
    { key: "notes", label: "הערות", count: customer.notes ? 1 : 0 },
    { key: "timeline", label: "ציר זמן" },
    { key: "money", label: "כספים" },
  ];

  return (
    <div className="mx-auto max-w-[1200px]">
      {/* Top action strip */}
      <div className="mb-2 flex items-center justify-between text-sm" style={{ color: "var(--text-secondary)" }}>
        <div className="flex items-center gap-2">
          <button onClick={() => { if (confirm("למחוק לקוח?")) nav({ to: "/customers" }); }}
            className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs"
            style={{ borderColor: "var(--danger)", color: "var(--danger)" }}>
            <Trash2 size={12} /> מחק
          </button>
          <button className="rounded p-1 hover:bg-[var(--bg-subtle)]" aria-label="הקודם"><ChevronRight size={16} /></button>
          <span className="ltr-num text-xs">1 / 200</span>
          <button className="rounded p-1 hover:bg-[var(--bg-subtle)]" aria-label="הבא"><ChevronLeft size={16} /></button>
          <span className="inline-flex items-center gap-1 text-xs font-medium" style={{ color: "var(--success)" }}>
            <CheckCircle2 size={14} /> מאומת
          </span>
        </div>
        <div className="text-[11px] tracking-widest" style={{ color: "var(--text-secondary)" }}>איש קשר</div>
      </div>

      {/* Name + status row */}
      <div className="flex items-start justify-between gap-4 border-b pb-4" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-2">
          <span className="rounded-full border px-3 py-1 text-xs font-medium"
            style={{ borderColor: "var(--success)", color: "var(--success)", backgroundColor: "var(--success-bg)" }}>
            לקוח
          </span>
          <span className="text-lg" aria-label="ישראל">🇮🇱</span>
          <span className="rounded-full border px-2.5 py-1 text-[11px]"
            style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>
            + מדינה
          </span>
        </div>
        <h1 className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>{customer.full_name}</h1>
      </div>

      {/* Action toolbar */}
      <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
        <button className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs"
          style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}>
          <Send size={12} /> המר ל-B2B
        </button>
        <button className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs"
          style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}>
          <Mail size={12} /> שלח ל-Zoho
        </button>
        <button className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs"
          style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}>
          רשימת Zoho
        </button>
        {customer.phone && (
          <a href={`https://wa.me/${customer.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer"
            className="rounded-md border p-1.5" style={{ borderColor: "var(--success)", color: "var(--success)" }}
            aria-label="וואטסאפ">
            <MessageCircle size={14} />
          </a>
        )}
        {customer.email && (
          <a href={`mailto:${customer.email}`}
            className="rounded-md border p-1.5" style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
            aria-label="אימייל">
            <Mail size={14} />
          </a>
        )}
        {customer.email && (
          <a href={`https://mail.google.com/mail/?view=cm&to=${customer.email}`} target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium"
            style={{ borderColor: "var(--danger)", color: "var(--danger)" }}>
            <Mail size={12} /> פתח ב-Gmail
          </a>
        )}
      </div>

      {/* Tags row */}
      <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
        <button className="inline-flex items-center gap-1 rounded-full border border-dashed px-2.5 py-1 text-[11px]"
          style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>
          <TagIcon size={11} /> + תגית
        </button>
        {(customer.tags?.length ? customer.tags : ["לבדיקה", "verified_customer", "Hebrew"]).map((t: string, i: number) => {
          const tones = [
            { fg: "var(--success)", bg: "var(--success-bg)", bd: "var(--success)" },
            { fg: "var(--info)", bg: "var(--info-bg)", bd: "var(--info)" },
            { fg: "var(--gold-600)", bg: "var(--gold-100)", bd: "var(--gold-600)" },
          ][i % 3];
          return (
            <span key={t} className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px]"
              style={{ borderColor: tones.bd, color: tones.fg, backgroundColor: tones.bg }}>
              <X size={10} /> {t} <TagIcon size={10} />
            </span>
          );
        })}
      </div>

      {/* Tabs bar */}
      <div className="mt-5 rounded-t-lg border border-b-0 bg-[var(--bg-subtle)] px-1 pt-1"
        style={{ borderColor: "var(--border)" }}>
        <div className="flex flex-row-reverse flex-wrap items-end gap-1">
          {tabs.map((t) => {
            const active = tab === t.key;
            return (
              <button key={t.key} onClick={() => setTab(t.key)}
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

      {/* Tab content */}
      <div className="rounded-b-lg border bg-white" style={{ borderColor: "var(--border)" }}>
        {tab === "profile" && (
          <div className="divide-y" style={{ borderColor: "var(--border)" }}>
            <SectionBar title="זהות" accent="var(--gold-100)" barColor="var(--gold-500)">
              <FieldRow label="שם מלא" value={customer.full_name} />
              <FieldRow label="שם בעברית" value={customer.full_name} />
              <FieldRow label="אימייל" value={customer.email} ltr />
              <FieldRow label="טלפון" value={customer.phone} ltr />
              <FieldRow label="WhatsApp" value={customer.phone} ltr />
              <FieldRow label="שפה מועדפת" value="עברית" />
            </SectionBar>

            <SectionBar title="תפקידים ושיווק" accent="var(--info-bg)" barColor="var(--info)">
              <FieldRow label="סטטוס" value="לקוח פעיל" />
              <FieldRow label="מקור ראשוני" value="ישיר" />
              <FieldRow label="לקוח מאז" value={new Date(customer.created_at).toLocaleDateString("he-IL")} />
              <FieldRow label="סה״כ שהיות" value={String(reservations.length)} ltr />
              <FieldRow label="סה״כ לילות" value={String(totalNights)} ltr />
              <FieldRow label="דירוג ממוצע"
                value={avgRating != null ? `${avgRating.toFixed(1)} ★` : null} />
            </SectionBar>

            <SectionBar title="סיכום כספי" accent="#F2E9DA" barColor="var(--gold-600)">
              <FieldRow label="סה״כ הכנסה" value={`₪${totalSpent.toLocaleString()}`} ltr />
              <FieldRow label="ממוצע להזמנה"
                value={reservations.length ? `₪${Math.round(totalSpent / reservations.length).toLocaleString()}` : null} ltr />
            </SectionBar>
          </div>
        )}

        {tab === "reservations" && (
          reservations.length === 0 ? (
            <EmptyState text="אין הזמנות עדיין." />
          ) : (
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
                    <td className="px-4 py-2.5">{channelLabel[r.channel as Channel]}</td>
                    <td className="px-4 py-2.5">
                      <span className="rounded-full px-2 py-0.5 text-[11px]"
                        style={{
                          backgroundColor: r.status === "cancelled" ? "var(--danger-bg)" : r.status === "confirmed" ? "var(--success-bg)" : "var(--info-bg)",
                          color: r.status === "cancelled" ? "var(--danger)" : r.status === "confirmed" ? "var(--success)" : "var(--info)",
                        }}>
                        {statusLabel[r.status as ReservationStatus]}
                      </span>
                    </td>
                    <td className="ltr-num px-4 py-2.5">₪{Number(r.total_amount).toLocaleString()}</td>
                    <td className="px-4 py-2.5">{r.rating ? <span className="inline-flex items-center gap-1"><Star size={12} style={{ color: "var(--gold-600)" }} />{r.rating}</span> : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}

        {tab === "comms" && (
          <div className="p-4 space-y-3">
            <form className="grid gap-2 sm:grid-cols-[120px_1fr_auto]"
              onSubmit={(e) => { e.preventDefault(); if (!comm.body.trim()) return; commM.mutate(comm); setComm({ ...comm, subject: "", body: "" }); }}>
              <select className="rounded-md border px-2 py-1.5 text-sm" style={{ borderColor: "var(--border)" }}
                value={comm.channel} onChange={(e) => setComm({ ...comm, channel: e.target.value as "whatsapp" | "email" })}>
                <option value="whatsapp">וואטסאפ</option>
                <option value="email">אימייל</option>
              </select>
              <input placeholder="תוכן הודעה" className="rounded-md border px-2 py-1.5 text-sm" style={{ borderColor: "var(--border)" }}
                value={comm.body} onChange={(e) => setComm({ ...comm, body: e.target.value })} />
              <button className="rounded-md px-3 py-1.5 text-sm font-semibold text-white" style={{ backgroundColor: "var(--navy-900)" }}>הוסף לתיעוד</button>
            </form>
            {communications.length === 0 ? (
              <EmptyState text="אין תקשורת מתועדת עדיין." />
            ) : (
              <ul className="divide-y" style={{ borderColor: "var(--border)" }}>
                {communications.map((c) => (
                  <li key={c.id} className="flex items-start gap-3 py-2.5">
                    <span className="rounded-full px-2 py-0.5 text-[11px]"
                      style={{
                        backgroundColor: c.channel === "whatsapp" ? "var(--success-bg)" : "var(--info-bg)",
                        color: c.channel === "whatsapp" ? "var(--success)" : "var(--info)",
                      }}>
                      {c.channel === "whatsapp" ? "WhatsApp" : c.channel === "email" ? "Email" : "SMS"}
                    </span>
                    <div className="flex-1 min-w-0">
                      {c.subject && <div className="text-sm font-medium">{c.subject}</div>}
                      <div className="text-sm" style={{ color: "var(--text-secondary)" }}>{c.body}</div>
                      <div className="ltr-num mt-0.5 text-[11px]" style={{ color: "var(--text-secondary)" }}>
                        {new Date(c.sent_at).toLocaleString("he-IL")} · {c.direction === "inbound" ? "נכנס" : "יוצא"}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {tab === "notes" && (
          <div className="p-4">
            <div className="mb-2 text-[11px]" style={{ color: "var(--text-secondary)" }}>הערות פנימיות</div>
            <textarea rows={8}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={() => notes !== (customer.notes ?? "") && updM.mutate({ notes })}
              className="w-full rounded-md border p-3 text-sm"
              style={{ borderColor: "var(--border)" }}
              placeholder="כתוב כאן הערות על הלקוח…" />
          </div>
        )}

        {tab === "money" && (
          <div className="grid grid-cols-2 gap-4 p-6 sm:grid-cols-4">
            <Stat label="סה״כ הכנסה" value={`₪${totalSpent.toLocaleString()}`} />
            <Stat label="סה״כ שהיות" value={String(reservations.length)} />
            <Stat label="סה״כ לילות" value={String(totalNights)} />
            <Stat label="דירוג ממוצע" value={avgRating != null ? `${avgRating.toFixed(1)} ★` : "—"} />
          </div>
        )}

        {(tab === "ai" || tab === "company" || tab === "campaigns" || tab === "timeline") && (
          <EmptyState text="עדיין אין תוכן במודול זה." />
        )}
      </div>

      {/* Footer verified */}
      <div className="mt-3 flex items-center justify-between text-xs" style={{ color: "var(--text-secondary)" }}>
        <button className="rounded-md border px-3 py-1.5" style={{ borderColor: "var(--border)" }}>בטל אימות</button>
        <span className="inline-flex items-center gap-1 font-medium" style={{ color: "var(--success)" }}>
          <CheckCircle2 size={14} /> רשומה מאומתת
        </span>
      </div>
    </div>
  );
}

function SectionBar({
  title, accent, barColor, children,
}: { title: string; accent: string; barColor: string; children: React.ReactNode }) {
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

function FieldRow({ label, value, ltr }: { label: string; value: React.ReactNode | null | undefined; ltr?: boolean }) {
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

function EmptyState({ text }: { text: string }) {
  return (
    <div className="p-10 text-center text-sm" style={{ color: "var(--text-secondary)" }}>{text}</div>
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