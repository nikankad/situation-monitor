# Situation Monitor

A personal intelligence dashboard for news, markets, global events, and economic indicators. Sign in with Google, connect your own API keys, and customize your workspace. This branch runs as a SvelteKit Node application with private SQLite storage.

## Run locally

Requires Node.js 22.13 or newer and npm. Use an actively supported Node LTS release. SQLite uses `better-sqlite3`; a compiler toolchain may be needed if your platform has no prebuilt binary.

```sh
npm ci
cp .env.example .env
```

Create a **Web application** OAuth client in [Google Cloud Console](https://console.cloud.google.com/apis/credentials). Configure the consent screen and add test users while the app is in testing. Add this authorized redirect URI exactly:

```text
http://localhost:5173/auth/callback/google
```

Set `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` in `.env`. Generate **two independent** secrets with `openssl rand -base64 32`: set one as `AUTH_SECRET` and the other as `API_KEY_ENCRYPTION_KEY`. Keep both stable and private. The encryption key must decode to exactly 32 bytes. Losing it makes saved provider keys unreadable; changing `AUTH_SECRET` signs everyone out.

```sh
npm run dev -- --host 127.0.0.1
```

Open http://localhost:5173. The login page shows setup status if OAuth is unconfigured; there is no development login bypass. Google must verify the account's email. The authentication integration follows [Auth.js for SvelteKit](https://authjs.dev/reference/sveltekit).

## Personalize your dashboard

After signing in, open **Settings**:

- Save, replace, or remove your [Finnhub](https://finnhub.io/) and [FRED](https://fred.stlouisfed.org/docs/api/api_key.html) API keys. Finnhub powers market quotes; FRED powers the Economic Indicators panel. Saving checks input format; provider authorization is checked when requesting data.
- Enable, disable, resize, and reorder dashboard panels.
- Customize your market symbols and watchlist using the Markets panel's configuration button.
- Create topic monitors and custom alert keywords.
- Choose an automatic refresh interval. Your provider's quota still applies.

Preferences save automatically to your account and load on your other devices. The header displays save status and offers retry on failure. Signing out waits for pending settings to save. Concurrent edits merge different preference groups; the last save wins for the same group. Old browser-only preferences are not imported automatically because they have no account owner.

Google signs you in; its tokens are not used to access your data providers. All account API routes require a session. Keys are encrypted using AES-256-GCM with the user and provider bound to each ciphertext, and only masked hints are returned. The server sends credentials directly to the provider; keys never enter browser bundles, browser storage, or the public CORS proxy. News and other public feeds still use the existing public sources. Market session caches are scoped by account and kept in sessionStorage.

FRED observations include their actual observation dates, which differ by series. The dashboard also retains some panels whose original data integrations are incomplete; these show empty states rather than fabricated data.

## Production

```sh
npm ci
npm run build
npm start
```

Deploy the built application to a Node host with a **persistent writable disk**. `npm start` loads an optional local `.env`; managed hosts may inject environment variables instead. Set:

```text
ORIGIN=https://monitor.example.com
AUTH_TRUST_HOST=true
DATABASE_PATH=/var/lib/situation-monitor/situation-monitor.sqlite
```

Also provide the four secrets described above. Add `https://monitor.example.com/auth/callback/google` to the same Google OAuth client's authorized redirect URIs. Serve behind HTTPS with a trusted reverse proxy and a correct external origin; only enable host trust when that proxy controls forwarded host headers. See [SvelteKit's Node deployment guide](https://svelte.dev/docs/kit/adapter-node).

SQLite tables are initialized automatically. Back up the database with SQLite's backup mechanism and retain the encryption key separately. Use a single persistent Node instance; multiple instances need a shared database implementation. Ephemeral/serverless disks are unsuitable for this storage model. GitHub Pages cannot run authentication or private server storage; the former Pages deployment workflow now validates the Node application and does not publish anything.

## Verification

```sh
npm run check
npm run test:unit
npm run build
npx playwright install chromium
npm run test:e2e
```

If Chromium is already installed at a custom location, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to its executable when running the browser tests.

End-to-end tests run the built Node server with temporary SQLite storage and isolated test credentials. They create signed test sessions in the test process, exercise route guards, account isolation, key management, preferences, sign-out, and Google OAuth initiation. They do not bypass authentication in the application or complete a real Google consent flow; verify that final flow with your configured Google client before deployment.

## Stack

Svelte 5, SvelteKit 2, TypeScript, Auth.js, SQLite, Tailwind CSS, D3, Vitest, and Playwright.

Fork of [hipcityreg/situation-monitor](https://github.com/hipcityreg/situation-monitor).
