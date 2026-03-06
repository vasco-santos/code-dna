# Database & SQL: Engineering DNA

## 🎯 Migrations & Schema Evolution
*   **Strict Control (No IF EXISTS):** Migrations MUST NOT use `IF EXISTS` or `IF NOT EXISTS` for table or column operations.
    *   **Rationale:** Schema evolution should be deterministic and controlled. Using `IF EXISTS` hides unexpected schema states and can lead to silent failures or inconsistent environments. If a migration fails because a table already exists, it indicates a desynchronized state that must be investigated, not bypassed.
*   **Atomic Migrations:** Each migration should be wrapped in a transaction (where supported) to ensure that partial changes do not leave the database in an inconsistent state.
*   **Reversibility:** Every migration MUST have a corresponding "Down" or "Rollback" script that is tested to ensure a clean return to the previous state.
*   **Data Integrity:** Use appropriate constraints (`NOT NULL`, `UNIQUE`, `FOREIGN KEY`, `CHECK`) at the database level. Application-level validation is secondary to database-level integrity.

## 🏗️ Schema Design
*   **Explicit Naming:** Use clear, descriptive, and consistent naming conventions (e.g., `snake_case` for tables and columns).
*   **Primary Keys:** Every table MUST have a primary key. Prefer `UUID` for distributed systems or `BIGSERIAL/BIGINT` for internal relational structures.
*   **Normalization:** Follow normalization principles up to 3NF unless denormalization is explicitly justified for proven performance requirements.
*   **Indices:** Index all foreign keys and columns frequently used in `WHERE` clauses, `JOIN` conditions, or `ORDER BY` operations. Avoid over-indexing, which slows down writes.

## ⚡ Query Performance
*   **Selective Selection:** NEVER use `SELECT *`. Explicitly name the columns required by the application to reduce I/O and network overhead.
*   **Prepared Statements:** ALWAYS use parameterized queries or prepared statements to prevent SQL Injection and allow the database to reuse execution plans.
*   **Pagination:** Use `LIMIT` and `OFFSET` (or preferably keyset pagination) for large datasets to prevent memory exhaustion in the application layer.
*   **Explain Analysis:** For complex queries, use `EXPLAIN ANALYZE` to identify bottlenecks (e.g., Sequential Scans vs. Index Scans).

## 🛡️ Security
*   **Least Privilege:** Application database users should only have the permissions necessary for their operations (e.g., `SELECT`, `INSERT`, `UPDATE`, `DELETE` on specific tables). Administrative tasks should use a separate user.
*   **Audit Logging:** Critical data changes should be tracked via audit tables or database-level logging.
