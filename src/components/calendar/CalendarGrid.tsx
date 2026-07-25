import { useState } from "react";
import {
  channelColor,
  channelLabel,
  gridDays,
  gridStartOffset,
  properties,
  reservations,
  type Reservation,
} from "@/lib/mock/calendar";
import { OCard } from "@/components/ui-oriya/Card";
import { ReservationPopover } from "./ReservationPopover";

const dayNames = ["א", "ב", "ג", "ד", "ה", "ו", "ש"];

function addDays(d: Date, n: number) {
  const nd = new Date(d);
  nd.setDate(nd.getDate() + n);
  return nd;
}

export function CalendarGrid() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const gridStart = addDays(today, gridStartOffset);
  const days = Array.from({ length: gridDays }, (_, i) => addDays(gridStart, i));
  const [selected, setSelected] = useState<Reservation | null>(null);

  const colW = 88;
  const rowH = 44;
  const labelW = 160;

  return (
    <OCard className="overflow-hidden">
      <div className="overflow-x-auto" dir="ltr">
        <div style={{ minWidth: labelW + gridDays * colW }}>
          {/* Header row */}
          <div className="flex">
            <div
              className="sticky left-0 z-20 h-12 border-b border-r bg-white"
              style={{ borderColor: "var(--border)", width: labelW }}
            />
            {days.map((d, i) => {
              const isToday = d.getTime() === today.getTime();
              const isSat = d.getDay() === 6;
              return (
                <div
                  key={i}
                  className="flex h-12 flex-col items-center justify-center border-b border-r text-[11px]"
                  style={{
                    width: colW,
                    borderColor: "var(--border)",
                    backgroundColor: isToday
                      ? "var(--navy-100)"
                      : isSat
                        ? "var(--bg-subtle)"
                        : "#fff",
                    color: isToday ? "var(--navy-700)" : "var(--text-secondary)",
                  }}
                >
                  <span className="font-medium">{dayNames[d.getDay()]}</span>
                  <span className={isToday ? "font-bold" : ""}>
                    {d.getDate()}/{d.getMonth() + 1}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Property groups */}
          {properties.map((property) => (
            <div key={property.id}>
              {/* Property header row */}
              <div className="flex">
                <div
                  className="sticky left-0 z-10 flex h-9 items-center border-b border-r px-3 text-[12px] font-semibold"
                  style={{
                    width: labelW,
                    borderColor: "var(--border)",
                    backgroundColor: "var(--bg-subtle)",
                    color: "var(--navy-700)",
                  }}
                  dir="rtl"
                >
                  {property.name}
                </div>
                {days.map((d, i) => {
                  const isSat = d.getDay() === 6;
                  const isToday = d.getTime() === today.getTime();
                  return (
                    <div
                      key={i}
                      className="h-9 border-b border-r"
                      style={{
                        width: colW,
                        borderColor: "var(--border)",
                        backgroundColor: isToday
                          ? "var(--navy-100)"
                          : isSat
                            ? "var(--bg-subtle)"
                            : "var(--bg-subtle)",
                      }}
                    />
                  );
                })}
              </div>

              {/* Unit rows */}
              {property.units.map((unit) => {
                const unitRes = reservations.filter((r) => r.unitId === unit.id);
                return (
                  <div key={unit.id} className="flex">
                    <div
                      className="sticky left-0 z-10 flex items-center border-b border-r bg-white px-3 text-[13px]"
                      style={{
                        width: labelW,
                        height: rowH,
                        borderColor: "var(--border)",
                        color: "var(--text-primary)",
                      }}
                      dir="rtl"
                    >
                      {unit.name}
                    </div>
                    <div className="relative flex border-b" style={{ height: rowH, borderColor: "var(--border)" }}>
                      {days.map((d, i) => {
                        const isToday = d.getTime() === today.getTime();
                        const isSat = d.getDay() === 6;
                        return (
                          <div
                            key={i}
                            className="border-r"
                            style={{
                              width: colW,
                              borderColor: "var(--border)",
                              backgroundColor: isToday
                                ? "var(--navy-100)"
                                : isSat
                                  ? "var(--bg-subtle)"
                                  : "#fff",
                            }}
                          />
                        );
                      })}
                      {unitRes.map((r) => {
                        const start = Math.max(0, r.startOffset - gridStartOffset);
                        const end = Math.min(gridDays, r.startOffset - gridStartOffset + r.length);
                        if (end <= 0 || start >= gridDays) return null;
                        const left = start * colW + 4;
                        const width = (end - start) * colW - 8;
                        const isBlock = r.channel === "block";
                        return (
                          <button
                            key={r.id}
                            onClick={() => setSelected(r)}
                            className={`absolute top-1.5 flex h-8 items-center overflow-hidden rounded-md px-2 text-[12px] font-medium transition hover:brightness-110 ${
                              isBlock ? "stripes-block" : ""
                            }`}
                            style={{
                              left,
                              width,
                              backgroundColor: isBlock ? undefined : channelColor[r.channel],
                              color: isBlock ? "var(--text-primary)" : "#fff",
                            }}
                            title={`${r.guest} · ${channelLabel[r.channel]}`}
                            dir="rtl"
                          >
                            <span className="truncate">{r.guest}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {selected && <ReservationPopover reservation={selected} onClose={() => setSelected(null)} />}
    </OCard>
  );
}