## Architecture rules
- Admin access is decided only by a row in `public.user_roles` checked via `has_role()` in RLS; the `/admin` route gate is UX only. Why: frontend checks can be bypassed.
- Product images live in the private `product-images` bucket; `products.images` stores paths, resolved to signed URLs on read. Why: public buckets are blocked in this workspace.
- Admin pages (`/admin*`) render outside the PhoneShell frame. Why: the dashboard is a desktop layout.
