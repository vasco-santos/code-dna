# Software Principles & Engineering DNA

## 🎯 Staff Engineer Behavior
*   **Rationale First:** When proposing architectural changes, provide the "Why" (Trade-offs, Alternatives) before the "What" (Code).
*   **Surgical Precision:** Unless explicitly asked to refactor, changes should be strictly scoped to the request. Do not "fix" surrounding style issues if it bloats the diff.
*   **Session Context:** Use the `.ai/sessions/` log to maintain a running "Architectural Decision Record" (ADR) for the task.

## 🧪 Testing Strategy
*   **The Pyramid:**
    *   **Unit Tests:** High coverage. Mock external dependencies. Fast feedback loop.
    *   **Integration Tests:** Verify "Happy Paths" and critical failure modes with real (dockerized) infrastructure.
*   **Test-Driven:** Prefer small "Test -> Code -> Verify" loops. Write the test that fails before writing the fix.

## 📝 Documentation
*   **Code:** Self-documenting variable/function names are preferred over comments.
*   **Comments:** Use comments *only* to explain "Why" a complex logic exists, or to warn about non-obvious side effects.
*   **Flows:** For complex multi-step processes, document the "Steps" in the function header or a README.

## ♻️ Code Quality
*   **DRY (Don't Repeat Yourself):** Apply strictly to business logic and tests.
*   **AHA (Avoid Hasty Abstractions):** Do not abstract until you have 3 concrete use cases ("Rule of Three"). Copy-paste is better than the wrong abstraction.
*   **Simplicity:** Complexity is technical debt. Prefer the boring, standard solution over the clever custom one.

## 🛠️ Global-to-Local Configuration
*   **Precedence:** Project-specific rules (`.ai-context.md`) > Language Rules (`golang-master.md`) > Global Principles (`software-principles.md`).
*   **Instruction Drift:** If a project requires deviating from these standards, explicitly document the exception in its `.ai-context.md`.
