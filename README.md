# JosephPay

Production-oriented JosephPay fintech backend built with NestJS, TypeScript, PostgreSQL, Prisma, JWT authentication, Zod validation, Swagger, and Resend email delivery.

> **Status:** Active development. The repository currently contains authentication, user, profile, wallet, wallet funding, email-verification, KYC, wallet-balance, ledger, transaction, transfer, and standalone webhook functionality. Financial provider integrations remain limited and should not yet be treated as production-ready.

## Technology stack

- Node.js and TypeScript
- NestJS and Express
- PostgreSQL and Prisma ORM
- JWT authentication with HTTP-only cookies
- Zod request validation
- Swagger/OpenAPI documentation
- Jest and Supertest testing
- Resend email delivery
- RabbitMQ integration groundwork

## Current functionality

Implemented API areas include:

- User registration and authenticated profile retrieval
- Login with access and refresh tokens stored in HTTP-only cookies
- Email verification and verification-email resend
- User profile retrieval
- NGN and USD wallet creation
- Per-currency wallet balances backed by ledger accounts
- Double-entry ledger posting for wallet transfers
- Atomic, idempotent user-to-user transfers with row-level balance locking
- Wallet funding initialization through a payment provider
- Provider-agnostic webhook intake with signature verification and duplicate delivery handling
- Transaction history listing and individual transaction retrieval
- KYC submission, retrieval, and review
- Global authentication guard with public-route support
- Prisma migrations and generated Prisma client

The application also exposes a basic health endpoint at `GET /`.

## Architecture

The project follows a modular-monolith structure. Each business area is organized under `src/module`, with shared infrastructure under `src/shared`, configuration under `src/config`, Prisma under `src/lib/prisma`, and API documentation under `src/docs`.

```text
src/
├── config/              Environment schemas and validation
├── docs/                Swagger setup and response DTOs
├── lib/prisma/          Prisma schema, migrations, and database service
├── module/
│   ├── Auth/
│   ├── Kyc/
│   ├── Profile/
│   ├── User/
│   ├── Wallet/
│   ├── WalletFunding/
│   ├── Webhook/
│   ├── Ledger/
│   ├── Transaction/
│   ├── Transfer/
│   └── email-verification/
├── shared/              Guards, validation, mail, responses, and types
├── app.module.ts
└── main.ts
```

Business logic belongs in services, database access belongs in repositories, and controllers are responsible for transport concerns such as validation and response formatting.

The financial modules are split into `Wallet`, `WalletFunding`, `Ledger`, `Transaction`, and `Transfer`. Wallet funding is an application workflow, but its financial source of truth is one `Transaction` record with type `DEPOSIT`; there is no separate wallet-funding table. `Webhook` receives provider callbacks and delegates verified events to the funding workflow. Wallet creation provisions NGN and USD balances and their corresponding customer ledger accounts.

## Prerequisites

- Node.js compatible with the installed NestJS and TypeScript versions
- npm
- PostgreSQL
- A Resend account and API key for email verification
- Dojah credentials and base URL for KYC verification

RabbitMQ support is present as groundwork, but the current listener is disabled and is not required for the basic HTTP application startup.

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a local `.env` file. Never commit it:

   ```env
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=replace-with-a-local-password
   POSTGRES_DB=fintech_platform
   DATABASE_URL=postgresql://postgres:replace-with-a-local-password@db:5432/fintech_platform
   JWT_ACCESS_SECRET=replace-with-at-least-32-characters
   JWT_REFRESH_SECRET=replace-with-at-least-32-characters
   JWT_ACCESS_TTL=15m
   JWT_REFRESH_TTL=7d
   RESEND_API_KEY=re_your_api_key
   RESEND_FROM_EMAIL=no-reply@example.com
   DOJAH_SECRET_KEY=your_dojah_secret_key
   DOJAH_APP_ID=your_dojah_app_id
   DOJAH_BASE_URL=https://api.dojah.io
   PAYSTACK_SECRET_KEY=your_paystack_secret_key
   PORT=5000
   ```

   When running the API outside Docker, use `localhost` instead of `db` in
   `DATABASE_URL`.

3. Generate the Prisma client and apply development migrations:

   ```bash
   npx prisma generate --schema src/lib/prisma
   npx prisma migrate dev --schema src/lib/prisma
   ```

   Use `prisma migrate dev` locally when changing the Prisma schema. It can
   create new migration files and is intended for interactive development.

   With Docker Compose, the `db_migrate` service applies the migrations that
   are already committed to the repository before `server-dev` starts. Run:

   ```bash
   docker compose up --build
   ```

   The Compose migration service uses `prisma migrate deploy` because startup
   should apply known migrations deterministically. It should not create new
   migrations or modify the schema interactively. Use `prisma migrate dev`
   outside Compose when a schema change needs to be developed.

