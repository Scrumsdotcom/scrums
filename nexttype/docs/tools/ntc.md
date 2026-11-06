---
title: The ntc reference checker
description: Build and run ntc, the reference decoder, elaborator, kernel, and evaluator for NTΔ streams and the NT0 core.
order: 2
---

# The ntc reference checker

> **Status: `ntc` 0.1.0, unreleased.**
> Build it from source. There is no published package yet.

`ntc` checks NTΔ streams against a manifest.
It decodes the stream, elaborates each fragment to NT0, re-checks it in an independent kernel, and prints one result per obligation.
It also evaluates closed terms with the reference evaluator.

`ntc` is different from [`nt`](cli.md).
`nt` is a preview script that checks the format of an obligation ledger.
`ntc` type-checks NTΔ.

## Build

`ntc` needs Node.js 20 or later.
It has no runtime dependencies.

```sh
cd nexttype/packages/compiler
npm ci --ignore-scripts
npm run build
node dist/src/cli.js version
```

Run the tests, the conformance suite, and the documentation examples:

```sh
npm test
```

## Check a stream

```console
$ ntc check --manifest examples/invoice/manifest.json examples/invoice/sum.ntd
proved o0 TY f0
; evidence sha256:c5ee1173d85575d1b4d30111b7f79c14e5a8af1a0f74b062a82e03e72a98ae2c
```

Without a manifest, pass a context:

```console
$ printf 'c0 A\nf0 (case v (cons (x _) x))\nput f0 c0 @b0\nck f0 @a0\n' | ntc check --context 'A:U0, n:N, v:V A n'
invalid o0 CASE f0
; 2:4 non-exhaustive case: add a nil branch, or give the vector a successor length
```

`--json` prints the same result as `nt-result/1` JSON:

```json
{
  "format": "nt-result/1",
  "ok": true,
  "diagnostics": [
    {
      "result": "proved",
      "code": "TY",
      "obligation": "o0",
      "fragment": "f0",
      "line": 4,
      "col": 1,
      "message": "f0 has type c0",
      "evidence": "sha256:…"
    }
  ],
  "contexts": []
}
```

## Evaluate a term

```console
$ ntc eval '(sum (cons 6000 (cons 6000 nil)))'
12000 : Z
```

`eval` infers the type, so terms that need an expected type (`lam`, `pair`, `case`) must appear inside a contract check instead.

## Other commands

| Command | Prints |
| --- | --- |
| `ntc fmt [FILE]` | The stream in canonical form: single spaces, no comments. |
| `ntc prelude` | The built-in constants, their types, and how they compute. |
| `ntc limits` | The input and resource limits. |
| `ntc version` | The checker version and the format identifiers. |

## Exit codes

| Code | Meaning |
| --- | --- |
| `0` | Every obligation is `proved`, or the command succeeded. |
| `1` | An obligation is not proved, or the input is invalid. |
| `2` | Usage error, or a file cannot be read. |

## Library

The package exports the same functions:

```typescript
import { checkStream, loadManifest } from "@scrums/nexttype-compiler";

const manifest = loadManifest(JSON.parse(manifestText));
const result = checkStream(streamText, manifest);
if (!result.ok) console.log(result.diagnostics);
```

`checkStream` never throws on bad input.
It returns diagnostics.

## Security

`ntc` reads only the files you name, opens no network connections, and starts no processes.
See [Security model](../reference/security-model.md).
