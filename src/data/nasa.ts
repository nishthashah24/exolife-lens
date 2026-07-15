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

const MAX_ARCHIVE_ROWS = 80;

const query = `
  select top ${MAX_ARCHIVE_ROWS}
    pl_name, hostname, sy_dist, pl_rade, pl_bmasse, pl_orbper, pl_eqt,
    st_teff, st_rad, discoverymethod, disc_year
  from pscomppars
  where pl_rade is not null
    and pl_orbper is not null
    and pl_rade < 2
    and pl_orbper < 500
  order by disc_year desc
`;

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function optionalNumber(value: unknown, min: number, max: number): number | undefined {
  if (!isFiniteNumber(value) || value < min || value > max) return undefined;
  return value;
}

function optionalYear(value: unknown): number | undefined {
  if (!isFiniteNumber(value) || value < 1990 || value > new Date().getFullYear() + 1) return undefined;
  return Math.round(value);
}

function safeText(value: unknown, fallback: string, maxLength = 80): string {
  if (typeof value !== "string") return fallback;
  const cleaned = value.replace(/\s+/g, " ").trim();
  if (!cleaned) return fallback;
  return cleaned.slice(0, maxLength);
}

function toWorld(row: unknown): World | undefined {
  if (!row || typeof row !== "object") return undefined;

  const record = row as NasaPlanetRow;
  const name = safeText(record.pl_name, "");
  const host = safeText(record.hostname, "");
  if (!name || !host) return undefined;

  const id = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  if (!id) return undefined;

  return {
    id,
    name,
    host,
    distanceLy: optionalNumber(record.sy_dist, 0, 100000) ? optionalNumber(record.sy_dist, 0, 100000)! * 3.26156 : undefined,
    planetRadiusEarth: optionalNumber(record.pl_rade, 0.01, 100),
    planetMassEarth: optionalNumber(record.pl_bmasse, 0.001, 10000),
    orbitalPeriodDays: optionalNumber(record.pl_orbper, 0.01, 1000000),
    equilibriumTempK: optionalNumber(record.pl_eqt, 1, 10000),
    stellarTempK: optionalNumber(record.st_teff, 1, 100000),
    stellarRadiusSun: optionalNumber(record.st_rad, 0.001, 10000),
    discoveryMethod: safeText(record.discoverymethod, "Unknown", 60),
    discoveryYear: optionalYear(record.disc_year),
    nasaUrl: `https://exoplanetarchive.ipac.caltech.edu/overview/${encodeURIComponent(name)}`,
    sourceLabel: "NASA Exoplanet Archive",
    summary: "A confirmed exoplanet record loaded from NASA Exoplanet Archive composite parameters.",
    whyItMatters: "Archive rows help students practice reading real scientific catalogs, including gaps and uncertainty.",
  };
}

export function parseNasaWorlds(rows: unknown): World[] {
  if (!Array.isArray(rows)) return [];
  return rows.slice(0, MAX_ARCHIVE_ROWS).map(toWorld).filter((world): world is World => Boolean(world));
}

export async function fetchNasaWorlds(signal?: AbortSignal): Promise<World[]> {
  const params = new URLSearchParams({
    query: query.replace(/\s+/g, " ").trim(),
    format: "json",
  });
  const response = await fetch(`https://exoplanetarchive.ipac.caltech.edu/TAP/sync?${params.toString()}`, {
    signal,
  });

  if (!response.ok) {
    throw new Error(`NASA Exoplanet Archive returned ${response.status}`);
  }

  const worlds = parseNasaWorlds(await response.json());
  if (worlds.length === 0) {
    throw new Error("NASA Exoplanet Archive response did not include usable worlds");
  }

  return worlds;
}
