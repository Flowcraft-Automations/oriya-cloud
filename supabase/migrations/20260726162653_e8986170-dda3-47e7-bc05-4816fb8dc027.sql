
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS bot_stage text,
  ADD COLUMN IF NOT EXISTS warmth text NOT NULL DEFAULT 'cold',
  ADD COLUMN IF NOT EXISTS last_bot_event_at timestamptz;

ALTER TABLE public.leads
  DROP CONSTRAINT IF EXISTS leads_warmth_check;
ALTER TABLE public.leads
  ADD CONSTRAINT leads_warmth_check CHECK (warmth IN ('cold','warm','hot'));

ALTER TABLE public.lead_inquiries
  ADD COLUMN IF NOT EXISTS bot_stage text,
  ADD COLUMN IF NOT EXISTS bot_event text,
  ADD COLUMN IF NOT EXISTS payload jsonb;

CREATE INDEX IF NOT EXISTS idx_leads_phone ON public.leads (phone);
