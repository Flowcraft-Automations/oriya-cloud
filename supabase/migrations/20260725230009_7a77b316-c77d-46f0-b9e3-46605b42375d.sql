
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data, is_super_admin,
  confirmation_token, email_change, email_change_token_new, recovery_token
)
SELECT
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated','authenticated',
  'jadirred@gmail.com',
  crypt('Mishpaha54!!', gen_salt('bf')),
  now(), now(), now(),
  '{"provider":"email","providers":["email"],"role":"admin"}'::jsonb,
  '{"role":"admin"}'::jsonb,
  false, '', '', '', ''
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'jadirred@gmail.com');
