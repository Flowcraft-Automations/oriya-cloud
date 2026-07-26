import { useMemo } from "react";
import { Clock, Check, Link2, FileSignature, CreditCard, PhoneCall, Sparkles, Pause, X } from "lucide-react";
import { TonePill } from "@/components/detail/DetailLayout";
import type { Tone } from "@/lib/types";

type Props = { seed: string; leadName: string };

type StepState = "done" | "waiting" | "pending" | "skipped";
type JourneyState = "active" | "waiting" | "completed" | "not_triggered" | "stopped";

type StepView = {
  label: string;
  state: StepState;
  meta?: string;
  preview?: string;
};

type JourneyView = {
  key: string;
  icon: any;
  accent: string;
  title: string;
  subtitle: string;
  trigger: string;
  state: JourneyState;
  nextInHours?: number;
  steps: StepView[];
};

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

const STATE_TONE: Record<JourneyState, Tone> = {
  active: "success",
  waiting: "warning",
  completed: "info",
  not_triggered: "neutral",
  stopped: "danger",
};
const STATE_LABEL: Record<JourneyState, string> = {
  active: "פעיל",
  waiting: "ממתין",
  completed: "הושלם",
  not_triggered: "לא הופעל",
  stopped: "הופסק",
};

function buildJourneys(seed: string, name: string): JourneyView[] {
  const h = hash(seed || "x");
  const firstName = (name || "אורח").split(" ")[0];
  const unit = ["סוויטה 3", "סוויטה 5", "פנטהאוז", "לופט גן"][h % 4];
  const link = "orya-suites.com/u/" + (h % 9000 + 1000).toString();

  // Deterministic per-lead progress buckets (0..4)
  const p = [h % 5, (h >> 3) % 5, (h >> 6) % 5, (h >> 9) % 5, (h >> 12) % 5];

  const j1: JourneyView = (() => {
    const stage = p[0];
    const steps: StepView[] = [
      { label: "ליד קיבל קישור לדירה", state: "done", meta: `${unit} · ${link}` },
      {
        label: "המתנה 3 שעות ללא השלמת הזמנה",
        state: stage === 0 ? "waiting" : stage >= 1 ? "done" : "pending",
        meta: stage === 0 ? "עוד 2:14 שעות" : "3 שעות עברו",
      },
      {
        label: "פולו-אפ עדין עם הקישור הישיר",
        state: stage >= 2 ? "done" : stage === 1 ? "waiting" : "pending",
        preview: `היי ${firstName}, ראינו שהצצת ב${unit} 🌿 שומרים לך אותה? הנה שוב הקישור: ${link}`,
      },
      {
        label: "המתנה לתגובה",
        state: stage === 4 ? "done" : stage === 3 ? "waiting" : "pending",
      },
    ];
    return {
      key: "j1",
      icon: Link2,
      accent: "#2563eb",
      title: "פולו-אפ ראשון · 3 שעות",
      subtitle: "ליד שקיבל קישור לדירה ולא השלים הזמנה",
      trigger: "טריגר: שליחת קישור · אין הזמנה תוך 3 שעות",
      state: stage === 0 ? "waiting" : stage === 4 ? "completed" : "active",
      nextInHours: stage === 0 ? 3 : undefined,
      steps,
    };
  })();

  const j2: JourneyView = (() => {
    const stage = p[1];
    const steps: StepView[] = [
      { label: "פולו-אפ ראשון נשלח", state: stage === 0 ? "pending" : "done" },
      {
        label: "המתנה 24 שעות ללא תגובה",
        state: stage === 1 ? "waiting" : stage >= 2 ? "done" : "pending",
        meta: stage === 1 ? "עוד 14 שעות" : undefined,
      },
      {
        label: "הודעת ערך · אמצע שבוע משתלם",
        state: stage >= 3 ? "done" : stage === 2 ? "waiting" : "pending",
        preview: `${firstName}, אמצע השבוע ב${unit} הכי שקט ושווה — 20% מתחת לסוף שבוע. רוצים תאריכים לדוגמה?`,
      },
    ];
    return {
      key: "j2",
      icon: Sparkles,
      accent: "#7c3aed",
      title: "פולו-אפ שני · 24 שעות",
      subtitle: "הודעת ערך במקום לחץ מכירתי",
      trigger: "טריגר: 24ש׳ ללא תגובה אחרי פולו-אפ ראשון",
      state: stage === 3 ? "completed" : stage <= 1 ? "waiting" : "active",
      nextInHours: stage === 1 ? 14 : undefined,
      steps,
    };
  })();

  const j3: JourneyView = (() => {
    const hasMinor = h % 3 === 0;
    if (!hasMinor) {
      return {
        key: "j3",
        icon: FileSignature,
        accent: "#0d9488",
        title: "בקשת חתימת הורה",
        subtitle: "טופס הסכמה דיגיטלי למשתתפים מתחת ל-18",
        trigger: "טריגר: קבוצה עם משתתף מתחת ל-18",
        state: "not_triggered",
        steps: [{ label: "אין משתתפים מתחת לגיל 18 בהזמנה", state: "skipped" }],
      };
    }
    const stage = p[2];
    const steps: StepView[] = [
      { label: "זוהה משתתף מתחת ל-18", state: "done", meta: "2 קטינים" },
      {
        label: "קישור לטופס הסכמת הורה נשלח",
        state: stage >= 1 ? "done" : "waiting",
        preview: `${firstName}, לצורך צ׳ק-אין חלק — נא לחתום דיגיטלית על אישור ההורה: orya-suites.com/consent/${(h % 9000 + 1000)}`,
      },
      {
        label: "המתנה 6 שעות לחתימה",
        state: stage === 4 ? "done" : stage >= 2 ? "waiting" : "pending",
        meta: stage === 2 ? "עוד 4:20 שעות" : stage === 3 ? "פג — נשלחה תזכורת" : undefined,
      },
      {
        label: "תזכורת חתימה",
        state: stage >= 3 ? "done" : "pending",
      },
    ];
    return {
      key: "j3",
      icon: FileSignature,
      accent: "#0d9488",
      title: "בקשת חתימת הורה",
      subtitle: "טופס הסכמה דיגיטלי למשתתפים מתחת ל-18",
      trigger: "טריגר: קבוצה עם משתתף מתחת ל-18 · תזכורת 6ש׳",
      state: stage === 4 ? "completed" : stage >= 2 ? "waiting" : "active",
      nextInHours: stage === 2 ? 4 : undefined,
      steps,
    };
  })();

  const j4: JourneyView = (() => {
    const stage = p[3];
    const amount = 500 + (h % 12) * 50;
    const steps: StepView[] = [
      { label: "קישור תשלום מקדמה נשלח", state: "done", meta: `₪${amount.toLocaleString("he-IL")}` },
      {
        label: "המתנה לתשלום",
        state: stage === 0 ? "waiting" : stage >= 1 ? "done" : "pending",
        meta: stage === 0 ? "עוד 6 שעות עד תזכורת" : undefined,
      },
      {
        label: "תזכורת מנומסת + קישור",
        state: stage >= 2 ? "done" : stage === 1 ? "waiting" : "pending",
        preview: `${firstName}, רק תזכורת ידידותית — כדי להבטיח את ${unit} בתאריכים שביקשתם, אפשר להשלים כאן: orya-suites.com/pay/${(h % 9000 + 1000)}`,
      },
      {
        label: "אין תשלום · הזמנה נשמרת לליד",
        state: stage === 4 ? "done" : stage === 3 ? "waiting" : "pending",
        meta: stage === 4 ? "ההזמנה הועברה חזרה לליד" : undefined,
      },
    ];
    return {
      key: "j4",
      icon: CreditCard,
      accent: "#059669",
      title: "תזכורת תשלום מקדמה",
      subtitle: "תזכורת אחת מנומסת · ההזמנה לא הולכת לאיבוד",
      trigger: "טריגר: קישור תשלום נשלח · לא שולם",
      state: stage === 4 ? "completed" : stage === 0 ? "waiting" : "active",
      nextInHours: stage === 0 ? 6 : undefined,
      steps,
    };
  })();

  const j5: JourneyView = (() => {
    const requested = h % 2 === 0;
    if (!requested) {
      return {
        key: "j5",
        icon: PhoneCall,
        accent: "#d97706",
        title: "בקשת שיחה חוזרת",
        subtitle: "\"חזרו אליי\" — אף פעם לא נופל בין הכיסאות",
        trigger: "טריגר: ליד ביקש שיחה חוזרת · לא הושג",
        state: "not_triggered",
        steps: [{ label: "הליד לא ביקש שיחה חוזרת", state: "skipped" }],
      };
    }
    const stage = p[4];
    const steps: StepView[] = [
      { label: "בקשת שיחה התקבלה", state: "done", meta: "בוט · יום ג׳ 14:20" },
      {
        label: "ניסיון התקשרות · לא נענה",
        state: stage >= 1 ? "done" : "waiting",
      },
      {
        label: "הודעת תיאום מחדש אוטומטית",
        state: stage >= 2 ? "done" : stage === 1 ? "waiting" : "pending",
        preview: `${firstName}, ניסינו לחזור אליך ולא הצלחנו לתפוס — מתי נוח לך שנתקשר? אפשר גם לבחור חלון כאן: orya-suites.com/callback`,
      },
      {
        label: "המתנה לבחירת חלון",
        state: stage === 4 ? "done" : stage >= 3 ? "waiting" : "pending",
      },
    ];
    return {
      key: "j5",
      icon: PhoneCall,
      accent: "#d97706",
      title: "בקשת שיחה חוזרת",
      subtitle: "\"חזרו אליי\" — אף פעם לא נופל בין הכיסאות",
      trigger: "טריגר: ליד ביקש שיחה חוזרת · לא הושג",
      state: stage === 4 ? "completed" : stage <= 1 ? "active" : "waiting",
      nextInHours: stage === 3 ? 2 : undefined,
      steps,
    };
  })();

  return [j1, j2, j3, j4, j5];
}

