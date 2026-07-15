import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  BookOpen,
  Database,
  ExternalLink,
  FlaskConical,
  GraduationCap,
  Github,
  Globe2,
  Layers3,
  Orbit,
  RefreshCw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Telescope,
} from "lucide-react";
import { fetchNasaWorlds, parseNasaWorlds } from "./data/nasa";
import nasaSnapshotRows from "./data/nasa-snapshot.json";
import { curatedWorlds } from "./data/worlds";
import type { EvidenceItem, EvidenceLevel, World } from "./types";

const archiveSnapshot = parseNasaWorlds(nasaSnapshotRows);

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
  const sourceUrl = world.nasaUrl;
  return [
    {
      label: "Planet size",
      value: world.planetRadiusEarth ? `${formatNumber(world.planetRadiusEarth, 2)} Earth radii` : "Unknown",
      level: levelFor(world.planetRadiusEarth),
      note: "Radius helps separate likely rocky worlds from larger mini-Neptunes, but it cannot prove habitability alone.",
      sourceUrl,
    },
    {
      label: "Planet mass",
      value: world.planetMassEarth ? `${formatNumber(world.planetMassEarth, 2)} Earth masses` : "Unknown",
      level: levelFor(world.planetMassEarth),
      note: "Mass constrains density and surface gravity when radius is also known.",
      sourceUrl,
    },
    {
      label: "Equilibrium temperature",
      value: world.equilibriumTempK ? `${formatNumber(world.equilibriumTempK, 0)} K / ${kelvinToCelsius(world.equilibriumTempK)}` : "Unknown",
      level: levelFor(world.equilibriumTempK, true),
      note: "This is a simplified estimate before atmosphere, clouds, greenhouse effects, and surface conditions are known.",
      sourceUrl,
    },
    {
      label: "Orbit length",
      value: world.orbitalPeriodDays ? `${formatNumber(world.orbitalPeriodDays, 2)} Earth days` : "Unknown",
      level: levelFor(world.orbitalPeriodDays),
      note: "Orbital period reveals how close the world is to its star and whether follow-up transits are practical.",
      sourceUrl,
    },
    {
      label: "Host star",
      value: world.stellarTempK ? `${world.host}, ${formatNumber(world.stellarTempK, 0)} K` : world.host,
      level: levelFor(world.host),
      note: "Star size, temperature, and activity shape radiation, climate, and atmospheric escape.",
      sourceUrl,
    },
    {
      label: "Distance",
      value: world.distanceLy !== undefined ? `${formatNumber(world.distanceLy, 1)} light-years` : "Unknown",
      level: levelFor(world.distanceLy),
      note: "Nearby systems are easier to study with telescopes, but distance does not determine whether life exists.",
      sourceUrl,
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

function mergeWorlds(...groups: World[][]) {
  const seen = new Set<string>();
  return groups.flat().filter((world) => {
    const key = world.name.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

const fieldGuides = [
  {
    id: "biosignatures",
    title: "Biosignatures",
    prompt: "What observation would make this world more interesting, and what false positive could mimic it?",
    body: "A biosignature is strongest when chemistry, context, and repeated observations point in the same direction.",
  },
  {
    id: "ocean-worlds",
    title: "Ocean worlds",
    prompt: "Could life have energy without sunlight here?",
    body: "Moons like Europa show why astrobiology cares about subsurface oceans, chemistry, and internal heat.",
  },
  {
    id: "stellar-risk",
    title: "Host star risk",
    prompt: "How might radiation or flares affect atmosphere retention?",
    body: "Small cool stars make transits easier to study, but stellar activity can complicate surface habitability.",
  },
];

function App() {
  const [query, setQuery] = useState("");
  const [source, setSource] = useState<"curated" | "snapshot" | "nasa">("snapshot");
  const [worlds, setWorlds] = useState<World[]>(() => mergeWorlds(curatedWorlds, archiveSnapshot));
  const [selectedId, setSelectedId] = useState(curatedWorlds[4].id);
  const [comparisonIds, setComparisonIds] = useState<string[]>(["earth", "trappist-1e", "proxima-centauri-b"]);
  const [method, setMethod] = useState("All");
  const [status, setStatus] = useState(`Cached NASA snapshot loaded with ${archiveSnapshot.length} archive rows`);
  const [isLoading, setIsLoading] = useState(false);
  const [activeGuide, setActiveGuide] = useState(fieldGuides[0].id);
  const [educatorMode, setEducatorMode] = useState(true);
  const nasaRequestRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      nasaRequestRef.current?.abort();
    };
  }, []);

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
  const evidenceCounts = evidence.reduce(
    (counts, item) => ({ ...counts, [item.level]: counts[item.level] + 1 }),
    { "Known from data": 0, Estimated: 0, Unknown: 0 } satisfies Record<EvidenceLevel, number>,
  );
  const comparisonWorlds = comparisonIds.map((id) => worlds.find((world) => world.id === id)).filter(Boolean) as World[];
  const activeGuideItem = fieldGuides.find((guide) => guide.id === activeGuide) ?? fieldGuides[0];

  async function loadNasaData() {
    nasaRequestRef.current?.abort();
    const controller = new AbortController();
    nasaRequestRef.current = controller;
    setIsLoading(true);
    setStatus("Fetching NASA Exoplanet Archive composite parameters...");

    try {
      const nasaWorlds = await fetchNasaWorlds(controller.signal);
      if (nasaRequestRef.current !== controller) return;
      const merged = mergeWorlds(curatedWorlds, nasaWorlds);
      setWorlds(merged);
      setSource("nasa");
      setStatus(`Loaded ${merged.length} worlds with NASA archive rows plus curated astrobiology references`);
    } catch (error) {
      if (controller.signal.aborted) return;
      setSource("curated");
      setWorlds(curatedWorlds);
      setStatus(error instanceof Error ? `NASA fetch failed; using curated data. ${error.message}` : "NASA fetch failed; using curated data.");
    } finally {
      if (nasaRequestRef.current === controller) {
        nasaRequestRef.current = null;
        setIsLoading(false);
      }
    }
  }

  function loadSnapshot() {
    const merged = mergeWorlds(curatedWorlds, archiveSnapshot);
    setSource("snapshot");
    setWorlds(merged);
    setStatus(`Cached NASA snapshot loaded with ${archiveSnapshot.length} archive rows`);
    setQuery("");
    setMethod("All");
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
        <div className="mission-strip" aria-label="Project safeguards">
          <span><ShieldCheck size={17} /> Validated archive rows</span>
          <span><Database size={17} /> Snapshot fallback</span>
          <span><GraduationCap size={17} /> Educator mode</span>
        </div>
      </section>

      <section className="workspace" aria-label="Exoplanet explorer">
        <aside className="control-panel" aria-label="Search and filters">
          <div className="panel-header">
            <div>
              <p className="eyebrow"><SlidersHorizontal size={15} /> Explorer</p>
              <h2>Worlds</h2>
            </div>
            <span className={`source-pill ${source === "nasa" ? "is-live" : ""}`}>
              {source === "nasa" ? "NASA loaded" : source === "snapshot" ? "Snapshot" : "Curated"}
            </span>
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
            <button className="secondary-button" onClick={loadSnapshot}>Snapshot</button>
            <button className="secondary-button" onClick={resetCurated}>Curated</button>
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
                <span>{selected.sourceLabel ?? "Curated source"}</span>
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

            <article className="science-card evidence-score-card">
              <div className="card-heading">
                <Layers3 size={18} />
                <h3>Evidence balance</h3>
              </div>
              <div className="evidence-meter" aria-label="Evidence balance">
                {evidenceOrder.map((level) => (
                  <span
                    key={level}
                    className={`meter-segment ${level.toLowerCase().replace(/\s+/g, "-")}`}
                    style={{ flexGrow: Math.max(evidenceCounts[level], 1) }}
                    title={`${level}: ${evidenceCounts[level]}`}
                  />
                ))}
              </div>
              <p>{evidenceCounts.Unknown > 0 ? `${evidenceCounts.Unknown} open question${evidenceCounts.Unknown === 1 ? "" : "s"} remain visible.` : "This profile has no unknown fields in the current evidence board."}</p>
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
                      <a href={item.sourceUrl} target="_blank" rel="noreferrer">
                        Field source <ExternalLink size={13} />
                      </a>
                    </article>
                  ))}
                </div>
              ))}
            </div>
          </section>

          <section className="field-guide" aria-label="Astrobiology field guide">
            <div className="section-title">
              <div>
                <p className="eyebrow"><Telescope size={16} /> Field guide</p>
                <h2>Turn the atlas into a research conversation</h2>
              </div>
              <button className="secondary-button" onClick={() => setEducatorMode((value) => !value)}>
                {educatorMode ? "Hide prompts" : "Show prompts"}
              </button>
            </div>
            <div className="guide-layout">
              <div className="guide-tabs" role="tablist" aria-label="Astrobiology concepts">
                {fieldGuides.map((guide) => (
                  <button
                    key={guide.id}
                    className={`guide-tab ${activeGuide === guide.id ? "is-selected" : ""}`}
                    onClick={() => setActiveGuide(guide.id)}
                    role="tab"
                    aria-selected={activeGuide === guide.id}
                  >
                    {guide.title}
                  </button>
                ))}
              </div>
              <article className="guide-card">
                <h3>{activeGuideItem.title}</h3>
                <p>{activeGuideItem.body}</p>
                {educatorMode ? <strong>{activeGuideItem.prompt}</strong> : null}
              </article>
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
