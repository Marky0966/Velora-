# VELORA — reseller store (plain HTML / CSS / JavaScript)

Walang build step. Hiwa-hiwalay ang pages (`index.html`, `shop.html`, `product.html`, `cart.html`, `checkout.html`, `login.html`, …). I-double-click ang `index.html` para makita, o i-host kahit saan (Netlify, Vercel, GitHub Pages, Cloudflare Pages — static lang).

## Ano ang gumagana
- Shop: search, category filter, max price, in-stock, sort, wishlist, recently viewed
- Product page: gallery, variants (size/color), qty, **Add to cart**, **Buy now**, share
- Cart (naka-save sa browser), free-shipping progress bar
- **Checkout**: kailangan naka-sign in → **delivery location muna** (type o "Use my current location") → saka lang mabubuksan ang payment
- Payment: **PayPal + credit/debit card** (PayPal Smart Buttons), at optional Cash on Delivery
- Sign in / register / email verification / forgot & reset password (Supabase Auth)
- Account page: order history + tracking; **Seller dashboard** (`admin.html`): lahat ng orders, delivery address + map link, update status/tracking, messages, subscribers
- Contact form, newsletter, FAQ, shipping/returns, privacy, terms, dark mode, mobile-friendly

## Kung walang CSS/style ang site
Dapat **magkakasama ang buong folder** (`css/`, `js/` at ang `.html` files). Mga karaniwang dahilan:
- Binuksan ang `.html` sa loob mismo ng zip — i-**Extract All** muna.
- Sa GitHub/hosting, na-upload ang mga `.html` pero hindi ang `css` at `js` folders (o na-flatten lahat). Dapat ganito ang itsura: `index.html`, `css/style.css`, `js/…`.

## Setup (20 minuto)

### 1. Supabase (login + orders) — libre
1. supabase.com → New project.
2. SQL Editor → i-paste ang buong `supabase/setup.sql` → Run.
3. Authentication → URL Configuration: ilagay ang URL ng site mo bilang *Site URL* at idagdag ang `…/login.html` at `…/reset.html` sa *Redirect URLs*. (Local test: `http://localhost:8000`.)
4. Project Settings → API → kopyahin ang **Project URL** at **anon public key** → ilagay sa `js/config.js` (`supabaseUrl`, `supabaseAnonKey`). Ang anon key ay pwedeng nasa browser; **huwag** gamitin ang service_role key dito.
5. Mag-register sa site gamit ang email mo, tapos sa SQL Editor:
   `insert into admins (email) values ('email-mo@example.com');` → makikita mo na ang **Seller dashboard** sa Account page.

### 1b. Google sign-in (Sign in / Sign up with Google)
1. console.cloud.google.com → gumawa ng project → **APIs & Services → OAuth consent screen** (External, ilagay ang app name at email mo).
2. **Credentials → Create credentials → OAuth client ID → Web application**.
   - *Authorized redirect URIs*: `https://<project-ref>.supabase.co/auth/v1/callback` (makikita sa Supabase → Authentication → Providers → Google).
3. Kopyahin ang **Client ID** at **Client secret** → Supabase → Authentication → Providers → **Google** → i-enable at i-paste → Save.
4. Supabase → Authentication → URL Configuration → *Redirect URLs*: idagdag ang `https://iyong-site.com/**` (at `http://localhost:8000/**` para sa local test).
5. Gagana lang ang Google button kapag naka-host/`localhost` ang site (hindi kapag double-click na `file://`).

### 2. PayPal
1. developer.paypal.com → Apps & Credentials → gumawa ng app.
2. Ilagay ang **Sandbox client id** sa `paypalClientId` (`js/config.js`) para mag-test gamit ang sandbox buyer account (nasa Sandbox → Accounts).
3. Kapag handa na, palitan ng **Live client id** (kailangan ng PayPal Business account) para tumanggap ng totoong bayad.
4. Itakda ang `currency` sa config (USD, EUR, PHP, …).

### 3. Palitan ang products at branding
- `js/products.js` — ilagay ang sarili mong produkto (pangalan, presyo, stock, litrato, options). Ang litrato ay URL o file sa isang `images/` folder.
- `js/config.js` — brand name, tagline, shipping fee, free-shipping threshold, tax, email, WhatsApp number.
- Mga litrato sa sample products ay galing Unsplash — palitan ng sarili mong litrato.

### 4. I-run locally
```
cd velora-store
python3 -m http.server 8000      # tapos buksan http://localhost:8000
```
(Pwede ring double-click ang index.html, pero mas maaasahan ang geolocation at login sa `localhost`/HTTPS.) Ang "Use my current location" ay nangangailangan ng HTTPS o localhost.

## Mahalagang paalala sa seguridad (basahin)
Ito ay *static* site na walang sariling server, kaya:
- Ang presyo ay kinukuwenta sa browser. Posibleng may magtangkang baguhin ito para magbayad ng mas mababa. **Bago i-ship ang PayPal order, i-check sa PayPal dashboard na tama ang halaga at nakatugma ang PayPal ref** (ipinapakita ito sa Seller dashboard). Para sa mas mahigpit na seguridad, kailangan ng server-side na pag-verify (hal. Supabase Edge Function) — sabihin mo lang kung gusto mong idagdag.
- Ang COD orders ay `pending` hanggang ikaw ang mag-update.
- Row Level Security (sa `setup.sql`) ang pumipigil sa customer na makita ang orders ng iba o gawing admin ang sarili.
- Ang stock ay nasa `products.js` at hindi awtomatikong nababawasan; i-update mo kapag may nabenta.

## Mga file
```
index.html shop.html product.html cart.html checkout.html success.html
login.html register.html forgot.html reset.html account.html admin.html
contact.html about.html faq.html shipping.html privacy.html terms.html 404.html
css/style.css
js/config.js  products.js  store.js  (shared)   + isang script bawat page
supabase/setup.sql
```
