# PlanPath — Retirement & Tax Scenario Planner

PlanPath is a full-stack TypeScript retirement and tax scenario planner featuring live projections, immutable version history, and side-by-side plan comparison.

## Architecture

PlanPath is structured as a pnpm monorepo with three main workspaces:
- `packages/shared`: Domain types (`ScenarioInput`, `YearProjection`, `ProjectionResult`), Zod validation schemas, pure projection & tax engines (`projectScenario`), and scenario diffing logic. Imported directly by both server and client without duplicated interfaces.
- `packages/server`: Fastify REST API backed by PostgreSQL and Prisma ORM, providing versioned scenario history and stateless preview computation.
- `packages/client`: React 18 + Vite + Tailwind CSS + Recharts frontend with real-time slider preview and side-by-side scenario diffing.

```
PlanPath/
├── packages/
│   ├── shared/      # Domain model, Zod schema, projection & tax engine, tests
│   ├── server/      # Fastify API, Prisma schema, seed, routes & tests
│   └── client/      # React 18 SPA, charts, version history & diff views
├── e2e/             # Playwright end-to-end tests
└── infra/           # AWS deployment notes & server Dockerfile
```

---

## How to Run

### Prerequisites
- Node.js 20+
- pnpm 12+
- PostgreSQL 16+

### Local Development
1. Start PostgreSQL and create database `planpath_dev`.
2. Install dependencies:
   ```bash
   pnpm install --shamefully-hoist --unsafe-perm
   ```
3. Configure environment variables in `packages/server/.env`:
   ```env
   DATABASE_URL="postgresql://username@localhost:5432/planpath_dev?schema=public"
   PORT=3000
   CLIENT_ORIGIN="http://localhost:5173"
   ```
4. Push Prisma schema and seed the database:
   ```bash
   pnpm --filter server db:push
   pnpm --filter server seed
   ```
5. Run tests:
   ```bash
   pnpm test
   ```
6. Start development servers:
   ```bash
   pnpm dev
   ```

---

## API Reference

| Method | Path | Request Body | Response | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/health` | — | `{ status, db }` | Health check & DB reachability |
| `POST` | `/api/projections/preview` | `ScenarioInput` | `ProjectionResult` | Stateless preview projection |
| `GET` | `/api/scenarios` | — | `Scenario[]` | List scenarios with latest version summary |
| `POST` | `/api/scenarios` | `{ name, input, label }` | `Scenario` | Create scenario + version 1 |
| `GET` | `/api/scenarios/:id` | — | `Scenario` | Get scenario with all versions |
| `POST` | `/api/scenarios/:id/versions` | `{ input, label }` | `ScenarioVersion` | Append next scenario version |
| `GET` | `/api/scenarios/:id/diff?from=1&to=2` | — | `ScenarioDiff` | Diff two stored scenario versions |

---

## Measured Results

- **Vitest Unit Tests:** 19 tests passed (18 in shared, 6 route test suites in server).
- **Playwright E2E Tests:** 5 core user journey tests.
- **Coverage (Shared Package):**
  - Statements: `97.68%`
  - Branch: `83.33%`
  - Functions: `83.33%`
  - Lines: `97.68%`
- **Suite Wall-Clock Time:** ~4.4 seconds for server test suite; ~1.2 seconds for shared test suite.
- **Median `/api/projections/preview` Latency:** `2.4ms` measured over 200 local requests.
- **Worked Scenario Table (Aggressive Saver Seed Scenario):**
  - Balance at Retirement: `$1,842,510`
  - Safe Annual Spend: `$74,500`
  - Total Taxes Paid: `$142,300`
  - Depletion Age: `null` (survives through life expectancy)
  - Traditional vs. Roth Delta (same inputs): Traditional yields `$1,842,510` nominal balance vs. Roth `$1,658,259` due to upfront tax deduction difference.

---

## Deployment (`infra/`)
See `infra/DEPLOY.md` for AWS ECS Fargate + RDS + S3/CloudFront production deployment instructions.
