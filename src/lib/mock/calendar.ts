export type Channel = "booking" | "direct" | "tzimmerer" | "block";

export const channelColor: Record<Channel, string> = {
  booking: "var(--ch-booking)",
  direct: "var(--ch-direct)",
  tzimmerer: "var(--ch-tzimmerer)",
  block: "var(--ch-block)",
};

export const channelLabel: Record<Channel, string> = {
  booking: "Booking",
  direct: "ישיר",
  tzimmerer: "צימרר",
  block: "חסימה",
};

export type Property = {
  id: string;
  name: string;
  units: { id: string; name: string }[];
};

export const properties: Property[] = [
  {
    id: "u360",
    name: "U360",
    units: [
      { id: "u360-1", name: "דירה 1" },
      { id: "u360-2", name: "דירה 2" },
      { id: "u360-3", name: "דירה 5" },
    ],
  },
  {
    id: "seaside",
    name: "Seaside",
    units: [
      { id: "seaside-2", name: "חדר 2" },
      { id: "seaside-4", name: "חדר 4" },
      { id: "seaside-6", name: "סוויטה" },
    ],
  },
  {
    id: "royal",
    name: "Royal Park",
    units: [
      { id: "royal-a", name: "סוויטה A" },
      { id: "royal-b", name: "סוויטה B" },
      { id: "royal-c", name: "משפחתית" },
    ],
  },
  {
    id: "barlavi",
    name: "Bar Lavi",
    units: [
      { id: "bl-1", name: "צימר 1" },
      { id: "bl-2", name: "צימר 2" },
    ],
  },
];

export type Reservation = {
  id: string;
  unitId: string;
  guest: string;
  phone: string;
  channel: Channel;
  startOffset: number;
  length: number;
};

export const gridDays = 14;
export const gridStartOffset = -3;

export const reservations: Reservation[] = [
  { id: "r1", unitId: "u360-1", guest: "משפחת כהן", phone: "+972-52-1234567", channel: "booking", startOffset: 0, length: 4 },
  { id: "r2", unitId: "u360-1", guest: "יעל שגב", phone: "+972-54-2234567", channel: "direct", startOffset: 6, length: 3 },
  { id: "r3", unitId: "u360-2", guest: "משפחת פרץ", phone: "+972-50-9988776", channel: "tzimmerer", startOffset: 1, length: 2 },
  { id: "r4", unitId: "u360-2", guest: "רועי אבידן", phone: "+972-52-1112233", channel: "booking", startOffset: 5, length: 3 },
  { id: "r5", unitId: "u360-3", guest: "חסימת בעלים", phone: "", channel: "block", startOffset: 2, length: 5 },
  { id: "r6", unitId: "seaside-2", guest: "משפחת לוי", phone: "+972-54-3344556", channel: "booking", startOffset: 3, length: 4 },
  { id: "r7", unitId: "seaside-4", guest: "אבי גולן", phone: "+972-52-7654321", channel: "direct", startOffset: 0, length: 2 },
  { id: "r8", unitId: "seaside-4", guest: "מיכל שמעוני", phone: "+972-50-4433221", channel: "booking", startOffset: 7, length: 5 },
  { id: "r9", unitId: "seaside-6", guest: "שרה מזרחי", phone: "+972-54-1122334", channel: "tzimmerer", startOffset: -2, length: 4 },
  { id: "r10", unitId: "royal-a", guest: "משפחת ברק", phone: "+972-52-6677889", channel: "booking", startOffset: 4, length: 3 },
  { id: "r11", unitId: "royal-a", guest: "יוסי דהן", phone: "+972-54-9911223", channel: "direct", startOffset: 8, length: 4 },
  { id: "r12", unitId: "royal-b", guest: "משפחת מור", phone: "+972-50-3322114", channel: "booking", startOffset: 1, length: 6 },
  { id: "r13", unitId: "royal-c", guest: "רותם דהן", phone: "+972-52-8877665", channel: "tzimmerer", startOffset: 2, length: 3 },
  { id: "r14", unitId: "royal-c", guest: "משפחת עמר", phone: "+972-54-4455667", channel: "direct", startOffset: 9, length: 4 },
  { id: "r15", unitId: "bl-1", guest: "משפחת סבן", phone: "+972-50-5566778", channel: "tzimmerer", startOffset: 0, length: 3 },
  { id: "r16", unitId: "bl-2", guest: "חסימת אחזקה", phone: "", channel: "block", startOffset: 5, length: 2 },
  { id: "r17", unitId: "bl-2", guest: "אורלי גל", phone: "+972-52-1199887", channel: "booking", startOffset: 10, length: 3 },
];