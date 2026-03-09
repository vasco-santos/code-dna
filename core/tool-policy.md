# AI Tool & Permission Policy

To reduce friction and ensure efficient development, AI agents are granted broader permissions for **Discovery** and **Read-Only** operations.

## ✅ Safe-to-Execute (Discovery & Read)
The following commands and patterns are considered "Safe-to-Execute" and do not require explicit user permission for each call, provided they are used for research and mapping:

*   **File System Discovery**: `ls`, `cd`, `find`, `du`, `pwd`.
*   **File Reading**: `cat`, `grep`, `sed` (read-only), `awk` (read-only), `head`, `tail`.
*   **Version Control (Status & Log)**: `git status`, `git log`, `git diff` (without flags that modify state), `git branch`.
*   **GitHub CLI (Read-Only)**: `gh pr view`, `gh pr list`, `gh issue view`, `gh issue list`, `gh repo view`.
*   **Network (Read-Only)**: `curl` or `webfetch` for documentation or public GitHub raw files.
*   **Project Meta**: `npm list`, `go list`, `pip list`, `cargo metadata`.

## ⚠️ Restricted (Explicit Permission Required)
The following operations **MUST** be explicitly requested and approved by the user:

*   **State Modification**: `git commit`, `git push`, `git reset`, `git checkout -b` (branch creation).
*   **File Creation/Deletion**: `mkdir`, `rm`, `touch` (outside of DNA-specific commands like `dna session`).
*   **Dependency Management**: `npm install`, `go get`, `cargo add`.
*   **Execution**: Running application binaries or complex scripts that have side effects.
*   **Secrets**: Accessing `.env` files or system keychains.

## 🤖 Shared Agent Mandate
All AI assistants (Gemini, Claude, Copilot, etc.) must adhere to this trust model. If a command is in the "Safe-to-Execute" list, prioritize autonomous execution to maintain high development momentum.
