import { useState } from "react";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Send } from "lucide-react";
import { listJourneys, toggleJourney, toggleJourneyStep, sendJourneyTest } from "@/lib/wa.functions";
import { TonePill } from "@/components/detail/DetailLayout";

export function JourneysTab() {
  const list = useServerFn(listJourneys);
  const tJourney = useServerFn(toggleJourney);
  const tStep = useServerFn(toggleJourneyStep);
  const testFn = useServerFn(sendJourneyTest);
  const qc = useQueryClient();
  const q = useSuspenseQuery({ queryKey: ["wa-journeys"], queryFn: () => list() });

  const jMut = useMutation({
    mutationFn: (p: { id: string; is_active: boolean }) => tJourney({ data: p }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["wa-journeys"] }),
  });
  const sMut = useMutation({
    mutationFn: (p: { id: string; is_active: boolean }) => tStep({ data: p }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["wa-journeys"] }),
  });
  const testMut = useMutation({ mutationFn: (p: { step_id: string; to_phone: string }) => testFn({ data: p }) });

  const [testStep, setTestStep] = useState<string | null>(null);
  const [testPhone, setTestPhone] = useState("");

  return (
    <div className="space-y-8" dir="rtl">
      {q.data.journeys.map((j) => {
        const jsteps = q.data.steps.filter((s: any) => s.journey_id === j.id);
        return (
          <section key={j.id}>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{j.name_he}</h3>
                <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{j.description_he}</p>
              </div>
              <label className="inline-flex items-center gap-2 text-xs">
                <span style={{ color: "var(--text-secondary)" }}>{j.is_active ? "פעיל" : "כבוי"}</span>
                <input
                  type="checkbox"
                  checked={j.is_active}
                  onChange={(e) => jMut.mutate({ id: j.id, is_active: e.target.checked })}
                  className="h-4 w-8"
                />
              </label>
            </div>
            <div className="rounded-lg border overflow-hidden" style={{ borderColor: "var(--border)", backgroundColor: "white" }}>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-right text-[11px] uppercase" style={{ color: "var(--text-secondary)" }}>
                    <th className="px-4 py-2.5 w-20">שלב</th>
                    <th className="px-4 py-2.5">שם</th>
                    <th className="px-4 py-2.5">טריגר</th>
                    <th className="px-4 py-2.5">תבנית</th>
                    <th className="px-4 py-2.5 w-20">פעיל</th>
                    <th className="px-4 py-2.5 w-16"></th>
                  </tr>
                </thead>
                <tbody>
                  {jsteps.map((s: any) => {
                    const tpl = s.wa_templates;
                    const tone = s.mode === "in_window" ? "gold" : tpl?.category === "marketing" ? "purple" : "info";
                    return (
                      <tr key={s.id} className="border-t" style={{ borderColor: "var(--border)" }}>
                        <td className="px-4 py-2.5 font-mono text-[12px]" style={{ color: "var(--gold-600)" }}>{s.step_code}</td>
                        <td className="px-4 py-2.5">{s.name_he}</td>
                        <td className="px-4 py-2.5 text-xs" style={{ color: "var(--text-secondary)" }}>{s.trigger_he}</td>
                        <td className="px-4 py-2.5">
                          <TonePill label={s.mode === "in_window" ? "in-window flow" : tpl?.name ?? "—"} tone={tone as any} />
                        </td>
                        <td className="px-4 py-2.5">
                          <input type="checkbox" checked={s.is_active}
                            onChange={(e) => sMut.mutate({ id: s.id, is_active: e.target.checked })} />
                        </td>
                        <td className="px-4 py-2.5">
                          <button
                            className="inline-flex items-center gap-1 rounded border px-2 py-1 text-[11px]"
                            style={{ borderColor: "var(--border)", color: "var(--navy-700)" }}
                            onClick={() => setTestStep(s.id)}
                            disabled={!tpl}
                            title={tpl ? "שלח בדיקה" : "אין תבנית"}
                          >
                            <Send size={11} /> בדיקה
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}

      {testStep && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setTestStep(null)}>
          <div dir="rtl" className="w-[360px] rounded-lg bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h4 className="mb-3 text-sm font-semibold">שלח בדיקה אליי</h4>
            <input
              className="w-full rounded border px-3 py-2 text-sm ltr-num"
              dir="ltr"
              placeholder="+972..."
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
            />
            <div className="mt-3 flex justify-end gap-2">
              <button className="rounded border px-3 py-1.5 text-xs" onClick={() => setTestStep(null)}>ביטול</button>
              <button
                className="rounded px-3 py-1.5 text-xs text-white"
                style={{ backgroundColor: "var(--navy-700)" }}
                onClick={() => {
                  testMut.mutate({ step_id: testStep, to_phone: testPhone }, {
                    onSuccess: () => { setTestStep(null); setTestPhone(""); alert("נשלח לתור לבדיקה"); },
                  });
                }}
              >שלח</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
