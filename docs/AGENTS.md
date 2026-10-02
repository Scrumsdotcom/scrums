# Scrums.com docs — contributor and agent instructions

This folder is the Mintlify source for the Scrums.com documentation at https://www.scrums.com/docs.

## About this folder

- The site uses [Mintlify](https://mintlify.com/docs).
- Pages are `.mdx` files with YAML frontmatter, grouped by feature area.
- `docs.json` holds the navigation, theme and tabs.
- Images and logos go in `logo/` or a new asset folder. Every asset must be referenced by a page, `docs.json`, `style.css` or `footer-tagline.js`.
- Component reference: https://mintlify.com/docs/components

## Rules

1. **`docs.json` is the only navigation source.** Register every new page there. Do not auto-generate, reformat, reorder or "tidy" it. Change it only for intentional navigation work.
2. **Frontmatter.** Every page uses `title` and `description` frontmatter.
3. **Entity facts.** `company/entity.json` and `company/graph.json` are canonical entity facts, governed by the Scrums.com digital constitution. They are served at `/docs/company/entity.json` and `/docs/company/graph.json`. The Scrums.com team maintains them. Do not change them in a pull request.
4. **Drafts.** Put unpublished pages under `drafts/` or name them `*.draft.mdx`. `.mintignore` keeps them out of the build.
5. **Test before you push.** When you add a page or change `docs.json`, run `mint dev` and `mint broken-links` in this folder. Do not push a change that breaks the Mintlify build.
6. **No secrets.** Example keys and tokens use obvious placeholders, for example `sk_live_xxxxxxxxxxxxxxxx`. This repository is public.
7. **No agent attribution.** Do not add AI co-author trailers or "Generated with" lines to commits or pull requests.

## Style

- Use active voice and second person ("you").
- Keep sentences short. Give one idea in each sentence.
- Use sentence case for headings.
- Use bold for UI elements: click **Settings**.
- Use code format for file names, commands, paths and code references.

## Local preview

1. Install the Mintlify CLI: `npm i -g mint`.
2. Run `mint dev` in this folder.
3. Open `http://localhost:3000`.
