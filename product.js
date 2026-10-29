(function () {
  const { $, $$, esc, money, product, stars, card, toast } = Store;
  Store.layout("shop.html");
  const id = new URLSearchParams(location.search).get("id");
  const p = product(id);
  const root = $("#pd");
  if (!p) { root.innerHTML = `<div class="empty"><div class="big">🔎</div><h2>Product not found</h2><a class="btn" href="shop.html">Back to shop</a></div>`; return; }
  document.title = p.name + " · " + window.CFG.brand;
  let variant = p.options ? p.options.values[0] : "", qty = 1, img = 0;
  const off = p.compareAt ? Math.round((1 - p.price / p.compareAt) * 100) : 0;

  function draw() {
    root.innerHTML = `
    <div><div class="gal-main"><img src="${esc(p.images[img])}" alt="${esc(p.name)}" onerror="${Store.fallbackImg}"></div>
      ${p.images.length > 1 ? `<div class="thumbs">${p.images.map((s, i) => `<button class="${i === img ? "on" : ""}" data-i="${i}" aria-label="Image ${i + 1}"><img src="${esc(s)}" alt=""></button>`).join("")}</div>` : ""}</div>
    <div>
      <p class="muted small"><a href="shop.html">Shop</a> / <a href="shop.html?category=${encodeURIComponent(p.category)}">${esc(p.category)}</a></p>
      <h1 style="font-size:2rem">${esc(p.name)}</h1>
      <p>${stars(p.rating)} <span class="muted small">${p.rating} · ${p.sold} sold</span></p>
      <p class="big">${money(p.price)} ${p.compareAt ? `<s class="muted" style="font-size:1rem;font-weight:400">${money(p.compareAt)}</s> <span class="badge">-${off}%</span>` : ""}</p>
      <p>${esc(p.desc)}</p>
      ${p.options ? `<div class="field" style="margin:0"><label>${esc(p.options.label)}: <b style="color:var(--ink)">${esc(variant)}</b></label></div>
        <div class="opts">${p.options.values.map((v) => `<button class="chip ${v === variant ? "on" : ""}" data-v="${esc(v)}">${esc(v)}</button>`).join("")}</div>` : ""}
      <p class="small" style="color:${p.stock > 0 ? "var(--ok)" : "var(--err)"};font-weight:700">${p.stock > 0 ? (p.stock <= 10 ? `Only ${p.stock} left!` : "In stock") : "Out of stock"}</p>
      <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center;margin:14px 0">
        <div class="qty"><button data-q="-1" aria-label="Decrease">−</button><span>${qty}</span><button data-q="1" aria-label="Increase">+</button></div>
        <button class="btn ghost" id="add" ${p.stock ? "" : "disabled"}>Add to cart</button>
        <button class="btn" id="buy" ${p.stock ? "" : "disabled"}>Buy now</button>
        <button class="btn ghost sm heart-inline" data-wish="${esc(p.id)}">♥ Wishlist</button>
      </div>
      <ul class="perks"><li>🚚 Ships worldwide · free over ${money(window.CFG.freeShippingOver)}</li><li>🔒 Secure checkout with PayPal &amp; cards</li><li>↩️ 14-day returns on unused items</li></ul>
      <p class="small muted" style="margin-top:18px">Share: <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(location.href)}" target="_blank" rel="noopener">Facebook</a> · <a href="https://twitter.com/intent/tweet?url=${encodeURIComponent(location.href)}" target="_blank" rel="noopener">X</a> · <a href="#" id="copy">Copy link</a></p>
    </div>`;
    const w = $(".heart-inline"); if (Store.wish().includes(p.id)) w.textContent = "♥ Saved";
  }
  root.addEventListener("click", async (e) => {
    const t = e.target;
    if (t.closest("[data-i]")) { img = +t.closest("[data-i]").dataset.i; draw(); }
    else if (t.closest("[data-v]")) { variant = t.closest("[data-v]").dataset.v; draw(); }
    else if (t.closest("[data-q]")) { qty = Math.max(1, Math.min(p.stock, qty + +t.closest("[data-q]").dataset.q)); draw(); }
    else if (t.id === "add") Store.addToCart(p.id, variant, qty);
    else if (t.id === "buy") location.href = `checkout.html?buy=${encodeURIComponent(p.id)}&v=${encodeURIComponent(variant)}&q=${qty}`;
    else if (t.closest(".heart-inline")) { const b = t.closest(".heart-inline"); b.textContent = Store.wish().includes(p.id) ? "♥ Wishlist" : "♥ Saved"; }
    else if (t.id === "copy") { e.preventDefault(); try { await navigator.clipboard.writeText(location.href); toast("Link copied"); } catch { toast("Copy failed", "err"); } }
  });
  draw();
  $("#related").innerHTML = window.PRODUCTS.filter((x) => x.category === p.category && x.id !== p.id).concat(window.PRODUCTS.filter((x) => x.category !== p.category)).slice(0, 4).map(card).join("");
  // recently viewed
  const rv = [p.id, ...Store.read("rv_v1", []).filter((x) => x !== p.id)].slice(0, 8); Store.write("rv_v1", rv);
  const others = rv.slice(1).map(product).filter(Boolean).slice(0, 4);
  if (others.length) { $("#rv").innerHTML = others.map(card).join(""); $("#rvwrap").hidden = false; }
})();
