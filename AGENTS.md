# OFOS Agent Rules

## Product and target stack

- Product name: **OFOS**. Do not use the legacy product name in new UI, package metadata, documentation, or generated code.
- Target architecture: NestJS REST API, React frontend, PostgreSQL database, and Prisma ORM.
- Retain the existing integrations and supporting technologies where they still fit: Redis, Google GenAI, JWT/cookie authentication, uploads, payments, and API documentation. Confirm compatibility and document any replacement before changing one.
- The current Express/EJS/MySQL implementation is the behavioral reference until a feature is migrated and verified. Read `PROJECT_OVERVIEW.md`, `flow.txt`, routes, services, and `prisma/schema.prisma` before implementing corresponding features.

## Agent coordination

- One orchestrator owns the plan, architecture decisions, phase boundaries, integration, and final acceptance. Specialized agents work only within assigned scope.
- Use focused agents for backend/API, React/UI, database/Prisma, and independent review/debugging. Do not have multiple agents edit the same files concurrently.
- The database agent owns schema conversion, migrations, seeds, and data integrity. Backend and frontend agents must follow its published contracts and the orchestrator's API contracts.
- Reviewer/debugger agents report findings with file paths, impact, and reproduction steps; they do not make broad refactors without assignment.
- Before delegating, give agents the relevant source files and a narrow deliverable. Require a concise handoff listing changed files, decisions, and unresolved items.

## Migration workflow

- Work in small, reviewable vertical slices. First inventory and plan; then establish the database and application skeleton; then migrate one end-to-end feature at a time.
- Preserve existing product behavior unless a change is explicitly documented and approved in the project plan.
- Maintain a migration checklist mapping every existing route, page, and workflow to its target implementation and status. Do not declare the remake complete while required legacy behavior is unmapped.
- Convert MySQL-specific Prisma types and semantics carefully for PostgreSQL (including unsigned integers, tiny integers, defaults, indexes, enums, JSON, and relation behavior). Keep identifiers and foreign keys consistent; document any necessary API representation changes.
- Use Prisma migrations as the source of truth. Never edit an applied migration; create a forward migration. Inspect generated SQL before applying it.
- Keep the old implementation intact as a reference until its replacement is accepted. Do not delete legacy code, data, uploads, or migration history as cleanup without explicit user instruction.
- Never run destructive database commands, reset/drop a database, or overwrite existing environment values. Confirm the target database name and inspect migration impact first.
- Keep secrets out of source control, logs, prompts, and agent summaries. Use `.env.example` with placeholders; do not print `.env` values.

## Engineering standards

- TypeScript strictness, clear module boundaries, DTO validation, consistent error responses, authorization checks, and secure password/token handling are required.
- React must call documented REST endpoints; do not introduce server-rendered EJS into the new UI.
- Keep API contracts documented (OpenAPI), and update the migration checklist and architecture notes as each slice lands.
- Prefer existing project conventions only when they fit the target architecture. Explain significant new dependencies before adding them.
- Do not create speculative MCP servers. Add an MCP integration only if a concrete workflow needs it and the orchestrator records its purpose and maintenance cost.

## Token and context budget

- Treat this as a long-running project. Do not attempt a whole-repository rewrite in one task or one agent context.
- At the start of each work session, read this file, the current migration checklist, and only the relevant source modules.
- Keep durable decisions, status, blockers, and next actions in `docs/migration/STATUS.md`; keep detailed feature mapping in `docs/migration/FEATURE-MAP.md`.
- Summarize findings instead of repeatedly pasting large source files. Ask agents for bounded outputs and stop once the deliverable is complete.
- After each phase, report completed items, verification performed, remaining work, and the next small task. Never claim completion based on scaffolding alone.

## Completion gates

- For each feature, verify database migration/schema, backend behavior, frontend flow, authorization, and error/empty/loading states before marking it complete.
- Run focused checks for changed code and the relevant build/type checks. Record commands and outcomes. Do not hide failures or weaken checks to get a green result.
- Have an independent reviewer inspect each substantial vertical slice before moving on.
- A phase is complete only when its acceptance criteria and documentation are updated; overall migration is complete only when the full feature map is accounted for and the agreed end-to-end flows work.
