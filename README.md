# ExoLife Lens

ExoLife Lens is an open-source astrobiology education website for exploring planets and moons through real evidence, uncertainty, and source-linked science context.

The project is designed for students, educators, and curious space fans who want a careful way to think about habitability. It avoids fake "life scores" and instead shows what is known, what is estimated, and what is still unknown.

## Purpose

Astrobiology sits at the intersection of astronomy, planetary science, biology, chemistry, and climate. ExoLife Lens makes that interdisciplinary thinking approachable by turning confirmed exoplanet records and selected Solar System targets into a readable evidence board.

The app focuses on:

- Scientific honesty: no claims of detected life unless a source supports it.
- Transparent uncertainty: data is labeled as known, estimated, or unknown.
- Public datasets: NASA Exoplanet Archive rows are loaded directly or from a cached snapshot.
- Accessible learning: each metric explains why astrobiologists care.
- Beautiful UX: the first screen is the working atlas, not a marketing page.

## Current Features

- Curated starter atlas with Earth, Mars, Europa, and notable exoplanets.
- Optional live fetch from the NASA Exoplanet Archive TAP API.
- Cached NASA Exoplanet Archive snapshot for offline-friendly fallback data.
- Search by world, host star, or discovery method.
- Discovery-method filter.
- Evidence board grouped by `Known from data`, `Estimated`, and `Unknown`.
- Field-level source links for every evidence item.
- Temperature context visualization.
- Side-by-side comparison mode.
- Educator mode with astrobiology field-guide prompts.
- Deployment security headers for Cloudflare Pages or compatible static hosts.
- Source links for NASA archive and astrobiology references.

## Data Sources

- NASA Exoplanet Archive: <https://exoplanetarchive.ipac.caltech.edu/>
- NASA Astrobiology: <https://astrobiology.nasa.gov/>
- NASA Solar System Exploration pages for Solar System reference worlds.

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
- Add more field-guide explainers for spectroscopy, extremophiles, habitable zones, and atmospheric false positives.
- Add a small changelog of reviewed scientific assumptions.

## License

MIT
