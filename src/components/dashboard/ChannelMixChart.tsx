import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { OCard, OCardBody, OCardHeader, OCardTitle } from "@/components/ui-oriya/Card";
import { channelMix } from "@/lib/mock/dashboard";

export function ChannelMixChart() {
  return (
    <OCard>
      <OCardHeader>
        <OCardTitle>מיקס ערוצים</OCardTitle>
      </OCardHeader>
      <OCardBody>
        <div className="flex items-center gap-5">
          <div className="h-40 w-40 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={channelMix} dataKey="value" innerRadius={44} outerRadius={64} paddingAngle={2} stroke="none">
                  {channelMix.map((c, i) => (
                    <Cell key={i} fill={c.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} formatter={(v: number, n) => [`${v}%`, n]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="flex-1 space-y-2 text-sm">
            {channelMix.map((c) => (
              <li key={c.name} className="flex items-center justify-between">
                <span className="flex items-center gap-2" style={{ color: "var(--text-secondary)" }}>
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                  {c.name}
                </span>
                <span className="ltr-num font-semibold" style={{ color: "var(--text-primary)" }}>{c.value}%</span>
              </li>
            ))}
          </ul>
        </div>
      </OCardBody>
    </OCard>
  );
}