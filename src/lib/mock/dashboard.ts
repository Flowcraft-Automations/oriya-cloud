export const kpis = [
  { key: "conversations", label: "שיחות פתוחות", value: 7, sub: "3 דורשות מענה", tone: "navy" as const },
  { key: "staying", label: "שוהים עכשיו", value: 12, sub: "4 מגיעים · 3 עוזבים", tone: "navy" as const },
  { key: "occupancy", label: "תפוסה החודש", value: "78%", sub: "11 יחידות פעילות", tone: "navy" as const },
  { key: "revenue", label: "הכנסות החודש", value: "₪184,320", sub: "ADR ₪612 · RevPAR ₪478", tone: "gold" as const },
];

export const revenueByMonth = [
  { month: "ינו", value: 121000 },
  { month: "פבר", value: 108000 },
  { month: "מרץ", value: 142000 },
  { month: "אפר", value: 156000 },
  { month: "מאי", value: 171000 },
  { month: "יונ", value: 168000 },
  { month: "יול", value: 184320, current: true },
];

export const occupancyTrend = [
  { month: "ינו", value: 58 },
  { month: "פבר", value: 51 },
  { month: "מרץ", value: 63 },
  { month: "אפר", value: 69 },
  { month: "מאי", value: 74 },
  { month: "יונ", value: 72 },
  { month: "יול", value: 78 },
];

export const channelMix = [
  { name: "Booking", value: 48, color: "var(--ch-booking)" },
  { name: "ישיר", value: 32, color: "var(--ch-direct)" },
  { name: "צימרר", value: 20, color: "var(--ch-tzimmerer)" },
];

export const arrivalsToday = [
  { name: "משפחת כהן", unit: "U360 · דירה 2", time: "15:00" },
  { name: "רועי אבידן", unit: "Seaside · חדר 4", time: "16:30" },
  { name: "משפחת לוי", unit: "Royal Park · סוויטה", time: "17:00" },
];

export const departuresToday = [
  { name: "שרה מזרחי", unit: "Bar Lavi · צימר 1", time: "11:00" },
  { name: "יוסי ברק", unit: "U360 · דירה 5", time: "11:00" },
];

export const newLeads = [
  { name: "מיכל שמעוני", source: "וואטסאפ", interest: "Royal Park · 3 לילות" },
  { name: "אבי גולן", source: "אתר", interest: "Seaside · סוף שבוע" },
  { name: "רותם דהן", source: "צימרר", interest: "Bar Lavi · חג" },
];