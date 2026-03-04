# Code DNA: Comprehensive Usage Guide

For a "Sneak Peek" of how a session evolves with real chat examples, see **[SHOWCASE.md](./SHOWCASE.md)**.

## 🖥️ CLI Commands Reference

### Repository Setup
- `dna init`: Symlinks core standards from the Hub into `.dna/`. Creates agent entry points (`GEMINI.md`, `.cursorrules`, `.windsurfrules`, `.codexrules`, `CLAUDE.md`).
- `dna init_context`: Scans the repository for frameworks, databases, and CI/CD. Populates `.dna/context/*.md` and generates `AGENTS.md`.

### Session Management
- `dna session start <name>`: Initializes a new session folder.
  - `--main <path>`: Link to a main repository for multi-repo work.
  - `--tool <name>`: Record the tool ID (e.g., `gemini-cli`).
  - `--external-id <id>`: Link to an external chat thread ID.
- `dna session list`: Shows all sessions and highlights the active one.
- `dna session status [id]`: Displays a dashboard of the current session's ADRs and Manifest.
- `dna session switch <id>`: Sets the "Current" session for the CLI (auto-detection).
- `dna session record [id] "<decision>"`: Adds an ADR to the current session.
- `dna session doc [id] <filename> <content>`: Writes a versioned markdown file to the session.

### Evolution (Mutations)
- `dna mutation propose "<title>" "<rationale>"`: Queues a local pattern for Hub review. 

### PR Review
- `dna review outbound <pr-link>`: Performs a DNA-based audit of a pull request.
- `dna review inbound <pr-link>`: Analyzes reviewer feedback and suggests fixes.

---

## 🤖 AI Prompting Recipes

### Scenario: Starting a complex task
> "I am starting a refactor of the payment gateway. Use `dna session start 'payment-refactor'` to track our work. Then run `dna init_context` to make sure you understand our current architecture. Once done, propose a strategy and record our first ADR."

### Scenario: Pivoting Architecture
> "Actually, let's use a Strategy pattern instead of a simple switch case. Record this decision in our DNA session and explain the trade-offs in the session manifest."

### Scenario: Proposing a Mutation
> "This utility function for handling monads is much cleaner than what we have in the global TypeScript idioms. Propose a mutation to the Hub using `dna mutation propose` so we can adopt this company-wide."

---

## 🔌 MCP Server Setup

Code DNA provides an MCP (Model Context Protocol) server to give agents direct access to the CLI tools.

### For Gemini CLI
```bash
gemini mcp add code-dna node /path/to/code-dna/dist/mcp-server.js --scope user --trust
```

### For Cursor / Claude Desktop
Add the following to your MCP configuration:
```json
{
  "mcpServers": {
    "code-dna": {
      "command": "node",
      "args": ["/absolute/path/to/code-dna/dist/mcp-server.js"]
    }
  }
}
```

---

## 🧬 Migration & Upgrade Guide

To upgrade an existing project to the latest Code DNA:

1. **Update the Hub**:
   ```bash
   cd /path/to/code-dna
   git pull
   npm install && npm run build
   ```

2. **Re-initialize the Spoke**:
   ```bash
   cd /path/to/your-project
   dna init
   dna init_context
   ```
   *Note: This will refresh symlinks and create new agent entry points (.cursorrules, CLAUDE.md, etc.) without deleting your existing sessions.*

3. **Check Active Session**:
   If you have a session in progress, run `dna session status` to verify ID detection. If needed, run `dna session switch <id>` once to re-enable the auto-ID detection.