4. Provision the system ledger accounts required for Paystack wallet funding:

   ```bash
   npm run prisma:seed-system-accounts
   ```

   This idempotently creates the `PAYSTACK_CLEARING_NGN` and
   `PAYSTACK_CLEARING_USD` system ledger accounts. These are ledger accounts,
   not customer wallets, and they must exist before a successful funding
   webhook can post its double-entry transaction.

5. Start the development server:

   ```bash
   npm run start:dev
   ```

The API is available at `http://localhost:5000` by default. The port can be changed with `PORT`.

## Production database migrations

Production deployments should run migrations once as a deployment step before
starting or updating API instances:

```bash
npx prisma migrate deploy --schema src/lib/prisma
```

Do not run `prisma migrate dev` in production, and do not run migrations
independently in every API replica. `migrate deploy` only applies committed
migrations and is safe for a non-interactive deployment job.

The current `production` Dockerfile stage contains the compiled application,
but does not include the Prisma migration files or the Prisma CLI. Run the
production migration command from a dedicated migration image/stage, or update
the deployment image to include those artifacts. Keep the API image and the
one-time migration job separate so application replicas do not race to migrate.

For production, prefer a managed PostgreSQL database with backups, restricted
network access, monitoring, and recovery procedures. The PostgreSQL service in
`compose.yaml` is intended primarily for local development and controlled
self-hosting.

## API documentation

API routes use the `/api/v1` version prefix. Swagger UI is available at:

```text
http://localhost:5000/docs
```

Current routes include:

| Area     | Method | Route                               | Authentication |
| -------- | ------ | ----------------------------------- | -------------- |
| Health   | GET    | `/`                                 | Public         |
| Auth     | POST   | `/api/v1/auth/login`                | Public         |
| Users    | POST   | `/api/v1/users`                     | Public         |
| Users    | POST   | `/api/v1/users/verify-email`        | Public         |
| Users    | POST   | `/api/v1/users/resend-verification` | Public         |
| Users    | GET    | `/api/v1/users`                     | Required       |
| Profiles | GET    | `/api/v1/users/profile`             | Required       |
| Wallets  | POST   | `/api/v1/wallet`                    | Required       |
| Wallet funding | POST | `/api/v1/wallet/fund`          | Required       |
| Transfers | POST  | `/api/v1/transfers`                 | Required       |
| Transactions | GET | `/api/v1/transactions`              | Required       |
| Transactions | GET | `/api/v1/transactions/:transactionId` | Required     |
| Webhooks | POST | `/api/v1/webhooks`                    | Provider signature |
| KYC      | POST   | `/api/v1/kyc/:userId`               | Required       |
| KYC      | GET    | `/api/v1/kyc/:userId`               | Required       |
| KYC      | PATCH  | `/api/v1/kyc/:userId/review`        | Required       |

