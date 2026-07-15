import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  BookOpen,
  Database,
  ExternalLink,
  FlaskConical,
  Github,
  Globe2,
  Orbit,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { fetchNasaWorlds } from "./data/nasa";
import { curatedWorlds } from "./data/worlds";
import type { EvidenceItem, EvidenceLevel, World } from "./types";

const kelvinToCelsius = (kelvin?: number) =>
  typeof kelvin === "number" ? `${Math.round(kelvin - 273.15)} C` : "Unknown";

const formatNumber = (value?: number, digits = 1) =>
  typeof value === "number" ? value.toLocaleString(undefined, { maximumFractionDigits: digits }) : "Unknown";

const evidenceOrder: EvidenceLevel[] = ["Known from data", "Estimated", "Unknown"];

function levelFor(value: unknown, estimated = false): EvidenceLevel {
  if (value === undefined || value === null || value === "") return "Unknown";
  return estimated ? "Estimated" : "Known from data";
}

function buildEvidence(world: World): EvidenceItem[] {
  return [
    {
      label: "Planet size",
      value: world.planetRadiusEarth ? `${formatNumber(world.planetRadiusEarth, 2)} Earth radii` : "Unknown",
      level: levelFor(world.planetRadiusEarth),
      note: "Radius helps separate likely rocky worlds from larger mini-Neptunes, but it cannot prove habitability alone.",
    },
    {
      label: "Planet mass",
      value: world.planetMassEarth ? `${formatNumber(world.planetMassEarth, 2)} Earth masses` : "Unknown",
      level: levelFor(world.planetMassEarth),
      note: "Mass constrains density and surface gravity when radius is also known.",
    },
    {
      label: "Equilibrium temperature",
      value: world.equilibriumTempK ? `${formatNumber(world.equilibriumTempK, 0)} K / ${kelvinToCelsius(world.equilibriumTempK)}` : "Unknown",
      level: levelFor(world.equilibriumTempK, true),
      note: "This is a simplified estimate before atmosphere, clouds, greenhouse effects, and surface conditions are known.",
    },
    {
      label: "Orbit length",
      value: world.orbitalPeriodDays ? `${formatNumber(world.orbitalPeriodDays, 2)} Earth days` : "Unknown",
      level: levelFor(world.orbitalPeriodDays),
      note: "Orbital period reveals how close the world is to its star and whether follow-up transits are practical.",
    },
    {
      label: "Host star",
      value: world.stellarTempK ? `${world.host}, ${formatNumber(world.stellarTempK, 0)} K` : world.host,
      level: levelFor(world.host),
      note: "Star size, temperature, and activity shape radiation, climate, and atmospheric escape.",
    },
    {
      label: "Distance",
      value: world.distanceLy !== undefined ? `${formatNumber(world.distanceLy, 1)} light-years` : "Unknown",
      level: levelFor(world.distanceLy),
      note: "Nearby systems are easier to study with telescopes, but distance does not determine whether life exists.",
    },
  ];
}

function habitabilityTone(world: World) {
  const radius = world.planetRadiusEarth;
  const temp = world.equilibriumTempK;
  const hasTemperateEstimate = typeof temp === "number" && temp >= 180 && temp <= 310;
  const hasRockyScale = typeof radius === "number" && radius > 0.5 && radius <= 1.8;

  if (world.id === "earth") return { label: "Confirmed inhabited reference", className: "tone-strong" };
  if (world.id === "europa" || world.id === "mars") return { label: "Solar System astrobiology target", className: "tone-medium" };
  if (hasTemperateEstimate && hasRockyScale) return { label: "Interesting, still unconfirmed", className: "tone-medium" };
  if (hasTemperateEstimate || hasRockyScale) return { label: "Partial evidence only", className: "tone-soft" };
  return { label: "Too many unknowns", className: "tone-muted" };
}

function radiusToPx(radius?: number) {
  if (!radius) return 18;
  return Math.max(12, Math.min(42, 16 + radius * 12));
}

function tempPosition(temp?: number) {
  if (!temp) return 50;
  return Math.max(4, Math.min(96, ((temp - 120) / 260) * 100));
}

