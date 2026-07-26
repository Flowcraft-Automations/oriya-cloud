
ALTER TABLE public.lead_inquiries
  ADD COLUMN IF NOT EXISTS page_url text,
  ADD COLUMN IF NOT EXISTS form_name text,
  ADD COLUMN IF NOT EXISTS referrer text,
  ADD COLUMN IF NOT EXISTS utm_source text,
  ADD COLUMN IF NOT EXISTS utm_campaign text,
  ADD COLUMN IF NOT EXISTS utm_medium text,
  ADD COLUMN IF NOT EXISTS guest_name text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS nights integer;

-- Seed website inquiries against existing website-source leads owned by the admin user
DO $$
DECLARE
  admin_id uuid;
  lead_rec RECORD;
  i int := 0;
  pages text[] := ARRAY[
    'https://orya-suites.com/suites/deluxe-sea-view',
    'https://orya-suites.com/suites/family-garden',
    'https://orya-suites.com/booking?checkin=2026-08-14',
    'https://orya-suites.com/contact',
    'https://orya-suites.com/'
  ];
  forms text[] := ARRAY['בדיקת זמינות', 'טופס יצירת קשר', 'הזמנה ישירה', 'טופס דירה'];
  utms text[]  := ARRAY['google', 'facebook', 'instagram', 'direct'];
  camps text[] := ARRAY['eilat-summer-2026', 'brand-il', 'retargeting-jul', 'organic'];
  refs text[]  := ARRAY['https://www.google.com/','https://www.instagram.com/','https://l.facebook.com/','direct'];
  msgs text[]  := ARRAY[
    'שלום, מעוניינת בסוויטה עם נוף לים ל־3 לילות באמצע אוגוסט, זוג + תינוקת. אפשר לצרף מיטת תינוק?',
    'מחפשים דירה למשפחה של 6 עם בריכה פרטית, סוף שבוע ארוך. מה המחיר וההזמנה כוללת ניקיון?',
    'צריך אישור מיידי — יש לי אופציה לטיסה ורוצה לסגור עכשיו. מה זמין ל־4 לילות?',
    'שאלה על מדיניות ביטול — האם ניתן לבטל עד 7 ימים לפני?'
  ];
BEGIN
  SELECT id INTO admin_id FROM auth.users WHERE email='jadirred@gmail.com' LIMIT 1;
  IF admin_id IS NULL THEN RETURN; END IF;

  FOR lead_rec IN
    SELECT l.id, l.full_name, l.phone, l.email
    FROM public.leads l
    WHERE l.owner_id = admin_id AND l.source = 'website'
    ORDER BY l.created_at DESC
    LIMIT 5
  LOOP
    i := i + 1;
    INSERT INTO public.lead_inquiries (
      owner_id, lead_id, source, unit_id, property_id,
      check_in, check_out, guests, nights, message,
      page_url, form_name, referrer, utm_source, utm_campaign, utm_medium,
      guest_name, phone, email, created_at
    ) VALUES (
      admin_id,
      lead_rec.id,
      'website',
      NULL,
      NULL,
      (CURRENT_DATE + ((i*3) || ' days')::interval)::date,
      (CURRENT_DATE + ((i*3 + 3) || ' days')::interval)::date,
      2 + (i % 4),
      3,
      msgs[1 + (i % array_length(msgs,1))],
      pages[1 + (i % array_length(pages,1))],
      forms[1 + (i % array_length(forms,1))],
      refs[1 + (i % array_length(refs,1))],
      utms[1 + (i % array_length(utms,1))],
      camps[1 + (i % array_length(camps,1))],
      'cpc',
      lead_rec.full_name,
      lead_rec.phone,
      lead_rec.email,
      now() - ((i * 6) || ' hours')::interval
    );
  END LOOP;
END $$;
