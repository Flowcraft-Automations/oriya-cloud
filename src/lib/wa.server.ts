// Server-only helpers for WhatsApp / ManyChat placeholders.
// Quiet hours: 09:00-21:00 Asia/Jerusalem. Shabbat: Fri 15:00 -> Sat 21:00.

export type QuietCheck = { allowed: boolean; reason?: string; scheduled_for?: string };

export function checkQuietHours(now: Date = new Date()): QuietCheck {
  const il = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Jerusalem" }));
  const day = il.getDay();
  const h = il.getHours();

  if (day === 5 && h >= 15) return { allowed: false, reason: "shabbat", scheduled_for: nextSaturdayEve(il) };
  if (day === 6 && h < 21) return { allowed: false, reason: "shabbat", scheduled_for: nextSaturdayEve(il) };
  if (h < 9) return { allowed: false, reason: "quiet_hours", scheduled_for: nextMorning(il) };
  if (h >= 21) return { allowed: false, reason: "quiet_hours", scheduled_for: nextMorning(il) };
  return { allowed: true };
}

function nextMorning(il: Date): string {
  const d = new Date(il);
  if (il.getHours() >= 9) d.setDate(d.getDate() + 1);
  d.setHours(9, 0, 0, 0);
  return d.toISOString();
}

function nextSaturdayEve(il: Date): string {
  const d = new Date(il);
  if (d.getDay() === 5) d.setDate(d.getDate() + 1);
  d.setHours(21, 0, 0, 0);
  return d.toISOString();
}
