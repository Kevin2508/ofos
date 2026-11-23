# Antigravity kickoff prompt

Paste this into Antigravity CLI from the OFOS repository root. The project agents are in `.agents/agents/`; use `ofos-orchestrator` as the lead.

```text
We are remaking this existing project as OFOS. Read and follow AGENTS.md and use the project-scoped agents in .agents/agents/. You are the orchestrator; delegate bounded, non-overlapping work to the database, backend, frontend, reviewer, and debugger specialists when appropriate. Keep one clear source of truth for architecture decisions and API contracts.

TARGET STACK
- Backend: NestJS REST API
- Frontend: React (no EJS in the new UI)
- Database: PostgreSQL with Prisma
- Retain existing supporting technologies/integrations where appropriate: Redis, Google GenAI, JWT/cookie auth, uploads, payment integrations, and OpenAPI. Inspect compatibility before carrying each one forward.
- Product name everywhere new: OFOS.

IMPORTANT EXISTING CONTEXT
This repository currently has an Express 5 + EJS application, a large MySQL Prisma schema, and substantial role-based food ordering functionality. Use PROJECT_OVERVIEW.md and flow.txt as maps, then inspect source files for actual behavior. The existing implementation remains the behavioral reference during migration. Do not treat this as a greenfield app or try to rewrite everything in one run.

FIRST TASK — DATABASE SETUP ONLY
The new database must have a name different from the project name. Use `ofos_platform_dev` as the PostgreSQL database name. First inspect local PostgreSQL availability and existing configuration without printing secrets. Give me the exact safe command or GUI steps to create this database for my installed PostgreSQL setup. Do not create, drop, reset, or modify any database yourself, and do not run migrations yet. If the server/credentials/installation are not discoverable, tell me exactly what is needed and stop at this checkpoint. Wait for me to confirm that I created `ofos_platform_dev` and provide connection details through my local `.env` before moving to the next phase. Never ask me to paste secrets into chat; tell me to configure them locally.

AFTER DATABASE CONFIRMATION
1. Inventory the current application and produce a concise phased migration plan plus `docs/migration/STATUS.md` and `docs/migration/FEATURE-MAP.md`. Map all existing pages, routes, roles, workflows, integrations, and schema areas; mark unknowns instead of guessing.
2. Propose the target repository layout, local development commands, API conventions, auth strategy, and PostgreSQL/Prisma conversion decisions. Identify MySQL-specific schema concerns (including unsigned integer IDs, tiny integers, enums, JSON, defaults, indexes, and relations). Get my approval for material product/architecture decisions before implementation.
3. After approval, create the smallest runnable NestJS + React + PostgreSQL/Prisma foundation and verify it. Then migrate functionality one vertical slice at a time, with independent review at each substantial slice. Keep legacy code intact until its replacement is accepted.

TOKEN AND EXECUTION DISCIPLINE
- Work in small phases and stop at meaningful checkpoints; never generate a complete rewrite in one task.
- Read only relevant modules per task. Summarize large findings and give each specialist a narrow assignment, expected output, and relevant files.
- Avoid duplicate agents doing the same work or editing shared files. The database specialist owns Prisma schema/migrations; the orchestrator owns contracts and integration.
- Before each phase, state the bounded goal and acceptance criteria. At the end, report changed files, commands and results, reviewer findings, incomplete items, and the next small task.
- Keep `docs/migration/STATUS.md` current so work can resume in a fresh session without re-reading everything.
- Do not add an MCP server unless a concrete requirement cannot be met by existing tools; explain maintenance cost first.
- Never expose secrets, run destructive DB commands, discard legacy implementation, or claim a feature complete based only on scaffolding.

For this first run, do only the FIRST TASK — DATABASE SETUP ONLY and wait for my confirmation.
```
