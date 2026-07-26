// Seed the CRM with the real Or-Ya Suite's data from orya-suites.com.
// Run with: SEED_ADMIN_EMAIL=... SEED_ADMIN_PASSWORD=... node --env-file=.env scripts/seed-orya.ts
// Idempotent: properties that already exist (by name, for this owner) are skipped.
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
if (!url || !key) throw new Error("Missing SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY in .env");

const email = process.env.SEED_ADMIN_EMAIL;
const password = process.env.SEED_ADMIN_PASSWORD;
if (!email || !password) throw new Error("Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD env vars (the CRM admin login)");

type SeedEntry = {
  property: { name: string; address: string; notes: string };
  unit: { name: string; capacity: number; base_price: number; notes: string };
};

const SEED: SeedEntry[] = [
  {
    property: {
      name: "oR-Ya Suite · U360",
      address: "אילת · שדרות ששת הימים (מתחם U360)",
      notes:
        "דירוג 4.70 · 38 ביקורות · Booking 9.4/10\n" +
        "U360 הוא אחד המתחמים המבוקשים באילת — מיקום מרכזי במרחק נסיעה קצרה לטיילת ולחוף, עם בריכה מקורה מחוממת, חדר כושר וספא הזמינים לכל האורחים. הסוויטה עוצבה בהשראת מלונאות בוטיק: חומרים טבעיים, תאורה רכה, ומיטת קינג איכותית. המטבחון מצויד באספרסו, מקרר גדול, כלים לארוחת בוקר ומקפיא — מושלם לחופשה זוגית או משפחתית קצרה.",
    },
    unit: {
      name: "סוויטה U360",
      capacity: 4,
      base_price: 1190,
      notes: "חדר שינה 1 · 2 מיטות · חדר רחצה 1 · מרפסת לנוף הרי אדום · צ׳ק-אין עצמאי 24/7",
    },
  },
  {
    property: {
      name: "oR-Ya Suite · MaOrly",
      address: "אילת · מגדל פיקוח (שכונת שחמון)",
      notes:
        "דירוג 5.00 · 24 ביקורות · Booking 10/10\n" +
        "MaOrly היא דירת בוטיק רחבה במיוחד בשכונת שחמון השקטה — אידיאלית לחופשת קבוצה או משפחה מורחבת. הסלון נפתח לגינה פרטית עם בריכה חיצונית, פינת ישיבה וכיריים למנגל. המטבח מאובזר במלואו כולל מכונת כביסה ומייבש. כל אחד מארבעת חדרי השינה מוקפד בעיצובו, עם מצעי כותנה מצרית ומגבות פרימיום. וילה אורבנית של 130 מ\"ר.",
    },
    unit: {
      name: "וילה MaOrly",
      capacity: 9,
      base_price: 1890,
      notes: "4 חדרי שינה · 5 מיטות · 2 חדרי רחצה · בריכה חיצונית פרטית · חניה חינם",
    },
  },
  {
    property: {
      name: "oR-Ya Suite · Royal Park",
      address: "אילת · מתחם Royal Park",
      notes:
        "דירוג 5.00 · 47 ביקורות · Airbnb 5.0/5\n" +
        "Royal Park הוא מתחם מגורים מטופח עם בריכה מרכזית, גינות ירוקות וחניה פרטית. הסוויטה כוללת חדר שינה נפרד עם מיטה זוגית, סלון עם שתי ספות נפתחות (יכולה לארח עד 5 אורחים), ומטבח מלא לארוחות בית. דירוג מושלם 5.0 באירבנב משקף את הקפדנות על ניקיון, עיצוב ושירות.",
    },
    unit: {
      name: "סוויטה Royal Park",
      capacity: 5,
      base_price: 1290,
      notes: "חדר שינה + 3 מיטות (2 ספות נפתחות) · חדר רחצה 1 · חניה צמודה",
    },
  },
  {
    property: {
      name: "Bar Lavi",
      address: "אילת · רחוב בר לביא",
      notes:
        "דירוג 5.00 · 8 ביקורות · הזמנות ישירות\n" +
        "ברחוב שקט באילת, דירת בר לביא מציעה חוויית בוטיק אינטימית: עיצוב פנים מודרני, חומרים טבעיים ופרטים קטנים שעושים את ההבדל. שני חדרי שינה, סלון פתוח, מטבח מאובזר ומרפסת לערבים רגועים. מתאים לזוגות, משפחות קטנות או נסיעות עבודה ארוכות.",
    },
    unit: {
      name: "דירת Bar Lavi",
      capacity: 4,
      base_price: 990,
      notes: "2 חדרי שינה · 2 מיטות · חדר רחצה 1 · מרפסת · Smart TV + YouTube Premium",
    },
  },
  {
    property: {
      name: "oR-Ya Suite · Sea View",
      address: "אילת · חוף הים (חיל ההנדסה)",
      notes:
        "דירוג 4.65 · 192 ביקורות · Booking 9.3/10 — היחידה המדורגת ביותר\n" +
        "סוויטה ייחודית על קו החוף של אילת, עם נוף פתוח לים האדום ולהרי אדום. 48 מ\"ר מנוצלים בחוכמה — מיטה זוגית רחבה, שתי ספות נפתחות ומטבחון מצויד. במתחם בריכה גדולה, ובמרחק הליכה קצר מהדירה תמצאו את הטיילת, מסעדות הדגים והחוף הצפוני. 192 חוות דעת חיוביות ב-Booking מדברות בעד עצמן.",
    },
    unit: {
      name: "סוויטת Sea View",
      capacity: 5,
      base_price: 890,
      notes: "חדר שינה 1 · 3 מיטות · חדר רחצה 1 · מרפסת פרטית · נוף ישיר לים",
    },
  },
  {
    property: {
      name: "Sea Side · Family Heaven",
      address: "אילת · קו החוף (החוף הצפוני)",
      notes:
        "דירוג 4.67 · 63 ביקורות · Airbnb\n" +
        "Sea Side · Family Heaven היא סוויטה משפחתית במתחם מלונאי על קו החוף. הסוויטה כוללת חדר שינה נפרד, סלון עם ספה נפתחת, חדר רחצה פרטי ומטבחון מאובזר. בריכת המתחם נחשבת לאחת היפות באילת — והכי חשוב, החוף הצפוני במרחק הליכה. אידיאלי לחופשת משפחה רגועה ומפנקת.",
    },
    unit: {
      name: "סוויטת Family Heaven",
      capacity: 4,
      base_price: 1090,
      notes: "חדר שינה 1 · 2 מיטות · חדר רחצה פרטי · בריכה מדהימה במתחם",
    },
  },
];

