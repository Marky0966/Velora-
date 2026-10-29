(function () {
  const { $, toast, sb, esc } = Store;
  Store.layout("contact.html");
  const C = window.CFG;
  $("#mail").textContent = C.contactEmail; $("#mail").href = "mailto:" + C.contactEmail;
  $("#f").addEventListener("submit", async (e) => {
    e.preventDefault(); const f = e.target, b = f.querySelector("button"), c = sb();
    if (!c) return toast("Contact form isn't connected yet — email us instead.", "err");
    b.disabled = true; b.innerHTML = `<span class="spin"></span>`;
    const { error } = await c.from("messages").insert({ name: f.name.value.trim(), email: f.email.value.trim(), message: f.message.value.trim() });
    b.disabled = false; b.textContent = "Send message";
    if (error) return toast("Couldn't send — please try again", "err");
    f.reset(); $("#msg").innerHTML = `<div class="notice ok">Thanks! We'll reply by email soon.</div>`; toast("Message sent");
  });
})();
