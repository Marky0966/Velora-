(function () {
  const { $, esc, toast, sb, configured } = Store;
  Store.layout("account.html");
  const root = $("#admin"), client = sb();
  if (!configured() || !client) { root.innerHTML = `<div class="notice err">Not connected — add Supabase keys in js/config.js.</div>`; return; }
  const money = (n, c) => new Intl.NumberFormat(window.CFG.locale, { style: "currency", currency: c }).format(n);
  const STATUS = ["pending", "paid", "packed", "shipped", "delivered", "cancelled", "refunded"];

  async function load() {
    const { data: s } = await client.auth.getSession();
    if (!s.session) { location.replace("login.html?next=admin.html"); return; }
    const ad = await client.from("admins").select("email");
    if (ad.error || !ad.data.length) { root.innerHTML = `<div class="notice err">This page is for the store owner only. (Add your email to the <code>admins</code> table — see README.)</div>`; return; }
    const [{ data: orders }, { data: msgs }, { count: subs }] = await Promise.all([
      client.from("orders").select("*").order("created_at", { ascending: false }).limit(200),
      client.from("messages").select("*").order("created_at", { ascending: false }).limit(50),
      client.from("subscribers").select("email", { count: "exact", head: true })
    ]);
    const paid = (orders || []).filter((o) => ["paid", "packed", "shipped", "delivered"].includes(o.status));
    const rev = paid.reduce((t, o) => t + Number(o.total), 0);
    root.innerHTML = `
      <div class="trust" style="margin-bottom:24px">
        <div class="card"><span>💰</span><b>${money(rev, window.CFG.currency)}</b><small class="muted">Revenue (paid orders)</small></div>
        <div class="card"><span>📦</span><b>${(orders || []).length}</b><small class="muted">Total orders</small></div>
        <div class="card"><span>⏳</span><b>${(orders || []).filter((o) => ["pending", "paid", "packed"].includes(o.status)).length}</b><small class="muted">To fulfil</small></div>
        <div class="card"><span>✉️</span><b>${subs ?? 0}</b><small class="muted">Subscribers</small></div></div>
      <h2>Orders</h2>
      <div class="notice info small">Before shipping a PayPal order, confirm the payment in your PayPal dashboard (match the PayPal ref and amount).</div>
      ${(orders || []).length ? (orders || []).map((o) => `<div class="order"><div class="top"><b>#${esc(o.id.slice(0, 8).toUpperCase())}</b><span class="muted small">${new Date(o.created_at).toLocaleString()}</span></div>
        <p class="small" style="margin:6px 0"><b>${esc(o.address.name)}</b> · ${esc(o.address.phone)} · ${esc(o.email)}<br>${esc(o.address.line1)}, ${esc(o.address.city)}, ${esc(o.address.state)} ${esc(o.address.zip)}, ${esc(o.address.country)}${o.address.note ? `<br><i>Note: ${esc(o.address.note)}</i>` : ""}
        ${o.address.lat ? `<br><a href="https://www.google.com/maps?q=${+o.address.lat},${+o.address.lon}" target="_blank" rel="noopener">📍 Open pinned location</a>` : `<br><a href="https://www.google.com/maps/search/${encodeURIComponent([o.address.line1, o.address.city, o.address.state, o.address.zip].join(" "))}" target="_blank" rel="noopener">📍 Find on map</a>`}</p>
        <ul style="margin:6px 0;padding-left:18px">${o.items.map((i) => `<li>${i.qty} × ${esc(i.name)}${i.variant ? ` (${esc(i.variant)})` : ""}</li>`).join("")}</ul>
        <p class="small muted">${esc(o.method)}${o.paypal_order_id ? " · PayPal ref " + esc(o.paypal_order_id) : ""} · <b>${money(o.total, o.currency)}</b></p>
        <div class="inline" style="flex-wrap:wrap"><select data-st="${esc(o.id)}" style="padding:9px;border-radius:10px;border:1px solid var(--line);background:var(--surface)">${STATUS.map((x) => `<option ${x === o.status ? "selected" : ""}>${x}</option>`).join("")}</select>
          <input data-tr="${esc(o.id)}" placeholder="Tracking number" value="${esc(o.tracking || "")}" style="padding:9px;border-radius:10px;border:1px solid var(--line);background:var(--surface)">
          <button class="btn sm" data-save="${esc(o.id)}">Save</button></div></div>`).join("") : `<div class="empty">No orders yet.</div>`}
      <h2 style="margin-top:36px">Customer messages</h2>
      ${(msgs || []).length ? msgs.map((m) => `<div class="order"><b>${esc(m.name)}</b> · <a href="mailto:${esc(m.email)}">${esc(m.email)}</a><p style="margin:6px 0 0">${esc(m.message)}</p></div>`).join("") : `<p class="muted">No messages.</p>`}`;
  }
  root.addEventListener("click", async (e) => {
    const b = e.target.closest("[data-save]"); if (!b) return;
    const id = b.dataset.save;
    b.disabled = true;
    const { error } = await client.from("orders").update({ status: root.querySelector(`[data-st="${id}"]`).value, tracking: root.querySelector(`[data-tr="${id}"]`).value.trim() || null }).eq("id", id);
    b.disabled = false; toast(error ? "Couldn't save" : "Order updated", error ? "err" : "ok");
  });
  load();
})();
