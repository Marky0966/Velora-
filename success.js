(function () {
  Store.layout("");
  const id = new URLSearchParams(location.search).get("id") || "";
  Store.$("#ref").textContent = "#" + id.slice(0, 8).toUpperCase();
})();
