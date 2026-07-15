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

- The first screen shows the ExoLife Lens atlas, not a landing page.
- Search works for examples like `trappist`, `mars`, `transit`, and `radial`.
- Discovery-method filtering updates the world list.
- Selecting a world updates the visual, evidence board, astrobiology read, and temperature marker.
- The evidence board always separates known values, estimates, and unknown values.
- Every evidence item includes a field source link.
- Comparison chips can add and remove worlds without layout breakage.
- Educator mode can show and hide field-guide prompts.
- Field-guide tabs switch content without changing the selected world.
- NASA source links open in a new tab.
- The page remains readable at mobile width.

## 4. NASA Data Check

Click **Load NASA data**.

Expected behavior:

- The status line changes while data is loading.
- If the NASA Exoplanet Archive request succeeds, the world list grows.
- If the request fails because of network/CORS/service availability, the curated starter set remains usable.

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
