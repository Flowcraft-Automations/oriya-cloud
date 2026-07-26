
ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS rating smallint,
  ADD COLUMN IF NOT EXISTS review text;

-- Lead inquiries
CREATE TABLE IF NOT EXISTS public.lead_inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  source text NOT NULL,
  unit_id uuid REFERENCES public.units(id) ON DELETE SET NULL,
  property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL,
  check_in date,
  check_out date,
  guests int,
  message text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lead_inquiries TO authenticated;
GRANT ALL ON public.lead_inquiries TO service_role;
ALTER TABLE public.lead_inquiries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own lead_inquiries" ON public.lead_inquiries
  FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE INDEX IF NOT EXISTS lead_inquiries_lead_idx ON public.lead_inquiries(lead_id);

-- Communications
CREATE TABLE IF NOT EXISTS public.communications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  customer_id uuid REFERENCES public.customers(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE,
  campaign_id uuid REFERENCES public.marketing_campaigns(id) ON DELETE SET NULL,
  channel text NOT NULL CHECK (channel IN ('whatsapp','email','sms')),
  direction text NOT NULL DEFAULT 'outbound' CHECK (direction IN ('outbound','inbound')),
  subject text,
  body text,
  status text DEFAULT 'sent',
  sent_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.communications TO authenticated;
GRANT ALL ON public.communications TO service_role;
ALTER TABLE public.communications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own communications" ON public.communications
  FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE INDEX IF NOT EXISTS communications_customer_idx ON public.communications(customer_id);
CREATE INDEX IF NOT EXISTS communications_lead_idx ON public.communications(lead_id);

-- Backfill inquiries from existing leads
INSERT INTO public.lead_inquiries (owner_id, lead_id, source, property_id, message, created_at)
SELECT l.owner_id, l.id, l.source, l.property_id, l.interest, l.created_at
FROM public.leads l
WHERE NOT EXISTS (SELECT 1 FROM public.lead_inquiries li WHERE li.lead_id = l.id);
