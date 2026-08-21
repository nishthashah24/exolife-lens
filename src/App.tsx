import { useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen,
  Database,
  Edit3,
  ExternalLink,
  Gauge,
  Globe2,
  Lock,
  PenLine,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import { calculateHhi } from "./data/hhi";
import { fetchNasaWorlds, parseNasaWorlds } from "./data/nasa";
import nasaSnapshotRows from "./data/nasa-snapshot.json";
import { curatedWorlds } from "./data/worlds";
import type { World } from "./types";

type Page = "index" | "creator" | "admin";
type DataMode = "curated" | "snapshot" | "nasa";

const archiveSnapshot = parseNasaWorlds(nasaSnapshotRows);

const creatorPosts = [
  {
    id: "why-hhi",
    title: "Why focus on human habitability?",
    tag: "Project Notes",
    minutes: 3,
    excerpt:
      "Most habitability conversations ask whether life could exist. HHI asks a narrower question: what would humans need to survive, study, and stay honest about uncertainty?",
  },
  {
    id: "first-data",
    title: "Reading my first NASA Exoplanet Archive rows",
    tag: "NASA Data",
    minutes: 4,
    excerpt:
      "A short reflection on what surprised me: how many fields are unknown, how careful scientists are, and why missing data can be the most interesting part.",
  },
  {
    id: "college-build",
    title: "Building a science project that other students can use",
    tag: "Student Builder",
    minutes: 2,
    excerpt:
      "The goal is not to claim discovery. The goal is to make a careful, useful public tool that turns curiosity into better questions.",
  },
];

const modeCopy: Record<DataMode, string> = {
  curated: "Gentle starter set",
  snapshot: "Cached NASA snapshot",
  nasa: "Live NASA data",
};

const formatNumber = (value?: number, digits = 1) =>
  typeof value === "number" ? value.toLocaleString(undefined, { maximumFractionDigits: digits }) : "Unknown";

const mergeWorlds = (...groups: World[][]) => {
  const seen = new Set<string>();
  return groups.flat().filter((world) => {
    const key = world.name.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

function useRoute(): [Page, (page: Page) => void] {
  const getPage = () => {
    const hash = window.location.hash.replace("#", "");
    return hash === "creator" || hash === "admin" ? hash : "index";
  };
  const [page, setPage] = useState<Page>(getPage);

  useEffect(() => {
    const onHash = () => setPage(getPage());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  return [
    page,
    (nextPage) => {
      window.location.hash = nextPage === "index" ? "" : nextPage;
      setPage(nextPage);
    },
  ];
}

function scoreText(value: number) {
  return `${Math.round(value)}/100`;
}

function MiniWorldCard({
  world,
  selected,
  onSelect,
}: {
  world: World;
  selected: boolean;
  onSelect: () => void;
}) {
  const profile = calculateHhi(world);

  return (
    <button className={`world-card ${selected ? "is-selected" : ""}`} onClick={onSelect}>
      <span className="world-card-score">{scoreText(profile.index)}</span>
      <strong>{world.name}</strong>
      <small>{world.host}</small>
      <span>{profile.label}</span>
    </button>
  );
}

function HhiIndexPage() {
  const [worlds, setWorlds] = useState<World[]>(() => mergeWorlds(curatedWorlds, archiveSnapshot));
  const [mode, setMode] = useState<DataMode>("snapshot");
  const [selectedId, setSelectedId] = useState("trappist-1e");
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState(`Using ${archiveSnapshot.length} cached NASA rows. No API key required.`);
  const requestRef = useRef<AbortController | null>(null);

  useEffect(() => () => requestRef.current?.abort(), []);

  const rankedWorlds = useMemo(
    () =>
      worlds
        .map((world) => ({ world, profile: calculateHhi(world) }))
        .sort((a, b) => b.profile.index - a.profile.index),
    [worlds],
  );

  const visibleWorlds = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return rankedWorlds
      .filter(({ world }) => {
        if (!normalized) return true;
        return `${world.name} ${world.host} ${world.discoveryMethod}`.toLowerCase().includes(normalized);
      })
      .slice(0, 12);
  }, [query, rankedWorlds]);

  const selected = worlds.find((world) => world.id === selectedId) ?? rankedWorlds[0]?.world ?? curatedWorlds[0];
  const selectedProfile = calculateHhi(selected);
  const topWorlds = rankedWorlds.slice(0, 3);

  async function loadNasaData() {
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    setIsLoading(true);
    setStatus("Loading live NASA Exoplanet Archive rows...");

    try {
      const nasaWorlds = await fetchNasaWorlds(controller.signal);
      if (requestRef.current !== controller) return;
      setWorlds(mergeWorlds(curatedWorlds, nasaWorlds));
      setMode("nasa");
      setStatus(`Live NASA data loaded: ${nasaWorlds.length} archive rows plus curated reference worlds.`);
    } catch (error) {
      if (!controller.signal.aborted) {
        setStatus(error instanceof Error ? `Live load failed. Using cached snapshot. ${error.message}` : "Live load failed. Using cached snapshot.");
        setWorlds(mergeWorlds(curatedWorlds, archiveSnapshot));
        setMode("snapshot");
      }
    } finally {
      if (requestRef.current === controller) {
        requestRef.current = null;
        setIsLoading(false);
      }
    }
  }

  function setDataMode(nextMode: DataMode) {
    requestRef.current?.abort();
    setMode(nextMode);
    setQuery("");

    if (nextMode === "curated") {
      setWorlds(curatedWorlds);
      setStatus("Using a short, beginner-friendly set of reference worlds.");
    } else {
      setWorlds(mergeWorlds(curatedWorlds, archiveSnapshot));
      setStatus(`Using ${archiveSnapshot.length} cached NASA rows. No API key required.`);
    }
  }

  return (
    <>
      <section className="hero-panel">
        <div>
          <p className="eyebrow"><Sparkles size={16} /> Human Habitability Index</p>
          <h1>Which worlds are most understandable for human survival?</h1>
          <p className="lede">
            ExoLife Lens now centers on HHI: a student-built index that scores human-centered clues like temperature proxy,
            gravity, rocky scale, star risk, study access, and missing atmosphere data.
          </p>
          <div className="hero-actions">
            <button className="primary-button" onClick={loadNasaData} disabled={isLoading}>
              <RefreshCw size={17} className={isLoading ? "spin" : ""} /> Use live NASA data
            </button>
            <a className="secondary-link" href="#creator"><UserRound size={17} /> About the creator</a>
          </div>
        </div>
        <div className="score-orb" aria-label={`Selected HHI ${scoreText(selectedProfile.index)}`}>
          <span>{scoreText(selectedProfile.index)}</span>
          <small>{selected.name}</small>
        </div>
      </section>

      <section className="compact-bar" aria-label="Data controls">
        <label className="search-field">
          <Search size={17} />
          <span className="sr-only">Search worlds</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search Mars, Europa, TRAPPIST, transit" />
        </label>
        <div className="mode-buttons" aria-label="Data mode">
          {(["curated", "snapshot"] as DataMode[]).map((item) => (
            <button key={item} className={mode === item ? "is-selected" : ""} onClick={() => setDataMode(item)}>
              {modeCopy[item]}
            </button>
          ))}
        </div>
        <p>{status}</p>
      </section>

      <section className="ranking-panel" aria-label="Human Habitability Index ranking">
        <div className="section-title">
          <div>
            <p className="eyebrow"><Gauge size={16} /> Ranked worlds</p>
            <h2>Pick a world to inspect</h2>
          </div>
          <p>HHI is not a life claim. It is a clarity tool for comparing human-centered constraints.</p>
        </div>
        <div className="world-grid">
          {visibleWorlds.length === 0 ? (
            <div className="empty-state">
              <strong>No matching worlds</strong>
              <span>Try a broader search or switch back to the starter set.</span>
            </div>
          ) : (
            visibleWorlds.map(({ world }) => (
              <MiniWorldCard key={world.id} world={world} selected={world.id === selected.id} onSelect={() => setSelectedId(world.id)} />
            ))
          )}
        </div>
      </section>

      <section className="analysis-panel" aria-label={`${selected.name} HHI analysis`}>
        <div className="analysis-header">
          <div>
            <p className="eyebrow"><Globe2 size={16} /> Focus world</p>
            <h2>{selected.name}</h2>
            <p>{selected.summary}</p>
          </div>
          <div className="analysis-score">
            <span>{scoreText(selectedProfile.index)}</span>
            <small>{selectedProfile.label}</small>
          </div>
        </div>

        <div className="analysis-grid">
          <article className="plain-card">
            <h3>Plain-English read</h3>
            <p>{selected.whyItMatters}</p>
            <p>{selectedProfile.caution}</p>
            <a href={selected.nasaUrl} target="_blank" rel="noreferrer">Open source record <ExternalLink size={14} /></a>
          </article>
          <article className="plain-card">
            <h3>Confidence</h3>
            <div className="confidence-bar"><span style={{ width: `${Math.round(selectedProfile.confidence * 100)}%` }} /></div>
            <p>{Math.round(selectedProfile.confidence * 100)}% of HHI factors have usable data. Missing atmosphere data deliberately lowers certainty.</p>
          </article>
        </div>

        <div className="factor-grid">
          {selectedProfile.factors.map((factor) => (
            <article className="factor-card" key={factor.id}>
              <div>
                <strong>{factor.label}</strong>
                <span className={`level ${factor.level.toLowerCase().replace(/\s+/g, "-")}`}>{factor.level}</span>
              </div>
              <p className="factor-value">{factor.score === undefined ? "No score" : scoreText(factor.score)} · {factor.value}</p>
              <p>{factor.note}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="compare-strip" aria-label="Top HHI comparison">
        <div className="section-title">
          <div>
            <p className="eyebrow"><ShieldCheck size={16} /> Quick compare</p>
            <h2>Highest HHI in the current dataset</h2>
          </div>
          <p>Use this as a starting point, then inspect the missing factors.</p>
        </div>
        <div className="top-worlds">
          {topWorlds.map(({ world, profile }) => (
            <article key={world.id}>
              <span>{scoreText(profile.index)}</span>
              <strong>{world.name}</strong>
              <small>{profile.label}</small>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

function CreatorPage() {
  return (
    <section className="creator-page">
      <div className="creator-hero">
        <div>
          <p className="eyebrow"><UserRound size={16} /> About the creator</p>
          <h1>Built by a student curious about worlds humans could understand.</h1>
          <p className="lede">
            This page is ready for your sister’s real bio, photo, and reflections. The current copy is intentionally modest:
            it presents her as a high-school builder learning astrobiology through public data and careful product design.
          </p>
        </div>
      </div>

      <div className="creator-grid">
        <article className="plain-card">
          <h2>Creator description draft</h2>
          <p>
            ExoLife Lens was created by a high-school student interested in astrobiology, exoplanets, and the question of what
            makes a world understandable for future human exploration. She built the project to make NASA exoplanet data easier
            for students and the public to explore without needing a research background.
          </p>
        </article>
        <article className="plain-card">
          <h2>Why HHI?</h2>
          <p>
            The Human Habitability Index gives her project a clear niche: not “did we find life,” but “what would humans need
            to know before calling a world remotely survivable?” It highlights uncertainty as part of the science.
          </p>
        </article>
      </div>

      <section className="blog-section">
        <div className="section-title">
          <div>
            <p className="eyebrow"><BookOpen size={16} /> Creator blog</p>
            <h2>Public posts</h2>
          </div>
          <p>Tags are public. View counts should stay private in the admin backend.</p>
        </div>
        <div className="post-grid">
          {creatorPosts.map((post) => (
            <article className="post-card" key={post.id}>
              <span>{post.tag}</span>
              <h3>{post.title}</h3>
              <p>{post.excerpt}</p>
              <small>{post.minutes} min read</small>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}

function AdminPage() {
  return (
    <section className="admin-page">
      <div className="creator-hero">
        <div>
          <p className="eyebrow"><Lock size={16} /> Creator backend</p>
          <h1>Blog admin blueprint</h1>
          <p className="lede">
            On Cloudflare, the public site can stay free while the creator dashboard is protected with Cloudflare Access and
            Google login. D1 stores posts, tags, drafts, and private view counts.
          </p>
        </div>
      </div>

      <div className="admin-grid">
        <article className="plain-card">
          <Edit3 size={22} />
          <h2>Write posts</h2>
          <p>Authenticated creator can create drafts, publish posts, and assign custom tags through `/admin`.</p>
        </article>
        <article className="plain-card">
          <Database size={22} />
          <h2>Store in D1</h2>
          <p>Public readers fetch only published posts. The admin API can include draft state and private views.</p>
        </article>
        <article className="plain-card">
          <PenLine size={22} />
          <h2>Private analytics</h2>
          <p>View counts are incremented server-side and only returned to authenticated admin endpoints.</p>
        </article>
      </div>
    </section>
  );
}

function App() {
  const [page, setPage] = useRoute();

  return (
    <main className="app-shell">
      <nav className="site-nav" aria-label="Main navigation">
        <button onClick={() => setPage("index")} className={page === "index" ? "is-selected" : ""}>HHI Atlas</button>
        <button onClick={() => setPage("creator")} className={page === "creator" ? "is-selected" : ""}>Creator</button>
        <button onClick={() => setPage("admin")} className={page === "admin" ? "is-selected" : ""}>Admin</button>
      </nav>

      {page === "creator" ? <CreatorPage /> : page === "admin" ? <AdminPage /> : <HhiIndexPage />}
    </main>
  );
}

export default App;
