# JosephPay

Production-oriented JosephPay fintech backend built with NestJS, TypeScript, PostgreSQL, Prisma, JWT authentication, Zod validation, Swagger, and Resend email delivery.

> **Status:** Active development. The repository currently contains authentication, user, profile, wallet, email-verification, KYC, wallet-balance, ledger, transaction, and user-to-user transfer functionality. Withdrawals, deposits, webhooks, and other capabilities remain planned and must not yet be treated as production-ready.

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
│   └── email-verification/
├── shared/              Guards, validation, mail, responses, and types
├── app.module.ts
└── main.ts
```

Business logic belongs in services, database access belongs in repositories, and controllers are responsible for transport concerns such as validation and response formatting.

The financial modules are split into `Ledger`, `Transaction`, and `Transfer`. Wallet creation provisions NGN and USD balances and their corresponding customer ledger accounts.

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
   DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE
   JWT_ACCESS_SECRET=replace-with-at-least-32-characters
   JWT_REFRESH_SECRET=replace-with-at-least-32-characters
   JWT_ACCESS_TTL=15m
   JWT_REFRESH_TTL=7d
   RESEND_API_KEY=re_your_api_key
   RESEND_FROM_EMAIL=no-reply@example.com
   DOJAH_SECRET_KEY=your_dojah_secret_key
   DOJAH_APP_ID=your_dojah_app_id
   DOJAH_BASE_URL=https://api.dojah.io
   PORT=5000
   ```

3. Generate the Prisma client and apply development migrations:

   ```bash
   npx prisma generate --schema src/lib/prisma
   npx prisma migrate dev --schema src/lib/prisma
   ```

4. Start the development server:

   ```bash
   npm run start:dev
   ```

The API is available at `http://localhost:5000` by default. The port can be changed with `PORT`.

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
| Transfers | POST  | `/api/v1/transfers`                 | Required       |
| Transactions | GET | `/api/v1/transactions`              | Required       |
| Transactions | GET | `/api/v1/transactions/:transactionId` | Required     |
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

## Database and money-handling rules

- PostgreSQL is the source of truth.
- IDs are UUIDs and database fields use snake_case mappings.
- Wallets contain one `WalletBalance` per supported currency, and each balance is linked to a customer `LedgerAccount`.
- `Transaction` records describe financial operations, while `LedgerEntry` records provide the debit and credit postings for each operation.
- Monetary values are stored as integers in the smallest currency unit; floating-point arithmetic must not be used for money.
- Wallet balances are cached values and must only change as part of a financial transaction.
- Financial movements use atomic database transactions and double-entry ledger entries.
- Ledger entries and audit records must be immutable.
- Financial endpoints must support idempotency and return the original result for duplicate requests.
- Financial data must not be cascade-deleted.
- Wallet balances cannot become negative.
- Users cannot withdraw until KYC is verified.

The wallet-ledger schema is applied through the Prisma migration `20260927110000_wallet_ledger_refactor`. Generate the client and apply development migrations with:

```bash
npx prisma generate --schema src/lib/prisma
npx prisma migrate dev --schema src/lib/prisma
```

For the project's detailed standards, see [API_GUIDELINES.md](API_GUIDELINES.md), [BUSINESS_RULES.md](BUSINESS_RULES.md), [DATABASE_GUIDELINES.md](DATABASE_GUIDELINES.md), and [AGENTS.md](AGENTS.md).

## Development commands

```bash
npm run start:dev   # Start in watch mode
npm run build       # Compile the application
npm run start:prod  # Start the compiled application
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

- Deposits, withdrawals, refunds, and settlements with the same ledger and idempotency guarantees
- Idempotent funding, withdrawals, refunds, and settlements
- Refresh-token session management and revocation
- Role-based access control and administrative workflows
- Webhook verification, persistence, and queue-based processing
- Notifications and provider integrations
- Immutable audit logging
- Production Docker, RabbitMQ, Redis, BullMQ, CI/CD, rate limiting, Helmet, and operational observability

This README should be updated whenever a module, route, environment variable, migration workflow, or operational dependency changes.
