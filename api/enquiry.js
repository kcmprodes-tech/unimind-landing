import { Resend } from "resend";

/* ------------------------------------------------------------------
   POST /api/enquiry
   Receives the demo enquiry form and emails it via Resend.

   Required env vars (set in Vercel project settings):
     RESEND_API_KEY     – API key from https://resend.com
     ENQUIRY_TO_EMAIL    – recipient (where leads land), e.g. you@kgmedia.id
     ENQUIRY_FROM_EMAIL  – verified sender, e.g. "Unimind <demo@unimind.kgmedia.id>"
                           (for quick testing you may use "onboarding@resend.dev")
   ------------------------------------------------------------------ */

const esc = (s = "") =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  // Vercel parses JSON bodies automatically; guard for string just in case.
  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  body = body || {};

  const {
    name = "",
    email = "",
    whatsapp = "",
    company = "",
    role = "",
    needs = [],
    message = "",
    company_url = "", // honeypot
    page = ""
  } = body;

  // Honeypot: real users never fill this. Pretend success to bots.
  if (company_url) return res.status(200).json({ ok: true });

  // Server-side validation
  if (
    !name || name.trim().length < 2 ||
    !EMAIL_RE.test(String(email).trim()) ||
    String(whatsapp).replace(/\D/g, "").length < 8 ||
    !company || company.trim().length < 2
  ) {
    return res.status(400).json({ ok: false, error: "Data tidak lengkap atau tidak valid." });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.ENQUIRY_TO_EMAIL;
  const fromEmail = process.env.ENQUIRY_FROM_EMAIL || "Unimind Intelligence <onboarding@resend.dev>";

  if (!apiKey || !toEmail) {
    console.error("Missing RESEND_API_KEY or ENQUIRY_TO_EMAIL env var.");
    return res.status(500).json({ ok: false, error: "Konfigurasi email belum lengkap di server." });
  }

  const needsList = Array.isArray(needs) ? needs : [needs].filter(Boolean);
  const row = (label, value) =>
    `<tr><td style="padding:8px 14px;color:#5A6478;font-size:13px;width:170px;vertical-align:top">${label}</td>
         <td style="padding:8px 14px;color:#0B1020;font-size:14px;font-weight:600">${value || "-"}</td></tr>`;

  const html = `
  <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:auto;background:#fff;border:1px solid #E7EAF1;border-radius:16px;overflow:hidden">
    <div style="background:linear-gradient(120deg,#3BC4F2,#3E8DE6 55%,#6A4FE6);padding:22px 24px;color:#fff">
      <div style="font-size:12px;letter-spacing:.2em;opacity:.85">UNIMIND INTELLIGENCE</div>
      <div style="font-size:19px;font-weight:700;margin-top:4px">Permintaan Demo Baru</div>
    </div>
    <table style="width:100%;border-collapse:collapse">
      ${row("Nama", esc(name))}
      ${row("Email kantor", `<a href="mailto:${esc(email)}" style="color:#3E8DE6">${esc(email)}</a>`)}
      ${row("WhatsApp", `<a href="https://wa.me/${String(whatsapp).replace(/\D/g, "")}" style="color:#3E8DE6">${esc(whatsapp)}</a>`)}
      ${row("Perusahaan", esc(company))}
      ${row("Jabatan", esc(role))}
      ${row("Kebutuhan", needsList.length ? esc(needsList.join(", ")) : "-")}
      ${row("Pesan", esc(message).replace(/\n/g, "<br>"))}
      ${row("Halaman", esc(page))}
    </table>
    <div style="padding:14px 24px;background:#F5F7FB;color:#5A6478;font-size:12px">
      Dikirim otomatis dari landing page Unimind Intelligence.
    </div>
  </div>`;

  const text =
    `Permintaan Demo Baru — Unimind Intelligence\n\n` +
    `Nama: ${name}\nEmail: ${email}\nWhatsApp: ${whatsapp}\n` +
    `Perusahaan: ${company}\nJabatan: ${role || "-"}\n` +
    `Kebutuhan: ${needsList.join(", ") || "-"}\n` +
    `Pesan: ${message || "-"}\nHalaman: ${page || "-"}\n`;

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: fromEmail,
      to: String(toEmail).split(",").map((s) => s.trim()).filter(Boolean),
      replyTo: String(email).trim(),
      subject: `[Unimind] Permintaan Demo — ${company.trim()}`,
      html,
      text
    });

    if (error) {
      console.error("Resend error:", error);
      return res.status(502).json({ ok: false, error: "Gagal mengirim email. Coba lagi nanti." });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Send failed:", err);
    return res.status(500).json({ ok: false, error: "Terjadi kesalahan pada server." });
  }
}
