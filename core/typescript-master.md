# TypeScript Master DNA: Idioms & Standards

## 🎯 Core Philosophy
*   **Pragmatic OOP + Functional Data:**
    *   **Services are Classes:** Use `class` for long-lived, stateful components (Services, Repositories) to leverage Dependency Injection and Interfaces.
    *   **Data is Dumb:** Use `interface` or `type` for data models (DTOs, Entities). **Do not** put methods on data classes. Use standalone "Mapper" functions for transformations (e.g., `toSafeUser(user)` instead of `user.toSafe()`).
*   **Hexagonal Architecture:**
    *   **Core Domain:** Pure TS. No dependencies on outer layers (Database, HTTP, queues).
    *   **Ports:** Interfaces defined in the Domain that adaptors must satisfy.
    *   **Adapters:** Infrastructure implementations (PostgresRepo, RedisCache) that implement the Ports.
*   **Strictness:** `noImplicitAny`, `strictNullChecks` are non-negotiable.

## 🏗️ Architecture & Patterns
*   **Module Structure:** Group by **Feature** (`modules/auth/`), not technical layer.
    *   `domain/`: Entities and logic.
    *   `application/`: Use cases / Services.
    *   `infrastructure/`: DB adaptors, API clients.
    *   `api/`: Controllers / Resolvers.
*   **Barrel Exports:** usage of `index.ts` is encouraged for clean public APIs of modules, but be mindful of circular dependencies.

## 🛡️ Error Handling
*   **Try/Catch:** Use standard `try/catch` for flow control.
*   **Custom Errors:** Extend `Error` for domain-specific failures. Ensure `name` and `stack` are preserved.
*   **Boundary Handling:** Catch errors at the "Edge" (Controller/Resolver) and map them to appropriate HTTP/gRPC codes. Do not leak internal stack traces to clients.

## ⚡ Async Patterns
*   **Async/Await:** Prefer `async/await` over raw `.then()`.
*   **Parallelism:** Use `Promise.all()` for independent concurrent tasks.
*   **Looping:** Avoid `await` inside `forEach`. Use `for...of` loops or `Promise.all(map(...))` for concurrent execution.

## ⚠️ The "Go-to-TS" Mental Model (Polyglot Bridges)
*   **Interfaces:** TS interfaces are *structural* (duck typing), unlike Go's *nominal* approach (though Go is also structural, implementation is implicit). In TS, interfaces disappear at runtime.
*   **Runtime Validation:** Since TS types vanish at runtime, use validation libraries (Zod, Joi) at the I/O boundaries (Requests) to ensure runtime integrity.
