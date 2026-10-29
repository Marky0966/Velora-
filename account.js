(function () {
  const { $, esc, money, toast, sb, configured } = Store;
  Store.layout("account.html");
  const root = $("#acct"), client = sb();
  if (!configured() || !client) { root.innerHTML = `<div class="notice err">Accounts aren't connected yet — add your Supabase keys in js/config.js.</div>`; return; }
  const fmt = (d) => new Date(d).toLocaleString();
  client.auth.getSession().then(async ({ data }) => {
    if (!data.session) { location.replace("login.html?next=account.html"); return; }
    const u = data.session.user;
    const [{ data: orders, error }, adm] = await Promise.all([
      client.from("orders").select("*").eq("user_id", u.id).order("created_at", { ascending: false }),
      client.from("admins").select("email").limit(1)
    ]);
    const isAdmin = !adm.error && adm.data && adm.data.length > 0;
    root.innerHTML = `
      <div class="two"><div>
        <h2>My orders</h2>
        ${error ? `<div class="notice err">Couldn't load orders.</div>` : !orders.length ? `<div class="empty"><div class="big">📦</div><p>No orders yet.</p><a class="btn" href="shop.html">Start shopping</a></div>` :
          orders.map((o) => `<div class="order"><div class="top"><b>#${esc(o.id.slice(0, 8).toUpperCase())}</b><span><span class="badge ${esc(o.status)}">${esc(o.status)}</span> <span class="badge">${esc(o.method)}</span></span></div>
          <p class="muted small">${fmt(o.created_at)}</p>
          <ul style="margin:6px 0;padding-left:18px">${o.items.map((i) => `<li>${i.qty} × ${esc(i.name)}${i.variant ? ` (${esc(i.variant)})` : ""}</li>`).join("")}</ul>
          <p class="small muted">Ship to: ${esc(o.address.name)}, ${esc(o.address.line1)}, ${esc(o.address.city)}, ${esc(o.address.country)}</p>
          ${o.tracking ? `<p class="small">Tracking: <b>${esc(o.tracking)}</b></p>` : ""}
          <b>${new Intl.NumberFormat(Store.read("x", undefined) || window.CFG.locale, { style: "currency", currency: o.currency }).format(o.total)}</b></div>`).join("")}
      </div>
      <aside class="card"><h3>Account</h3><p style="margin:0"><b>${esc(u.user_metadata?.full_name || "Customer")}</b></p><p class="muted small">${esc(u.email)}</p>
        ${isAdmin ? `<a class="btn full" href="admin.html" style="margin-bottom:10px">Seller dashboard</a>` : ""}
        <a class="btn ghost full" href="reset.html" style="margin-bottom:10px">Change password</a>
        <button class="btn dark full" id="out">Sign out</button></aside></div>`;
    $("#out").onclick = async () => { await client.auth.signOut(); toast("Signed out"); setTimeout(() => (location.href = "index.html"), 500); };
  });
})();
