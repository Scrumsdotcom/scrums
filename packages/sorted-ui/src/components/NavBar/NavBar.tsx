import { Fragment, useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { PIC } from "./NavBar.icons";
import "./NavBar.css";

export interface NavBarProps {
  brand?: string;
  ctaLabel?: string;
  searchHref?: string;
  ctaHref?: string;
  loginLabel?: string;
  loginHref?: string;
  salesLabel?: string;
  salesHref?: string;
  openOn?: "hover" | "click";
  primitives?: { label: string; href: string }[];
  salesVariant?: "ghost" | "quiet";
  loggedInUx?: "" | "on" | "demo";
  pricingHref?: string;
}

const Chevron = (
  <svg className="ds-nav__chev" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);
const CaretRight = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const ExtArrow = <span className="ds-nav__simple-ext" aria-hidden="true">↗</span>;
const Simple = ({ label, href = "#", chips, ext }: { label: string; href?: string; chips?: { label: string; href: string }[]; ext?: boolean }) =>
  chips ? (
    <div className="ds-nav__simple ds-nav__simple--chips">
      <a className="ds-nav__simple-main" href={href}>{label}{ext ? ExtArrow : null}</a>
      <span className="ds-nav__simple-chiprow">
        {chips.map((c) => <a key={c.href} className="ds-nav__simple-chip" href={c.href}>{c.label}</a>)}
      </span>
    </div>
  ) : (
    <a className="ds-nav__simple" href={href}>{label}{ext ? ExtArrow : null}</a>
  );

const SECTIONS = ["platform", "solutions", "resources", "company"] as const;
type Section = (typeof SECTIONS)[number];
const LABELS: Record<Section, string> = {
  platform: "Enterprise AI Platform", solutions: "Solutions", resources: "Resources", company: "Company",
};
const pad = (i: number) => String(i + 1).padStart(2, "0");

const HUB: Record<Section, string> = {
  platform: "/platform", solutions: "/solutions", resources: "/resources", company: "/about-us",
};

type PlatformGlyph = "sq" | "dia" | "rect" | "bars" | "ring" | "tab";
type PlatformLink = {
  label: string;
  href: string;
  glyph?: PlatformGlyph;
  chip?: string;
  chipTone?: "blue" | "grey";
  count?: number;
  desc?: string;
};
const PLATFORM_HEAD = { label: "Enterprise Platform", desc: "AI software engineering orchestration platform", href: "/platform" };
const PLATFORM_CAPS: PlatformLink[] = [
  { label: "AI Agent Harness", href: "/platform/agent-harness", glyph: "sq" },
  { label: "AI Agent Gateway", href: "/platform/ai-gateway", glyph: "dia" },
  { label: "MCP Gateway", href: "/platform/mcp-gateway", glyph: "rect", chip: "NEW", chipTone: "blue" },
  { label: "AI Coding Agents", href: "/catalog/agents", glyph: "ring" },
  { label: "AI Governance", href: "/platform", glyph: "bars" },
  { label: "Sovereign AI", href: "/platform", glyph: "tab", chip: "af-cpt+4", chipTone: "grey" },
];
const CATALOG_HEAD = { label: "AI Catalog", desc: "Deployable AI for engineering orgs", href: "/catalog" };
const CATALOG_ROWS: PlatformLink[] = [
  { label: "Agents", href: "/catalog/agents", count: 163 },
  { label: "MCPs", href: "/catalog/mcps", count: 101 },
  { label: "Models", href: "/catalog/models", count: 30 },
  { label: "Skills", href: "/catalog/skills", count: 10 },
  { label: "AI Infra", href: "/catalog/infrastructure", count: 512 },
];
const CATALOG_TOTAL = 895;
const SERVICES_HEAD = { label: "AI Platform Services", desc: "Operated by Scrums.com engineers", href: "/ai-development" };
const SERVICE_ROWS: PlatformLink[] = [
  { label: "AI Development", href: "/ai-development", chip: "SUBSCRIPTION", chipTone: "blue", desc: "End-to-end software delivery" },
  { label: "AI Engineers", href: "/hire", chip: "CERTIFIED", chipTone: "blue", desc: "Hire certified AI engineers & teams" },
];
const PRICING = { label: "Pricing", desc: "Transparent plans for every team", href: "/pricing" };
const FEATURED = {
  stat: "11,058 hrs",
  statKey: "hours saved in 30 days",
  tag: "AI AGENTS // BANKING",
  desc: "AI Agent Gateway modernising legacy systems for BFSI teams",
  cta: "Read case study →",
  href: "/case-studies/secure-scalable-mcp-framework-for-30000-ai-agents",
};

function Chip({ text, tone = "blue" }: { text: string; tone?: "blue" | "grey" }) {
  return <span className={`ds-nav__pp-chip ds-nav__pp-chip--${tone}`}>{text}</span>;
}
function HeadLink({ label, desc, href }: { label: string; desc: string; href: string }) {
  return (
    <a className="ds-nav__pp-head" href={href}>
      <span className="ds-nav__pp-head-t">{label}<span className="ds-nav__pp-chev" aria-hidden="true">→</span></span>
      <span className="ds-nav__pp-head-d">{desc}</span>
    </a>
  );
}

const USE_CASES = [
  { label: "Accelerate Velocity", href: "/solutions/use-case/accelerate-engineering-velocity" },
  { label: "Scale Capacity", href: "/solutions/use-case/scale-engineering-capacity" },
  { label: "Visibility & Insights", href: "/solutions/use-case/engineering-visibility-delivery-insights" },
  { label: "Modernize Legacy Systems", href: "/solutions/use-case/modernize-legacy-systems" },
  { label: "AI & Automation", href: "/solutions/use-case/ai-automation" },
  { label: "Secure & Compliant Delivery", href: "/solutions/use-case/secure-compliant-software-delivery" },
  { label: "Modernize DevOps", href: "/solutions/use-case/modernize-devops-platform-engineering" },
];
const WHO = [
  { icon: PIC.cto, title: "CTOs", href: "/solutions/cto" },
  { icon: PIC.engmgr, title: "Engineering Managers", href: "/solutions/engineering-manager" },
  { icon: PIC.product, title: "Product Leads", href: "/solutions/product-lead" },
  { icon: PIC.arch, title: "Head of Architecture", href: "/solutions/enterprise-architect" },
  { icon: PIC.qalead, title: "Head of QA / DevOps", href: "/solutions/qa-devops-lead" },
  { icon: PIC.ailead, title: "AI / Automation Lead", href: "/solutions/ai-automation-lead" },
  { icon: PIC.pricing, title: "CFOs", href: "/solutions/cfo" },
  { icon: PIC.talent, title: "Founders", href: "/solutions/founder" },
];
const INDUSTRIES = [
  { icon: PIC.fintech, title: "FinTech", href: "/solutions/industries/fintech-software" },
  { icon: PIC.bank, title: "Banking & Financial Services", href: "/solutions/industries/banking-financial-services-software" },
  { icon: PIC.insurance, title: "Insurance", href: "/solutions/industries/insurance-software" },
  { icon: PIC.saas, title: "Technology & SaaS", href: "/solutions/industries/technology-saas-software" },
  { icon: PIC.allind, title: "See All Industries", href: "/solutions/industries" },
];
const RESOURCES = [
  { icon: PIC.blog, title: "Blog", desc: "Industry insights and engineering best practices", href: "/blog" },
  { icon: PIC.guides, title: "Guides", desc: "In-depth technical and strategy guides", href: "/guides" },
  { icon: PIC.videos, title: "Videos", desc: "Webinars, demos, and talks", href: "/resources/videos" },
  { icon: PIC.podcast, title: "Podcast", desc: "Conversations with engineering leaders", href: "/resources/podcast" },
];
const TOOLS_RESEARCH = [
  { title: "Case Studies", desc: "Proven delivery, in the client's words", href: "/case-studies" },
  { title: "Top 100 AI", desc: "Annual ranking of AI companies in Africa", href: "/resources/research/top-100-ai-companies-in-africa" },
  { title: "Research & Benchmarks", desc: "All research reports and benchmarks", href: "/resources/research" },
];
const CAREERS_CHIPS = [
  { label: "Jobs", href: "/jobs" },
  { label: "Library", href: "/careers/library" },
  { label: "Skill Hub", href: "/careers/skill-hub" },
];
const COMPANY: { label: string; href: string; chips?: { label: string; href: string }[] }[] = [
  { label: "About", href: "/about-us" },
  { label: "Client Stories", href: "/case-studies" },
  { label: "Careers", href: "/careers", chips: CAREERS_CHIPS },
  { label: "Rewards", href: "/company/rewards" },
];
const DOCS_CHIPS = [
  { label: "Documentation", href: "/docs" },
  { label: "API", href: "/docs/api-reference/introduction" },
];
const TRUST: { label: string; href: string; ext?: boolean; chips?: { label: string; href: string }[] }[] = [
  { label: "Docs", href: "/docs", ext: true, chips: DOCS_CHIPS },
  { label: "Contact Us", href: "/contact-us" },
  { label: "Trust & Legal", href: "/legal" },
  { label: "Partners", href: "/partnerships" },
];

const SOL_HIRES = [
  { name: "Dedicated AI Teams", count: "640", href: "/hire/teams" },
  { name: "Python Developers", count: "284", href: "/hire/python-developers" },
  { name: "Forward Deployed Engineers", count: "212", href: "/hire/forward-deployed-engineers" },
];
const SOL_SERVICES: { label: string; sub: string; href: string; chip: string; tab: number }[] = [
  { label: "Hire Engineers", sub: "Developers, CTOs and teams", href: "/hire", chip: "CERTIFIED", tab: 3 },
  { label: "Software Development", sub: "Build, run and operate subscription", href: "/ai-development", chip: "MANAGED", tab: 4 },
];
type SolItem = { icon: ReactNode; name: string; sub: string; href: string; tag?: string };
type SolTab = { name: string; sub: string; count: string; kicker: string; desc: string; items: SolItem[]; promo: { badge: string; title: string; desc: string; cta: string; href: string } };
const SOL_TABS: SolTab[] = [
  {
    name: "Use Cases", sub: "Outcomes to drive", count: "07", kicker: "// use cases", desc: "The outcome you're driving toward",
    items: [
      { icon: PIC.swdev, name: "Accelerate Velocity", sub: "Ship faster, sustainably", href: "/solutions/use-case/accelerate-engineering-velocity" },
      { icon: PIC.infra, name: "Scale Capacity", sub: "Add throughput on demand", href: "/solutions/use-case/scale-engineering-capacity" },
      { icon: PIC.qalead, name: "Visibility & Insights", sub: "DORA + engineering intel", href: "/solutions/use-case/engineering-visibility-delivery-insights" },
      { icon: PIC.maintenance, name: "Modernize Legacy", sub: "De-risk the rewrite", href: "/solutions/use-case/modernize-legacy-systems" },
      { icon: PIC.agents, name: "AI & Automation", sub: "Put agents to work", href: "/solutions/use-case/ai-automation" },
      { icon: PIC.insurance, name: "Secure & Compliant", sub: "SOC2 · ISO · HIPAA", href: "/solutions/use-case/secure-compliant-software-delivery" },
      { icon: PIC.reliability, name: "Modernize DevOps", sub: "Pipelines & reliability", href: "/solutions/use-case/modernize-devops-platform-engineering" },
    ],
    promo: { badge: "Benchmark", title: "Where do you stand on DORA?", desc: "Free engineering-health assessment across the four key metrics.", cta: "Run the assessment", href: "/platform/dora-metrics" },
  },
  {
    name: "Industries", sub: "Where we deliver", count: "06", kicker: "// industries", desc: "Domain-shaped delivery",
    items: [
      { icon: PIC.fintech, name: "FinTech", sub: "Payments, ledgers & risk", href: "/solutions/industries/fintech-software" },
      { icon: PIC.bank, name: "Banking & Financial", sub: "Core & digital banking", href: "/solutions/industries/banking-financial-services-software" },
      { icon: PIC.insurance, name: "Insurance", sub: "Claims, underwriting & data", href: "/solutions/industries/insurance-software" },
      { icon: PIC.saas, name: "Technology & SaaS", sub: "Product velocity at scale", href: "/solutions/industries/technology-saas-software" },
      { icon: PIC.talent, name: "Healthcare", sub: "Compliant, secure systems", href: "/solutions/industries/healthcare-software" },
      { icon: PIC.allind, name: "See All Industries", sub: "Full sector index", href: "/solutions/industries" },
    ],
    promo: { badge: "Regulated", title: "Delivery for regulated industries", desc: "SOC2, ISO 27001 & HIPAA-ready squads with full audit trails.", cta: "See compliance", href: "/legal" },
  },
  {
    name: "Who We Help", sub: "Buyer & role fit", count: "06", kicker: "// who we help", desc: "Mapped to your role & mandate",
    items: [
      { icon: PIC.cto, name: "CTOs", sub: "Strategy, scale & spend", href: "/solutions/cto" },
      { icon: PIC.engmgr, name: "Engineering Managers", sub: "Throughput & team health", href: "/solutions/engineering-manager" },
      { icon: PIC.product, name: "Product Leads", sub: "Roadmap velocity", href: "/solutions/product-lead" },
      { icon: PIC.arch, name: "Head of Architecture", sub: "Modernization & platform", href: "/solutions/enterprise-architect" },
      { icon: PIC.qalead, name: "Head of QA / DevOps", sub: "Quality & reliability", href: "/solutions/qa-devops-lead" },
      { icon: PIC.ailead, name: "AI / Automation Lead", sub: "Agent adoption & governance", href: "/solutions/ai-automation-lead" },
    ],
    promo: { badge: "For leaders", title: "An exec view of engineering", desc: "Executive dashboards translating delivery into business signal.", cta: "See reporting", href: "/platform/developer-productivity" },
  },
];

const SOL_SERVICE_TABS: SolTab[] = [
  {
    name: "Hire Engineers", sub: "Operators, teams & squads", count: "09", kicker: "// hire engineers", desc: "Vetted operators, embedded teams & squads",
    items: [
      { icon: PIC.talent, name: "Hire AI Engineers", sub: "Individual vetted engineers", href: "/hire" },
      { icon: PIC.engmgr, name: "Dedicated Teams", sub: "Full squads, embedded", href: "/hire/teams" },
      { icon: PIC.agents, name: "Forward Deployed Engineers", sub: "Applied AI, deployed with you", href: "/hire/forward-deployed-engineers", tag: "Hot" },
      { icon: PIC.arch, name: "Staff Augmentation", sub: "Embed vetted roles you manage", href: "/hire/staff-augmentation" },
      { icon: PIC.platform, name: "Global Capability Center", sub: "Your engineering center in Africa", href: "/hire/global-capability-center" },
      { icon: PIC.swdev, name: "Hire Python Developers", sub: "Django · FastAPI · data", href: "/hire/python-developers", tag: "Hot" },
      { icon: PIC.mobile, name: "Hire React Native Devs", sub: "Cross-platform mobile", href: "/hire/react-native-developers", tag: "Hot" },
      { icon: PIC.console, name: "Hire Kotlin Developers", sub: "Android & JVM backends", href: "/hire/kotlin-developers", tag: "Hot" },
      { icon: PIC.talent, name: "Engineers Register", sub: "Search every profile", href: "/hire/engineers" },
    ],
    promo: { badge: "48h match", title: "Build your dedicated team", desc: "Vetted operators matched from the live mesh. Introduced within 48 hours.", cta: "Start hiring", href: "/hire" },
  },
  {
    name: "Software Development", sub: "Build, run and operate subscription", count: "11", kicker: "// software development", desc: "Engineering, AI & delivery capabilities",
    items: [
      { icon: PIC.agents, name: "AI Development", sub: "LLM products, agents & SDLC automation", href: "/ai-development", tag: "Hot" },
      { icon: PIC.swdev, name: "Software Development", sub: "Full-stack product engineering", href: "/ai-development/custom-software-development" },
      { icon: PIC.mobile, name: "Mobile App Development", sub: "iOS, Android & cross-platform", href: "/ai-development/mobile-app-development" },
      { icon: PIC.qa, name: "Software Testing & QA", sub: "Automated quality gates", href: "/ai-development/software-testing-qa" },
      { icon: PIC.infra, name: "Data Engineering", sub: "Pipelines, warehouses & ML", href: "/ai-development/data-engineering-analytics" },
      { icon: PIC.web, name: "Web Development", sub: "Modern web at scale", href: "/ai-development/web-development" },
      { icon: PIC.platform, name: "Application Modernization", sub: "Legacy → cloud-native", href: "/ai-development/application-modernization" },
      { icon: PIC.reliability, name: "DevOps & Reliability", sub: "CI/CD, SRE & observability", href: "/ai-development/devops-engineering" },
      { icon: PIC.delivery, name: "Scopes", sub: "Fixed-scope sprints, pods & SLAs", href: "/ai-development/scopes" },
      { icon: PIC.platform, name: "Product Development", sub: "Fully-managed product studio", href: "/ai-development/product-development" },
      { icon: PIC.console, name: "Outcome-Driven Sprints", sub: "Fixed-scope, results in weeks", href: "/ai-development/scopes?type=outcome-driven-sprints" },
    ],
    promo: { badge: "Platform", title: "Software Engineering Operations Platform", desc: "Unify tools, deploy agents, and track DORA from one console.", cta: "Explore the platform", href: "/platform" },
  },
];
const SOL_ALL: SolTab[] = [...SOL_TABS, ...SOL_SERVICE_TABS];

const RES_FEATURED = {
  badge: "Guide",
  title: "AI agents in software development",
  desc: "The field guide to putting agents to work across the SDLC.",
  cta: "Read the guide",
  href: "/guides/agentic-ai-and-ai-agents-guide-for-software-teams",
};

type MGroup = { heading: string; items: { label: string; href: string; ext?: boolean }[] };
const MOBILE_NAV: Record<Section, MGroup[]> = {
  platform: [],
  solutions: [
    { heading: "use cases", items: USE_CASES },
    { heading: "industries", items: INDUSTRIES.map((i) => ({ label: i.title, href: i.href })) },
    { heading: "who we help", items: WHO.map((w) => ({ label: w.title, href: w.href })) },
    { heading: "ai platform services", items: SOL_SERVICES.map((x) => ({ label: x.label, href: x.href })) },
    { heading: "featured", items: [{ label: "Where do you stand on DORA?", href: "/platform/dora-metrics" }] },
  ],
  resources: [
    { heading: "resources", items: RESOURCES.map((r) => ({ label: r.title, href: r.href })) },
    { heading: "tools & research", items: TOOLS_RESEARCH.map((t) => ({ label: t.title, href: t.href })) },
  ],
  company: [
    { heading: "company", items: COMPANY.map((c) => ({ label: c.label, href: c.href })) },
    { heading: "trust & security", items: TRUST },
  ],
};

const SearchGlyph = (
  <svg viewBox="0 0 16 16" width="14" height="14" fill="none" aria-hidden="true">
    <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.6" />
    <line x1="10.8" y1="10.8" x2="14.2" y2="14.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

const UserGlyph = (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5" />
  </svg>
);
type Me = { name?: string | null; email?: string | null; picture?: string | null };
const DEMO_USER: Me = { name: "Alex Morgan", email: "alex@acme-example.com", picture: null };
const DEMO_PIC =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="hsl(222,86%,54%)"/><circle cx="32" cy="24" r="11" fill="hsl(221,64%,93%)"/><path d="M10 60c2-13 11-19 22-19s20 6 22 19z" fill="hsl(221,64%,93%)"/></svg>',
  );
const ACCOUNT_LINKS = [
  { label: "Your workspace", href: "https://platform.scrums.com" },
  { label: "Deployments", href: "/ai-development" },
  { label: "Billing", href: "https://platform.scrums.com" },
  { label: "Docs", href: "/docs" },
  { label: "Support", href: "/contact-us" },
];
function initialsOf(me: Me): string {
  const src = (me.name ?? "").trim() || (me.email ?? "").trim();
  if (!src) return "?";
  const words = src.split(/[\s._@-]+/).filter(Boolean);
  const a = words[0]?.[0] ?? "";
  const b = words.length > 1 ? words[1][0] : "";
  return (a + b).toUpperCase() || "?";
}
function avatarVariant(me: Me): string {
  const src = (me.email ?? "").trim() || (me.name ?? "").trim();
  let h = 0;
  for (let i = 0; i < src.length; i++) h = (h * 31 + src.charCodeAt(i)) % 997;
  return `ds-nav__avatar--v${h % 4}`;
}
function Avatar({ me, className }: { me: Me; className: string }) {
  return me.picture ? (
    <span className={className}>
      <img src={me.picture} alt="" />
    </span>
  ) : (
    <span className={`${className} ${avatarVariant(me)}`} aria-hidden="true">{initialsOf(me)}</span>
  );
}

export function NavBar({
  brand = "Scrums.com",
  ctaLabel = "Get Started",
  searchHref = "/products/search",
  ctaHref = "#",
  loginLabel = "Login",
  loginHref = "https://platform.scrums.com",
  salesLabel = "Talk to sales",
  salesHref = "/contact-us?intent=sales",
  primitives,
  salesVariant = "ghost",
  openOn = "hover",
  loggedInUx = "",
  pricingHref,
}: NavBarProps) {
  const [open, setOpen] = useState<Section | null>(null);
  const [mcat, setMcat] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [msec, setMsec] = useState<Section | "account" | null>(null);
  const [sol, setSol] = useState(0);
  const uid = useId();
  const [kbd, setKbd] = useState("⌘K");
  const flagOn = loggedInUx === "on" || loggedInUx === "demo";
  const [me, setMe] = useState<Me | null>(null);
  const [acct, setAcct] = useState(false);
  const [demoPic, setDemoPic] = useState(false);
  useEffect(() => {
    if (loggedInUx === "demo") {
      setMe(DEMO_USER);
      return;
    }
    let alive = true;
    fetch("/auth/me", { credentials: "same-origin", cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (alive && d && d.signedIn) setMe({ name: d.name ?? null, email: d.email ?? null, picture: d.picture ?? null });
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [loggedInUx]);
  const meView: Me | null = me && loggedInUx === "demo" ? { ...me, picture: demoPic ? DEMO_PIC : null } : me;
  const entPrimary = !!pricingHref;
  const signOut = () => {
    setAcct(false);
    if (loggedInUx === "demo") {
      setMe(null);
      return;
    }
    fetch("/auth/logout", { method: "POST", credentials: "same-origin" })
      .catch(() => {})
      .finally(() => location.reload());
  };
  const authedFirstName = me?.name ? String(me.name).trim().split(/\s+/)[0] : "Account";
  const loginText = me ? authedFirstName : loginLabel;
  const loginDest = me ? "https://platform.scrums.com" : loginHref;
  const ctaText = me ? (flagOn ? "Your workspace" : "Open Platform") : ctaLabel;
  const ctaDest = me ? "https://platform.scrums.com" : ctaHref;
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    if (!/Mac|iPhone|iPad/.test(navigator.platform)) setKbd("Ctrl K");
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setOpen(null); setMobile(false); setAcct(false); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  useEffect(() => {
    if (!acct) return;
    const onDown = (e: MouseEvent) => {
      if (!(e.target as Element | null)?.closest?.(".ds-nav__acctwrap")) setAcct(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [acct]);

  const wrapRef = useRef<HTMLDivElement | null>(null);
  const barRef = useRef<HTMLElement | null>(null);
  const bubbleRef = useRef<HTMLDivElement | null>(null);
  const arrowRef = useRef<HTMLDivElement | null>(null);
  const trigRefs = useRef<Partial<Record<Section, HTMLButtonElement | null>>>({});
  const viewRefs = useRef<Partial<Record<Section, HTMLDivElement | null>>>({});
  const openT = useRef<number | undefined>(undefined);
  const closeT = useRef<number | undefined>(undefined);
  const prevOpen = useRef<Section | null>(null);
  const clearTimers = () => {
    window.clearTimeout(openT.current);
    window.clearTimeout(closeT.current);
  };
  useEffect(() => clearTimers, []);

  const enter = (s: Section) => {
    if (openOn !== "hover") return;
    clearTimers();
    if (open) setOpen(s);
    else openT.current = window.setTimeout(() => setOpen(s), 70);
  };
  const focusOpen = (s: Section) => {
    if (openOn === "hover") { clearTimers(); setOpen(s); }
  };
  const toggle = (s: Section) => { clearTimers(); setOpen((o) => (o === s ? null : s)); };
  const leave = () => {
    if (openOn !== "hover") return;
    clearTimers();
    closeT.current = window.setTimeout(() => setOpen(null), 220);
  };
  const keep = () => clearTimers();
  const dismiss = () => {
    if (openOn !== "hover") return;
    clearTimers();
    setOpen(null);
  };

  useLayoutEffect(() => {
    if (!open) { prevOpen.current = null; return; }
    const place = () => {
      const wrap = wrapRef.current;
      const bar = barRef.current;
      const bub = bubbleRef.current;
      const view = viewRefs.current[open];
      const trig = trigRefs.current[open];
      if (!wrap || !bar || !bub || !view || !trig) return;
      const wr = wrap.getBoundingClientRect();
      const br = bar.getBoundingClientRect();
      const bs = getComputedStyle(bar);
      const cl = br.left - wr.left + parseFloat(bs.paddingLeft);
      const cr = br.right - wr.left - parseFloat(bs.paddingRight);
      wrap.style.setProperty("--ds-nav-cw", `${cr - cl}px`);
      const tr = trig.getBoundingClientRect();
      const cx = tr.left - wr.left + tr.width / 2;
      const w = view.offsetWidth;
      const h = view.offsetHeight;
      const x = Math.min(Math.max(cx - w / 2, cl), Math.max(cl, cr - w));
      const ax = Math.min(Math.max(cx, x + 14), x + w - 14);
      bub.style.width = `${w}px`;
      bub.style.height = `${h}px`;
      bub.style.transform = `translateX(${x}px)`;
      const arr = arrowRef.current;
      if (arr) arr.style.transform = `translateX(${ax}px) rotate(45deg)`;
    };
    const wrap = wrapRef.current;
    if (prevOpen.current === null && wrap) {
      wrap.classList.add("ds-nav--teleport");
      place();
      void wrap.offsetWidth;
      wrap.classList.remove("ds-nav--teleport");
    } else {
      place();
    }
    prevOpen.current = open;
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [open, sol]);

  const openIdx = open ? SECTIONS.indexOf(open) : -1;
  const viewCls = (s: Section) =>
    open === s ? " is-open" : openIdx >= 0 && SECTIONS.indexOf(s) < openIdx ? " is-left" : "";

  return (
    <div className={"ds-nav" + (scrolled ? " ds-nav--scrolled" : "")} onMouseLeave={leave} ref={wrapRef}>
      <nav className="ds-nav__bar" aria-label="Primary" ref={barRef}>
        <a
          className="ds-nav__brand"
          href="/"
          aria-label={brand}
          onMouseEnter={leave}
          onFocus={dismiss}
        >
          <img
            className="ds-nav__logo"
            src="/scrums-logo.png"
            alt={brand}
            width="138"
            height="30"
          />
        </a>

        {}
        <div className="ds-nav__center">
          {SECTIONS.filter((s) => s !== "company").map((s, i) => (
            <button
              key={s}
              type="button"
              className={`ds-nav__trig${open === s ? " is-open" : ""}`}
              aria-expanded={open === s}
              aria-controls={`${uid}-${s}`}
              ref={(el) => { trigRefs.current[s] = el; }}
              onMouseEnter={() => enter(s)}
              onFocus={() => focusOpen(s)}
              onClick={() => toggle(s)}
            >
              <span className="ds-nav__tnum">{pad(i)}</span>
              {s === "platform" ? <><span className="ds-nav__tpre">Enterprise AI </span>Platform</> : LABELS[s]}
              {Chevron}
            </button>
          ))}
          {entPrimary ? (
            <a className="ds-nav__trig ds-nav__trig--link" href={pricingHref} onMouseEnter={leave} onFocus={dismiss}>
              <span className="ds-nav__tnum">{pad(SECTIONS.length - 1)}</span>
              Pricing
            </a>
          ) : null}
        </div>

        {}
        <div className="ds-nav__right">
          <a
            className="ds-nav__search"
            onMouseEnter={leave}
            href={searchHref}
            data-nav-search
            aria-label={`Search the catalog (${kbd})`}
            onClick={(e) => {
              if ("cmdk" in document.documentElement.dataset) {
                e.preventDefault();
                window.dispatchEvent(new Event("scrums:cmdk-open"));
              }
            }}
          >
            {SearchGlyph}
            <kbd className="ds-nav__search-kbd">{kbd}</kbd>
          </a>
          <button
            type="button"
            className={`ds-nav__trig ds-nav__trig--right${open === "company" ? " is-open" : ""}`}
            aria-expanded={open === "company"}
            aria-controls={`${uid}-company`}
            ref={(el) => { trigRefs.current.company = el; }}
            onMouseEnter={() => enter("company")}
            onFocus={() => focusOpen("company")}
            onClick={() => toggle("company")}
          >
            {LABELS.company}
            {Chevron}
          </button>
          {flagOn ? (
            meView ? null : (
              <a className="ds-nav__login ds-nav__login--icon" href={loginDest} aria-label={loginText} title={loginText} onMouseEnter={leave}>{UserGlyph}</a>
            )
          ) : (
            <a className="ds-nav__login" href={loginDest} onMouseEnter={leave}>{loginText}</a>
          )}
          <a className={salesVariant === "quiet" ? "ds-nav__ghost ds-nav__ghost--quiet" : "ds-nav__ghost"} href={salesHref} onMouseEnter={leave}>{salesLabel}</a>
          {flagOn && meView ? (
            <div className="ds-nav__acctwrap">
              <button
                type="button"
                className="ds-nav__acctbtn"
                onMouseEnter={leave}
                aria-label="Account menu"
                aria-haspopup="menu"
                aria-expanded={acct}
                onClick={() => setAcct((a) => !a)}
              >
                <Avatar me={meView} className="ds-nav__avatar" />
              </button>
              {acct ? (
                <div className="ds-nav__acct" role="menu" aria-label="Account">
                  <div className="ds-nav__acct-id">
                    <Avatar me={meView} className="ds-nav__avatar ds-nav__avatar--lg" />
                    <span className="ds-nav__acct-meta">
                      <span className="ds-nav__acct-name">{meView.name}</span>
                      <span className="ds-nav__acct-email">{meView.email}</span>
                    </span>
                  </div>
                  {primitives && primitives.length > 0 ? (
                    <>
                      <div className="ds-nav__acct-h">// catalog</div>
                      {primitives.map((p, i) => (
                        <a key={p.href} role="menuitem" className="ds-nav__acct-link" href={p.href}>
                          <span className="ds-nav__acct-num">{pad(i)}</span>
                          {p.label}
                        </a>
                      ))}
                      <div className="ds-nav__acct-h">// account</div>
                    </>
                  ) : null}
                  {ACCOUNT_LINKS.map((l, i) => (
                    <a key={l.label} role="menuitem" className="ds-nav__acct-link" href={l.href}>
                      <span className="ds-nav__acct-num">{pad(i)}</span>
                      {l.label}
                    </a>
                  ))}
                  {loggedInUx === "demo" ? (
                    <button type="button" className="ds-nav__acct-link ds-nav__acct-demo" onClick={() => setDemoPic((p) => !p)}>
                      <span className="ds-nav__acct-num">··</span>
                      demo: {demoPic ? "use initials chip" : "use photo chip"}
                    </button>
                  ) : null}
                  <div className="ds-nav__acct-out">
                    <button type="button" role="menuitem" className="ds-nav__acct-link" onClick={signOut}>
                      <span className="ds-nav__acct-num">→</span>
                      Sign out
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
          <a className="ds-nav__cta" href={ctaDest} onMouseEnter={leave}>{ctaText} →</a>
        </div>

        {flagOn && meView ? (
          <button
            type="button"
            className="ds-nav__mavatar"
            aria-label="Menu"
            aria-expanded={mobile}
            onClick={() => setMobile((m) => !m)}
          >
            <Avatar me={meView} className="ds-nav__avatar" />
          </button>
        ) : (
          <button
            type="button"
            className={`ds-nav__burger${mobile ? " is-open" : ""}`}
            aria-label="Menu"
            aria-expanded={mobile}
            onClick={() => setMobile((m) => !m)}
          >
            <span /><span /><span />
          </button>
        )}
      </nav>

      {}
      <div className={`ds-nav__bubblewrap${open ? " is-open" : ""}`}>
      <div className={`ds-nav__bubble${open === "platform" || open === "solutions" || open === "resources" ? " ds-nav__bubble--light" : ""}`} ref={bubbleRef} onMouseEnter={keep}>
      <div className="ds-nav__views">

      {}
      <div id={`${uid}-platform`} role="region" aria-label="Platform" aria-hidden={open !== "platform"}
        ref={(el) => { viewRefs.current.platform = el; }}
        className={`ds-nav__panel ds-nav__panel--platform${viewCls("platform")}`}>
        <div className="ds-nav__pp">
          <div className="ds-nav__pp-col">
            <div className="ds-nav__pp-eyebrow">// enterprise ai platform</div>
            <HeadLink {...PLATFORM_HEAD} />
            <div className="ds-nav__pp-list">
              {PLATFORM_CAPS.map((l) => (
                <a key={l.label} className="ds-nav__pp-link" href={l.href}>
                  <span className={`ds-nav__pp-glyph ds-nav__pp-glyph--${l.glyph}`} aria-hidden="true"><i /></span>
                  <span className="ds-nav__pp-label">{l.label}</span>
                  {l.chip ? <Chip text={l.chip} tone={l.chipTone} /> : null}
                </a>
              ))}
            </div>
          </div>
          <div className="ds-nav__pp-col">
            <div className="ds-nav__pp-eyebrow">// ai catalog</div>
            <HeadLink {...CATALOG_HEAD} />
            <div className="ds-nav__pp-list">
              {CATALOG_ROWS.map((l) => (
                <a key={l.label} className="ds-nav__pp-link ds-nav__pp-link--row" href={l.href}>
                  <span className="ds-nav__pp-label">{l.label}</span>
                  <span className="ds-nav__pp-count">{l.count}</span>
                </a>
              ))}
            </div>
          </div>
          <div className="ds-nav__pp-col ds-nav__pp-col--services">
            <div className="ds-nav__pp-eyebrow">// ai delivery</div>
            <HeadLink {...SERVICES_HEAD} />
            <div className="ds-nav__pp-list">
              {SERVICE_ROWS.map((l) => (
                <a key={l.label} className="ds-nav__pp-link ds-nav__pp-link--svc" href={l.href}>
                  <span className="ds-nav__pp-svc-top"><span className="ds-nav__pp-label">{l.label}</span>{l.chip ? <Chip text={l.chip} tone={l.chipTone} /> : null}</span>
                  <span className="ds-nav__pp-desc">{l.desc}</span>
                </a>
              ))}
            </div>
            <a className="ds-nav__pp-pricing" href={PRICING.href}>
              <span className="ds-nav__pp-pricing-t">{PRICING.label}<span className="ds-nav__pp-arrow" aria-hidden="true">↗</span></span>
              <span className="ds-nav__pp-desc">{PRICING.desc}</span>
            </a>
          </div>
          <div className="ds-nav__pp-col ds-nav__pp-col--feat">
            <div className="ds-nav__pp-eyebrow">// featured</div>
            <a className="ds-nav__pp-feat" href={FEATURED.href}>
              <span className="ds-nav__pp-feat-v">{FEATURED.stat}</span>
              <span className="ds-nav__pp-feat-k">{FEATURED.statKey}</span>
              <span className="ds-nav__pp-feat-rule" aria-hidden="true" />
              <span className="ds-nav__pp-feat-tag">{FEATURED.tag}</span>
              <span className="ds-nav__pp-feat-d">{FEATURED.desc}</span>
              <span className="ds-nav__pp-feat-link">{FEATURED.cta}</span>
            </a>
          </div>
        </div>
      </div>

      {}
      <div id={`${uid}-solutions`} role="region" aria-label="Solutions" aria-hidden={open !== "solutions"}
        ref={(el) => { viewRefs.current.solutions = el; }}
        className={`ds-nav__panel ds-nav__panel--solutions${viewCls("solutions")}`}>
        <div className="ds-nav__sol">
          {}
          <div className="ds-nav__sol-rail">
            <div className="ds-nav__pp-eyebrow">// solutions</div>
            {SOL_TABS.map((t, i) => (
              <button
                key={t.name}
                type="button"
                className={`ds-nav__sol-tab${i === sol ? " is-on" : ""}`}
                onMouseEnter={() => setSol(i)}
                onFocus={() => setSol(i)}
              >
                <span className="ds-nav__sol-dot" aria-hidden="true" />
                <span className="ds-nav__sol-tabtext">
                  <span className="ds-nav__sol-tabname">{t.name}</span>
                  <span className="ds-nav__sol-tabsub">{t.sub}</span>
                </span>
                <span className="ds-nav__sol-count">{t.count}</span>
                <span className="ds-nav__sol-chev" aria-hidden="true">→</span>
              </button>
            ))}
            <div className="ds-nav__sol-svc">
              <div className="ds-nav__pp-eyebrow">// ai platform services</div>
              {SOL_SERVICES.map((x) => (
                <a
                  key={x.label}
                  className={`ds-nav__sol-svclink${sol === x.tab ? " is-on" : ""}`}
                  href={x.href}
                  onMouseEnter={() => setSol(x.tab)}
                  onFocus={() => setSol(x.tab)}
                >
                  <span className="ds-nav__sol-sq" aria-hidden="true" />
                  <span className="ds-nav__sol-tabtext">
                    <span className="ds-nav__sol-tabname">{x.label}</span>
                    <span className="ds-nav__sol-tabsub">{x.sub}</span>
                  </span>
                  <Chip text={x.chip} tone="blue" />
                </a>
              ))}
            </div>
            <div className="ds-nav__sol-foot">
              <a className="ds-nav__sol-all" href="/catalog"><span>Browse the full AI catalog</span><span aria-hidden="true">↗</span></a>
              <a className="ds-nav__sol-all" href="/solutions"><span>See all solutions</span><span aria-hidden="true">↗</span></a>
            </div>
          </div>

          {}
          <div className="ds-nav__sol-items">
            <div className="ds-nav__sol-head">
              <span className="ds-nav__pp-eyebrow">{SOL_ALL[sol].kicker}</span>
              <span className="ds-nav__sol-desc">{SOL_ALL[sol].desc}</span>
            </div>
            <div className="ds-nav__sol-grid">
              {SOL_ALL[sol].items.map((it) => (
                <a key={it.name} className="ds-nav__mitem ds-nav__sol-row" href={it.href}>
                  <span className="ds-nav__icobox">{it.icon}</span>
                  <span className="ds-nav__sol-rowtext">
                    <span className="ds-nav__mt">{it.name}{it.tag ? <span className="ds-nav__tag">{it.tag}</span> : null}</span>
                    <span className="ds-nav__md">{it.sub}</span>
                  </span>
                </a>
              ))}
            </div>
          </div>

          {}
          <div className="ds-nav__sol-feat">
            <div className="ds-nav__pp-eyebrow">// featured</div>
            <a className="ds-nav__promo" href={SOL_ALL[sol].promo.href}>
              <span className="ds-nav__promo-badge"><span className="ds-nav__promo-pulse" aria-hidden="true" />{SOL_ALL[sol].promo.badge}</span>
              <span className="ds-nav__promo-title">{SOL_ALL[sol].promo.title}</span>
              <span className="ds-nav__promo-desc">{SOL_ALL[sol].promo.desc}</span>
              <span className="ds-nav__promo-cta">{SOL_ALL[sol].promo.cta} →</span>
            </a>
            <div className="ds-nav__sol-hires">
              <div className="ds-nav__pp-eyebrow">// high-intent hire</div>
              {SOL_HIRES.map((h) => (
                <a key={h.name} className="ds-nav__sol-hire" href={h.href}>
                  <span className="ds-nav__sol-hiretick" aria-hidden="true">$</span>
                  <span className="ds-nav__sol-hirename">{h.name}</span>
                  <span className="ds-nav__sol-count">{h.count}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {}
      <div id={`${uid}-resources`} role="region" aria-label="Resources" aria-hidden={open !== "resources"}
        ref={(el) => { viewRefs.current.resources = el; }}
        className={`ds-nav__panel ds-nav__panel--resources${viewCls("resources")}`}>
        {}
        <div className="ds-nav__pp ds-nav__pp--2">
          <div className="ds-nav__pp-col">
            <div className="ds-nav__pp-eyebrow">// resources</div>
            <HeadLink label="Resources" desc="Guides, playbooks and engineering intel" href={HUB.resources} />
            <div className="ds-nav__pp-list">
              {RESOURCES.map((r) => (
                <a key={r.title} className="ds-nav__pp-link ds-nav__pp-link--svc ds-nav__pp-link--ico" href={r.href}>
                  <span className="ds-nav__icobox ds-nav__icobox--light">{r.icon}</span>
                  <span className="ds-nav__pp-ico-text">
                    <span className="ds-nav__pp-svc-top"><span className="ds-nav__pp-label">{r.title}</span></span>
                    <span className="ds-nav__pp-desc">{r.desc}</span>
                  </span>
                </a>
              ))}
            </div>
          </div>
          <div className="ds-nav__pp-col ds-nav__pp-col--last">
            <div className="ds-nav__pp-eyebrow">// tools & research</div>
            <div className="ds-nav__pp-list">
              {TOOLS_RESEARCH.map((t) => (
                <a key={t.title} className="ds-nav__pp-link ds-nav__pp-link--svc" href={t.href}>
                  <span className="ds-nav__pp-svc-top"><span className="ds-nav__pp-label">{t.title}</span></span>
                  <span className="ds-nav__pp-desc">{t.desc}</span>
                </a>
              ))}
            </div>
            {}
            <div className="ds-nav__pp-eyebrow ds-nav__pp-eyebrow--feat">// featured</div>
            <a className="ds-nav__promo ds-nav__promo--sm" href={RES_FEATURED.href}>
              <span className="ds-nav__promo-badge"><span className="ds-nav__promo-pulse" aria-hidden="true" />{RES_FEATURED.badge}</span>
              <span className="ds-nav__promo-title">{RES_FEATURED.title}</span>
              <span className="ds-nav__promo-desc">{RES_FEATURED.desc}</span>
              <span className="ds-nav__promo-cta">{RES_FEATURED.cta} →</span>
            </a>
          </div>
        </div>
      </div>

      {}
      <div id={`${uid}-company`} role="region" aria-label="Company" aria-hidden={open !== "company"}
        ref={(el) => { viewRefs.current.company = el; }}
        className={`ds-nav__panel ds-nav__panel--company${viewCls("company")}`}>
        <div className="ds-nav__grid ds-nav__grid--2">
          <div className="ds-nav__pcol-divide">
            <div className="ds-nav__col-h">// company</div>
            {COMPANY.map((c) => <Simple key={c.label} {...c} />)}
          </div>
          <div>
            <div className="ds-nav__col-h">// trust & security</div>
            {TRUST.map((t) => <Simple key={t.label} {...t} />)}
          </div>
        </div>
      </div>

      </div>
      </div>
      <div className={`ds-nav__bubble-arrow${open === "platform" || open === "solutions" || open === "resources" ? " ds-nav__bubble-arrow--light" : ""}`} ref={arrowRef} aria-hidden="true" />
      </div>

      {}
      <div className={`ds-nav__mobile${mobile ? " is-open" : ""}`}>
        <ul className="ds-nav__mlist">
          {SECTIONS.map((s, i) => (
            <Fragment key={s}>
            {entPrimary && s === "company" ? (
              <li className="ds-nav__mgroup">
                <a className="ds-nav__mrow" href={pricingHref}>
                  <span className="ds-nav__mnum">{pad(i)}</span>
                  <span className="ds-nav__mlabel">Pricing</span>
                  <span className="ds-nav__mcaret">{CaretRight}</span>
                </a>
              </li>
            ) : null}
            <li className={`ds-nav__mgroup${s === "platform" ? " ds-nav__mgroup--platform" : ""}${s === "platform" || s === "solutions" || s === "resources" ? " ds-nav__mgroup--light" : ""}${msec === s ? " is-open" : ""}`}>
              <button
                type="button"
                className="ds-nav__mrow"
                aria-expanded={msec === s}
                aria-controls={`${uid}-m-${s}`}
                onClick={() => setMsec((o) => (o === s ? null : s))}
              >
                <span className="ds-nav__mnum">{pad(entPrimary && s === "company" ? i + 1 : i)}</span>
                <span className="ds-nav__mlabel">{LABELS[s]}</span>
                <svg className="ds-nav__mcaret" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
              </button>
              <div id={`${uid}-m-${s}`} className="ds-nav__msub" role="region" aria-label={LABELS[s]}>
                {s === "platform" ? (
                  <div className="ds-nav__mpp">
                    <div className="ds-nav__mpp-sec">
                      <div className="ds-nav__pp-eyebrow">// enterprise ai platform</div>
                      <HeadLink {...PLATFORM_HEAD} />
                      <div className="ds-nav__mpp-rows">
                        {PLATFORM_CAPS.map((l) => (
                          <a key={l.label} className="ds-nav__mpp-row" href={l.href}>
                            <span className="ds-nav__pp-label">{l.label}</span>
                            {l.chip ? <Chip text={l.chip} tone={l.chipTone} /> : null}
                          </a>
                        ))}
                      </div>
                    </div>
                    <div className="ds-nav__mpp-sec">
                      <div className="ds-nav__pp-eyebrow">// ai delivery</div>
                      <HeadLink {...SERVICES_HEAD} />
                      <div className="ds-nav__mpp-rows">
                        {SERVICE_ROWS.map((l) => (
                          <a key={l.label} className="ds-nav__mpp-row" href={l.href}>
                            <span className="ds-nav__pp-label">{l.label}</span>
                            {l.chip ? <Chip text={l.chip} tone={l.chipTone} /> : null}
                          </a>
                        ))}
                      </div>
                    </div>
                    <div className="ds-nav__mpp-sec">
                      <div className="ds-nav__pp-eyebrow">// ai catalog</div>
                      <button
                        type="button"
                        className={`ds-nav__mpp-cat${mcat ? " is-open" : ""}`}
                        aria-expanded={mcat}
                        aria-controls={`${uid}-m-catalog`}
                        onClick={() => setMcat((c) => !c)}
                      >
                        <span className="ds-nav__mpp-cat-t">{CATALOG_HEAD.label}<span className="ds-nav__mpp-cat-n">{CATALOG_TOTAL} records</span><span className="ds-nav__mpp-cat-caret" aria-hidden="true">{CaretRight}</span></span>
                        <span className="ds-nav__pp-head-d">{CATALOG_HEAD.desc}</span>
                      </button>
                      <div id={`${uid}-m-catalog`} className="ds-nav__mpp-rows ds-nav__mpp-rows--cat" hidden={!mcat}>
                        <a className="ds-nav__mpp-row" href={CATALOG_HEAD.href}><span className="ds-nav__pp-label">All records</span><span className="ds-nav__pp-count">{CATALOG_TOTAL}</span></a>
                        {CATALOG_ROWS.map((l) => (
                          <a key={l.label} className="ds-nav__mpp-row" href={l.href}>
                            <span className="ds-nav__pp-label">{l.label}</span>
                            <span className="ds-nav__pp-count">{l.count}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                    <div className="ds-nav__mpp-sec ds-nav__mpp-sec--pricing">
                      <a className="ds-nav__pp-pricing" href={PRICING.href}>
                        <span className="ds-nav__pp-pricing-t">{PRICING.label}<span className="ds-nav__pp-arrow" aria-hidden="true">↗</span></span>
                        <span className="ds-nav__pp-desc">{PRICING.desc}</span>
                      </a>
                    </div>
                  </div>
                ) : null}
                {s === "solutions" || s === "resources" ? (
                  <div className="ds-nav__mpp ds-nav__mpp--list">
                    {MOBILE_NAV[s].map((g) => (
                      <div key={g.heading} className="ds-nav__mpp-sec">
                        <div className="ds-nav__pp-eyebrow">// {g.heading}</div>
                        <div className="ds-nav__mpp-rows">
                          {g.items.map((it) => (
                            <a key={it.href + it.label} className="ds-nav__mpp-row" href={it.href}><span className="ds-nav__pp-label">{it.label}</span></a>
                          ))}
                        </div>
                      </div>
                    ))}
                    <div className="ds-nav__mpp-sec ds-nav__mpp-sec--all">
                      <a className="ds-nav__mpp-all" href={HUB[s]}>See all {LABELS[s]} {CaretRight}</a>
                    </div>
                  </div>
                ) : (
                  MOBILE_NAV[s].map((g) => (
                    <div key={g.heading} className="ds-nav__msub-group">
                      <div className="ds-nav__msub-h">// {g.heading}</div>
                      {g.items.map((it) => (
                        <a key={it.href + it.label} className="ds-nav__msub-link" href={it.href}>{it.label}{it.ext ? ExtArrow : null}</a>
                      ))}
                    </div>
                  ))
                )}
                {s === "platform" || s === "solutions" || s === "resources" ? null : <a className="ds-nav__msub-all" href={HUB[s]}>See all {LABELS[s]} {CaretRight}</a>}
              </div>
            </li>
            </Fragment>
          ))}
          {flagOn && meView ? (
            <li className={`ds-nav__mgroup${msec === "account" ? " is-open" : ""}`}>
              <button
                type="button"
                className="ds-nav__mrow"
                aria-expanded={msec === "account"}
                aria-controls={`${uid}-m-account`}
                onClick={() => setMsec((o) => (o === "account" ? null : "account"))}
              >
                <span className="ds-nav__mnum">{pad(SECTIONS.length + (entPrimary ? 1 : 0))}</span>
                <span className="ds-nav__mlabel">Account</span>
                <svg className="ds-nav__mcaret" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
              </button>
              <div id={`${uid}-m-account`} className="ds-nav__msub" role="region" aria-label="Account">
                <div className="ds-nav__macct-id">
                  <Avatar me={meView} className="ds-nav__avatar" />
                  <span className="ds-nav__acct-meta">
                    <span className="ds-nav__acct-name">{meView.name}</span>
                    <span className="ds-nav__acct-email">{meView.email}</span>
                  </span>
                </div>
                <div className="ds-nav__msub-group">
                  <div className="ds-nav__msub-h">// account</div>
                  {ACCOUNT_LINKS.map((l, i) => (
                    <a key={l.label} className="ds-nav__msub-link" href={l.href}>
                      <span className="ds-nav__mnum">{pad(i)}</span> {l.label}
                    </a>
                  ))}
                  <button type="button" className="ds-nav__msub-link ds-nav__msub-out" onClick={signOut}>
                    <span className="ds-nav__mnum">→</span> Sign out
                  </button>
                </div>
              </div>
            </li>
          ) : null}
        </ul>
        <div className="ds-nav__mcta">
          <a className="ds-nav__cta" href={ctaDest}>{ctaText} →</a>
          <a className="ds-nav__ghost" href={salesHref}>{salesLabel}</a>
          {flagOn && meView ? null : <a className="ds-nav__mlogin" href={loginDest}>{loginText}</a>}
        </div>
        <div className="ds-nav__mstatus">
          <span className="ds-nav__dot" aria-hidden="true" />
          ALL SYSTEMS OPERATIONAL
        </div>
      </div>
    </div>
  );
}
