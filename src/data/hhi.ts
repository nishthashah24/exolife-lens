import type { EvidenceLevel, World } from "../types";

export type HhiFactor = {
  id: string;
  label: string;
  score?: number;
  level: EvidenceLevel;
  value: string;
  note: string;
};

export type HhiProfile = {
  index: number;
  confidence: number;
  label: string;
  caution: string;
  factors: HhiFactor[];
};

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value));

const known = (value: unknown): EvidenceLevel => (value === undefined || value === null ? "Unknown" : "Known from data");

const bell = (value: number, ideal: number, spread: number) => clamp(100 * Math.exp(-Math.pow((value - ideal) / spread, 2)));

const numberText = (value?: number, unit = "", digits = 1) =>
  typeof value === "number" ? `${value.toLocaleString(undefined, { maximumFractionDigits: digits })}${unit}` : "Unknown";

function temperatureFactor(world: World): HhiFactor {
  if (world.equilibriumTempK === undefined) {
    return {
      id: "temperature",
      label: "Temperature proxy",
      level: "Unknown",
      value: "Unknown",
      note: "Human surface comfort needs atmospheric data. This app only has a rough equilibrium-temperature proxy for many exoplanets.",
    };
  }

  return {
    id: "temperature",
    label: "Temperature proxy",
    level: "Estimated",
    value: `${numberText(world.equilibriumTempK, " K", 0)} / ${Math.round(world.equilibriumTempK - 273.15)} C before atmosphere`,
    score: bell(world.equilibriumTempK, 255, 58),
    note: "Equilibrium temperature is not surface temperature. It is useful as a first-pass clue, not a comfort forecast.",
  };
}

function gravityFactor(world: World): HhiFactor {
  if (world.planetMassEarth === undefined || world.planetRadiusEarth === undefined) {
    return {
      id: "gravity",
      label: "Gravity",
      level: "Unknown",
      value: "Unknown",
      note: "Human habitability depends strongly on gravity, but many worlds do not have both mass and radius measured.",
    };
  }

  const gravity = world.planetMassEarth / Math.pow(world.planetRadiusEarth, 2);
  return {
    id: "gravity",
    label: "Gravity",
    level: "Estimated",
    value: `${numberText(gravity, " g", 2)}`,
    score: bell(gravity, 1, 0.65),
    note: "Earth-like gravity is easier for long-term human physiology. This estimate assumes the cataloged mass and radius are reliable.",
  };
}

function rockyScaleFactor(world: World): HhiFactor {
  if (world.planetRadiusEarth === undefined) {
    return {
      id: "rocky-scale",
      label: "Rocky-world scale",
      level: "Unknown",
      value: "Unknown",
      note: "Radius helps screen for likely rocky planets, but composition cannot be proven from size alone.",
    };
  }

  return {
    id: "rocky-scale",
    label: "Rocky-world scale",
    level: known(world.planetRadiusEarth),
    value: `${numberText(world.planetRadiusEarth, " Earth radii", 2)}`,
    score: world.planetRadiusEarth <= 0.35 ? 30 : bell(world.planetRadiusEarth, 1, 0.75),
    note: "Humans need a solid surface or engineered habitat. Small rocky-scale worlds are more plausible than gas giants.",
  };
}

function starFactor(world: World): HhiFactor {
  if (world.stellarTempK === undefined) {
    return {
      id: "star",
      label: "Host star risk",
      level: "Unknown",
      value: world.host,
      note: "Star temperature and activity affect radiation exposure, atmosphere loss, and long-term climate stability.",
    };
  }

  const score = world.stellarTempK < 3300 ? 45 : world.stellarTempK < 4200 ? 68 : world.stellarTempK < 6800 ? 90 : 58;

  return {
    id: "star",
    label: "Host star risk",
    level: known(world.stellarTempK),
    value: `${world.host}, ${numberText(world.stellarTempK, " K", 0)}`,
    score,
    note: "Cool red stars make planets easier to detect but can raise flare and radiation concerns. Sun-like stars score more comfortably here.",
  };
}

function orbitFactor(world: World): HhiFactor {
  if (world.orbitalPeriodDays === undefined) {
    return {
      id: "orbit",
      label: "Orbit context",
      level: "Unknown",
      value: "Unknown",
      note: "Orbit length helps infer star distance and follow-up observing cadence.",
    };
  }

  return {
    id: "orbit",
    label: "Orbit context",
    level: known(world.orbitalPeriodDays),
    value: `${numberText(world.orbitalPeriodDays, " days", 2)}`,
    score: world.orbitalPeriodDays < 2 ? 25 : world.orbitalPeriodDays < 15 ? 62 : world.orbitalPeriodDays < 500 ? 84 : 50,
    note: "Very short orbits often imply tidal locking or intense stellar exposure. This is a context clue, not a verdict.",
  };
}

function accessFactor(world: World): HhiFactor {
  if (world.distanceLy === undefined) {
    return {
      id: "access",
      label: "Study access",
      level: "Unknown",
      value: "Unknown",
      note: "Closer worlds are easier to study, but distance does not make a planet physically more habitable.",
    };
  }

  return {
    id: "access",
    label: "Study access",
    level: known(world.distanceLy),
    value: `${numberText(world.distanceLy, " light-years", 1)}`,
    score: world.distanceLy === 0 ? 100 : clamp(100 - 18 * Math.log10(world.distanceLy + 1)),
    note: "This factor rewards worlds humans can study more easily. It is separated from physical survival conditions.",
  };
}

function atmosphereFactor(world: World): HhiFactor {
  if (world.id === "earth") {
    return {
      id: "atmosphere",
      label: "Breathable atmosphere",
      level: "Known from data",
      value: "Present",
      score: 100,
      note: "Earth is the only known inhabited reference world in this atlas.",
    };
  }

  if (world.id === "mars") {
    return {
      id: "atmosphere",
      label: "Breathable atmosphere",
      level: "Known from data",
      value: "Not breathable",
      score: 8,
      note: "Mars has an atmosphere, but it is thin and not breathable for humans without life support.",
    };
  }

  return {
    id: "atmosphere",
    label: "Breathable atmosphere",
    level: "Unknown",
    value: "Unknown",
    note: "For most exoplanets, atmospheric composition is not known. This is the biggest human-habitability gap.",
  };
}

export function calculateHhi(world: World): HhiProfile {
  const factors = [
    temperatureFactor(world),
    gravityFactor(world),
    rockyScaleFactor(world),
    starFactor(world),
    orbitFactor(world),
    accessFactor(world),
    atmosphereFactor(world),
  ];

  const scored = factors.filter((factor) => typeof factor.score === "number");
  const raw = scored.reduce((total, factor) => total + (factor.score ?? 0), 0) / Math.max(scored.length, 1);
  const confidence = scored.length / factors.length;
  const index = clamp(raw * (0.55 + confidence * 0.45));

  const label =
    world.id === "earth"
      ? "Human reference world"
      : index >= 75
        ? "Human-interest candidate"
        : index >= 55
          ? "Needs major unknowns resolved"
          : index >= 35
            ? "Difficult for humans"
            : "Extreme or poorly known";

  return {
    index,
    confidence,
    label,
    caution:
      "HHI is an educational index created for ExoLife Lens. It is not an official NASA metric and should never be read as proof that humans could live there.",
    factors,
  };
}
