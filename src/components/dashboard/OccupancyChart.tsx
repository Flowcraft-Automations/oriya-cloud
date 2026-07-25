import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { OCard, OCardBody, OCardHeader, OCardTitle } from "@/components/ui-oriya/Card";
import { occupancyTrend } from "@/lib/mock/dashboard";

export function OccupancyChart() {
  return (
    <OCard>
      <OCardHeader>
        <OCardTitle>מגמת תפוסה</OCardTitle>
        <span className="text-xs" style={{ color: "var(--text-secondary)" }}>%</span>
      </OCardHeader>
      <OCardBody>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={occupancyTrend} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis dataKey="month" reversed tickLine={false} axisLine={false} tick={{ fill: "var(--text-secondary)", fontSize: 12 }} />
              <YAxis orientation="right" tickLine={false} axisLine={false} tick={{ fill: "var(--text-secondary)", fontSize: 11 }} domain={[0, 100]} />
              <Tooltip contentStyle={{ border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} formatter={(v: number) => [`${v}%`, "תפוסה"]} />
              <Line type="monotone" dataKey="value" stroke="var(--navy-500)" strokeWidth={2.5} dot={{ r: 3, fill: "var(--navy-700)", strokeWidth: 0 }} activeDot={{ r: 5, fill: "var(--gold-600)", strokeWidth: 0 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </OCardBody>
    </OCard>
  );
}