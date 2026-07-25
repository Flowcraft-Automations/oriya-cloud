import { channelColorVar as channelColor, channelLabel, type Channel } from "@/lib/types";

const items: Channel[] = ["booking", "direct", "tzimmerer", "block"];

export function ChannelLegend() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {items.map((c) => (
        <div key={c} className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-secondary)" }}>
          {c === "block" ? (
            <span className="stripes-block h-3 w-4 rounded-sm" />
          ) : (
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: channelColor[c] }} />
          )}
          <span>{channelLabel[c]}</span>
        </div>
      ))}
    </div>
  );
}