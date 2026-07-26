
CREATE TABLE public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  reservation_id UUID REFERENCES public.reservations(id) ON DELETE SET NULL,
  invoice_number TEXT NOT NULL,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  tax NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','paid','overdue','cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoices TO authenticated;
GRANT ALL ON public.invoices TO service_role;

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage own invoices" ON public.invoices
  FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

CREATE TRIGGER set_invoices_updated_at BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed invoices from existing reservations
INSERT INTO public.invoices (owner_id, customer_id, reservation_id, invoice_number, issue_date, due_date, amount, tax, total, status, notes)
SELECT
  r.owner_id,
  r.customer_id,
  r.id,
  'INV-' || TO_CHAR(r.check_in, 'YYYYMM') || '-' || LPAD((ROW_NUMBER() OVER (ORDER BY r.check_in))::text, 4, '0'),
  r.check_in,
  r.check_in + INTERVAL '14 days',
  ROUND(r.total_amount / 1.17, 2),
  ROUND(r.total_amount - (r.total_amount / 1.17), 2),
  r.total_amount,
  CASE
    WHEN r.paid_amount >= r.total_amount THEN 'paid'
    WHEN r.check_in < CURRENT_DATE - INTERVAL '20 days' THEN 'overdue'
    WHEN r.status = 'cancelled' THEN 'cancelled'
    ELSE 'sent'
  END,
  'חשבונית עבור הזמנה ' || COALESCE(r.guest_name, '')
FROM public.reservations r
WHERE r.customer_id IS NOT NULL AND r.channel <> 'block'
ORDER BY r.check_in DESC
LIMIT 10;