function StepDot({ state }: { state: StepState }) {
  if (state === "done")
    return (
      <span className="flex h-5 w-5 items-center justify-center rounded-full text-white" style={{ backgroundColor: "var(--success)" }}>
        <Check size={12} />
      </span>
    );
  if (state === "waiting")
    return (
      <span className="flex h-5 w-5 items-center justify-center rounded-full text-white" style={{ backgroundColor: "var(--warning)" }}>
        <Clock size={12} />
      </span>
    );
  if (state === "skipped")
    return (
      <span className="flex h-5 w-5 items-center justify-center rounded-full" style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)" }}>
        <X size={12} />
      </span>
    );
  return (
    <span className="flex h-5 w-5 items-center justify-center rounded-full border" style={{ borderColor: "var(--border)", backgroundColor: "white", color: "var(--text-secondary)" }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: "var(--text-secondary)" }} />
    </span>
  );
}

export function LeadJourneysDemo({ seed, leadName }: Props) {
  const journeys = useMemo(() => buildJourneys(seed, leadName), [seed, leadName]);
  const totals = journeys.reduce(
    (a, j) => {
      a[j.state] = (a[j.state] ?? 0) + 1;
      return a;
    },
    {} as Record<JourneyState, number>,
  );

  return (
    <div className="space-y-3" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            מסעות לידים
          </h3>
          <p className="text-[11px]" style={{ color: "var(--text-secondary)" }}>
            5 מסעות אוטומטיים · מותאמים ל־{leadName}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(["active", "waiting", "completed", "not_triggered"] as JourneyState[]).map((k) =>
            totals[k] ? (
              <span
                key={k}
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
                style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-primary)" }}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{
                    backgroundColor:
                      k === "active" ? "var(--success)" : k === "waiting" ? "var(--warning)" : k === "completed" ? "var(--info)" : "var(--text-tertiary)",
                  }}
                />
                <span className="ltr-num">{totals[k]}</span> {STATE_LABEL[k]}
              </span>
            ) : null,
          )}
        </div>
      </div>

      <ul className="space-y-3">
        {journeys.map((j) => {
          const Icon = j.icon;
          const muted = j.state === "not_triggered";
          return (
            <li
              key={j.key}
              className="overflow-hidden rounded-xl border"
              style={{ borderColor: "var(--border)", backgroundColor: "white", opacity: muted ? 0.75 : 1 }}
            >
              <div
                className="flex items-start gap-3 border-b px-4 py-3"
                style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-subtle)" }}
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white"
                  style={{ backgroundColor: j.accent }}
                >
                  <Icon size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold" style={{ color: "var(--navy-900)" }}>
                      {j.title}
                    </span>
                    <TonePill label={STATE_LABEL[j.state]} tone={STATE_TONE[j.state]} />
                    {j.nextInHours != null && (
                      <span
                        className="inline-flex items-center gap-1 text-[11px]"
                        style={{ color: "var(--warning)" }}
                      >
                        <Pause size={11} /> שליחה הבאה בעוד <span className="ltr-num">{j.nextInHours}</span> שעות
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 text-[12px]" style={{ color: "var(--text-secondary)" }}>
                    {j.subtitle}
                  </div>
                  <div className="mt-1 text-[10px] uppercase tracking-wide" style={{ color: "var(--text-tertiary)" }}>
                    {j.trigger}
                  </div>
                </div>
              </div>

              <ol className="relative px-4 py-3">
                {j.steps.map((s, i) => (
                  <li key={i} className="relative flex gap-3 pb-3 last:pb-0">
                    {i < j.steps.length - 1 && (
                      <span
                        className="absolute right-[9px] top-5 bottom-0 w-px"
                        style={{ backgroundColor: "var(--border)" }}
                      />
                    )}
                    <StepDot state={s.state} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-2">
                        <span
                          className="text-[13px]"
                          style={{
                            color: s.state === "pending" || s.state === "skipped" ? "var(--text-secondary)" : "var(--text-primary)",
                            fontWeight: s.state === "waiting" ? 600 : 400,
                          }}
                        >
                          {s.label}
                        </span>
                        {s.meta && (
                          <span className="ltr-num text-[11px]" style={{ color: "var(--text-secondary)" }}>
                            {s.meta}
                          </span>
                        )}
                      </div>
                      {s.preview && (
                        <div className="mt-1.5 flex justify-end">
                          <div
                            className="max-w-[90%] rounded-lg rounded-br-sm px-3 py-2 text-[12px]"
                            style={{
                              backgroundColor: "#dcf8c6",
                              color: "#0b1220",
                              whiteSpace: "pre-wrap",
                              lineHeight: 1.5,
                            }}
                          >
                            {s.preview}
                          </div>
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </li>
          );
        })}
      </ul>
    </div>
  );
}