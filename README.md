# Unimind Intelligence — Landing Page

Landing page marketing untuk **Unimind Intelligence**, platform AI news media monitoring & social media listening dari **KG Media** (Kompas Gramedia Group).

Satu CTA utama → **enquiry / demo form** yang dikirim ke email lewat serverless function (Resend).

## Stack

- Static HTML/CSS/JS (tanpa build step)
- Phosphor Icons + Google Fonts (Plus Jakarta Sans, Inter) via CDN
- 1 serverless function: [`api/enquiry.js`](api/enquiry.js) — kirim email via [Resend](https://resend.com)
- Deploy: **Vercel**

## Struktur

```
index.html          # halaman landing (semua section), atribut data-i18n
styles.css          # design system + responsive
i18n.js             # kamus ID/EN + language switcher (default: ID, simpan ke localStorage)
script.js           # nav, reveal animation, validasi & submit form
api/enquiry.js       # POST handler → email via Resend
assets/             # logo (SVG), og-image, KG Media logo
vercel.json         # cleanUrls
.env.example        # daftar environment variable
```

## Environment Variables

| Variable | Wajib | Keterangan |
|---|---|---|
| `RESEND_API_KEY` | ✅ | API key dari resend.com |
| `ENQUIRY_TO_EMAIL` | ✅ | Email penerima lead (boleh dipisah koma untuk beberapa penerima) |
| `ENQUIRY_FROM_EMAIL` | ➖ | Pengirim (domain terverifikasi di Resend). Default `onboarding@resend.dev` untuk testing |

## Jalankan lokal

Frontend saja (form belum kirim email):

```bash
npx serve .            # atau: python3 -m http.server 8000
```

Full + serverless function (butuh Vercel CLI & env):

```bash
npm install
cp .env.example .env.local   # isi RESEND_API_KEY & ENQUIRY_TO_EMAIL
npx vercel dev
```

## Deploy ke Vercel

1. Push repo ini ke GitHub.
2. Di [vercel.com](https://vercel.com) → **Add New Project** → import repo.
3. Framework preset: **Other** (static). Tanpa build command.
4. **Settings → Environment Variables**: isi `RESEND_API_KEY`, `ENQUIRY_TO_EMAIL`, `ENQUIRY_FROM_EMAIL`.
5. **Deploy**. Function `/api/enquiry` otomatis terdeteksi.

### Setup Resend (agar email benar-benar terkirim)

1. Buat akun di [resend.com](https://resend.com) → **API Keys** → buat key → isi ke `RESEND_API_KEY`.
2. **Domains** → tambahkan & verifikasi domain (mis. `unimind.kgmedia.id`) lewat DNS, lalu set `ENQUIRY_FROM_EMAIL` ke alamat domain tsb.
3. Untuk uji coba cepat tanpa domain: pakai `onboarding@resend.dev` — namun email hanya terkirim ke pemilik akun Resend.

## Catatan brand

- Mark logo dibuat ulang sebagai SVG di [`assets/unimind-mark.svg`](assets/unimind-mark.svg). Ganti dengan file vektor resmi bila tersedia (cukup timpa file ini).
- Warna brand & font diatur via CSS variables di bagian atas [`styles.css`](styles.css).
