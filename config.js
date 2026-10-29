/* ============================================================
   SETTINGS — ito lang ang kailangan mong baguhin para sa shop mo
   ============================================================ */
window.CFG = {
  brand: "VELORA",
  tagline: "Curated finds, delivered worldwide.",
  currency: "USD",            // PayPal currency code: USD, EUR, GBP, PHP, AUD, ...
  locale: "en-US",            // format ng presyo
  contactEmail: "hello@example.com",
  whatsapp: "",               // hal. "639171234567" (optional)

  // Shipping
  freeShippingOver: 75,       // libre ang shipping kapag lampas dito ang subtotal
  shippingFlat: 6.99,
  taxRate: 0,                 // 0.12 = 12%

  enableCOD: true,            // Cash on delivery option

  // Supabase (login + orders) — supabase.com → Project Settings → API
  supabaseUrl: "",
  supabaseAnonKey: "",

  // PayPal (card at PayPal payments) — developer.paypal.com → Apps & Credentials
  // Gamitin ang SANDBOX client id habang nagte-test, LIVE client id kapag handa na.
  paypalClientId: ""
};
