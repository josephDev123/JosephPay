# Fintech Backend Engineering Guide

## Project Overview

This project is a production-grade fintech backend built with Node.js and TypeScript.

The goal is NOT to build a tutorial application.

The goal is to build software that follows the architecture, security, and engineering practices used by companies like Stripe, Paystack, Flutterwave, Wise, Moniepoint, and modern digital banks.

Always prioritize:

- Correctness over convenience
- Reliability over cleverness
- Auditability over simplicity
- Security over performance
- Explicit code over magic

Every financial operation must be deterministic and traceable.

---

# Tech Stack

Backend

- Node.js
- TypeScript
- Express (or NestJS)
- PostgreSQL
- Prisma ORM
- Redis
- BullMQ

Infrastructure

- Docker
- Docker Compose
- GitHub Actions

Documentation

- OpenAPI / Swagger

Testing

- Vitest or Jest
- Supertest

Validation

- Zod

Authentication

- JWT
- Refresh Tokens

---

# Engineering Philosophy

Never generate "tutorial code."

Generate production-quality code.

Every implementation should be:

- Modular
- Testable
- Reusable
- Scalable
- Typed
- Well documented

Never sacrifice readability for fewer lines of code.

---

# Architecture

Prefer Modular Monolith.

Structure

src/

    modules/

        auth/

        users/

        wallet/

        ledger/

        payment/

        transfer/

        kyc/

        webhook/

        notification/

        merchant/

        escrow/

        admin/

        audit/

    shared/

    lib/

    config/

Every module should own:

- controller
- service
- repository
- routes/module
- validation
- dto
- mapper
- types
- tests

Avoid cross-module coupling.

---

# Layer Rules

Controller

- Request parsing
- Validation
- Authentication
- Authorization
- Response formatting

Never place business logic here.

Service

Contains business rules.

Repository

Contains database access only.

Never mix SQL/Prisma with business logic.

---

# Database Rules

PostgreSQL is the source of truth.

Never duplicate data unless intentionally cached.

Every table should have:

- id
- created_at
- updated_at

Soft deletes only when required.

Never use cascade deletes for financial data.

---

# Money Rules

Never store money as float.

Never use:

float

double

decimal in JavaScript.

Store monetary values as integers representing the smallest currency unit.

Examples

NGN

₦100.50

Store

10050

USD

$10.25

Store

1025

Never perform calculations using floating point numbers.

---

# Wallet Rules

Wallet balance is a cached value.

Ledger is the source of truth.

Never update balance directly without creating a financial transaction.

Every balance change must originate from a transaction.

---

# Ledger Rules

Ledger entries are immutable.

Never update them.

Never delete them.

Every financial movement creates ledger entries.

Money never appears or disappears.

Every debit must have a corresponding credit.

Always use double-entry accounting.

---

# Transaction Rules

Every transaction must have

- unique reference
- status
- amount
- currency
- type
- source
- destination

Statuses

PENDING

PROCESSING

SUCCESS

FAILED

REVERSED

CANCELLED

Never trust frontend transaction status.

---

# Idempotency

Every endpoint that moves money must support idempotency.

Examples

Transfer

Withdrawal

Funding

Settlement

Refund

Duplicate requests must return the original response.

Never process the same request twice.

---

# Database Transactions

Money movement must use database transactions.

Example

BEGIN

Create Transaction

Create Ledger Entries

Update Wallet Balance

COMMIT

Rollback on failure.

Never leave partial updates.

---

# External Providers

Never trust external APIs.

Always

Validate

Verify

Retry

Log

Persist provider responses.

Store

provider

provider_reference

provider_response

---

# Webhooks

Webhook processing must be idempotent.

Always

Verify signature

Save payload

Queue processing

Return quickly

Never perform heavy work inside webhook controllers.

---

# Audit Logs

Every sensitive action must be logged.

Examples

Login

Password change

KYC approval

Transfer

Withdrawal

Admin action

Audit logs are immutable.

---

# Logging

Never use console.log.

Use structured logging.

Every request should have

request_id

user_id

correlation_id

Include

duration

status

error

---

# Error Handling

Never expose internal errors.

Return consistent error responses.

Example

{
"success": false,
"message": "...",
"code": "...",
"errors": []
}

---

# Security

Always validate input.

Never trust frontend data.

Escape outputs where required.

Hash passwords.

Encrypt sensitive information.

Implement

Rate limiting

CORS

Helmet

CSRF where applicable

Secure cookies

Never expose secrets.

---

# Authentication

Access Token

Short lived

Refresh Token

Long lived

Support multiple sessions.

Allow session revocation.

---

# Authorization

Prefer RBAC.

Roles

CUSTOMER

MERCHANT

SUPPORT

ADMIN

SUPER_ADMIN

Never hardcode permissions.

---

# APIs

REST first.

Follow consistent naming.

Good

POST /wallet/fund

POST /wallet/withdraw

POST /transfers

GET /transactions

Bad

POST /sendMoneyNow

---

# Naming

Use singular table names only if consistent across the project.

Use descriptive names.

Avoid abbreviations.

Never use

tmp

data

value

object

---

# Validation

Every endpoint must validate

Request

Body

Query

Params

Headers

Never trust request types.

---

<!-- # Testing

Every service should have

Unit tests

Integration tests

Critical money movement requires transaction tests. -->

---

# Documentation

Every endpoint should include

Purpose

Authentication

Request example

Response example

Errors

Business rules

---

# Code Generation Guidelines

When generating code:

1. Explain architectural decisions.

2. Explain why a pattern was chosen.

3. Explain tradeoffs.

4. Generate production-quality code.

5. Avoid shortcuts.

6. Prefer explicit implementations.

7. Keep functions small.

8. Keep services cohesive.

9. Use dependency injection.

10. Follow SOLID principles.

---

# AI Behaviour

Do not assume requirements.

Ask questions when business rules are ambiguous.

If a generated solution could risk financial inconsistency, explain the risk before implementing.

Suggest improvements when appropriate.

Always think like a senior fintech backend engineer.

Don't optimize prematurely.

Favor correctness over speed.

Every financial action must be:

Traceable

Auditable

Recoverable

Deterministic

Secure

Idempotent

Consistent

Reliable

## Build, Test, and Development Commands

- `npm install`: install dependencies.
- `npm run start:dev`: run the API in watch mode for local development.
- `npm run build`: compile TypeScript with Nest CLI into `dist/`.
- `npm run start:prod`: start the compiled server from `dist/main`.
- `npm run test`: run unit tests with Jest.
- `npm run test:e2e`: run end-to-end tests from `test/jest-e2e.json`.
- `npm run test:cov`: generate coverage output in `coverage/`.
- `npm run lint`: run ESLint and apply safe fixes.
- `npm run format`: format `src/**/*.ts` and `test/**/*.ts` with Prettier.

<!-- ## Testing Guidelines

Jest is configured in `package.json`. Unit tests use `src/**/*.spec.ts`; e2e tests use `test/app.e2e-spec.ts`. Name tests after the unit under test, and keep assertions focused on observable behavior. Run `npm run test` before committing, and use `npm run test:cov` when changing shared logic or request handling. -->

## Configuration & Secrets

Do not commit local secrets from `.env`. Keep environment-specific values out of source control, and document any new required variables in the README or PR notes.
