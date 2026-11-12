# Architectural & Implementation Decisions (`docs/DECISIONS.md`)

This log tracks architectural and technical decisions made during the development of the EduTrio API server.

---

### DEC-001: Fastify Adapter with NestJS 10
- **Context**: High throughput requirements (<150ms p95 on dashboard, <300ms on payments).
- **Decision**: Used `@nestjs/platform-fastify` with Fastify 4.28+ over Express for 2x higher raw HTTP throughput, lower latency, and native JSON parsing performance.
- **Consequences**: Standard Express middlewares (like `req.user` mutating patterns) replaced by NestJS Guards and Fastify plugins (`@fastify/helmet`, `@fastify/cors`, `@fastify/multipart`).

### DEC-002: Multi-Tenancy Isolation via PostgreSQL Row-Level Security (RLS)
- **Context**: Strict multi-tenant isolation required across schools.
- **Decision**: Defense in depth:
  1. Application-level repository queries always filter by `tenant_id`.
  2. PostgreSQL RLS policies applied with `current_setting('app.tenant_id')`, set via `SET LOCAL app.tenant_id` inside `TenantTx.run()`.
  3. Context passed transparently using Node.js `AsyncLocalStorage`.

### DEC-003: Prefixed ULIDs for Primary Keys
- **Context**: The contract examples use prefixed identifiers (`stu_01`, `stf_21`, `fln_01`, `ses_2627`).
- **Decision**: Implemented `IdGenerator` using `ulidx` to produce lexicographically sortable, prefixed IDs (`stu_...`, `stf_...`). Stored as `text` in Postgres.

### DEC-004: Money Representation with Decimal.js
- **Context**: Financial transactions and fee balances must never suffer floating-point roundoff issues.
- **Decision**: All fee amounts stored as `NUMERIC(12,2)` in PostgreSQL and handled via `Money` (`Decimal.js`) in code, serialized to JSON as numbers with 2 decimal places matching contract format.

### DEC-005: Dual-Process Architecture (API vs Worker)
- **Context**: Heavy tasks (bulk imports, PDF generation, report exports, late-fee cron) must not block HTTP request latency.
- **Decision**: Packaged single codebase into two execution targets: `api` (stateless Fastify HTTP server) and `worker` (BullMQ queue consumer and repeatable schedulers).

