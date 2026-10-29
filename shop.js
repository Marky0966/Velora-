(function () {
  const { $, $$, card, wish, esc } = Store;
  Store.layout("shop.html");
  const params = new URLSearchParams(location.search);
  const st = { q: params.get("q") || "", cat: params.get("category") || "", sort: ["featured","best","rating","low","high"].includes(params.get("sort")) ? params.get("sort") : "featured", max: "", stock: false, wishlist: params.get("wishlist") === "1" };
  const P = window.PRODUCTS;
  const maxPrice = Math.ceil(Math.max(...P.map((p) => p.price)));
  $("#cats").innerHTML = ["", ...window.CATEGORIES].map((c) => `<button class="chip" data-cat="${esc(c)}">${c || "All"}</button>`).join("");
  $("#q").value = st.q; $("#maxv").max = maxPrice; $("#maxv").value = maxPrice; $("#sort").value = st.sort;

  function render() {
    let list = P.filter((p) =>
      (!st.cat || p.category === st.cat) &&
      (!st.q || (p.name + " " + p.category + " " + p.desc).toLowerCase().includes(st.q.toLowerCase())) &&
      (!st.max || p.price <= +st.max) && (!st.stock || p.stock > 0) && (!st.wishlist || wish().includes(p.id)));
    const sorts = {
      featured: (a, b) => (b.featured | 0) - (a.featured | 0) || b.sold - a.sold,
      low: (a, b) => a.price - b.price, high: (a, b) => b.price - a.price,
      best: (a, b) => b.sold - a.sold, rating: (a, b) => b.rating - a.rating
    };
    list.sort(sorts[st.sort]);
    $("#grid").innerHTML = list.map(card).join("");
    $("#empty").hidden = list.length > 0; $("#grid").hidden = !list.length;
    $("#count").textContent = `${list.length} product${list.length === 1 ? "" : "s"}` + (st.wishlist ? " in your wishlist" : "");
    $("#title").textContent = st.wishlist ? "My wishlist" : st.cat || "All products";
    $$("#cats .chip").forEach((c) => c.classList.toggle("on", c.dataset.cat === st.cat));
    $("#maxl").textContent = st.max ? "≤ " + Store.money(+st.max) : "Any";
  }
  $("#cats").onclick = (e) => { const b = e.target.closest("[data-cat]"); if (b) { st.cat = b.dataset.cat; render(); } };
  $("#q").oninput = (e) => { st.q = e.target.value; render(); };
  $("#sort").onchange = (e) => { st.sort = e.target.value; render(); };
  $("#maxv").oninput = (e) => { st.max = +e.target.value >= maxPrice ? "" : e.target.value; render(); };
  $("#stock").onchange = (e) => { st.stock = e.target.checked; render(); };
  $("#reset").onclick = () => { Object.assign(st, { q: "", cat: "", max: "", stock: false, sort: "featured", wishlist: false }); $("#q").value = ""; $("#sort").value = "featured"; $("#maxv").value = maxPrice; $("#stock").checked = false; render(); };
  // wishlist page: re-render after un-hearting
  document.addEventListener("click", (e) => { if (st.wishlist && e.target.closest("[data-wish]")) setTimeout(render, 0); });
  render();
})();
