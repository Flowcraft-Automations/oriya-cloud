import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getInvoiceByPaymentToken, markPaymentTokenPaid } from "@/lib/orders.functions";

export const Route = createFileRoute("/pay/$token")({
  head: () => ({ meta: [{ title: "תשלום · Oriya" }] }),
  component: PayPage,
});

function PayPage() {
  const { token } = Route.useParams();
  const get = useServerFn(getInvoiceByPaymentToken);
  const pay = useServerFn(markPaymentTokenPaid);
  const q = useSuspenseQuery({ queryKey: ["pay", token], queryFn: () => get({ data: { token } }) });
  const m = useMutation({ mutationFn: () => pay({ data: { token } }), onSuccess: () => q.refetch() });

  if (!q.data.found) {
    return (
      <div dir="rtl" className="min-h-screen bg-[#F8F5EF] flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-2xl bg-white p-8 text-center border" style={{ borderColor: "#E7DFCF" }}>
          <div className="text-lg font-semibold">קישור לא תקין</div>
          <div className="mt-2 text-sm text-slate-600">הקישור פג תוקף או שאינו קיים.</div>
        </div>
      </div>
    );
  }

  const inv = q.data;
  const paid = inv.status === "paid";

  return (
    <div dir="rtl" className="min-h-screen bg-[#F8F5EF] flex items-center justify-center p-6" style={{ fontFamily: "'Assistant', system-ui, sans-serif" }}>
      <div className="max-w-md w-full rounded-2xl bg-white overflow-hidden border shadow-sm" style={{ borderColor: "#E7DFCF" }}>
        <div className="px-8 py-6 border-b" style={{ borderColor: "#E7DFCF", background: "linear-gradient(135deg, #1D2A44 0%, #253656 100%)" }}>
          <div className="text-[11px] uppercase tracking-widest text-amber-200/80">Oriya · Luxury Suites</div>
          <div className="mt-1 text-xl font-semibold text-white">{paid ? "תשלום התקבל" : "תשלום הזמנה"}</div>
          <div className="mt-1 text-sm text-slate-200/80">חשבונית {inv.invoice_number}</div>
        </div>

        <div className="p-8 space-y-5">
          <div className="space-y-1">
            <div className="text-xs uppercase tracking-wide text-slate-500">אורח</div>
            <div className="text-base font-semibold text-slate-900">{inv.guest_name || "—"}</div>
          </div>
          {(inv.property || inv.unit) && (
            <div className="space-y-1">
              <div className="text-xs uppercase tracking-wide text-slate-500">נכס</div>
              <div className="text-sm text-slate-800">{inv.property} · {inv.unit}</div>
            </div>
          )}
          {inv.check_in && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">שהות</span>
              <span dir="ltr" className="font-mono text-slate-800">{inv.check_in} → {inv.check_out}</span>
            </div>
          )}
          <div className="rounded-xl px-5 py-4 flex items-baseline justify-between" style={{ backgroundColor: "#F2E9DA" }}>
            <span className="text-xs uppercase tracking-widest text-amber-900">סה״כ לתשלום</span>
            <span dir="ltr" className="text-3xl font-bold text-amber-950">₪{inv.total.toLocaleString()}</span>
          </div>

          {paid ? (
            <div className="rounded-xl px-4 py-3 text-center text-emerald-800 bg-emerald-50 border border-emerald-200 text-sm">
              ✓ התשלום בוצע בהצלחה. תודה!
            </div>
          ) : (
            <button
              onClick={() => m.mutate()}
              disabled={m.isPending}
              className="w-full rounded-xl py-3.5 text-white font-semibold shadow-sm transition-transform active:scale-[0.99] disabled:opacity-60"
              style={{ backgroundColor: "#1D2A44" }}>
              {m.isPending ? "מעבד..." : "אישור תשלום · הדגמה"}
            </button>
          )}

          <div className="text-[11px] text-center text-slate-400">
            סביבת הדגמה · לא מחייב תשלום אמיתי
          </div>
        </div>
      </div>
    </div>
  );
}