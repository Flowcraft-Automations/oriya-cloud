import { useMemo, useState } from "react";
import { useSuspenseQuery, useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Send, Check, Clock, AlertCircle, MessageCircle, Reply, ShieldOff, ShieldCheck } from "lucide-react";
import {
  listTemplates,
  listMessages,
  sendTemplateToCustomer,
  sendTemplateByPhone,
  getCustomerConsent,
} from "@/lib/wa.functions";
import { TonePill, EmptyState } from "@/components/detail/DetailLayout";
import type { Tone } from "@/lib/types";

type Props = {
  mode: "customer" | "lead";
  customerId?: string;
  phone: string | null;
  displayName: string;
};

const STATUS_TONE: Record<string, Tone> = {
  queued: "neutral",
  sent: "info",
  delivered: "info",
  read: "success",
  replied: "success",
  failed: "danger",
};

const STATUS_LABEL: Record<string, string> = {
  queued: "בתור",
  sent: "נשלח",
  delivered: "נמסר",
  read: "נקרא",
  replied: "השיב",
  failed: "כשל",
};

function StatusIcon({ status }: { status: string }) {
  const s = 12;
  if (status === "read" || status === "replied") return <Check size={s} />;
  if (status === "queued") return <Clock size={s} />;
  if (status === "failed") return <AlertCircle size={s} />;
  return <Send size={s} />;
}

