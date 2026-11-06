# @scrums/nexttype-compiler

The NextType reference checker, `ntc`.
It decodes NTΔ streams (`ntd/1`), elaborates them to the NT0 core, re-checks every term in an independent kernel, evaluates closed terms, and binds each proved obligation to a SHA-256 evidence digest.

No runtime dependencies. Node.js 20 or later.

## Build and test

```sh
npm ci --ignore-scripts
npm test        # type-check, unit, property, conformance, and documentation tests
npm run fuzz    # NT_FUZZ_RUNS=20000 by default; NT_FUZZ_SEED reproduces a run
```

## Use

```console
$ ntc eval '(sum (cons 6000 (cons 6000 nil)))'
12000 : Z
$ ntc check --manifest examples/vector/manifest.json examples/vector/head.ntd
proved o0 TY f1
; evidence sha256:8254346f9828d0aea0d61d48b994516f1934cdf4cf75f3b36e8c12ad53420685
```

See [the ntc guide](../../docs/tools/ntc.md), [NTΔ shorthand](../../docs/language/shorthand.md), and the [security model](../../docs/reference/security-model.md).

## Layout

| File | Role | In the trust base |
| --- | --- | --- |
| `src/syntax.ts` | `ntd/1` decoder and canonical printer. | Yes |
| `src/core.ts` | NT0 terms and values, evaluation, conversion. | Yes |
| `src/check.ts` | `Kernel` (trusted) and `Elaborator` (untrusted; its output is re-checked). | Kernel only |
| `src/prelude.ts` | Built-in constants and their types. | Yes |
| `src/session.ts` | Manifests, digests, and stream processing. | Policy checks |
| `src/limits.ts` | Input and resource limits. | Yes |
| `src/cli.ts` | The `ntc` command. | No |
| `test/` | Unit, property, conformance, and documentation tests; the fuzzer. | — |

## License

Apache-2.0. See [LICENSE](../../../LICENSE).
