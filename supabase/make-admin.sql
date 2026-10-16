-- Run AFTER you have signed up once in the app with this email.
-- Replace the email below with yours, then run in Supabase SQL Editor.
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin' FROM auth.users WHERE email = 'YOUR_EMAIL@example.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Check: should return one row with role = admin
SELECT u.email, r.role FROM public.user_roles r JOIN auth.users u ON u.id = r.user_id;