export function MarketingPanel({ mode, customerId, phone, displayName }: Props) {
  const qc = useQueryClient();
  const templatesFn = useServerFn(listTemplates);
  const messagesFn = useServerFn(listMessages);
  const sendToCustFn = useServerFn(sendTemplateToCustomer);
  const sendByPhoneFn = useServerFn(sendTemplateByPhone);
  const consentFn = useServerFn(getCustomerConsent);

  const templatesQ = useSuspenseQuery({ queryKey: ["wa-templates"], queryFn: () => templatesFn() });
  const messagesQ = useSuspenseQuery({
    queryKey: ["wa-messages", mode, customerId ?? phone],
    queryFn: () =>
      customerId
        ? messagesFn({ data: { customer_id: customerId, limit: 50 } })
        : phone
          ? messagesFn({ data: { phone, limit: 50 } })
          : Promise.resolve([]),
  });
  const consentQ = useQuery({
    queryKey: ["wa-consent", customerId],
    queryFn: () => consentFn({ data: { customer_id: customerId! } }),
    enabled: !!customerId,
  });

  const [picked, setPicked] = useState<string>("");
  const [showResult, setShowResult] = useState<{ ok: boolean; reason?: string } | null>(null);

  const approved = useMemo(
    () => (templatesQ.data ?? []).filter((t: any) => t.status === "approved"),
    [templatesQ.data],
  );

  const sendM = useMutation({
    mutationFn: async (template_name: string) => {
      if (customerId) return sendToCustFn({ data: { customer_id: customerId, template_name } });
      if (phone) return sendByPhoneFn({ data: { phone, template_name } });
      throw new Error("אין טלפון");
    },
    onSuccess: (res: any) => {
      setShowResult({ ok: !!res?.ok, reason: res?.skipped_reason });
      qc.invalidateQueries({ queryKey: ["wa-messages"] });
      setTimeout(() => setShowResult(null), 4000);
    },
  });

  const messages = messagesQ.data ?? [];
  const funnel = messages.reduce(
    (a: Record<string, number>, m: any) => {
      a[m.status] = (a[m.status] ?? 0) + 1;
      return a;
    },
    { queued: 0, sent: 0, delivered: 0, read: 0, replied: 0, failed: 0 },
  );

  const optedOut = !!(customerId && consentQ.data && consentQ.data.opted_in === false);

  return (
    <div className="space-y-6" dir="rtl">
      {/* Manual trigger */}
      <div className="rounded-lg border p-4" style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-subtle)" }}>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>שליחה ידנית</h3>
            <p className="text-[11px]" style={{ color: "var(--text-secondary)" }}>
              שלח תבנית WhatsApp מאושרת ל{mode === "lead" ? "ליד" : "לקוח"} — {displayName}
            </p>
          </div>
          {customerId && (
            optedOut
              ? <TonePill label="הסיר הסכמה" tone="danger" />
              : <span className="inline-flex items-center gap-1 text-[11px]" style={{ color: "var(--success)" }}>
                  <ShieldCheck size={12} /> נתן הסכמה
                </span>
          )}
        </div>
        {!phone ? (
          <div className="text-xs" style={{ color: "var(--danger)" }}>
            <ShieldOff size={12} className="inline" /> אין טלפון — לא ניתן לשלוח
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <select
              className="min-w-[240px] flex-1 rounded-md border px-3 py-2 text-sm"
              style={{ borderColor: "var(--border)", backgroundColor: "white" }}
              value={picked}
              onChange={(e) => setPicked(e.target.value)}
            >
              <option value="">בחר תבנית…</option>
              {approved.map((t: any) => (
                <option key={t.id} value={t.name} disabled={optedOut && t.category === "marketing"}>
                  {t.name} · {t.category === "marketing" ? "שיווקי" : "שירותי"}
                </option>
              ))}
            </select>
            <button
              className="inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
              style={{ backgroundColor: "var(--navy-900)" }}
              disabled={!picked || sendM.isPending}
              onClick={() => sendM.mutate(picked)}
            >
              <Send size={13} /> {sendM.isPending ? "שולח…" : "שלח"}
            </button>
          </div>
        )}
        {showResult && (
          <div className="mt-3 text-xs" style={{ color: showResult.ok ? "var(--success)" : "var(--danger)" }}>
            {showResult.ok ? "✓ נכנס לתור לשליחה" : `לא נשלח: ${showResult.reason ?? "שגיאה"}`}
          </div>
        )}
      </div>

      {/* Funnel snapshot */}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {(["queued", "sent", "delivered", "read", "replied", "failed"] as const).map((k) => (
          <div key={k} className="rounded-lg border p-3" style={{ borderColor: "var(--border)", backgroundColor: "white" }}>
            <div className="text-[10px] uppercase tracking-wide" style={{ color: "var(--text-secondary)" }}>{STATUS_LABEL[k]}</div>
            <div className="ltr-num text-xl font-semibold" style={{ color: "var(--navy-900)" }}>{funnel[k] ?? 0}</div>
          </div>
        ))}
      </div>

      {/* Timeline */}
      <div>
        <h3 className="mb-2 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>היסטוריית הודעות</h3>
        {messages.length === 0 ? (
          <EmptyState text="לא נשלחו הודעות עדיין." />
        ) : (
          <ul className="divide-y rounded-lg border" style={{ borderColor: "var(--border)", backgroundColor: "white" }}>
            {messages.map((m: any) => {
              const tpl = m.wa_templates;
              const isCampaign = !!m.campaign_id;
              const isJourney = !!m.journey_step_id;
              const trigger = isCampaign ? "קמפיין" : isJourney ? "מסע" : "ידני";
              return (
                <li key={m.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full" style={{ backgroundColor: "var(--bg-subtle)", color: `var(--${STATUS_TONE[m.status] === "danger" ? "danger" : STATUS_TONE[m.status] === "success" ? "success" : "navy-700"})` }}>
                    <StatusIcon status={m.status} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium" style={{ color: "var(--text-primary)" }}>
                        {tpl?.name ?? (m.direction === "in" ? "הודעה נכנסת" : "הודעה")}
                      </span>
                      {tpl?.category && (
                        <TonePill label={tpl.category === "marketing" ? "שיווקי" : "שירותי"} tone={tpl.category === "marketing" ? "purple" : "info"} />
                      )}
                      <span className="text-[10px] uppercase tracking-wide" style={{ color: "var(--text-secondary)" }}>{trigger}</span>
                    </div>
                  </div>
                  <TonePill label={STATUS_LABEL[m.status] ?? m.status} tone={STATUS_TONE[m.status] ?? "neutral"} />
                  <span className="ltr-num text-[11px]" style={{ color: "var(--text-secondary)" }}>
                    {new Date(m.created_at).toLocaleString("he-IL", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}