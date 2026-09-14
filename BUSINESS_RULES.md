# Wallet Rules

- Wallet balance can never be negative.
- Wallet balance is cached.
- Ledger is the source of truth.

# Transfer Rules

- Sender cannot send to themselves.
- Sender must have sufficient balance.
- Transfers are atomic.
- Duplicate idempotency keys return the first result.

# KYC Rules

- Users cannot withdraw until KYC is VERIFIED.
- Users with FAILED KYC cannot create virtual accounts.

<!-- # Escrow Rules

- Escrow funds are locked until released.
- Only the buyer can confirm delivery.
- Admin can resolve disputes. -->
