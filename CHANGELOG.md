# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-03-06

### Added
- **AI Continuity (Save & Resume)**:
    - New `dna session save <brain_dump>` command to create versioned handoff documents.
    - New `dna session resume <id>` command with a **Mandatory Resumption Protocol** requiring the AI to ask 2-3 clarifying questions.
- **Proactive Drift Detection**:
    - MCP Server now includes `check_status` to detect missing or outdated Code DNA.
    - `init_context` now automatically alerts the agent if an update to the Global Hub is available.
- **New DNA Strands**:
    - **Database DNA (`core/database-master.md`)**: Established strict "No `IF EXISTS`" policy for deterministic schema control.
    - **Go Naming Conventions**: Standardized the `<action><what><how>` pattern (e.g., `fetchDataConcurrently`) in `core/golang-master.md`.
- **CLI Improvements**:
    - Added `session switch` and `session status` commands to the CLI.

### Changed
- `dna init` is now verified as idempotent and is the recommended way to update repositories to the latest DNA version.
- `src/actions/core.ts` now uses `checkDNAStatus` for more robust initialization checks.
- Updated `README.md` with new "AI Incantations" and improved documentation for session management.

## [1.0.0] - 2026-03-05
- Initial release of Code DNA.
