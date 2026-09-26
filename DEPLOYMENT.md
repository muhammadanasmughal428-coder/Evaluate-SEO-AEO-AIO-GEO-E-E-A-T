# Universal Deployment Guide (Vercel & Non-Vercel Worldwide Production)

This application is engineered for **100% production-ready deployment** across any worldwide platform. All features, options, and endpoints work identically whether deployed on **Vercel** serverless or **without Vercel** (VPS, Docker, Cloud Run, Railway, Render, etc.).

---

## ⚡ 1. Deploy on Vercel (ورسل پر لائیو کرنے کا طریقہ)

### Automatic Vercel Architecture:
- **Frontend SPA**: Built via `vite build` to `/dist`, served directly by Vercel's global Edge CDN with asset caching (`Cache-Control: public, max-age=31536000`).
- **Serverless API**: Configured in `/api/index.ts` and `/vercel.json` routing all `/api/*` endpoints through Node.js serverless functions.
- **Client Fallback**: Any direct route refresh (e.g. `/websites`, `/learning`, `/chat`) seamlessly falls back to `/index.html`.

### Deployment Steps:
1. Push this repository to **GitHub / GitLab / Bitbucket**.
2. Open **[vercel.com](https://vercel.com)** and click **"Add New Project"** -> **"Import"**.
3. Select your repository. Vercel will auto-detect Vite.
4. Under **Environment Variables**, add:
   - `GEMINI_API_KEY`: *(Your Google Gemini API Key)*
   - `DATABASE_URL`: *(Optional: Your PostgreSQL connection string from Vercel Postgres, Supabase, Neon, or Railway)*
   - `NODE_ENV`: `production`
5. Click **Deploy**. In under 60 seconds, your site is globally live with HTTPS and custom domain support!

---

## 🐳 2. Deploy Without Vercel (ورسل کے بغیر لائیو کرنے کا طریقہ)

### Option A: 1-Command Docker Deployment (VPS / Cloud Server)
Any cloud server (DigitalOcean Droplet, AWS EC2, Hetzner, Linode, Google Cloud Compute):
```bash
# Clone the repository
git clone <your-repo-url>
cd applet

# Set your Gemini API Key in .env
echo "GEMINI_API_KEY=your_gemini_key_here" > .env

# Run full stack with PostgreSQL database
docker compose up -d
```
The app will be immediately live and serving on port `3000` with automated health checks!

---

### Option B: Node.js Standalone with PM2 (Ubuntu / Debian VPS)
```bash
# 1. Install Node.js 20+
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. Install PM2 process manager
sudo npm install -g pm2

# 3. Clone and install
git clone <your-repo-url>
cd applet
npm install

# 4. Build the production React assets
npm run build

# 5. Start with PM2
pm2 start "npm start" --name "global-webaudit-platform"
pm2 save
pm2 startup
```

---

### Option C: Google Cloud Run / AWS App Runner / Railway / Render
1. Connect your repository.
2. Build command: `npm run build`
3. Start command: `npm start`
4. Set Environment Variables:
   - `PORT`: `3000` (or injected by platform)
   - `GEMINI_API_KEY`: `your_key`
   - `DATABASE_URL` or `SQL_HOST`: `your_db_connection`
   - `NODE_ENV`: `production`

---

## 🔍 3. Live Production Health & Diagnostics Endpoint

Verify your live server at any time:
```bash
curl https://your-domain.com/api/health
```
Returns:
```json
{
  "status": "ok",
  "timestamp": "2026-09-24T...",
  "uptime": 124.5,
  "deploymentTarget": "vercel",
  "environment": "production",
  "database": "connected",
  "geminiConfigured": true,
  "version": "1.0.0"
}
```

---

## 🛡️ 4. Included Production Features & Zero-Failure Guarantees

1. **5-Pillar Live Auditor (SEO, AEO, AIO, GEO, E-E-A-T)**:
   - Real-time page crawler with bot detection bypass, user-agent rotation, and timeout guards.
   - Live AI recommendations generator with instant JSON export & printable audit reports.

2. **Student Learning Hub (9th Grade through PhD)**:
   - Camera/photo problem capture and OCR text solver.
   - Strict 5 pedagogical principles + 5 instructional personas.
   - Physical constants, SI base & derived units directory.
   - Flashcards, interactive self-tests, study notes.

3. **Professional Websites Directory**:
   - Enforced URL format: starts with `http:// / https://www.` and ends with `.com`.
   - Physical office addresses with Google Maps navigation links.
   - Resilient database fallbacks so directory never appears empty even during cold starts.

4. **Multilingual AI Chat Studio**:
   - Multimodal image and text problem analysis.
   - 33+ languages with native Urdu and Roman Urdu support.
   - Voice speech-to-text and audio speech synthesis playback.
