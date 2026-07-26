export type Channel = "booking" | "direct" | "tzimmerer" | "airbnb" | "vrbo" | "block";
export type ReservationStatus = "pending" | "confirmed" | "checkin" | "checkout" | "cancelled";
export type LeadSource = "whatsapp" | "website" | "tzimmerer" | "instagram" | "referral" | "other";
export type LeadStage = "new" | "contacted" | "quoted" | "booked" | "lost";

export const channelColorVar: Record<Channel, string> = {
  booking: "var(--ch-booking)",
  direct: "var(--ch-direct)",
  tzimmerer: "var(--ch-tzimmerer)",
  airbnb: "var(--ch-booking)",
  vrbo: "var(--ch-direct)",
  block: "var(--ch-block)",
};

export const channelLabel: Record<Channel, string> = {
  booking: "Booking",
  direct: "ישיר",
  tzimmerer: "צימרר",
  airbnb: "Airbnb",
  vrbo: "Vrbo",
  block: "חסימה",
};

export const statusLabel: Record<ReservationStatus, string> = {
  pending: "מוזמן",
  confirmed: "מאושר",
  checkin: "צ'ק-אין",
  checkout: "צ'ק-אאוט",
  cancelled: "בוטל",
};

export const sourceLabel: Record<LeadSource, string> = {
  whatsapp: "וואטסאפ",
  website: "אתר",
  tzimmerer: "צימרר",
  instagram: "אינסטגרם",
  referral: "הפניה",
  other: "אחר",
};

export const stageLabel: Record<LeadStage, string> = {
  new: "חדש",
  contacted: "יצרנו קשר",
  quoted: "הצעת מחיר",
  booked: "הוזמן",
  lost: "אבוד",
};

export type Tone = "success" | "info" | "gold" | "neutral" | "danger" | "purple" | "warning";

export const sourceTone: Record<LeadSource, Tone> = {
  whatsapp: "success",
  website: "info",
  tzimmerer: "purple",
  instagram: "gold",
  referral: "warning",
  other: "neutral",
};

export const stageTone: Record<LeadStage, Tone> = {
  new: "info",
  contacted: "gold",
  quoted: "warning",
  booked: "success",
  lost: "danger",
};

export const statusTone: Record<ReservationStatus, Tone> = {
  pending: "info",
  confirmed: "success",
  checkin: "gold",
  checkout: "neutral",
  cancelled: "danger",
};

export const channelTone: Record<Channel, Tone> = {
  booking: "info",
  direct: "gold",
  tzimmerer: "purple",
  airbnb: "danger",
  vrbo: "warning",
  block: "neutral",
};

export type Property = { id: string; name: string; address: string | null; notes: string | null };
export type Unit = {
  id: string;
  property_id: string;
  name: string;
  capacity: number;
  base_price: number;
  notes: string | null;
};
export type Customer = {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  id_number: string | null;
  tags: string[];
  notes: string | null;
  created_at: string;
};
export type Reservation = {
  id: string;
  unit_id: string;
  customer_id: string | null;
  guest_name: string;
  phone: string | null;
  channel: Channel;
  status: ReservationStatus;
  check_in: string;
  check_out: string;
  nights: number | null;
  adults: number;
  children: number;
  total_amount: number;
  paid_amount: number;
  notes: string | null;
};
export type Lead = {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  source: LeadSource;
  interest: string | null;
  stage: LeadStage;
  property_id: string | null;
  notes: string | null;
  created_at: string;
  warmth?: string | null;
  bot_stage?: string | null;
  last_bot_event_at?: string | null;
  manychat_subscriber_id?: string | null;
};