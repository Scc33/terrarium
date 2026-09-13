# @terrarium/fixtures

Shared test inputs: `standardCountry` (Meridia's parameter vector), the named action scripts
the golden and property suites replay (`passive`, `fuelTaxAtQ8`, …), and the blessed golden
snapshots in `golden/`. `pnpm bless` rewrites the goldens; read `pnpm diff-state --moved-only`
first (ADR-0008).
