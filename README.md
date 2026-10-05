<p align="center">
  <a href="https://www.scrums.com">
    <img src="docs/favicon.png" height="96" alt="Scrums.com">
    <h3 align="center">Scrums.com</h3>
  </a>
</p>

<p align="center">
  Software Engineering. Sorted.
</p>

<p align="center">
  <a href="https://www.scrums.com/docs"><strong>Documentation</strong></a> ·
  <a href="https://www.scrums.com/docs/changelog"><strong>Changelog</strong></a> ·
  <a href="https://www.scrums.com/platform"><strong>Platform</strong></a> ·
  <a href="https://www.scrums.com/catalog"><strong>Catalog</strong></a> ·
  <a href="https://www.scrums.com/docs/cli/introduction"><strong>CLI</strong></a>
</p>

<p align="center">
  <a href="https://www.scrums.com"><img alt="Website" src="https://img.shields.io/badge/website-scrums.com-0b5cff"></a>
  <a href="https://www.scrums.com/docs"><img alt="Docs" src="https://img.shields.io/badge/docs-scrums.com%2Fdocs-0b5cff"></a>
  <a href="LICENSE"><img alt="License" src="https://img.shields.io/github/license/Scrumsdotcom/scrums"></a>
  <a href="https://x.com/scrumsdotcom"><img alt="X" src="https://img.shields.io/badge/follow-%40scrumsdotcom-000000?logo=x"></a>
</p>
<br/>

## Scrums.com

Scrums.com is the enterprise AI platform for software engineering. Engineering leaders use it to deploy AI agents, models, AI engineers and infrastructure from one catalog, then govern and measure all of it on one platform.

SEOP is the architecture of the Scrums.com platform: one control plane for AI agents, models, engineers and infrastructure.

## What is in this repository

| Path | Contents |
|---|---|
| [`docs/`](docs) | Source of the Scrums.com documentation at [scrums.com/docs](https://www.scrums.com/docs), built with [Mintlify](https://mintlify.com). |
| [`packages/sorted-ui/`](packages/sorted-ui) | Source of [`@scrums/sorted-ui`](https://www.npmjs.com/package/@scrums/sorted-ui), the Sorted UI React components and design tokens. |

## Documentation

For guides, the API reference and the CLI, see the [documentation](https://www.scrums.com/docs).

To preview the documentation locally:

```bash
npm i -g mint
cd docs
mint dev
```

## Releases

We publish a release on the 1st of each month. The tag format is `vYYYY.MM`.
Each release lists the pull requests that merged in that month.
See [Releases](https://github.com/Scrumsdotcom/scrums/releases).
For changes to the platform, see the [changelog](https://www.scrums.com/docs/changelog).

## Contributing

Read [`docs/AGENTS.md`](docs/AGENTS.md) before you change a page. It applies to people and to coding agents. To suggest a change, open an [issue](https://github.com/Scrumsdotcom/scrums/issues) or a pull request.

## Security

To report a vulnerability, see [`SECURITY.md`](.github/SECURITY.md).

## License

[Apache 2.0](LICENSE), except [`packages/sorted-ui/`](packages/sorted-ui), which is [MIT](packages/sorted-ui/LICENSE). The Scrums.com name and logo are trademarks and are not licensed. See [`packages/sorted-ui/TRADEMARKS.md`](packages/sorted-ui/TRADEMARKS.md).
