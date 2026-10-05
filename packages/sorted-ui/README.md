# @scrums/sorted-ui

Sorted UI is the React component library behind the Scrums.com interface.
It follows one design register: one blue (`#135BFF`), IBM Plex Mono as the
primary face, a 3px maximum radius, no shadows, and hairline grids.

See the design system at [scrums.com/company/sorted-ui](https://www.scrums.com/company/sorted-ui).

> **Early release (0.x).** Component APIs can change between minor versions.

## Install

```sh
npm install @scrums/sorted-ui
```

Peer dependencies: `react` and `react-dom` 18 or later.

## Use

Load the design tokens once, then import components:

```tsx
import "@scrums/sorted-ui/tokens/tokens.css";
import { Button, Hero, Footer } from "@scrums/sorted-ui";
```

Each component imports its own stylesheet. Use a bundler that handles CSS
imports (Vite, Next.js, webpack, esbuild, and similar).

## Components

- **Chrome:** NavBar, NotificationBar, Footer, Breadcrumb
- **Sections:** Hero, Stats, FeatureCards, Faq, Pricing, Testimonials,
  LogoStrip, ProcessTimeline, CapabilityMatrix, ComparisonTable,
  CaseStudyGrid, IntegrationsGrid, BlogList, ContactForm, ContentBody
- **Content:** ArticleHeader, RelatedArticles
- **Calls to action:** CtaCentered, CtaCommandStrip
- **Catalog and telemetry:** OperatorResultCard, PrimitiveSelectorCard,
  TelemetryTable, StatStrip, SegmentedMeter, StatusDot, SectionLabel,
  CommitRail, IncludedList, FacetGroup, FilterChip, FilterDrawer,
  SortControl, LoadMore
- **Primitives:** Button

The package also exports other components. The type declarations list every export.

## License

The code is MIT (see `LICENSE`).
The Scrums.com name, logo, Sudo and the Sorted mark are not covered by the MIT
licence. Forks must use a different name (see `TRADEMARKS.md`).
