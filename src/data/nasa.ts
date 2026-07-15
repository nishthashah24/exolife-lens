import type { World } from "../types";

type NasaPlanetRow = {
  pl_name: string;
  hostname: string;
  sy_dist?: number;
  pl_rade?: number;
  pl_bmasse?: number;
  pl_orbper?: number;
  pl_eqt?: number;
  st_teff?: number;
  st_rad?: number;
  discoverymethod?: string;
  disc_year?: number;
};

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

export async function fetchNasaWorlds(): Promise<World[]> {
  const params = new URLSearchParams({
    query: query.replace(/\s+/g, " ").trim(),
    format: "json",
  });
  const response = await fetch(`https://exoplanetarchive.ipac.caltech.edu/TAP/sync?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`NASA Exoplanet Archive returned ${response.status}`);
  }

  const rows = (await response.json()) as NasaPlanetRow[];
  return rows.map((row) => ({
    id: row.pl_name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
    name: row.pl_name,
    host: row.hostname,
    distanceLy: row.sy_dist ? row.sy_dist * 3.26156 : undefined,
    planetRadiusEarth: row.pl_rade,
    planetMassEarth: row.pl_bmasse,
    orbitalPeriodDays: row.pl_orbper,
    equilibriumTempK: row.pl_eqt,
    stellarTempK: row.st_teff,
    stellarRadiusSun: row.st_rad,
    discoveryMethod: row.discoverymethod ?? "Unknown",
    discoveryYear: row.disc_year,
    nasaUrl: `https://exoplanetarchive.ipac.caltech.edu/overview/${encodeURIComponent(row.pl_name)}`,
    summary: "A confirmed exoplanet record loaded from NASA Exoplanet Archive composite parameters.",
    whyItMatters: "Live archive rows help students practice reading real scientific catalogs, including gaps and uncertainty.",
  }));
}
