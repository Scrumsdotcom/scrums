# /company/metrics

Typed metric definitions. Every metric declares:

- owner module
- type and unit
- formula (how it is computed)
- lineage (upstream sources)
- freshness (expected lag, max lag before alert)
- thresholds (info / warning / critical)

Validate against [`/schemas/metric.schema.json`](../../schemas/metric.schema.json).

Metrics are the substrate goals are evaluated against. Stale metrics make goals lie.
