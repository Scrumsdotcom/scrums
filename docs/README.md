# Scrums.com documentation

This folder is the source of the Scrums.com documentation at https://www.scrums.com/docs. The site is built with [Mintlify](https://mintlify.com).

## Local preview

1. Install the Mintlify CLI: `npm i -g mint`.
2. Run `mint dev` in this folder. This folder contains `docs.json`.
3. Open `http://localhost:3000`.

## Entity facts

`company/entity.json` and `company/graph.json` are the canonical, machine-readable facts about Scrums.com. They are served at `/docs/company/entity.json` and `/docs/company/graph.json`. The Scrums.com team maintains them. Do not change them in a pull request; open an issue instead.

## Contributing

Read `AGENTS.md` before you change a page. It applies to people and to coding agents.
