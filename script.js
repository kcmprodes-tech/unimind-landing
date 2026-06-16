/* ============================================================
   Unimind Intelligence — Landing interactions
   ============================================================ */
(function () {
  "use strict";

  /* ---------- Footer year ---------- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ---------- Sticky header shadow on scroll ---------- */
  var header = document.getElementById("siteHeader");
  var onScroll = function () {
    if (!header) return;
    header.classList.toggle("scrolled", window.scrollY > 8);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------- Mobile nav toggle ---------- */
  var navToggle = document.getElementById("navToggle");
  var mobileNav = document.getElementById("mobileNav");
  if (navToggle && mobileNav && header) {
    var setNav = function (open) {
      header.classList.toggle("nav-open", open);
      mobileNav.hidden = !open;
      navToggle.setAttribute("aria-expanded", String(open));
      navToggle.querySelector("i").className = open ? "ph ph-x" : "ph ph-list";
    };
    navToggle.addEventListener("click", function () {
      setNav(mobileNav.hidden);
    });
    mobileNav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () { setNav(false); });
    });
  }

  /* ---------- Reveal on scroll ---------- */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revealEls.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  /* ============================================================
     Enquiry form
     ============================================================ */
  var form = document.getElementById("enquiryForm");
  if (!form) return;

  var statusEl = document.getElementById("formStatus");
  var submitBtn = document.getElementById("submitBtn");
  var btnLabel = submitBtn ? submitBtn.querySelector(".btn-label") : null;

  var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // translate helper (falls back to the given Indonesian string)
  function tr(key, fb) {
    try { return (window.UnimindI18N && window.UnimindI18N.t(key)) || fb; }
    catch (e) { return fb; }
  }

  function showStatus(type, msg) {
    if (!statusEl) return;
    statusEl.hidden = false;
    statusEl.className = "form-status " + type;
    statusEl.textContent = msg;
  }

  function setBusy(busy) {
    if (!submitBtn) return;
    submitBtn.setAttribute("aria-busy", String(busy));
    if (btnLabel) btnLabel.textContent = busy ? tr("form.sending", "Mengirim...") : tr("form.submit", "Minta Demo / Kirim");
  }

  function validate() {
    var ok = true;
    var required = [
      { id: "name", test: function (v) { return v.length > 1; } },
      { id: "email", test: function (v) { return emailRe.test(v); } },
      { id: "whatsapp", test: function (v) { return v.replace(/\D/g, "").length >= 8; } },
      { id: "company", test: function (v) { return v.length > 1; } }
    ];
    required.forEach(function (f) {
      var el = document.getElementById(f.id);
      if (!el) return;
      var valid = f.test(el.value.trim());
      el.classList.toggle("invalid", !valid);
      if (!valid && ok) el.focus();
      ok = ok && valid;
    });
    return ok;
  }

  // clear invalid state on input
  form.querySelectorAll("input, textarea").forEach(function (el) {
    el.addEventListener("input", function () { el.classList.remove("invalid"); });
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (statusEl) statusEl.hidden = true;

    if (!validate()) {
      showStatus("error", tr("form.err.validate", "Mohon lengkapi data yang ditandai dengan benar."));
      return;
    }

    var needs = Array.prototype.map.call(
      form.querySelectorAll('input[name="needs"]:checked'),
      function (c) { return c.value; }
    );

    var payload = {
      name: form.name.value.trim(),
      email: form.email.value.trim(),
      whatsapp: form.whatsapp.value.trim(),
      company: form.company.value.trim(),
      role: form.role.value.trim(),
      needs: needs,
      message: form.message.value.trim(),
      company_url: form.company_url.value, // honeypot
      page: window.location.href
    };

    setBusy(true);

    fetch("/api/enquiry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then(function (res) {
        return res.json().then(function (data) { return { ok: res.ok, data: data }; });
      })
      .then(function (r) {
        if (r.ok && r.data && r.data.ok) {
          form.reset();
          showStatus("success", tr("form.ok", "Terima kasih! Permintaan Anda terkirim. Tim Unimind Intelligence akan segera menghubungi Anda."));
        } else {
          showStatus("error", (r.data && r.data.error) || tr("form.err.server", "Maaf, terjadi kesalahan. Silakan coba lagi."));
        }
      })
      .catch(function () {
        showStatus("error", tr("form.err.network", "Gagal mengirim. Periksa koneksi Anda lalu coba lagi."));
      })
      .finally(function () {
        setBusy(false);
      });
  });
})();
