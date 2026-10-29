/* Shared logic: cart, wishlist, theme, header/footer, toast, supabase client */
(function () {
  const C = window.CFG, P = window.PRODUCTS;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const money = (n) => new Intl.NumberFormat(C.locale, { style: "currency", currency: C.currency }).format(n);
  const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
  const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
  const product = (id) => P.find((p) => p.id === id);
  const r2 = (n) => Math.round(n * 100) / 100;

  /* ---------- toast ---------- */
  function toast(msg, type = "ok") {
    let box = $("#toasts");
    if (!box) { box = document.createElement("div"); box.id = "toasts"; box.setAttribute("aria-live", "polite"); document.body.appendChild(box); }
    const t = document.createElement("div");
    t.className = "toast " + type; t.textContent = msg; box.appendChild(t);
    requestAnimationFrame(() => t.classList.add("show"));
    setTimeout(() => { t.classList.remove("show"); setTimeout(() => t.remove(), 300); }, 3000);
  }

  /* ---------- cart ---------- */
  const getCart = () => read("cart_v1", []).filter((i) => product(i.id));
  const saveCart = (c) => { write("cart_v1", c); badge(); };
  function addToCart(id, variant = "", qty = 1) {
    const p = product(id); if (!p) return false;
    const cart = getCart(); const line = cart.find((i) => i.id === id && i.variant === variant);
    const have = line ? line.qty : 0;
    if (have + qty > p.stock) { toast(`Only ${p.stock} in stock`, "err"); return false; }
    if (line) line.qty += qty; else cart.push({ id, variant, qty });
    saveCart(cart); toast("Added to cart"); return true;
  }
  function setQty(id, variant, qty) {
    let cart = getCart(); const p = product(id);
    cart = cart.map((i) => (i.id === id && i.variant === variant ? { ...i, qty: Math.min(qty, p.stock) } : i)).filter((i) => i.qty > 0);
    saveCart(cart);
  }
  const removeLine = (id, variant) => saveCart(getCart().filter((i) => !(i.id === id && i.variant === variant)));
  function totals(items) {
    const subtotal = r2(items.reduce((s, i) => s + product(i.id).price * i.qty, 0));
    const shipping = !subtotal || subtotal >= C.freeShippingOver ? 0 : C.shippingFlat;
    const tax = r2(subtotal * C.taxRate);
    return { subtotal, shipping, tax, total: r2(subtotal + shipping + tax) };
  }
  // Buy Now: ?buy=ID&v=variant&q=1 → isang item lang, hindi hinahalo sa cart
  function checkoutItems() {
    const q = new URLSearchParams(location.search);
    if (q.get("buy") && product(q.get("buy"))) return { buyNow: true, items: [{ id: q.get("buy"), variant: q.get("v") || "", qty: Math.max(1, Math.min(+q.get("q") || 1, product(q.get("buy")).stock)) }] };
    return { buyNow: false, items: getCart() };
  }
  function badge() {
    const n = getCart().reduce((s, i) => s + i.qty, 0);
    $$(".cart-count").forEach((e) => { e.textContent = n; e.hidden = !n; });
  }

  /* ---------- wishlist ---------- */
  const wish = () => read("wish_v1", []);
  function toggleWish(id) {
    const w = wish(); const i = w.indexOf(id);
    if (i >= 0) w.splice(i, 1); else w.push(id);
    write("wish_v1", w); toast(i >= 0 ? "Removed from wishlist" : "Saved to wishlist");
    $$(`[data-wish="${id}"]`).forEach((b) => b.classList.toggle("on", i < 0));
  }

  /* ---------- UI helpers ---------- */
  const stars = (r) => `<span class="stars" aria-label="${r} out of 5">${"★".repeat(Math.round(r))}${"☆".repeat(5 - Math.round(r))}</span>`;
  const fallbackImg = "this.onerror=null;this.src='data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22400%22><rect width=%22400%22 height=%22400%22 fill=%22%23e9e4d8%22/><text x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 fill=%22%23999%22 font-family=%22sans-serif%22>No image</text></svg>'";
  function card(p) {
    const off = p.compareAt ? Math.round((1 - p.price / p.compareAt) * 100) : 0;
    return `<article class="pcard">
      <a href="product.html?id=${esc(p.id)}" class="pimg"><img loading="lazy" src="${esc(p.images[0])}" alt="${esc(p.name)}" onerror="${fallbackImg}">
        ${off ? `<span class="tag">-${off}%</span>` : ""}${p.stock === 0 ? `<span class="tag dark">Sold out</span>` : ""}</a>
      <button class="heart ${wish().includes(p.id) ? "on" : ""}" data-wish="${esc(p.id)}" aria-label="Wishlist">♥</button>
      <div class="pbody"><p class="muted small">${esc(p.category)}</p>
        <h3><a href="product.html?id=${esc(p.id)}">${esc(p.name)}</a></h3>
        <p class="small">${stars(p.rating)} <span class="muted">${p.rating} · ${p.sold} sold</span></p>
        <p class="price">${money(p.price)} ${p.compareAt ? `<s class="muted">${money(p.compareAt)}</s>` : ""}</p>
        <button class="btn sm full" data-add="${esc(p.id)}" ${p.stock === 0 || p.options ? (p.stock === 0 ? "disabled" : "data-choose") : ""}>${p.stock === 0 ? "Sold out" : p.options ? "Choose options" : "Add to cart"}</button>
      </div></article>`;
  }

  // delegated clicks for cards (Add to cart / wishlist)
  document.addEventListener("click", (e) => {
    const h = e.target.closest("[data-wish]"); if (h) { toggleWish(h.dataset.wish); return; }
    const a = e.target.closest("[data-add]");
    if (a && !a.disabled) {
      if (a.hasAttribute("data-choose")) location.href = "product.html?id=" + a.dataset.add;
      else addToCart(a.dataset.add, "", 1);
    }
  });

  /* ---------- theme ---------- */
  const applyTheme = (t) => document.documentElement.setAttribute("data-theme", t);
  applyTheme(read("theme_v1", matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));

  /* ---------- supabase ---------- */
  let _sb;
  function sb() {
    if (_sb !== undefined) return _sb;
    _sb = C.supabaseUrl && C.supabaseAnonKey && window.supabase ? window.supabase.createClient(C.supabaseUrl, C.supabaseAnonKey) : null;
    return _sb;
  }
  const configured = () => !!(C.supabaseUrl && C.supabaseAnonKey);

  /* ---------- layout ---------- */
  function layout(active) {
    const nav = [["index.html", "Home"], ["shop.html", "Shop"], ["about.html", "About"], ["contact.html", "Contact"]];
    $("#site-header").innerHTML = `
      <div class="announce">🌍 Worldwide shipping · Free delivery over ${money(C.freeShippingOver)} · Secure checkout</div>
      <header class="head"><div class="wrap head-in">
        <button class="icon burger" aria-label="Menu" aria-expanded="false">☰</button>
        <a class="logo" href="index.html"><span class="mark">V</span>${esc(C.brand)}</a>
        <nav class="nav" id="nav">${nav.map(([h, l]) => `<a href="${h}" class="${active === h ? "active" : ""}">${l}</a>`).join("")}</nav>
        <form class="search" action="shop.html"><input name="q" type="search" placeholder="Search products…" aria-label="Search"></form>
        <div class="actions">
          <button class="icon" id="themeBtn" aria-label="Toggle theme">🌓</button>
          <a class="icon" href="shop.html?wishlist=1" aria-label="Wishlist">♡</a>
          <a class="icon" id="acctLink" href="login.html" aria-label="Account">👤</a>
          <a class="icon cartbtn" href="cart.html" aria-label="Cart">🛒<span class="cart-count" hidden>0</span></a>
        </div></div></header>`;
    $("#site-footer").innerHTML = `
      <footer class="foot"><div class="wrap foot-grid">
        <div><a class="logo" href="index.html"><span class="mark">V</span>${esc(C.brand)}</a><p class="muted">${esc(C.tagline)}</p>
          <p class="small muted">We accept PayPal, Visa, Mastercard, Amex${C.enableCOD ? " & Cash on Delivery" : ""}.</p></div>
        <div><h4>Shop</h4><a href="shop.html">All products</a>${window.CATEGORIES.map((c) => `<a href="shop.html?category=${encodeURIComponent(c)}">${c}</a>`).join("")}</div>
        <div><h4>Help</h4><a href="shipping.html">Shipping &amp; returns</a><a href="faq.html">FAQ</a><a href="contact.html">Contact us</a><a href="account.html">My orders</a></div>
        <div><h4>Newsletter</h4><p class="small muted">Deals and new arrivals. No spam.</p>
          <form id="newsForm" class="inline"><input type="email" name="email" placeholder="you@email.com" required aria-label="Email"><button class="btn sm">Join</button></form></div>
      </div><div class="foot-bottom"><div class="wrap"><span>© ${new Date().getFullYear()} ${esc(C.brand)}. All rights reserved.</span><span><a href="privacy.html">Privacy</a> · <a href="terms.html">Terms</a></span></div></div></footer>`;
    $("#themeBtn").onclick = () => { const t = document.documentElement.dataset.theme === "dark" ? "light" : "dark"; applyTheme(t); write("theme_v1", t); };
    const burger = $(".burger"), navEl = $("#nav");
    burger.onclick = () => { const o = navEl.classList.toggle("open"); burger.setAttribute("aria-expanded", o); };
    $("#newsForm").onsubmit = async (e) => {
      e.preventDefault(); const email = e.target.email.value.trim(); const c = sb();
      if (!c) return toast("Newsletter not available yet", "err");
      const { error } = await c.from("subscribers").insert({ email });
      toast(error && !/duplicate/i.test(error.message) ? "Something went wrong" : "Thanks for subscribing!", error && !/duplicate/i.test(error.message) ? "err" : "ok");
      if (!error) e.target.reset();
    };
    badge();
    const c = sb();
    if (c) c.auth.getSession().then(({ data }) => { if (data.session) { $("#acctLink").href = "account.html"; $("#acctLink").title = data.session.user.email; $("#acctLink").classList.add("signed"); } });
    if (C.whatsapp) { const w = document.createElement("a"); w.className = "wa"; w.href = "https://wa.me/" + C.whatsapp; w.target = "_blank"; w.rel = "noopener"; w.textContent = "💬"; w.setAttribute("aria-label", "Chat on WhatsApp"); document.body.appendChild(w); }
  }

  window.Store = { $, $$, esc, money, read, write, product, toast, getCart, addToCart, setQty, removeLine, totals, checkoutItems, wish, toggleWish, stars, card, sb, configured, layout, badge, fallbackImg };
})();
