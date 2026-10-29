(function () {
  const { $, toast, sb, configured, esc } = Store;
  Store.layout("login.html");
  const C = window.CFG, mode = document.body.dataset.mode; // login | register | forgot | reset
  const form = $("#f"), msg = $("#msg");
  const show = (t, type = "err") => { msg.innerHTML = `<div class="notice ${type}">${esc(t)}</div>`; };
  const next = () => { const n = new URLSearchParams(location.search).get("next") || "account.html"; return /^[a-z0-9_\-./?=&%]+$/i.test(n) && !n.startsWith("//") && !/^[a-z]+:/i.test(n) ? n : "account.html"; };
  const client = sb();
  if (!configured() || !client) { show("Sign-in isn't connected yet. Add your Supabase keys in js/config.js (see README) and make sure you're online.", "err"); document.querySelectorAll("#f button,#f input,#google").forEach((e) => (e.disabled = true)); return; }

  const busy = (b, on, label) => { b.disabled = on; b.innerHTML = on ? `<span class="spin"></span>` : label; };

  if (mode !== "reset") client.auth.getSession().then(({ data }) => { if (data.session && mode !== "forgot") { let n = next(); try { const pl = sessionStorage.getItem("post_login"); if (pl) { n = pl; sessionStorage.removeItem("post_login"); } } catch {} location.replace(n); } });


  /* show / hide password */
  document.querySelectorAll("[data-eye]").forEach((b) => b.addEventListener("click", () => {
    const i = $("#" + b.dataset.eye); const show = i.type === "password"; i.type = show ? "text" : "password";
    b.classList.toggle("on", show); b.setAttribute("aria-label", show ? "Hide password" : "Show password");
  }));
  /* password strength (register) */
  const pw = $("#password"), meter = $("#meter");
  if (meter && pw) pw.addEventListener("input", () => {
    const v = pw.value; let sc = 0;
    if (v.length >= 8) sc++; if (/[A-Z]/.test(v) && /[a-z]/.test(v)) sc++; if (/\d/.test(v)) sc++; if (/[^A-Za-z0-9]/.test(v) || v.length >= 12) sc++;
    const L = ["Too short", "Weak", "Okay", "Good", "Strong"], col = ["#c0392b", "#c0392b", "#d9a21b", "#7fb83f", "#1f8a55"];
    meter.firstElementChild.style.width = (v ? Math.max(sc, 1) * 25 : 0) + "%"; meter.firstElementChild.style.background = col[sc];
    $("#meterTxt").textContent = v ? L[sc] : "Use 8+ characters";
  });
  /* Google sign-in / sign-up (OAuth through Supabase) */
  const g = $("#google");
  if (g) g.addEventListener("click", async () => {
    if (location.protocol === "file:") return show("Google sign-in needs the site to run on http://localhost or https:// (not by double-clicking the file). See README.");
    g.disabled = true; msg.innerHTML = "";
    try { sessionStorage.setItem("post_login", next()); } catch {}
    const { error } = await client.auth.signInWithOAuth({ provider: "google", options: { redirectTo: location.origin + location.pathname.replace(/[^/]*$/, "") + "login.html" } });
    if (error) { g.disabled = false; show(/provider is not enabled/i.test(error.message) ? "Google sign-in isn't switched on yet. Enable it in Supabase → Authentication → Providers → Google (see README)." : error.message); }
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault(); msg.innerHTML = "";
    const b = form.querySelector("button.btn"), label = b.textContent, v = (n) => (form[n] ? form[n].value.trim() : "");
    busy(b, true, label);
    try {
      if (mode === "login") {
        const { error } = await client.auth.signInWithPassword({ email: v("email"), password: form.password.value });
        if (error) throw new Error(/confirm/i.test(error.message) ? "Please verify your email first — check your inbox." : "Wrong email or password.");
        location.href = next();
      } else if (mode === "register") {
        if (form.password.value.length < 8) throw new Error("Password must be at least 8 characters.");
        if (form.password.value !== form.password2.value) throw new Error("Passwords don't match.");
        const { data, error } = await client.auth.signUp({ email: v("email"), password: form.password.value, options: { data: { full_name: v("name") }, emailRedirectTo: location.origin + location.pathname.replace(/[^/]*$/, "") + "login.html" } });
        if (error) throw new Error(error.message);
        if (data.session) location.href = next();
        else { show("Account created! Check your email to verify, then sign in.", "ok"); form.reset(); }
      } else if (mode === "forgot") {
        await client.auth.resetPasswordForEmail(v("email"), { redirectTo: location.origin + location.pathname.replace(/[^/]*$/, "") + "reset.html" });
        show("If that email has an account, a reset link is on its way.", "ok");
      } else if (mode === "reset") {
        if (form.password.value.length < 8) throw new Error("Password must be at least 8 characters.");
        const { error } = await client.auth.updateUser({ password: form.password.value });
        if (error) throw new Error(error.message);
        toast("Password updated"); setTimeout(() => (location.href = "account.html"), 800);
      }
    } catch (err) { show(err.message || "Something went wrong."); }
    busy(b, false, label);
  });
})();