function App() {
  const [query, setQuery] = useState("");
  const [source, setSource] = useState<"curated" | "nasa">("curated");
  const [worlds, setWorlds] = useState<World[]>(curatedWorlds);
  const [selectedId, setSelectedId] = useState(curatedWorlds[4].id);
  const [comparisonIds, setComparisonIds] = useState<string[]>(["earth", "trappist-1e", "proxima-centauri-b"]);
  const [method, setMethod] = useState("All");
  const [status, setStatus] = useState("Curated starter set loaded");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!worlds.some((world) => world.id === selectedId)) {
      setSelectedId(worlds[0]?.id ?? "earth");
    }
  }, [selectedId, worlds]);

  const methods = useMemo(() => ["All", ...Array.from(new Set(worlds.map((world) => world.discoveryMethod))).sort()], [worlds]);

  const filteredWorlds = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return worlds
      .filter((world) => (method === "All" ? true : world.discoveryMethod === method))
      .filter((world) => {
        if (!normalizedQuery) return true;
        return `${world.name} ${world.host} ${world.discoveryMethod}`.toLowerCase().includes(normalizedQuery);
      })
      .sort((a, b) => {
        const aTemp = a.equilibriumTempK ?? 9999;
        const bTemp = b.equilibriumTempK ?? 9999;
        return Math.abs(aTemp - 255) - Math.abs(bTemp - 255);
      });
  }, [method, query, worlds]);

  const selected = worlds.find((world) => world.id === selectedId) ?? worlds[0];
  const evidence = buildEvidence(selected);
  const comparisonWorlds = comparisonIds.map((id) => worlds.find((world) => world.id === id)).filter(Boolean) as World[];

  async function loadNasaData() {
    setIsLoading(true);
    setStatus("Fetching NASA Exoplanet Archive composite parameters...");

    try {
      const nasaWorlds = await fetchNasaWorlds();
      const merged = [...curatedWorlds, ...nasaWorlds.filter((world) => !curatedWorlds.some((curated) => curated.name === world.name))];
      setWorlds(merged);
      setSource("nasa");
      setStatus(`Loaded ${merged.length} worlds with NASA archive rows plus curated astrobiology references`);
    } catch (error) {
      setSource("curated");
      setWorlds(curatedWorlds);
      setStatus(error instanceof Error ? `NASA fetch failed; using curated data. ${error.message}` : "NASA fetch failed; using curated data.");
    } finally {
      setIsLoading(false);
    }
  }

  function resetCurated() {
    setSource("curated");
    setWorlds(curatedWorlds);
    setStatus("Curated starter set loaded");
    setQuery("");
    setMethod("All");
  }

  function toggleCompare(id: string) {
    setComparisonIds((current) => {
      if (current.includes(id)) return current.filter((value) => value !== id);
      return [...current.slice(-3), id];
    });
  }

  const tone = habitabilityTone(selected);

  return (
    <main className="app-shell">
      <section className="topbar" aria-label="Project overview">
        <div>
          <p className="eyebrow"><Sparkles size={16} /> Open-source astrobiology atlas</p>
          <h1>ExoLife Lens</h1>
          <p className="lede">
            Explore real worlds through careful evidence, missing data, and astrobiology context instead of fake life scores.
          </p>
        </div>
        <div className="topbar-actions" aria-label="Primary actions">
          <a className="icon-link" href="https://exoplanetarchive.ipac.caltech.edu/" target="_blank" rel="noreferrer">
            <Database size={18} /> NASA archive <ExternalLink size={14} />
          </a>
          <a className="icon-link" href="https://astrobiology.nasa.gov/" target="_blank" rel="noreferrer">
            <BookOpen size={18} /> Astrobiology <ExternalLink size={14} />
          </a>
        </div>
      </section>

      <section className="workspace" aria-label="Exoplanet explorer">
        <aside className="control-panel" aria-label="Search and filters">
          <div className="panel-header">
            <div>
              <p className="eyebrow"><SlidersHorizontal size={15} /> Explorer</p>
              <h2>Worlds</h2>
            </div>
            <span className={`source-pill ${source === "nasa" ? "is-live" : ""}`}>{source === "nasa" ? "NASA loaded" : "Curated"}</span>
          </div>

          <label className="search-field">
            <Search size={17} />
            <span className="sr-only">Search worlds</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search planet, host, method" />
          </label>

          <label className="select-field">
            Discovery method
            <select value={method} onChange={(event) => setMethod(event.target.value)}>
              {methods.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <div className="data-actions">
            <button className="primary-button" onClick={loadNasaData} disabled={isLoading}>
              <RefreshCw size={17} className={isLoading ? "spin" : ""} /> Load NASA data
            </button>
            <button className="secondary-button" onClick={resetCurated}>Reset</button>
          </div>

          <p className="status-line">{status}</p>

          <div className="world-list" aria-label="World list">
            {filteredWorlds.map((world) => {
              const itemTone = habitabilityTone(world);
              return (
                <button
                  className={`world-row ${world.id === selected.id ? "is-selected" : ""}`}
                  key={world.id}
                  onClick={() => setSelectedId(world.id)}
                >
                  <span className="row-planet" style={{ width: radiusToPx(world.planetRadiusEarth), height: radiusToPx(world.planetRadiusEarth) }} />
                  <span>
                    <strong>{world.name}</strong>
                    <small>{world.host} · {world.discoveryMethod}</small>
                  </span>
                  <span className={`row-tone ${itemTone.className}`} aria-label={itemTone.label} />
                </button>
              );
            })}
          </div>
        </aside>

        <section className="detail-panel" aria-label={`${selected.name} details`}>
          <div className="world-hero">
            <div className="planet-visual" aria-hidden="true">
              <div className="orbit-ring ring-one" />
              <div className="orbit-ring ring-two" />
              <div
                className="planet-core"
                style={{
                  width: radiusToPx(selected.planetRadiusEarth) * 2,
                  height: radiusToPx(selected.planetRadiusEarth) * 2,
                }}
              />
            </div>
            <div className="world-title">
              <p className="eyebrow"><Orbit size={16} /> {selected.host}</p>
              <h2>{selected.name}</h2>
              <p>{selected.summary}</p>
              <div className="fact-strip">
                <span>{selected.discoveryYear ? selected.discoveryYear : "Reference"}</span>
                <span>{selected.discoveryMethod}</span>
                <span>{selected.distanceLy !== undefined ? `${formatNumber(selected.distanceLy, 1)} ly` : "Distance unknown"}</span>
              </div>
            </div>
          </div>

          <div className="insight-grid">
            <article className="science-card">
              <div className="card-heading">
                <FlaskConical size={18} />
                <h3>Astrobiology read</h3>
              </div>
              <p className={`tone-label ${tone.className}`}>{tone.label}</p>
              <p>{selected.whyItMatters}</p>
              <a href={selected.nasaUrl} target="_blank" rel="noreferrer">
                Open source record <ExternalLink size={14} />
              </a>
            </article>

            <article className="science-card temp-card">
              <div className="card-heading">
                <Activity size={18} />
                <h3>Temperature context</h3>
              </div>
              <div className="temperature-track" aria-label="Equilibrium temperature context">
                <span className="zone cold">Cold</span>
                <span className="zone temperate">Temperate</span>
                <span className="zone hot">Hot</span>
                <span className="temp-marker" style={{ left: `${tempPosition(selected.equilibriumTempK)}%` }} />
              </div>
              <p>{selected.equilibriumTempK ? `${formatNumber(selected.equilibriumTempK, 0)} K is an estimate before atmosphere is known.` : "No equilibrium temperature is available for this world."}</p>
            </article>
          </div>

          <section className="evidence-board" aria-label="Evidence board">
            <div className="section-title">
              <h2>Evidence board</h2>
              <p>Transparent labels keep the product useful without overclaiming life detection.</p>
            </div>
            <div className="evidence-columns">
              {evidenceOrder.map((level) => (
                <div className="evidence-column" key={level}>
                  <h3>{level}</h3>
                  {evidence.filter((item) => item.level === level).map((item) => (
                    <article className="evidence-item" key={item.label}>
                      <strong>{item.label}</strong>
                      <span>{item.value}</span>
                      <p>{item.note}</p>
                    </article>
                  ))}
                </div>
              ))}
            </div>
          </section>
        </section>
      </section>

      <section className="compare-section" aria-label="World comparison">
        <div className="section-title">
          <div>
            <p className="eyebrow"><Globe2 size={16} /> Compare</p>
            <h2>Put worlds side by side</h2>
          </div>
          <p>Select up to four worlds from the atlas to compare the evidence gaps.</p>
        </div>

        <div className="compare-picker">
          {worlds.slice(0, 14).map((world) => (
            <button
              key={world.id}
              className={`chip ${comparisonIds.includes(world.id) ? "is-selected" : ""}`}
              onClick={() => toggleCompare(world.id)}
              aria-pressed={comparisonIds.includes(world.id)}
            >
              {world.name}
            </button>
          ))}
        </div>

        <div className="compare-grid">
          {comparisonWorlds.map((world) => (
            <article className="compare-card" key={world.id}>
              <div className="compare-card-top">
                <span className="mini-planet" style={{ width: radiusToPx(world.planetRadiusEarth), height: radiusToPx(world.planetRadiusEarth) }} />
                <div>
                  <h3>{world.name}</h3>
                  <p>{habitabilityTone(world).label}</p>
                </div>
              </div>
              <dl>
                <div><dt>Radius</dt><dd>{world.planetRadiusEarth ? `${formatNumber(world.planetRadiusEarth, 2)} Earth` : "Unknown"}</dd></div>
                <div><dt>Mass</dt><dd>{world.planetMassEarth ? `${formatNumber(world.planetMassEarth, 2)} Earth` : "Unknown"}</dd></div>
                <div><dt>Orbit</dt><dd>{world.orbitalPeriodDays ? `${formatNumber(world.orbitalPeriodDays, 2)} days` : "Unknown"}</dd></div>
                <div><dt>Temp</dt><dd>{world.equilibriumTempK ? `${formatNumber(world.equilibriumTempK, 0)} K` : "Unknown"}</dd></div>
              </dl>
            </article>
          ))}
        </div>
      </section>

      <footer>
        <span><Github size={16} /> Built for open-source student astrobiology education.</span>
        <span>Data is educational and source-linked; it does not claim life detection.</span>
      </footer>
    </main>
  );
}

export default App;
