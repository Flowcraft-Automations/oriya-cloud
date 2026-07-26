-- Enums
CREATE TYPE public.wa_template_category AS ENUM ('utility', 'marketing');
CREATE TYPE public.wa_template_status AS ENUM ('draft', 'pending', 'approved', 'rejected');
CREATE TYPE public.msg_status AS ENUM ('queued', 'sent', 'delivered', 'read', 'failed', 'replied');
CREATE TYPE public.journey_key AS ENUM ('leads', 'clients');
CREATE TYPE public.msg_direction AS ENUM ('out', 'in');
CREATE TYPE public.wa_send_mode AS ENUM ('in_window', 'template');
CREATE TYPE public.campaign_status AS ENUM ('draft', 'scheduled', 'running', 'done', 'cancelled');

-- Customers extensions
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS lifecycle text,
  ADD COLUMN IF NOT EXISTS manychat_id text;

-- Reservations extension
ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS checkin_code text;

-- Backfill lifecycle from reservations
UPDATE public.customers c SET lifecycle = sub.lc
FROM (
  SELECT customer_id,
    CASE
      WHEN bool_or(status = 'checkin') THEN 'staying'
      WHEN bool_or(status IN ('confirmed','pending')) AND max(check_in) >= CURRENT_DATE THEN 'booked'
      WHEN bool_or(status = 'checkout') OR max(check_out) < CURRENT_DATE THEN 'past'
      ELSE 'booked'
    END AS lc
  FROM public.reservations
  WHERE customer_id IS NOT NULL
  GROUP BY customer_id
) sub
WHERE c.id = sub.customer_id;
UPDATE public.customers SET lifecycle = 'lead' WHERE lifecycle IS NULL;

-- wa_templates
CREATE TABLE public.wa_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  category public.wa_template_category NOT NULL,
  status public.wa_template_status NOT NULL DEFAULT 'draft',
  body_he text NOT NULL,
  variables jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wa_templates TO authenticated;
GRANT ALL ON public.wa_templates TO service_role;
ALTER TABLE public.wa_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated manage wa_templates" ON public.wa_templates FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER wa_templates_updated BEFORE UPDATE ON public.wa_templates FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- wa_journeys
CREATE TABLE public.wa_journeys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key public.journey_key NOT NULL UNIQUE,
  name_he text NOT NULL,
  description_he text,
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wa_journeys TO authenticated;
GRANT ALL ON public.wa_journeys TO service_role;
ALTER TABLE public.wa_journeys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated manage wa_journeys" ON public.wa_journeys FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER wa_journeys_updated BEFORE UPDATE ON public.wa_journeys FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- wa_journey_steps
CREATE TABLE public.wa_journey_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id uuid NOT NULL REFERENCES public.wa_journeys(id) ON DELETE CASCADE,
  step_code text NOT NULL,
  order_index int NOT NULL,
  name_he text NOT NULL,
  trigger_he text NOT NULL,
  template_id uuid REFERENCES public.wa_templates(id) ON DELETE SET NULL,
  mode public.wa_send_mode NOT NULL DEFAULT 'template',
  is_active boolean NOT NULL DEFAULT false,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(journey_id, step_code)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wa_journey_steps TO authenticated;
