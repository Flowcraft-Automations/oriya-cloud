
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS payment_link_token text UNIQUE,
  ADD COLUMN IF NOT EXISTS payment_link_created_at timestamptz;

INSERT INTO public.wa_templates (name, category, status, body_he, variables, notes)
VALUES
  ('payment_link', 'utility', 'approved',
   'שלום {{name}} 👋
לתשלום ההזמנה שלך ב־{{property}} ({{unit}}) בסך {{amount}} ₪ אנא היכנס/י לקישור:
{{link}}
תודה, צוות אוריה',
   '["name","property","unit","amount","link"]'::jsonb,
   'קישור תשלום להזמנה'),
  ('booking_confirmation', 'utility', 'approved',
   'שלום {{name}} 🌸
ההזמנה שלך אושרה:
📍 {{property}} · {{unit}}
📅 צ׳ק־אין {{check_in}} · צ׳ק־אאוט {{check_out}}
👥 {{guests}} אורחים · {{nights}} לילות
סה״כ: {{amount}} ₪
נשמח לראותך!',
   '["name","property","unit","check_in","check_out","guests","nights","amount"]'::jsonb,
   'אישור הזמנה')
ON CONFLICT (name) DO UPDATE SET
  status = EXCLUDED.status,
  body_he = EXCLUDED.body_he,
  variables = EXCLUDED.variables;
