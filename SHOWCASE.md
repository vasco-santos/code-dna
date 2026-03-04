# Code DNA in Action: A Sneak Peek 🧬

This document demonstrates how **Code DNA** transforms a standard AI chat into a professional, experienced-level engineering workflow.

---

## 🎭 The Scene: "The MFA Refactor"

**Developer**: *"I need to refactor the Auth module to support Multi-Factor Authentication (MFA)."*

**Resident Architect (AI)**:
> "Understood. I've initialized a new DNA session: `20260304-auth-mfa-support`. 
> I also ran `dna init_context` and detected we are using **Express.js** and **Prisma**.
>
> **Proposed Strategy**:
> 1. Add `mfa_secret` and `mfa_enabled` to the `User` model.
> 2. Implement TOTP generation/verification.
> 3. Update the login flow to require a second factor if enabled.
>
> I've recorded this strategy in the session manifest. Shall we proceed?"

**Developer**: *"Yes, and let's use the `speakeasy` library for TOTP."*

**Resident Architect (AI)**:
> "Excellent choice. I have recorded the decision: **'Using speakeasy for TOTP implementation'** in our ADR log. 
> I'm now drafting the implementation plan and the Pull Request description in our session folder."

---

## 📂 Repository Evolution

Before Code DNA, your repository is just code. After starting a session, it gains a **Permanent Memory**:

```text
my-project/
├── .dna/
│   ├── context/
│   │   ├── architecture.md  <-- Auto-discovered: "Express + Prisma"
│   │   └── idioms.md        <-- "Use functional patterns, Vitest for tests"
│   └── sessions/
│       └── 20260304-auth-mfa-support/
│           ├── session-manifest.v1.md  <-- The "Brain Dump"
│           ├── decisions.md            <-- The "Why" (ADRs)
│           ├── discussion-log.v1.md    <-- The "Vibe" (Conversation Journal)
│           └── draft-pr.md             <-- The "Outcome"
```

---

## 📜 The Artifacts (Sneak Peek)

### 1. The ADR Log (`decisions.md`)
*Traceable, permanent architectural choices.*
```markdown
## Decisions
- Started session for MFA support.
- Using `speakeasy` for TOTP; preferred over `otplib` for simplicity in this stack.
- Decision: Storing MFA secrets encrypted at rest using AES-256-GCM.
```

### 2. The Discussion Journal (`discussion-log.v1.md`)
*Preserves the nuances of the conversation.*
```markdown
### Turn: 202603041200
- **Context**: Selecting TOTP library.
- **Key Points**: Developer explicitly requested `speakeasy`. I verified it aligns with our Node.js security idioms.
```

### 3. The Live PR Draft (`draft-pr.md`)
*Ready-to-ship documentation, updated in real-time.*
```markdown
## 🧬 Code DNA: Pull Request
**Session ID**: `20260304-auth-mfa-support`

### 🏗️ Architectural Changes
- [x] Decisions recorded in `decisions.md` (AES encryption for secrets)
- [ ] Mutation proposed: "Generic MFA Provider interface" (Pending Hub review)

### 📝 Summary
Refactored the authentication controller to support a two-step verification flow.
```

---

## 🎭 Scene 2: The DNA-Powered Review

**Developer (vasco-santos)**: *"I've pushed the code for the MFA refactor. Can you perform a DNA audit before I request human review?"*

**Resident Architect (AI)**:
> "Running `dna review outbound https://github.com/vasco-santos/code-dna/pull/42`. 
>
> **Outbound Review Results**:
> - ✅ **Strict Types**: Verified. No `any` usage in the new controllers.
> - ✅ **ADR Compliance**: Implementation matches our decision to use AES-256-GCM.
> - ⚠️ **Idiom Warning**: The retry logic in `mfa-provider.ts` uses a static delay. Our `typescript-master` DNA recommends exponential backoff for external services.
> - 💡 **Mutation Proposal**: Your `speakeasy` wrapper is highly reusable. Propose it to the Global Hub?
>
> I've applied the exponential backoff fix. We are ready for team feedback."

---

**Developer (vasco-santos)**: *"The team has left some feedback on the PR. Can you help me address it?"*

**Resident Architect (AI)**:
> "Running `dna review inbound https://github.com/vasco-santos/code-dna/pull/42`.
>
> **Inbound Feedback Analysis**:
> - **Reviewer @senior-eng**: *'We should use a constant-time comparison for the TOTP tokens to prevent timing attacks.'*
> - **Architect Analysis**: This is a critical security idiom. I've drafted a fix using `crypto.timingSafeEqual`.
> - **Action**: I'm updating `decisions.md` with this security pivot and recording the fix in the discussion log.
>
> Fix applied. PR updated and ADR recorded."

---

## 🚀 Why Code DNA?

1.  **Zero Onboarding**: When a new AI agent joins the project, it reads `AGENTS.md` and the active session. It is immediately a "Resident Architect."
2.  **No Knowledge Loss**: Even if the chat history is lost, the **Session Folder** remains.
3.  **Global Excellence**: Local improvements are "mutated" back to the Global Hub, making your entire organization smarter with every session.

### [Ready to start? See USAGE.md](./USAGE.md)
