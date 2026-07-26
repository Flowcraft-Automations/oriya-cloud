# לידים בזמן אמת · עמודת חמימות · לינק ל־ManyChat

## 1. עדכונים חיים (Realtime)
- **מיגרציה**: `ALTER PUBLICATION supabase_realtime ADD TABLE public.leads, public.lead_inquiries;` והגדרת `REPLICA IDENTITY FULL` על שתי הטבלאות.
- **בעמוד הרשימה** `src/routes/_authenticated/leads.index.tsx`: `useEffect` שנרשם ל־`postgres_changes` על `leads` (INSERT/UPDATE/DELETE) ומריץ `qc.invalidateQueries({ queryKey: ["leads"] })`. cleanup ב־`supabase.removeChannel`.
- **בעמוד הפרטים** `src/routes/_authenticated/leads.$id.tsx`: אותה תבנית — האזנה על `leads` (עם `filter: id=eq.{id}`) ועל `lead_inquiries` (`filter: lead_id=eq.{id}`) עם invalidate של המפתחות הרלוונטיים.
- לא נוגעים ב־loader — הוא נשאר כמו שהוא; Realtime רק דוחף invalidate כשיש שינוי, וה־Query עצמו מרענן.

## 2. עמודת חמימות בטבלה
- הוספת עמודה **"חמימות"** ל־`LeadsTable` בין "מקור" ל־"שלב".
- `InlineSelect` עם 3 ערכים (`cold` קר · `warm` פושר · `hot` חם) ו־`TonePill` צבועה (neutral / gold / danger — אותו מיפוי שכבר קיים ב־`leads.$id.tsx`).
- שמירה דרך `updateLead` הקיים (הוא כבר מקבל `warmth`).
- להוסיף גם צ׳יפ חמימות בכרטיסי הקנבן.

## 3. לינק ל־ManyChat לכל ליד
- **מיגרציה**: הוספת עמודה `manychat_subscriber_id text` לטבלת `leads`.
- **עדכון ה־Webhook** `supabase/functions/manychat-webhook/index.ts`: לקלוט את `body.id` (מזהה ה־subscriber של ManyChat שנשלח בכל בקשה) ולשמור אותו בעמודה החדשה — גם ב־INSERT וגם ב־UPDATE (רק אם עדיין ריק, כדי לא לדרוס).
- **בטבלה ובכרטיס הפרטים**: כפתור/אייקון WhatsApp שמוביל ל־`https://app.manychat.com/fb3418755/chat/{manychat_subscriber_id}` (target="_blank", rel="noopener"). כאשר `manychat_subscriber_id` חסר — הכפתור לא מוצג (או מוצג מושבת) כי אין subscriber ב־ManyChat.
- הלינק בעמוד הפרטים ישב ליד שם הליד/צ׳יפ החמימות בכותרת.

## נקודות טכניות
- Realtime על `leads` דורש `REPLICA IDENTITY FULL` כדי שאירועי UPDATE יכילו את `owner_id` — אחרת מסנני RLS ידחו. RLS הקיים (owner-based) נשאר כמו שהוא.
- לא ניגעים ב־Kanban עצמו מעבר לצ׳יפ החמימות.
- אין שינוי בזרימות שליחה, בטבלת customers, או ב־Marketing.
