# ORIGIN — Personal OS

A premium, private life-management app: daily habit diary, bucket list, work
projects, asset tracker, and personal report. Built with Next.js (App
Router), Tailwind CSS, PostgreSQL and Drizzle ORM.

## What you need on your machine

| Tool | Version | Notes |
|------|---------|-------|
| **Node.js** | 20+ (LTS) | download from [nodejs.org](https://nodejs.org) |
| **npm** | 10+ | ships with Node.js |
| **Git** | any | to clone the repo |
| **PostgreSQL** | 14+ | local install, Docker, or a hosted DB (Neon, Supabase, Railway…) |
| **VS Code** | any | recommended editor |

### Suggested VS Code extensions
- **ESLint** (dbaeumer.vscode-eslint)
- **Tailwind CSS IntelliSense** (bradlc.vscode-tailwindcss)
- **Prettier** (esbenp.prettier-vscode) — optional
- **PostgreSQL** (cweijan.vscode-postgresql-client2) — optional, for browsing your DB

---

## 1 · Clone & install

```bash
git clone <your-repo-url>
cd origin
npm install
```

## 2 · Set up your environment file

Copy the example and fill it in:

```bash
cp .env.example .env
```

At minimum you need:

- `DATABASE_URL` — your PostgreSQL connection string
- `AUTH_SECRET` — any long random string (used to sign login cookies)

Generate a secure `AUTH_SECRET`:

```bash
openssl rand -base64 48
```

`GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` are **optional**. Leave them
blank — the app has its own ID + password login and works without Google.

## 3 · Create the database schema

Make sure your Postgres server is running and reachable at the URL you set,
then push the schema:

```bash
npx drizzle-kit push
```

That creates the `users` and `app_data` tables.

## 4 · Run the app locally

```bash
npm run dev
```

Open **http://localhost:3000** in your browser. Register an account from
Settings → Account & Cloud Sync, and you're in.

## Available scripts

| Script | What it does |
|--------|--------------|
| `npm run dev` | Local dev server with hot reload |
| `npm run build` | Production build |
| `npm run start` | Run the built production server |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check with no emit |
| `npx drizzle-kit push` | Push schema changes to the database |

---

## Deploying — Cloudflare notes

ORIGIN is a **Next.js app with server-side APIs and a Node runtime**
(PostgreSQL via `pg`, `scrypt`, `jose`, etc.). Two paths on Cloudflare:

### ✅ Recommended: **Cloudflare Pages + a Node host for the app**

Cloudflare Pages/Workers run on the **edge** (V8 isolates) and do **not**
support the Node `pg` driver or `crypto.scryptSync` used for password
hashing. The cleanest setup is:

1. **Host the app** on any Node platform (Vercel, Render, Railway, Fly,
   your own VPS, etc.) — they all support Next.js out of the box.
2. **Point Cloudflare in front of it** for DNS + CDN + free HTTPS.

**Cloudflare DNS + Proxy setup:**

1. Add your domain in Cloudflare → *Websites*.
2. Update your registrar's nameservers to the two Cloudflare ones shown.
3. In DNS, add a record pointing to your host:
   - `A` or `CNAME` → your app host (e.g. `cname.vercel-dns.com`)
   - Proxy status: **Proxied** (orange cloud)
4. **SSL/TLS** tab:
   - Encryption mode: **Full (strict)**
   - Always Use HTTPS: **On**
   - Automatic HTTPS Rewrites: **On**
5. **Speed → Optimization** (safe defaults):
   - Brotli: **On**
   - Early Hints: **On**
   - Auto Minify: HTML/CSS/JS all **On**
6. **Caching → Configuration:**
   - Browser Cache TTL: *Respect Existing Headers*
   - Development Mode: **Off** (turn on temporarily while testing)
7. **Rules → Page Rules** (optional, keep API dynamic):
   - `your-domain.com/api/*` → **Cache Level: Bypass**
8. Add a **Cache Rule** to bypass cache for cookies:
   - Match: `http.cookie contains "origin_session"` → Cache eligibility: *Bypass cache*

### ⚙️ Alternative: **Cloudflare Pages (edge runtime)**

Only viable if you swap the database + auth layer:

- Replace `pg` with **Neon Serverless** or **Cloudflare D1**
- Replace `crypto.scryptSync` password hashing with a WebCrypto/PBKDF2
  implementation
- Add `wrangler.toml` and `@cloudflare/next-on-pages`

That's a bigger refactor. For a fast, reliable deploy, use the recommended
path above.

### Environment variables to set on your host

| Key | Required | Description |
|-----|----------|-------------|
| `DATABASE_URL` | ✅ | Production PostgreSQL URL (Neon/Supabase/RDS/etc.) |
| `AUTH_SECRET` | ✅ | Random 48+ char secret |
| `NEXT_PUBLIC_APP_URL` | ✅ | e.g. `https://origin.yourdomain.com` |
| `GOOGLE_CLIENT_ID` | optional | Only if you enable Google sign-in |
| `GOOGLE_CLIENT_SECRET` | optional | Same |

After deploying, run the schema push against your production DB **once**:

```bash
DATABASE_URL="<prod-url>" npx drizzle-kit push
```

---

## Data & privacy

- All personal data (habits, diary, bucket list, work, asset) is stored
  per-user in your PostgreSQL database (`app_data.data` as JSONB).
- Passwords are salted + hashed with `scrypt` — never stored in plaintext.
- Sessions use signed, HTTP-only cookies (30-day expiry).
- The client also caches your data in `localStorage` so it works offline
  and syncs when back online.
