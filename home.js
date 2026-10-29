(function () {
  const { $, card, money } = Store;
  Store.layout("index.html");
  const P = window.PRODUCTS;
  const fill = (sel, list) => { $(sel).innerHTML = list.map(card).join(""); };
  fill("#featured", P.filter((p) => p.featured).slice(0, 4));
  fill("#best", [...P].sort((a, b) => b.sold - a.sold).slice(0, 4));
  fill("#deals", P.filter((p) => p.compareAt).slice(0, 4));
  $("#cats").innerHTML = window.CATEGORIES.map((c) => `<a class="cat" href="shop.html?category=${encodeURIComponent(c)}">${c}</a>`).join("");
  $("#heroImgs").innerHTML = [P[0], P[2]].map((p) => `<img src="${p.images[0]}" alt="${p.name}" onerror="${Store.fallbackImg}">`).join("");
  $("#freeShip").textContent = money(window.CFG.freeShippingOver);
  // countdown to end of day
  const t = () => {
    const end = new Date(); end.setHours(23, 59, 59, 999);
    const s = Math.max(0, Math.floor((end - new Date()) / 1000));
    const v = [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60].map((n) => String(n).padStart(2, "0"));
    ["h", "m", "s"].forEach((k, i) => { $("#t-" + k).textContent = v[i]; });
  };
  t(); setInterval(t, 1000);
})();
