# Code DNA: Engineering Excellence for AI Agents

**Code DNA** is the single source of truth for coding standards, architectural principles, and AI-assisted development workflows. It transforms AI agents from "guests" to **Resident Architects** by injecting Experienced-level engineering DNA into every repository.

## 🎯 The Mission
As AI agents become core members of the engineering team, we must eliminate "Instruction Drift." **Code DNA** implements a **Global-to-Local (Hub-and-Spoke)** model, ensuring that excellence is inherited by every project while preserving domain-specific context.

## 🏗️ Architecture: Hub & Spoke

### 1. The Hub (`code-dna/`)
The "Central Brain" containing modular, version-controlled DNA strands that define the "Law of the Land."
*   **`core/`**: Language-specific idioms (Go, TypeScript) and general software principles (SOLID, DRY).
*   **`skills/`**: External vendor capabilities (e.g., `mcollina/skills`) managed via Git submodules.
*   **`src/`**: The **DNA Engine**—the CLI and MCP server that synchronize rules across repositories.
*   **`templates/`**: Standardized instruction templates for AI interactions.

### 2. The Spoke (`[project-repo]/`)
Each repository maintains its own lightweight context while inheriting the Global DNA:
*   **`.dna-context.md`**: Project-specific domain logic (e.g., "This is a Stripe payment gateway").
*   **`AGENTS.md`**: A "README for AIs" describing the local architecture and technical "gotchas."
*   **`.dna/` (Internal)**: A directory managed by the DNA Engine containing symlinks to the Global Strands.

## 🌉 The DNA Engine (CLI & MCP)
To maintain portability and clean history, we use a hybrid injection strategy:
1.  **Symlinks (Local Dev)**: Global rules are symlinked into the project's `.dna/` directory for real-time updates.
2.  **Git Hygiene**: The `.dna/` directory is automatically added to `.git/info/exclude`.
3.  **Portability**: The engine can transition from symlinks to "hard copies" for CI/CD or remote environments.

## 📓 DNA Sessions: Architectural Audit
Every task is treated as a formal **DNA Session** to preserve the rationale behind every change:
*   **Path**: `.dna/sessions/${SESSION_ID}/`
*   **`decisions.md`**: Tracking architectural choices, trade-offs, and the "Why" behind the code.
*   **Auto-Versioning**: All plans, RFCs, and session documents are versioned (e.g., `plan.v1.md`) to preserve the evolution of thought.

### 🔗 Multi-Repo Workflows
Code DNA supports complex tasks that span multiple repositories through a **Main/Linked** pattern:
1.  **Main Repo**: The primary source of truth for the session.
2.  **Linked Repos**: Secondary repositories affected by the task.
3.  **Unified Context**: By initializing a linked session (`dna session start --main /path/to/main`), the engine symlinks the session folder across repositories. This ensures all ADRs, RFCs, and PR drafts are centralized in the Main repo while remaining accessible from any linked project.

## 🤖 Model Agency via MCP (Model Context Protocol)
Code DNA provides an MCP Server wrapper for the `dna` CLI, enabling:
*   **Structured Thought Trails**: Agents autonomously record decisions in the active session.
*   **Standards as Resources**: Global DNA strands are exposed as MCP Resources (`dna://golang-master`).
*   **Automated PR Lifecycle**: Agents manage the `draft-pr.md` autonomously.

## 🐙 Review & GitHub Integration
*   **Inbound**: Analyze team feedback on PRs and suggest surgical fixes based on Engineering DNA.
*   **Outbound**: Perform automated "First-Pass" reviews on PRs, checking for DNA adherence.

## 🔄 Lifecycle: Plan-First Mandate
To prevent "Context Bloat" and ensure quality, we follow a tiered execution model:
1.  **Discovery**: Gather project-specific context.
2.  **Strategy (Mandatory)**: Propose high-level ADRs and record them in the Session Log. **Agents MUST wait for user approval after planning.**
3.  **Execution**: Small, verifiable "Test + Code" cycles.
4.  **Refinement**: Surgical linting and documentation.

## 🚀 Future Strands & Roadmap
We are evolving Code DNA to become an autonomous engineering ecosystem:

1.  **🧬 DNA Mutations (Evolution Loop)**: Allow agents to suggest local architectural improvements back to the Global Hub via `dna propose-mutation`, creating a continuous feedback loop.
2.  **🛡️ The Lead Architect Agent**: A specialized agent persona that audits PRs for DNA compliance before they reach human reviewers.
3.  **🤖 Automatic Context Sync**: Real-time updates to `.dna/context/` after successful sessions to ensure agent repository knowledge never goes stale.
4.  **🔗 Cross-Repo DNA Grafting**: Tools to "graft" proven patterns from one repository to another (e.g., "Graft the auth pattern from Repo-A to Repo-B").
5.  **📝 Automated PR Finalization**: Transforming ADRs and session logs into perfect, template-compliant PR descriptions automatically.

## 📋 Prerequisites
1.  **Node.js (v18+)**
2.  **GitHub CLI (`gh`)**: Required for the `review` tool.
    *   Run `dna auth link` to synchronize your local authentication.
3.  **Git**

## 🔌 Usage

### Installation
Clone this repo and link the CLI:
```bash
npm install
npm run build
npm link --force
```

### Migration Guide (for existing repos using `.ai`)
If you were using the old `ai-standards` system, run these commands in your project root:
1.  **Update Global CLI**: `cd /Users/vcs/code/code-dna && npm install && npm run build && npm link --force`
2.  **Rename Folder**: `mv .ai .dna` (or let `dna init` auto-migrate it)
3.  **Re-initialize**: `dna init` (This updates symlinks and `GEMINI.md`)
4.  **Update MCP**: Update Gemini/Claude configuration to point to `/Users/vcs/code/code-dna/dist/mcp-server.js`.

### Available Tools
*   `dna init`: Symlinks global DNA into the current repository.
*   `dna init_context`: Analyzes the repo and initializes architectural context.
*   `dna session start <name>`: Initializes a new DNA session.
    *   Use `--main /path/to/repo` to link this to another project's session.
*   `dna session doc <id> <file> <content>`: Writes a versioned session document.
*   `dna session cleanup <id>`: Cleans up old document versions.
*   `dna review outbound <pr>`: Performs an automated review against the DNA.

### Gemini CLI Integration
Register the MCP Server:
```bash
gemini mcp add code-dna node /Users/vcs/code/code-dna/dist/mcp-server.js --scope user --trust
```

## 🧪 Testing
```bash
npm test
```