const supabase = createClient(url, key);

const { data: auth, error: authError } = await supabase.auth.signInWithPassword({ email, password });
if (authError || !auth.user) throw new Error(`Sign-in failed: ${authError?.message}`);
const ownerId = auth.user.id;

const { data: existing, error: listError } = await supabase.from("properties").select("name");
if (listError) throw new Error(`Failed to list properties: ${listError.message}`);
const existingNames = new Set((existing ?? []).map((p) => p.name));

let created = 0;
let skipped = 0;
for (const { property, unit } of SEED) {
  if (existingNames.has(property.name)) {
    console.log(`skip   ${property.name} (already exists)`);
    skipped++;
    continue;
  }
  const { data: propRow, error: propError } = await supabase
    .from("properties")
    .insert({ ...property, owner_id: ownerId })
    .select()
    .single();
  if (propError) throw new Error(`Failed to create property "${property.name}": ${propError.message}`);

  const { error: unitError } = await supabase
    .from("units")
    .insert({ ...unit, property_id: propRow.id, owner_id: ownerId });
  if (unitError) throw new Error(`Failed to create unit "${unit.name}": ${unitError.message}`);

  console.log(`create ${property.name} → ${unit.name} (₪${unit.base_price}/לילה, עד ${unit.capacity} אורחים)`);
  created++;
}

console.log(`\nDone: ${created} created, ${skipped} skipped.`);
await supabase.auth.signOut();
