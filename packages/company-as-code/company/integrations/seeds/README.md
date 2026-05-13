# /company/integrations/seeds

Worked examples of canonical identity records — `Organization` and `Person` — that the rest of the seed manifests reference indirectly (via roles like `cfo`, `head-of-growth`, etc.).

These are reference shapes. A real instantiation would carry many more rows and live under whatever directory layout that fork chose for identity seeds (e.g. `/company/domains/finance-ops/people/`). They're parked here next to the `Integration` example because all three are coordination-layer concerns: canonical IDs + external mappings.

| File | Primitive | Purpose |
|---|---|---|
| [`ORG-COMPANY.yaml`](./ORG-COMPANY.yaml) | Organization | The root company itself, demonstrating canonical-ID + externalIds pattern |
| [`PERSON-CFO.yaml`](./PERSON-CFO.yaml) | Person | A canonical employee referenced from the finance module's contacts |
