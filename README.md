# ExoLife Lens

ExoLife Lens is an open-source astrobiology education website focused on a student-created Human Habitability Index (HHI): a careful way to compare what humans would need to know before discussing long-term survival on another world.

The project is designed for students, educators, and curious space fans who want a careful way to think about habitability. It avoids claims of life detection and instead shows a confidence-aware score built from known, estimated, and unknown constraints.

## Purpose

Astrobiology sits at the intersection of astronomy, planetary science, biology, chemistry, and climate. ExoLife Lens makes that interdisciplinary thinking approachable by turning confirmed exoplanet records and selected Solar System targets into a human-centered habitability profile.

The app focuses on:

- Scientific honesty: HHI is educational and not an official NASA metric.
- Transparent uncertainty: data is labeled as known, estimated, or unknown.
- Public datasets: NASA Exoplanet Archive rows are loaded directly or from a cached snapshot.
- Beginner-friendly exploration: visitors can choose a path, read a plain-language takeaway, and learn terms in context.
- Accessible learning: each metric explains why astrobiologists care.
- Cleaner UX: the first screen gives a compact HHI overview, searchable ranking, and one focused analysis.

## Current Features

- Human Habitability Index profiles for Earth, Mars, Europa, and exoplanets.
- Optional live fetch from the NASA Exoplanet Archive TAP API.
- Cached NASA Exoplanet Archive snapshot for offline-friendly fallback data.
- Search by world, host star, or discovery method.
- HHI factor cards for temperature proxy, gravity, rocky scale, star risk, orbit, study access, and atmosphere.
- Confidence penalty when important measurements are missing.
- Creator page with public blog-post structure.
- Cloudflare Pages Functions and D1 scaffold for a private creator backend.
- Deployment security headers for Cloudflare Pages or compatible static hosts.
- Source links for NASA archive and astrobiology references.

## Data Sources

- NASA Exoplanet Archive: <https://exoplanetarchive.ipac.caltech.edu/>
- NASA Astrobiology: <https://astrobiology.nasa.gov/>
- NASA Solar System Exploration pages for Solar System reference worlds.

## HHI Method

See [HHI_METHOD.md](./HHI_METHOD.md).

## Creator Blog Backend

See [BLOG_BACKEND.md](./BLOG_BACKEND.md).

## Local Development

```bash
npm install
npm run dev
```

Then open the local URL printed by Vite.

## Build

```bash
npm run build
```

The production site is emitted to `dist/`.

## Refresh NASA Snapshot

```bash
npm run data:refresh
```

This fetches a bounded set of NASA Exoplanet Archive rows and writes `src/data/nasa-snapshot.json`. A GitHub Actions workflow also refreshes the snapshot weekly.

## Future Roadmap

- Add accessibility and usability testing notes from student users.
- Build the authenticated admin UI that calls the scaffolded Cloudflare admin APIs.
- Add richer post pages with markdown rendering after the D1 backend is connected.
- Add a small changelog of reviewed scientific assumptions.

## License

MIT
