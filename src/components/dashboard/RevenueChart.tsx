import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { OCard, OCardBody, OCardHeader, OCardTitle } from "@/components/ui-oriya/Card";
import { revenueByMonth } from "@/lib/mock/dashboard";

export function RevenueChart() {
  return (
    <OCard>
      <OCardHeader>
        <OCardTitle>הכנסות לפי חודש</OCardTitle>
        <span className="text-xs" style={{ color: "var(--text-secondary)" }}>₪ · 2026</span>
      </OCardHeader>
      <OCardBody>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={revenueByMonth} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis dataKey="month" reversed tickLine={false} axisLine={false} tick={{ fill: "var(--text-secondary)", fontSize: 12 }} />
              <YAxis orientation="right" tickLine={false} axisLine={false} tick={{ fill: "var(--text-secondary)", fontSize: 11 }} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
              <Tooltip cursor={{ fill: "var(--bg-subtle)" }} contentStyle={{ border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} formatter={(v: number) => [`₪${v.toLocaleString()}`, "הכנסות"]} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {revenueByMonth.map((d, i) => (
                  <Cell key={i} fill={d.current ? "var(--gold-600)" : "var(--navy-700)"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </OCardBody>
    </OCard>
  );
}