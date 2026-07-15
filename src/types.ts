export type EvidenceLevel = "Known from data" | "Estimated" | "Unknown";

export type World = {
  id: string;
  name: string;
  host: string;
  distanceLy?: number;
  planetRadiusEarth?: number;
  planetMassEarth?: number;
  orbitalPeriodDays?: number;
  equilibriumTempK?: number;
  stellarTempK?: number;
  stellarRadiusSun?: number;
  discoveryMethod: string;
  discoveryYear?: number;
  nasaUrl: string;
  summary: string;
  whyItMatters: string;
};

export type EvidenceItem = {
  label: string;
  value: string;
  level: EvidenceLevel;
  note: string;
};
