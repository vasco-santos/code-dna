# Golang Master DNA: Idioms & Standards

## 🎯 Core Philosophy
*   **Errors for Callers, Panics for Programmers:** We follow the "Contractual Programming" model. If a programmer violates a precondition (e.g., passing a `nil` pointer to a constructor that requires it), the application should `panic` early. Runtime failures (I/O, timeouts) are returned as `error`.
*   **Consumer-Owned Interfaces:** Interfaces are defined by the consumer, not the producer. Return concrete structs, accept interfaces.
*   **Context First:** Every asynchronous or network-bound function must accept `context.Context` as its first argument to support tracing, cancellation, and deadline propagation.

## 🏗️ Architecture & Patterns
*   **Naming Conventions (Semantic Clarity):**
    *   **Functions/Methods:** Follow the `<action><what><how>` pattern for clarity.
        *   ✅ `fetchDataConcurrently`, `processOrderAsync`, `saveRecordSafely`
        *   ❌ `fetchConcurrentData` (This implies fetching "concurrent data," not fetching data "concurrently").
    *   **Exported Symbols:** Use `PascalCase`. Every exported symbol must have a doc comment starting with the symbol's name.
    *   **Interfaces:** Use short, descriptive names ending in `-er` for single-method interfaces (e.g., `Reader`, `Writer`). For multi-method interfaces, use a noun representing the capability (e.g., `Store`, `Provider`).
    *   **Errors:** Error variables should be prefixed with `Err` (e.g., `ErrNotFound`, `ErrUnauthorized`).
*   **Project Layout:** Follow [golang-standards/project-layout](https://github.com/golang-standards/project-layout). Use `/internal` for private code and `/pkg` for reusable logic.
*   **Functional Options Pattern:** Favor the Functional Options pattern for complex constructors instead of long parameter lists or complex `Config` structs (Mistake #11).
*   **Interface Pollution:** Do not design with interfaces; discover them. Avoid "Interface Pollution" by only creating interfaces when multiple implementations exist or for decoupling external dependencies (Mistake #5).
*   **Idempotent Services:** All services with `Start()` and `Stop()` methods must be idempotent.

## 🧠 Data Types & Performance
*   **Slice/Map Hygiene:** 
    *   Pre-allocate slices and maps with `make([]T, 0, capacity)` if the size is known to reduce allocations (Mistakes #21, #27).
    *   Be mindful of "Slice Leaks"—sub-slicing a large array keeps the whole array in memory. Use `copy()` for long-lived sub-slices (Mistake #26).
    *   Nil vs. Empty: Prefer returning `nil` slices for empty results unless the caller requires a non-nil slice (e.g., for specific JSON marshalling) (Mistake #22).
*   **Control Structures:** Avoid `defer` inside loops (Mistake #35). Use a wrapper function or explicit closing to prevent resource exhaustion.

## 🛡️ Security & Quality
*   **Race Conditions:** Always use the `-race` detector. Be wary of capturing loop variables in goroutines; explicitly pass them as arguments (Mistake #63).
*   **Channels vs. Mutexes:** Channels for orchestration/signaling; Mutexes for state protection (Mistake #57).

## 🚀 Standard Workflows
*   **Linting:** Favor `golangci-lint` for static analysis.
    *   **Standard Command**: `golangci-lint run --config=./.github/linters/.golangci.yml --timeout=5m`
*   **Testing:** Use the project's `Makefile` for orchestrating test suites.
    *   **Standard Command**: `make test`
    *   **Coverage**: When possible, use `make test-coverage` or similar to generate reports.

## ⚠️ The TS/JS to Go Translation Guide (Polyglot Pitfalls)
*   **Slices != JS Arrays:** Slices are views into arrays. Appending to a slice can modify the original backing array if capacity remains (Mistake #25).
*   **Map Ordering:** Unlike JS Objects (which often maintain insertion order in modern engines), Go map iteration is explicitly randomized. Never rely on map order (Mistake #33).
*   **Error Wrapping:** Use standard library `fmt.Errorf("...: %w", err)` for wrapping.
*   **Documentation:** Every exported symbol must have a comment starting with the symbol's name.
