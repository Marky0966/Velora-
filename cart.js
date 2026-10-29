(function () {
  const { $, esc, money, product, getCart, setQty, removeLine, totals } = Store;
  Store.layout("cart.html");
  const C = window.CFG;
  function draw() {
    const items = getCart(), root = $("#cart");
    if (!items.length) {
      root.innerHTML = `<div class="empty"><div class="big">🛒</div><h2>Your cart is empty</h2><p class="muted">Add something you love.</p><a class="btn" href="shop.html">Start shopping</a></div>`;
      return;
    }
    const t = totals(items), left = Math.max(0, C.freeShippingOver - t.subtotal), pct = Math.min(100, (t.subtotal / C.freeShippingOver) * 100);
    root.innerHTML = `<div class="two"><div class="card">
      <p class="small"><b>${left > 0 ? `Add ${money(left)} more for free shipping` : "🎉 You've unlocked free shipping!"}</b></p><div class="progress"><i style="width:${pct}%"></i></div>
      ${items.map((i) => { const p = product(i.id); return `<div class="line">
        <a href="product.html?id=${esc(p.id)}"><img src="${esc(p.images[0])}" alt="${esc(p.name)}" onerror="${Store.fallbackImg}"></a>
        <div><a href="product.html?id=${esc(p.id)}"><b>${esc(p.name)}</b></a>${i.variant ? `<p class="muted small" style="margin:0">${esc(p.options?.label || "Option")}: ${esc(i.variant)}</p>` : ""}
          <p style="margin:2px 0">${money(p.price)}</p>
          <div class="qty"><button data-d="-1" data-id="${esc(i.id)}" data-v="${esc(i.variant)}" aria-label="Decrease">−</button><span>${i.qty}</span><button data-d="1" data-id="${esc(i.id)}" data-v="${esc(i.variant)}" aria-label="Increase">+</button></div></div>
        <div style="text-align:right"><b>${money(p.price * i.qty)}</b><br><button class="chip" data-rm="${esc(i.id)}" data-v="${esc(i.variant)}" style="margin-top:8px">Remove</button></div></div>`; }).join("")}
      </div>
      <aside class="card sum"><h3>Order summary</h3>
        <div class="row"><span>Subtotal</span><span>${money(t.subtotal)}</span></div>
        <div class="row"><span>Shipping</span><span>${t.shipping ? money(t.shipping) : "Free"}</span></div>
        ${t.tax ? `<div class="row"><span>Tax</span><span>${money(t.tax)}</span></div>` : ""}
        <div class="row total"><span>Total</span><span>${money(t.total)}</span></div>
        <a class="btn full" href="checkout.html" style="margin-top:14px">Checkout</a>
        <a class="btn ghost full" href="shop.html" style="margin-top:10px">Continue shopping</a>
        <p class="small muted center" style="margin-top:14px">🔒 Secure checkout · You'll enter your delivery location next</p></aside></div>`;
  }
  $("#cart").addEventListener("click", (e) => {
    const d = e.target.closest("[data-d]"), r = e.target.closest("[data-rm]");
    if (d) { const line = getCart().find((i) => i.id === d.dataset.id && i.variant === d.dataset.v); setQty(d.dataset.id, d.dataset.v, line.qty + +d.dataset.d); draw(); }
    if (r) { removeLine(r.dataset.rm, r.dataset.v); Store.toast("Item removed"); draw(); }
  });
  draw();
})();