Successful responses follow this shape:

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {}
}
```

Errors follow this shape:

```json
{
  "success": false,
  "message": "A safe, user-facing error message",
  "code": "ERROR_CODE",
  "errors": []
}
```

Authentication cookies are HTTP-only. Swagger is configured to send credentials when testing protected endpoints.

### Transfers and transactions

Transfers move funds between two users' wallet balances in the requested currency. The request amount must be a positive integer string representing the smallest currency unit, for example `10050` for ₦100.50. Each transfer requires an idempotency key; repeating the same request for the same authenticated user returns the existing transaction instead of processing it again.

Example request:

```json
{
  "destinationUserId": "9d8c7b6a-5f4e-4321-9012-345678901234",
  "currency": "NGN",
  "amount": "10050",
  "idempotencyKey": "send-2026-09-27-001"
}
```

Transfer processing runs inside one database transaction. It locks both wallet balances in a deterministic order, creates a transaction record, posts matching debit and credit ledger entries, updates the cached balances, and marks the transaction successful. A transfer fails when the destination or currency balance is missing, the sender has insufficient funds, the amount is invalid, or the source and destination users are the same.

Transaction amounts and ledger-entry amounts are serialized as strings in API responses because they are stored as PostgreSQL `BIGINT` values.

### Wallet funding and webhooks

Wallet funding is initiated with `POST /api/v1/wallet/fund`. The request requires an idempotency key and creates one `DEPOSIT` transaction. The response contains the transaction reference and provider checkout details when available.

Example request:

```json
{
  "amount": "2500000",
  "currency": "NGN",
  "customerEmail": "customer@example.com",
  "provider": "PAYSTACK",
  "idempotencyKey": "funding-request-123"
}
```

The transaction starts in `PROCESSING` and is only marked `SUCCESS` after the provider webhook is signature-verified and the payment amount and currency are verified. Ledger entries and the wallet balance are updated atomically. Repeated funding requests with the same idempotency key return the original transaction.

Paystack wallet funding uses amounts in the smallest currency unit. The
Paystack `charge.success` webhook must contain the same provider reference,
amount, and currency as the initialized transaction. The funding workflow
posts a debit to the matching Paystack system ledger account and a credit to
the customer wallet ledger account. The transaction row is locked while the
ledger posting is performed so concurrent webhook deliveries cannot post the
same funding twice.

All payment providers send callbacks to the single public endpoint `POST /api/v1/webhooks`. The webhook module identifies the provider from provider-specific signature headers, verifies the raw request body, persists the webhook event for deduplication, and delegates payment settlement to the wallet-funding workflow. Webhook controllers do not accept provider identity from the request body.

For Paystack, configure the webhook URL as:

```text
POST /api/v1/webhooks
Header: x-paystack-signature: <Paystack HMAC-SHA512 signature>
```

The endpoint is public but rejects requests with an invalid signature. Repeated
events are acknowledged as duplicates and do not create additional ledger
entries.

## Database and money-handling rules

- PostgreSQL is the source of truth.
- IDs are UUIDs and database fields use snake_case mappings.
- Wallets contain one `WalletBalance` per supported currency, and each balance is linked to a customer `LedgerAccount`.
- `Transaction` records describe financial operations and payment-provider state, while `LedgerEntry` records provide the debit and credit postings for each operation.
- Wallet funding does not have a second financial table; one funding request maps to one `Transaction`.
- Monetary values are stored as integers in the smallest currency unit; floating-point arithmetic must not be used for money.
- Wallet balances are cached values and must only change as part of a financial transaction.
- Financial movements use atomic database transactions and double-entry ledger entries.
- Ledger entries and audit records must be immutable.
- Financial endpoints must support idempotency and return the original result for duplicate requests.
- Financial data must not be cascade-deleted.
- Wallet balances cannot become negative.
- Users cannot withdraw until KYC is verified.

The wallet-ledger schema is applied through the Prisma migration `20260927110000_wallet_ledger_refactor`. During development, generate the client and apply development migrations with:

```bash
npx prisma generate --schema src/lib/prisma
npx prisma migrate dev --schema src/lib/prisma
npm run prisma:seed-system-accounts
```

For the project's detailed standards, see [API_GUIDELINES.md](API_GUIDELINES.md), [BUSINESS_RULES.md](BUSINESS_RULES.md), [DATABASE_GUIDELINES.md](DATABASE_GUIDELINES.md), and [AGENTS.md](AGENTS.md).

## Development commands

```bash
npm run start:dev   # Start in watch mode
npm run build       # Compile the application
npm run start:prod  # Start the compiled application
npm run prisma:seed-system-accounts # Build and seed Paystack system accounts
npm run test        # Run unit tests
npm run test:e2e    # Run end-to-end tests
npm run test:cov    # Generate coverage
npm run lint        # Run ESLint with safe fixes
npm run format      # Format source and test TypeScript files
```

Run tests after changes to services, validation, authentication, database access, or request handling. Financial workflows should include transaction, idempotency, rollback, and balance-integrity tests as they are introduced.

## Security and configuration

- Keep `.env` and all credentials outside version control.
- Use strong, unique JWT secrets of at least 32 characters.
- Do not expose database errors, secrets, password hashes, OTPs, or provider credentials in API responses or logs.
- Validate request bodies, parameters, queries, and headers at the application boundary.
- External providers must be verified, persisted, retried safely, and logged with correlation context.

## Roadmap

Planned areas include:

- Withdrawals, refunds, and settlements with the same ledger and idempotency guarantees
- Idempotent funding, withdrawals, refunds, and settlements
- Refresh-token session management and revocation
- Role-based access control and administrative workflows
- Queue-based webhook processing and additional payment-provider adapters
- Notifications and provider integrations
- Immutable audit logging
- Production Docker, RabbitMQ, Redis, BullMQ, CI/CD, rate limiting, Helmet, and operational observability

## Documentation maintenance

Update this README whenever a module, route, environment variable, migration workflow, payment provider, or operational dependency changes. Each new financial feature should document its endpoint, authentication, idempotency behavior, transaction type, ledger effect, webhook behavior, and response shape. Keep Swagger DTOs and this README synchronized.
