# FOOT HOUSE: Setup Guide

This guide takes you from the project files on your computer to a working app with real sign-up, login, logout and database, all running on your own Supabase project. Follow the steps in order and tick each one off.

**What you need before you start**
- Node.js 20 or newer (or Bun) installed on your computer
- A free account at https://supabase.com
- A code editor such as VS Code (you already have this)

**Time needed:** about 30 minutes for email login, plus extra time for Google login and deployment.

---

## Where to keep what

Read this table first. It decides what is safe and what is not.

| Item | Where to keep it | Put in GitHub? | Visible in the browser? |
|---|---|---|---|
| App code | Private GitHub repository | Yes | n/a |
| Supabase **Project URL** | `.env` file and your hosting service's environment variables | No | Yes (safe) |
| Supabase **publishable key** | `.env` file and your hosting service's environment variables | No | Yes (safe, protected by database rules) |
| Supabase **service_role / secret key** | **Nowhere.** This app does not need it. | Never | Never |
| Database password | A password manager (for example Bitwarden) | Never | Never |
| Google OAuth Client Secret | Only inside the Supabase dashboard | Never | Never |
| Email (SMTP) password or API key | Only inside the Supabase dashboard | Never | Never |
| Backup files | Google Drive or an external disk | No | n/a |

The `service_role` (or `secret`) key bypasses every security rule in your database. If it leaks, anyone can read and change all your data. Never paste it into `.env`, never share it in screenshots, and never commit it.

The `.env` file is already listed in `.gitignore`, so Git will not upload it. Still, double-check before your first push.

---

## Step 1: Create your Supabase project

1. Sign in at https://supabase.com and click **New project**.
2. Choose a name, set a strong database password, and save that password in your password manager.
3. For the region, choose **South Asia (Mumbai)**. This is the closest to you.
4. Wait a minute or two until the project finishes setting up.

## Step 2: Add your keys to `.env`

1. In Supabase, open **Project Settings > API Keys** (on some versions this page is just called **API**).
2. Copy two values:
   - **Project URL** (looks like `https://abcdxyz.supabase.co`)
   - **Publishable key** (starts with `sb_publishable_`). If your project only shows the older style, copy the **anon public** key instead.
3. Open the `.env` file in the project folder and fill in these four lines. The URL goes in two places and the key goes in two places, so each value appears twice:

   ```
   SUPABASE_URL="https://abcdxyz.supabase.co"
   SUPABASE_PUBLISHABLE_KEY="your-publishable-key"
   VITE_SUPABASE_URL="https://abcdxyz.supabase.co"
   VITE_SUPABASE_PUBLISHABLE_KEY="your-publishable-key"
   ```

4. Save the file. If the app is already running, stop it and start it again, because `.env` is only read at startup.

## Step 3: Create the database

1. In Supabase, open **SQL Editor** and click **New query**.
2. Open `supabase/setup.sql` from this project, copy everything, paste it into the editor, and click **Run**.
3. You should see "Success". This creates all tables, the security rules, the profile-creation trigger, and a private storage bucket called `product-images`.
4. Check the result:
   - **Table Editor** should list: `profiles`, `user_roles`, `products`, `cart_items`, `wishlist_items`, `addresses`, `feedback`.
   - **Storage** should list a bucket called `product-images` marked as private.

Run `setup.sql` only once. Running it a second time will show "already exists" errors. That is harmless, but it means the first run worked.

## Step 4: Tell Supabase which URLs may sign users in

1. Open **Authentication > URL Configuration**.
2. Set **Site URL** to `http://localhost:3000`.
3. Under **Redirect URLs**, add `http://localhost:3000/**`.

When you deploy later, you will add your real domain here too (Step 10).

## Step 5: Email sign-up and password reset

Supabase sends two kinds of email for this app: the "confirm your account" email and the "reset your password" email.

**Option A: Quick local testing (fastest)**
1. Open **Authentication > Sign In / Providers** and select **Email**.
2. Turn **Confirm email** off and save.
3. Now a new user is signed in immediately after sign-up, with no email needed.
4. Turn **Confirm email** back on before you launch to real customers.

Password reset still needs email, even with Confirm email off. The built-in Supabase mailer works for a few test emails per hour, which is enough for testing.

**Option B: Real email (needed for launch)**
1. Create a free account with an email provider such as Resend or Brevo and verify your sender address or domain.
2. In Supabase, open **Authentication > Emails > SMTP Settings**, turn on custom SMTP, and enter the host, port, username, password and sender details your provider gives you.
3. Open **Authentication > Emails > Templates** and edit the "Confirm sign up" and "Reset password" messages so they say FOOT HOUSE.

## Step 6: Run the app

Open a terminal in the project folder and run:

```
bun install
bun run dev
```

If you use npm instead of Bun:

```
npm install
npm run dev
```

Then open http://localhost:3000 in your browser.

The app always uses port 3000. If something else is using that port, the app will stop with an error instead of choosing another port. Close the other program and try again. The fixed port matters because Supabase only allows the redirect URL you added in Step 4.

## Step 7: Create your first account and make it admin

