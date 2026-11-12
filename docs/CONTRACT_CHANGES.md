# EduTrio API Contract Changes Log (`docs/CONTRACT_CHANGES.md`)

This document records all modifications, extensions, and additions made to `api-contract.json` so the frontend and QA teams remain synchronized.

---

## [1.0.0] - Baseline Contract & Initial Extensions

### 1. Payment Gateway Webhook (`PAYMENT_WEBHOOK`)
- **Method & Path**: `POST /api/v1/fees/payments/webhook`
- **Auth**: None (Protected via webhook signature headers e.g. `X-Razorpay-Signature`).
- **Rationale**: Real-world payment gateways (Razorpay, Stripe) deliver authoritative payment success/failure callbacks asynchronously. Required for reliable idempotent transaction settlement.
- **Payload**: Raw gateway webhook payload.
- **Response**: `200 OK` with `{ success: true, data: { status: "PROCESSED" } }`.

### 2. Infrastructure Health & Liveness Endpoints
- **Endpoints**:
  - `GET /health/live`: Lightweight process liveness probe.
  - `GET /health/ready`: Dependency readiness probe inspecting PostgreSQL, Redis, and MinIO storage.
- **Auth**: Public (`auth: false`).
- **Rationale**: Standard container orchestration (Docker Compose, Kubernetes) health checking.

### 3. Server-Sent Events (SSE) Live Event Stream (`STREAM_EVENTS`)
- **Method & Path**: `GET /api/v1/stream`
- **Auth**: Bearer JWT (`auth: true`).
- **Rationale**: Real-time push of in-app bell notifications and chat thread messages without client polling overhead.

### 4. Logout Bearer Token Fallback
- **Endpoint**: `POST /api/v1/auth/logout`
- **Rationale**: While `refreshToken` body is accepted for explicit single-token revocation, the API also supports revoking the active session directly from the Bearer token when body is empty.

