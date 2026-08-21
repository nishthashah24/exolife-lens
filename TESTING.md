# Testing ExoLife Lens

Use this checklist before publishing changes.

## 1. Install Dependencies

```bash
npm install
```

## 2. Run the Development Server

```bash
npm run dev
```

Open the Vite URL shown in the terminal.

## 3. Manual Product Checks

- The first screen shows the Human Habitability Index overview, not a crowded two-column explorer.
- Search works for examples like `trappist`, `mars`, `transit`, and `radial`.
- A no-results search shows a useful empty state.
- Selecting a world updates the HHI score, confidence bar, and factor cards.
- The HHI caveat is visible in the focused analysis.
- Creator navigation opens the public creator/blog page.
- Admin navigation opens the backend blueprint page.
- NASA source links open in a new tab.
- The page remains readable at mobile width.

## 4. NASA Data Check

Click **Load NASA data**.

Expected behavior:

- The status line changes while data is loading.
- If the NASA Exoplanet Archive request succeeds, the world list grows.
- If the request fails because of network/CORS/service availability, the cached snapshot remains usable.

## 5. Production Build

```bash
npm run build
```

Expected behavior:

- TypeScript compilation succeeds.
- Vite emits a `dist/` directory.
- `dist/_headers` exists when static-host security headers are needed.

## 6. Snapshot Refresh

```bash
npm run data:refresh
```

Expected behavior:

- `src/data/nasa-snapshot.json` is updated with a bounded list of NASA archive rows.
- `npm run build` still succeeds afterward.

## 7. Preview Production Build

```bash
npm run preview
```

Open the preview URL and repeat the core manual checks.

## 8. Cloudflare Backend Checks

After Cloudflare D1 and Access are configured:

- `/api/posts` returns only published posts.
- `/api/posts/:slug` does not expose private view counts.
- `/api/admin/posts` returns `401` without Cloudflare Access authentication.
- `/api/admin/posts` returns draft posts and view counts only for the configured `ADMIN_EMAIL`.