1. In the app, sign up with your own email and a password (8+ characters, with a number and a symbol).
2. If Confirm email is on, click the link in your inbox.
3. Open `supabase/make-admin.sql`. Replace `YOUR_EMAIL@example.com` with the email you just used.
4. Paste it into the Supabase **SQL Editor** and click **Run**. The last line of the script shows a table with your email and the role `admin`. If it shows no rows, the email does not match a signed-up account.
5. Go to http://localhost:3000/admin/login and sign in. You can now add products, upload images, and publish them.

Only accounts listed in the `user_roles` table can open the admin area. Anyone else is sent back to the home page.

## Step 8: Google sign-in (optional)

Email login works without this step.

1. Open https://console.cloud.google.com and create a project.
2. Go to **APIs & Services > OAuth consent screen**, choose **External**, and fill in the app name and your email.
3. Go to **Credentials > Create credentials > OAuth client ID** and choose **Web application**.
4. Under **Authorized redirect URIs**, add:
   `https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback`
   (Use your own project URL from Step 2.)
5. Google then shows a **Client ID** and **Client Secret**. In Supabase, open **Authentication > Sign In / Providers > Google**, paste both, turn Google on, and save.
6. Test it with the Google button on the sign-in screen.

**Apple sign-in** needs a paid Apple Developer account. If you do not have one, remove the Apple button so users do not hit an error: open `src/components/fh/SocialAuth.tsx` and delete the Apple entry from the list of providers.

## Step 9: Test everything

Go through this list on http://localhost:3000. Tick each item only after it works.

- [ ] Sign up with a new email
- [ ] Confirm the email (or skip this if Confirm email is off)
- [ ] Sign in with the correct password
- [ ] A wrong password shows an error
- [ ] Refresh the page: you are still signed in
- [ ] Sign out from the Profile page, then open a protected page: you are sent to the sign-in screen
- [ ] Forgot password: the email arrives and the new password works
- [ ] Signing up again with an email that already exists shows "account already exists"
- [ ] Google sign-in works (if you set it up)
- [ ] Profile setup saves your details
- [ ] Cart, wishlist, saved addresses and feedback all save
- [ ] Create a second account: it cannot see the first account's cart, wishlist or addresses
- [ ] Admin: add a product with an image, edit it, unpublish it, delete it
- [ ] A normal account that opens `/admin` is sent back to the home page

## Step 10: Put it online (Vercel example)

1. Create a **private** repository on GitHub and push the project to it. Confirm that `.env` is not in the repository.
2. Sign in at https://vercel.com and import the repository.
3. Under **Environment Variables**, add the same four variables from Step 2.
4. Click **Deploy**.
5. When Vercel gives you your live address (or you connect your own domain), return to Supabase:
   - **Authentication > URL Configuration**: change **Site URL** to your live address and add `https://YOUR-DOMAIN/**` to **Redirect URLs**. Keep the localhost entry for development.
   - If you use Google sign-in, no change is needed in Google Cloud, because Google only talks to Supabase.
6. If you change an environment variable later, redeploy. The `VITE_` values are baked in when the app is built.

## Step 11: Backups and safety

- Take a database backup regularly. In Supabase, check **Database > Backups**. On the free plan, make your own copy with `pg_dump` and keep it in a safe place.
- On the free plan, Supabase pauses a project after about a week with no activity. You can resume it from the dashboard. When you have real customers, move to a paid plan.
- If a key or the `.env` file ever becomes public, go to **Project Settings > API Keys** and rotate it immediately.

---

## Troubleshooting

| What you see | Most likely cause and fix |
|---|---|
| "Missing Supabase environment variable(s)" | `.env` is empty or has typos. Fill in all four lines and restart the app. |
| The app will not start because the port is in use | Another program is using port 3000. Close it and run again. |
| Sign-up works but no email arrives | Confirm email is on but SMTP is not set up. Use Step 5 Option A for testing, or set up SMTP. |
| Clicking the email link opens an error or the wrong page | The address is missing from **Redirect URLs** (Step 4). Add it with `/**` at the end. |
| "Incorrect email or password" for a new account | The email is not confirmed yet, or the password is wrong. Check your inbox. |
| Admin login sends you to the home page | Your account has no admin role. Run `make-admin.sql` again with the correct email. |
| Product images do not load | You are not signed in, or the `product-images` bucket is missing. Run Step 3 again. |
| Google button shows an error | The redirect URI in Google Cloud does not match Step 8, or Google is not turned on in Supabase. |

## What is not built yet

- **Orders, checkout and payments.** There is no orders table, and the Orders page only shows "No orders yet". Selling for real needs an `orders` table, a checkout flow, and a payment provider such as Razorpay. This is the next big feature to build.

## WhatsApp ordering (no payment, no order tracking)

Customers order by sending a ready-made WhatsApp message to you.

1. Add your WhatsApp number to `.env` (digits only, with country code, no `+` or spaces):
   ```
   VITE_WHATSAPP_NUMBER="9779812345678"
   ```
   Restart the app after changing `.env`.
2. On a product page, **Buy Now on WhatsApp** sends that product. In the Bag, **Order on WhatsApp** sends everything in the bag.
3. The message contains the product name, price, size, colour, quantity, a product link, a photo link (valid for 7 days), and the customer's name, phone and email from their profile.
4. The product link only works after you deploy the app to a real domain. On `localhost` it will point to localhost.
