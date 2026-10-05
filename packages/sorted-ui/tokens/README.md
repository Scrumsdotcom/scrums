# Sorted UI — design tokens

Sorted UI is the design system of Scrums.com. This folder holds its design tokens as data files. The React components are in [`../src`](../src).

- **See the design system:** [scrums.com/company/sorted-ui](https://www.scrums.com/company/sorted-ui)
- **Use the React components:** [`@scrums/sorted-ui`](https://www.npmjs.com/package/@scrums/sorted-ui) on npm

> **Early release.** Token names and values can change between releases.

## Files

| File | Format | Use it for |
|---|---|---|
| [`design-tokens.json`](design-tokens.json) | W3C design tokens (JSON) | Design tools, token pipelines (for example Style Dictionary), Figma imports. |
| [`system.json`](system.json) | JSON | The structure and rules of the system: type families, spacing, radius, materials, grid, motion, component inventory, voice, and dos and don'ts. Values reference `design-tokens.json`. Give it to an agent that builds Scrums.com UI. |
| [`../src/tokens/tokens.css`](../src/tokens/tokens.css) | CSS custom properties | Any web page. `@scrums/sorted-ui` ships it as `dist/tokens/tokens.css`. |

## Use the tokens in CSS

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@scrums/sorted-ui/dist/tokens/tokens.css">
```

Or, with the npm package:

```tsx
import "@scrums/sorted-ui/tokens/tokens.css";
```

Then use the variables:

```css
.panel {
  background: var(--paper);
  border: var(--border-hairline);
  border-radius: var(--r);
  font-family: var(--font-primary);
  color: var(--ink-1);
}
```

## The register

Every Sorted UI surface follows these rules:

1. **One accent.** Blue (`--blue`, `#135BFF`) is the only accent color.
2. **One status green.** `--live` appears only on the live-status dot.
3. **Mono first.** IBM Plex Mono is the primary face (`--font-primary`).
4. **Square corners.** The maximum radius is 3px (`--r`).
5. **No shadows.** Elevation uses a 2px blue top edge and a hairline border.
6. **Hairline grids.** Panels share 1px gridlines (`--hair-*`).
7. **Mechanical motion.** Transitions are 120–200ms. Reduced motion is respected.

## License

The tokens are [MIT](../LICENSE). The Scrums.com name, logo, Sudo and the Sorted mark are not covered. See [`TRADEMARKS.md`](../TRADEMARKS.md).
