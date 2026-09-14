# PostgreSQL Standards

- UUID primary keys
- snake_case table names
- snake_case column names
- timestamptz for timestamps
- created_at
- updated_at
- deleted_at only when required

Never use cascade delete for financial tables.

Money stored in smallest currency unit.

Ledger tables are append-only.

Every FK must be indexed.