GRANT ALL ON public.wa_journey_steps TO service_role;
ALTER TABLE public.wa_journey_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated manage wa_journey_steps" ON public.wa_journey_steps FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER wa_journey_steps_updated BEFORE UPDATE ON public.wa_journey_steps FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- journey_enrollments
CREATE TABLE public.journey_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id uuid NOT NULL REFERENCES public.wa_journeys(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  reservation_id uuid REFERENCES public.reservations(id) ON DELETE SET NULL,
  current_step_code text,
  paused_until timestamptz,
  exited_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.journey_enrollments TO authenticated;
GRANT ALL ON public.journey_enrollments TO service_role;
ALTER TABLE public.journey_enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated manage journey_enrollments" ON public.journey_enrollments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE INDEX journey_enrollments_customer_idx ON public.journey_enrollments(customer_id);
CREATE TRIGGER journey_enrollments_updated BEFORE UPDATE ON public.journey_enrollments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Drop old marketing_campaigns (unused in UI) then create campaigns
DROP TABLE IF EXISTS public.marketing_campaigns CASCADE;

CREATE TABLE public.campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_he text NOT NULL,
  template_id uuid REFERENCES public.wa_templates(id) ON DELETE SET NULL,
  segment jsonb NOT NULL DEFAULT '{}'::jsonb,
  coupon_code text,
  scheduled_at timestamptz,
  launched_at timestamptz,
  status public.campaign_status NOT NULL DEFAULT 'draft',
  stats jsonb NOT NULL DEFAULT '{}'::jsonb,
  owner_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaigns TO authenticated;
GRANT ALL ON public.campaigns TO service_role;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated manage campaigns" ON public.campaigns FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER campaigns_updated BEFORE UPDATE ON public.campaigns FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- messages_log
CREATE TABLE public.messages_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  reservation_id uuid REFERENCES public.reservations(id) ON DELETE SET NULL,
  campaign_id uuid REFERENCES public.campaigns(id) ON DELETE SET NULL,
  template_id uuid REFERENCES public.wa_templates(id) ON DELETE SET NULL,
  journey_step_id uuid REFERENCES public.wa_journey_steps(id) ON DELETE SET NULL,
  phone text,
  direction public.msg_direction NOT NULL DEFAULT 'out',
  status public.msg_status NOT NULL DEFAULT 'queued',
  error text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  delivered_at timestamptz,
  read_at timestamptz,
  replied_at timestamptz
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages_log TO authenticated;
GRANT ALL ON public.messages_log TO service_role;
ALTER TABLE public.messages_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated manage messages_log" ON public.messages_log FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE INDEX messages_log_customer_idx ON public.messages_log(customer_id);
CREATE INDEX messages_log_reservation_idx ON public.messages_log(reservation_id);
CREATE INDEX messages_log_campaign_idx ON public.messages_log(campaign_id);
CREATE INDEX messages_log_created_idx ON public.messages_log(created_at DESC);

-- contact_tags
CREATE TABLE public.contact_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  tag text NOT NULL,
  source text NOT NULL DEFAULT 'manual',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(customer_id, tag)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contact_tags TO authenticated;
GRANT ALL ON public.contact_tags TO service_role;
ALTER TABLE public.contact_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated manage contact_tags" ON public.contact_tags FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE INDEX contact_tags_customer_idx ON public.contact_tags(customer_id);

-- contact_consent
CREATE TABLE public.contact_consent (
  customer_id uuid PRIMARY KEY REFERENCES public.customers(id) ON DELETE CASCADE,
  opted_in boolean NOT NULL DEFAULT true,
  reason text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contact_consent TO authenticated;
GRANT ALL ON public.contact_consent TO service_role;
ALTER TABLE public.contact_consent ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated manage contact_consent" ON public.contact_consent FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER contact_consent_updated BEFORE UPDATE ON public.contact_consent FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed consent for existing customers
INSERT INTO public.contact_consent (customer_id, opted_in)
SELECT id, true FROM public.customers ON CONFLICT DO NOTHING;

-- Seed templates
INSERT INTO public.wa_templates (name, category, status, body_he, variables, notes) VALUES
('lead_followup_4h_he', 'utility', 'approved',
'היי {{1}}, ראינו שהתעניינת ב-{{2}} לתאריכים {{3}} ועוד לא סגרנו 🙂 היחידות לתאריכים האלה מתמלאות — אפשר להשלים הזמנה כאן: {{4}}. יש שאלה? פשוט תכתבו לנו.',
'[{"key":"1","label":"שם פרטי"},{"key":"2","label":"נכס"},{"key":"3","label":"תאריכים"},{"key":"4","label":"קישור להזמנה"}]'::jsonb,
'T2 · Lead follow-up 4h'),
('lead_followup_24h_he', 'marketing', 'approved',
'היי {{1}}, התאריכים {{2}} ב-{{3}} עדיין פנויים כרגע. אם המחיר היה השיקול — שווה לבדוק את התאריכים באמצע שבוע, ההפרש משמעותי. לבדיקה: {{4}}. להסרה השיבו "הסר".',
'[{"key":"1","label":"שם"},{"key":"2","label":"תאריכים"},{"key":"3","label":"נכס"},{"key":"4","label":"קישור"}]'::jsonb,
'T3 · Lead follow-up 24h'),
('lead_teen_consent_he', 'utility', 'approved',
'כדי לאשר אירוח נוער ב-U360 אנחנו צריכים טופס הסכמת הורה חתום + פיקדון. הטופס הדיגיטלי (2 דקות): {{1}}. ההזמנה תאושר מיד עם קבלת הטופס והמקדמה 🙏',
'[{"key":"1","label":"קישור לטופס"}]'::jsonb,
'T4 · Teen consent'),
('order_confirmation_he', 'utility', 'approved',
'ההזמנה אושרה! 🎉 {{1}}, מחכים לכם ב-{{2}} ({{3}}) בתאריכים {{4}}–{{5}}, {{6}} אורחים. סה"כ: ₪{{7}}. מדיניות ביטול ותנאים: {{8}}. נשלח את כל פרטי ההגעה יום לפני הצ''ק-אין.',
'[{"key":"1","label":"שם"},{"key":"2","label":"נכס"},{"key":"3","label":"יחידה"},{"key":"4","label":"צק-אין"},{"key":"5","label":"צק-אאוט"},{"key":"6","label":"אורחים"},{"key":"7","label":"סה״כ"},{"key":"8","label":"קישור מדיניות"}]'::jsonb,
'T5 · Order confirmation'),
('order_deposit_reminder_he', 'utility', 'approved',
'תזכורת קטנה 💙 להשלמת ההזמנה ל-{{1}} נותר לשלם מקדמה של ₪{{2}}. תשלום מאובטח בקליק: {{3}}. ההזמנה שמורה לכם עוד {{4}} שעות.',
'[{"key":"1","label":"נכס"},{"key":"2","label":"סכום מקדמה"},{"key":"3","label":"קישור תשלום"},{"key":"4","label":"שעות נותרו"}]'::jsonb,
'T6 · Deposit reminder'),
('order_prearrival_he', 'utility', 'approved',
'מתרגשים לקראתכם! 🌊 תזכורת: צ''ק-אין מחר ב-{{1}} החל מ-{{2}}. כתובת: {{3}}. חניה: {{4}}. את קוד הכניסה נשלח מחר כשהדירה מוכנה. צריכים משהו מיוחד? זה הזמן לכתוב לנו.',
'[{"key":"1","label":"נכס"},{"key":"2","label":"שעת צק-אין"},{"key":"3","label":"כתובת"},{"key":"4","label":"חניה"}]'::jsonb,
'T7 · Pre-arrival'),
('order_checkin_ready_he', 'utility', 'approved',
'הדירה שלכם מוכנה! ✨ {{1}}, קוד כניסה: {{2}}. הוראות הגעה מדויקות + תמונת הכניסה: {{3}}. Wi-Fi: {{4}}. שהייה נעימה! אנחנו זמינים כאן לכל דבר.',
'[{"key":"1","label":"שם"},{"key":"2","label":"קוד כניסה"},{"key":"3","label":"קישור הוראות"},{"key":"4","label":"Wi-Fi"}]'::jsonb,
'T8 · Check-in ready'),
('order_beatles_voucher_he', 'utility', 'approved',
'מתנה מאיתנו 🎁 שובר של ₪50 לאדם ל-Beatles Bar הערב! הראו את הקוד {{1}} בכניסה. טיפ: מי שמגיע בין 22:00–24:00 נכנס בלי תור. ליהנות!',
'[{"key":"1","label":"קוד שובר"}]'::jsonb,
'T9 · Beatles voucher'),
('post_checkout_thanks_he', 'utility', 'approved',
'תודה שהתארחתם אצלנו {{1}} 💙 מקווים שנהניתם ב-{{2}}! נשמח לשמוע איך היה — מספיק לענות להודעה הזו במשפט.',
'[{"key":"1","label":"שם"},{"key":"2","label":"נכס"}]'::jsonb,
'T10 · Post-checkout thanks'),
('post_review_request_he', 'marketing', 'approved',
'{{1}}, חוות דעת קצרה שלכם עוזרת לנו מאוד 🙏 דירוג בגוגל (30 שניות): {{2}}. וכתודה — קוד {{3}} ל-10% הנחה בהזמנה הבאה ישירות דרכנו.',
'[{"key":"1","label":"שם"},{"key":"2","label":"קישור גוגל"},{"key":"3","label":"קוד הנחה"}]'::jsonb,
'T11 · Review request'),
('winback_seasonal_he', 'marketing', 'approved',
'מתגעגעים? 🌴 {{1}}, ספטמבר באילת = ים חם, מחירים רגועים. קוד {{2}} מעניק {{3}}% הנחה להזמנות באתר: {{4}}. בתוקף עד {{5}}. להסרה השיבו "הסר".',
'[{"key":"1","label":"שם"},{"key":"2","label":"קוד"},{"key":"3","label":"אחוז"},{"key":"4","label":"קישור"},{"key":"5","label":"תוקף"}]'::jsonb,
'T12 · Win-back seasonal');

-- Seed journeys
INSERT INTO public.wa_journeys (key, name_he, description_he) VALUES
('leads', 'מסע לידים', 'שני מגעים מקסימום — welcome, follow-up 4h, follow-up 24h + מסלול הסכמת נוער.'),
('clients', 'מסע לקוחות', 'מרגע אישור ההזמנה ועד ביקורת גוגל — כולל שער ידני "החדר מוכן".');

-- Seed journey steps for leads
INSERT INTO public.wa_journey_steps (journey_id, step_code, order_index, name_he, trigger_he, template_id, mode, config)
SELECT j.id, s.step_code, s.order_index, s.name_he, s.trigger_he,
  (SELECT id FROM public.wa_templates WHERE name = s.template_name),
  s.mode::public.wa_send_mode,
  s.config::jsonb
FROM public.wa_journeys j
JOIN (VALUES
  ('A1', 1, 'ברוכים הבאים', 'ליד נוצר', NULL, 'in_window', '{}'),
  ('A2', 2, 'תזכורת 4 שעות', '+4h, אין שיחה פתוחה', 'lead_followup_4h_he', 'template', '{"delay_hours":4}'),
  ('A3', 3, 'תזכורת 24 שעות', '+24h, עדיין ללא תגובה', 'lead_followup_24h_he', 'template', '{"delay_hours":24}'),
  ('A4', 4, 'טופס הסכמת הורים', 'זוהתה קבוצת נוער', 'lead_teen_consent_he', 'template', '{}'),
  ('A5', 5, 'תיוג ליד אבוד', 'סטטוס = אבוד, סיבה = מחיר', NULL, 'in_window', '{"tag_only":true}'),
  ('A6', 6, 'מעבר למסע לקוחות', 'ליד → הזמנה מאושרת', NULL, 'in_window', '{"handoff":true}')
) s(step_code, order_index, name_he, trigger_he, template_name, mode, config) ON j.key = 'leads';

-- Seed journey steps for clients
INSERT INTO public.wa_journey_steps (journey_id, step_code, order_index, name_he, trigger_he, template_id, mode, config)
SELECT j.id, s.step_code, s.order_index, s.name_he, s.trigger_he,
  (SELECT id FROM public.wa_templates WHERE name = s.template_name),
  s.mode::public.wa_send_mode,
  s.config::jsonb
FROM public.wa_journeys j
JOIN (VALUES
  ('B1', 1, 'אישור הזמנה', 'הזמנה אושרה', 'order_confirmation_he', 'template', '{}'),
  ('B2', 2, 'תזכורת מקדמה', 'מקדמה לא שולמה +3h', 'order_deposit_reminder_he', 'template', '{"delay_hours":3}'),
  ('B3', 3, 'תזכורת טופס נוער', 'קבוצת נוער וטופס לא נחתם, T-3d', 'lead_teen_consent_he', 'template', '{}'),
  ('B4', 4, 'טרום-הגעה', 'T-1d, 10:00', 'order_prearrival_he', 'template', '{"send_at":"10:00"}'),
  ('B5', 5, 'החדר מוכן', 'המשתמש לחץ "החדר מוכן"', 'order_checkin_ready_he', 'template', '{"manual_gate":true}'),
  ('B6', 6, 'שובר Beatles', 'ערב ההגעה 19:00, +18', 'order_beatles_voucher_he', 'template', '{"send_at":"19:00","min_age":18}'),
  ('B7', 7, 'תודה אחרי צק-אאוט', 'יום צק-אאוט 12:00', 'post_checkout_thanks_he', 'template', '{"send_at":"12:00"}'),
  ('B8', 8, 'בקשת ביקורת', '+1d 11:00, אם התגובה חיובית', 'post_review_request_he', 'template', '{"send_at":"11:00"}'),
  ('B9', 9, 'זכאות win-back', '+60d ללא הזמנה עתידית', NULL, 'in_window', '{"delay_days":60,"audience_only":true}')
) s(step_code, order_index, name_he, trigger_he, template_name, mode, config) ON j.key = 'clients';

-- Seed sample messages_log across last 14 days
INSERT INTO public.messages_log (customer_id, reservation_id, template_id, phone, direction, status, created_at, delivered_at, read_at, payload)
SELECT
  c.id,
  r.id,
  t.id,
  c.phone,
  'out',
  (ARRAY['sent','delivered','read','replied','failed']::public.msg_status[])[1 + (i % 5)],
  now() - (i || ' days')::interval - (i * 37 || ' minutes')::interval,
  CASE WHEN i % 5 <> 4 THEN now() - (i || ' days')::interval + interval '2 minutes' END,
  CASE WHEN i % 5 IN (2,3) THEN now() - (i || ' days')::interval + interval '10 minutes' END,
  jsonb_build_object('seed', true, 'i', i)
FROM (SELECT generate_series(0,19) AS i) g
CROSS JOIN LATERAL (SELECT id, phone FROM public.customers ORDER BY random() LIMIT 1) c
LEFT JOIN LATERAL (SELECT id FROM public.reservations WHERE customer_id = c.id ORDER BY random() LIMIT 1) r ON true
CROSS JOIN LATERAL (SELECT id FROM public.wa_templates ORDER BY random() LIMIT 1) t;