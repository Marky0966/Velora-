(function () {
  const { $, $$, esc, money, product, totals, checkoutItems, toast, sb, configured } = Store;
  Store.layout("cart.html");
  const C = window.CFG, root = $("#co");
  const COUNTRIES = [["PH","Philippines"],["US","United States"],["CA","Canada"],["GB","United Kingdom"],["AU","Australia"],["NZ","New Zealand"],["SG","Singapore"],["MY","Malaysia"],["ID","Indonesia"],["TH","Thailand"],["VN","Vietnam"],["JP","Japan"],["KR","South Korea"],["HK","Hong Kong"],["TW","Taiwan"],["IN","India"],["AE","United Arab Emirates"],["SA","Saudi Arabia"],["QA","Qatar"],["KW","Kuwait"],["DE","Germany"],["FR","France"],["ES","Spain"],["IT","Italy"],["NL","Netherlands"],["IE","Ireland"],["SE","Sweden"],["NO","Norway"],["CH","Switzerland"],["AT","Austria"],["BE","Belgium"],["PT","Portugal"],["PL","Poland"],["MX","Mexico"],["BR","Brazil"],["ZA","South Africa"],["OT","Other"]];
  const { buyNow, items } = checkoutItems();
  let session = null, confirmed = false, address = null, busy = false;

  if (!items.length) { root.innerHTML = `<div class="empty"><div class="big">🛒</div><h2>Nothing to check out</h2><a class="btn" href="shop.html">Browse products</a></div>`; return; }
  if (!configured() || !sb()) {
    root.innerHTML = `<div class="notice err"><b>Checkout isn't connected yet.</b> Add your Supabase keys in <code>js/config.js</code> (see README) — orders and sign-in need it. Also check your internet connection.</div>`; return;
  }

  const T = totals(items);
  const saved = Store.read("addr_v1", {});

  function summaryHTML() {
    return `<h3>Order summary</h3>${items.map((i) => { const p = product(i.id); return `<div class="row"><span>${i.qty} × ${esc(p.name)}${i.variant ? ` <span class="muted small">(${esc(i.variant)})</span>` : ""}</span><span>${money(p.price * i.qty)}</span></div>`; }).join("")}
    <div class="row" style="border-top:1px solid var(--line);padding-top:10px"><span>Subtotal</span><span>${money(T.subtotal)}</span></div>
    <div class="row"><span>Shipping</span><span>${T.shipping ? money(T.shipping) : "Free"}</span></div>
    ${T.tax ? `<div class="row"><span>Tax</span><span>${money(T.tax)}</span></div>` : ""}
    <div class="row total"><span>Total</span><span>${money(T.total)}</span></div>
    <p class="small muted">${buyNow ? "Buy now — this item only." : `<a href="cart.html">← Edit cart</a>`}</p>`;
  }

  function draw() {
    root.innerHTML = `
    <div class="steps"><div class="step done"><i>✓</i>Cart</div><div class="step ${confirmed ? "done" : "on"}"><i>${confirmed ? "✓" : "2"}</i>Delivery location</div><div class="step ${confirmed ? "on" : ""}"><i>3</i>Payment</div></div>
    <div class="two" style="padding-top:0"><div>
      <form id="addr" class="card ${confirmed ? "lock" : ""}" novalidate style="margin-bottom:20px">
        <h3>Where should we deliver?</h3>
        <button type="button" class="btn ghost sm" id="geo" style="margin-bottom:16px">📍 Use my current location</button>
        <div class="grid2">
          <div class="field"><label for="name">Full name</label><input id="name" name="name" autocomplete="name" required value="${esc(saved.name || session.user.user_metadata?.full_name || "")}"><span class="errmsg">Required</span></div>
          <div class="field"><label for="phone">Phone (with country code)</label><input id="phone" name="phone" type="tel" autocomplete="tel" required placeholder="+63 917 123 4567" value="${esc(saved.phone || "")}"><span class="errmsg">Enter a valid phone number</span></div>
        </div>
        <div class="field"><label for="country">Country</label><select id="country" name="country" required>${COUNTRIES.map(([c, n]) => `<option value="${c}" ${(saved.country || "PH") === c ? "selected" : ""}>${n}</option>`).join("")}</select></div>
        <div class="field"><label for="line1">Street address</label><input id="line1" name="line1" autocomplete="address-line1" required placeholder="House no., street, barangay / apartment" value="${esc(saved.line1 || "")}"><span class="errmsg">Required</span></div>
        <div class="grid2">
          <div class="field"><label for="city">City</label><input id="city" name="city" autocomplete="address-level2" required value="${esc(saved.city || "")}"><span class="errmsg">Required</span></div>
          <div class="field"><label for="state">State / Province</label><input id="state" name="state" autocomplete="address-level1" required value="${esc(saved.state || "")}"><span class="errmsg">Required</span></div>
        </div>
        <div class="grid2">
          <div class="field"><label for="zip">Postal code</label><input id="zip" name="zip" autocomplete="postal-code" required value="${esc(saved.zip || "")}"><span class="errmsg">Required</span></div>
          <div class="field"><label for="note">Delivery note (optional)</label><input id="note" name="note" placeholder="Landmark, gate code…" value="${esc(saved.note || "")}"></div>
        </div>
        <button class="btn" id="confirmAddr">Confirm delivery location</button>
      </form>
      ${confirmed ? `<div class="notice info" style="display:flex;justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap"><span>📦 Delivering to <b>${esc(address.name)}</b> — ${esc(address.line1)}, ${esc(address.city)}, ${esc(address.state)} ${esc(address.zip)}, ${esc((COUNTRIES.find((c) => c[0] === address.country) || [])[1] || "")}</span><button class="btn ghost sm" id="editAddr">Change</button></div>` : ""}
      <div class="card ${confirmed ? "" : "lock"}" id="payBox">
        <h3>Payment</h3>
        ${confirmed ? "" : `<p class="small muted">Confirm your delivery location first to unlock payment.</p>`}
        <div id="payErr"></div>
        <div id="paypal"></div>
        ${C.enableCOD ? `<div style="margin-top:14px"><button class="btn ghost full" id="cod" ${confirmed ? "" : "disabled"}>Place order — Cash on delivery</button></div>` : ""}
      </div></div>
      <aside class="card sum">${summaryHTML()}<p class="small muted center">🔒 Payments are processed securely by PayPal. We never see or store your card details.</p></aside></div>`;
    bind();
    if (confirmed) loadPayPal();
  }

  function bind() {
    const f = $("#addr");
    f.addEventListener("submit", (e) => {
      e.preventDefault();
      const d = Object.fromEntries(new FormData(f));
      let ok = true;
      ["name", "phone", "line1", "city", "state", "zip"].forEach((k) => {
        const wrap = f[k].closest(".field"); let good = String(d[k]).trim().length >= 2;
        if (k === "phone") good = /^[+\d][\d\s().-]{6,19}$/.test(String(d[k]).trim());
        wrap.classList.toggle("bad", !good); if (!good) ok = false;
      });
      if (!ok) { toast("Please complete your delivery details", "err"); f.querySelector(".bad input")?.focus(); return; }
      Object.keys(d).forEach((k) => (d[k] = String(d[k]).trim()));
      address = d; Store.write("addr_v1", d); confirmed = true; draw();
      $("#payBox").scrollIntoView({ behavior: "smooth", block: "center" });
    });
    $("#geo").onclick = geolocate;
    $("#editAddr")?.addEventListener("click", () => { confirmed = false; saved && Object.assign(saved, address); draw(); });
    $("#cod")?.addEventListener("click", () => placeOrder("cod", null));
  }

  function geolocate() {
    const btn = $("#geo");
    if (!navigator.geolocation) return toast("Location isn't supported on this device", "err");
    btn.disabled = true; btn.innerHTML = `<span class="spin"></span> Finding you…`;
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const { latitude: lat, longitude: lon } = pos.coords;
        const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&lat=${lat}&lon=${lon}`, { headers: { Accept: "application/json" } });
        const j = await r.json(), a = j.address || {};
        const set = (id, v) => { if (v) $("#" + id).value = v; };
        set("line1", [a.house_number, a.road, a.suburb || a.neighbourhood || a.quarter].filter(Boolean).join(", "));
        set("city", a.city || a.town || a.village || a.municipality || a.county);
        set("state", a.state || a.region || a.province);
        set("zip", a.postcode);
        const cc = (a.country_code || "").toUpperCase(); $("#country").value = COUNTRIES.some((c) => c[0] === cc) ? cc : "OT";
        saved.lat = lat; saved.lon = lon;
        toast("Location filled in — please double-check it");
      } catch { toast("Couldn't look up your address — please type it in", "err"); }
      btn.disabled = false; btn.textContent = "📍 Use my current location";
    }, (err) => {
      toast(err.code === 1 ? "Location permission denied — please type your address" : "Couldn't get your location", "err");
      btn.disabled = false; btn.textContent = "📍 Use my current location";
    }, { enableHighAccuracy: true, timeout: 12000 });
  }

  /* ---------- PayPal ---------- */
  let ppLoading;
  function loadPayPal() {
    const box = $("#paypal");
    if (!C.paypalClientId) { box.innerHTML = `<div class="notice err">PayPal isn't configured yet — add <code>paypalClientId</code> in <code>js/config.js</code>.</div>`; return; }
    if (!ppLoading) ppLoading = new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(C.paypalClientId)}&currency=${C.currency}&components=buttons&enable-funding=card`;
      s.onload = res; s.onerror = () => rej(new Error("PayPal failed to load")); document.head.appendChild(s);
    });
    box.innerHTML = `<p class="small muted"><span class="spin"></span> Loading secure payment…</p>`;
    ppLoading.then(() => {
      box.innerHTML = "";
      window.paypal.Buttons({
        style: { layout: "vertical", shape: "pill", label: "pay" },
        createOrder: (d, actions) => actions.order.create({
          purchase_units: [{ description: `${C.brand} order`, amount: { currency_code: C.currency, value: T.total.toFixed(2), breakdown: {
            item_total: { currency_code: C.currency, value: T.subtotal.toFixed(2) }, shipping: { currency_code: C.currency, value: T.shipping.toFixed(2) }, tax_total: { currency_code: C.currency, value: T.tax.toFixed(2) } } } }],
          application_context: { shipping_preference: "NO_SHIPPING" }
        }),
        onApprove: async (d, actions) => {
          const cap = await actions.order.capture();
          const amt = cap.purchase_units?.[0]?.payments?.captures?.[0];
          if (cap.status !== "COMPLETED" || !amt || Number(amt.amount.value) < T.total) { showErr("Payment wasn't completed. You have not been charged the full amount — please try again."); return; }
          await placeOrder("paypal", cap.id);
        },
        onCancel: () => toast("Payment cancelled"),
        onError: (err) => { console.error(err); showErr("Something went wrong with PayPal. Please try again."); }
      }).render("#paypal");
    }).catch(() => { box.innerHTML = `<div class="notice err">Couldn't load PayPal. Check your connection and refresh.</div>`; });
  }
  const showErr = (m) => { $("#payErr").innerHTML = `<div class="notice err">${esc(m)}</div>`; };

  /* ---------- save order ---------- */
  async function placeOrder(method, paypalId) {
    if (busy) return; busy = true;
    const btn = $("#cod"); if (btn) { btn.disabled = true; btn.innerHTML = `<span class="spin"></span> Placing order…`; }
    const lines = items.map((i) => { const p = product(i.id); return { id: p.id, name: p.name, variant: i.variant, qty: i.qty, price: p.price }; });
    const row = {
      user_id: session.user.id, email: session.user.email, items: lines,
      address: { ...address, lat: saved.lat ?? null, lon: saved.lon ?? null },
      subtotal: T.subtotal, shipping: T.shipping, tax: T.tax, total: T.total, currency: C.currency,
      method, paypal_order_id: paypalId, status: method === "paypal" ? "paid" : "pending"
    };
    const { data, error } = await sb().from("orders").insert(row).select("id").single();
    busy = false;
    if (error) {
      console.error(error);
      if (paypalId) { Store.write("unsaved_order", { paypalId, row }); showErr(`Your payment went through (PayPal ref ${paypalId}) but we couldn't save the order. Please contact us with this reference — do NOT pay again.`); }
      else { showErr("We couldn't place your order. Please try again."); if (btn) { btn.disabled = false; btn.textContent = "Place order — Cash on delivery"; } }
      return;
    }
    if (!buyNow) { Store.write("cart_v1", []); Store.badge(); }
    location.href = "success.html?id=" + data.id;
  }

  /* ---------- start: require sign-in ---------- */
  sb().auth.getSession().then(({ data }) => {
    if (!data.session) { location.replace("login.html?next=" + encodeURIComponent("checkout.html" + location.search)); return; }
    session = data.session; draw();
  });
})();
