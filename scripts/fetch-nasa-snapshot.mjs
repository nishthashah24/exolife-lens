import { mkdir, rename, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const destination = resolve(root, "src/data/nasa-snapshot.json");

const query = `
  select top 80
    pl_name, hostname, sy_dist, pl_rade, pl_bmasse, pl_orbper, pl_eqt,
    st_teff, st_rad, discoverymethod, disc_year
  from pscomppars
  where pl_rade is not null
    and pl_orbper is not null
    and pl_rade < 2
    and pl_orbper < 500
  order by disc_year desc
`;

const params = new URLSearchParams({
  query: query.replace(/\s+/g, " ").trim(),
  format: "json",
});

const response = await fetch(`https://exoplanetarchive.ipac.caltech.edu/TAP/sync?${params.toString()}`);

if (!response.ok) {
  throw new Error(`NASA Exoplanet Archive returned ${response.status}`);
}

const rows = await response.json();

if (!Array.isArray(rows) || rows.length === 0) {
  throw new Error("NASA Exoplanet Archive returned no rows");
}

await mkdir(dirname(destination), { recursive: true });
await writeFile(`${destination}.tmp`, `${JSON.stringify(rows, null, 2)}\n`);
await rename(`${destination}.tmp`, destination);

console.log(`Wrote ${rows.length} NASA rows to ${destination}`);
