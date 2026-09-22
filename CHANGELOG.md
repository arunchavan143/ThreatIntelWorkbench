# Changelog

All notable changes to Threat Intel Workbench Pro are documented here.

## [Unreleased]

### Fixed
- **Removed leaked debug artifact `error-debug.json`** — a local Windows file
  path had been accidentally committed via the old error-logging code path.
  Removed from the working tree and added to `.gitignore` to prevent
  recurrence. (Note: it remains visible in prior commit history unless
  history is rewritten.)

### Security
- Removed hardcoded default DB password (`|| 'threat_pass_2024'`) from
  `src/config/database.js` `development`/`test` configs — password now
  must come from `DB_PASSWORD` in `.env`, with no fallback baked into
  source. (`production` config already had no fallback.)

## [4.0.1] - 2026-07-29

Fixes based on a pre-release code review that identified three gaps between
what the tool reported and what it actually did.

### Fixed
- **`POST /api/mitre/sync` was a no-op.** It downloaded the full MITRE
  ATT&CK STIX 2.1 bundle but discarded everything except a `{timestamp,
  count}` summary, so `getIntrusionSets()` never had real data to read and
  actor attribution silently stayed on a ~12-technique hardcoded fallback
  forever, even after a "successful" sync.
  Fix: `syncSTIXData()` now persists the full `objects` array to
  `data/enterprise-attack-cache.json`. Verified live: a real sync pulls
  ~25,800 STIX objects including 189 actual `intrusion-set` (APT actor)
  entries.
  → See [`docs/API.md § MITRE ATT&CK STIX Sync`](docs/API.md) for the
  endpoint contract.

- **`/health` always reported `"status": "healthy"`** regardless of whether
  Postgres was actually reachable, and never exposed database state at all.
  An analyst had no way to know history/persistence was down without
  reading raw server console output.
  Fix: `/health` now calls `sequelize.authenticate()` with a 2-second
  timeout on every request and returns `"status": "degraded"` plus a
  `"database"` field when Postgres is unreachable. The endpoint itself
  never hangs or 500s on a DB failure — the check is timeout-guarded and
  caught.
  → See [`docs/API.md § Health Check`](docs/API.md) for the response shape.

- **DB write failures triggered a synchronous `fs.writeFileSync` on every
  investigation.** Whenever `LoggerService.logInvestigation()` failed to
  write to Postgres (e.g. DB down), it fell back to blocking the event loop
  with a raw sync file write that overwrote the same file every time — no
  rotation, no history of prior errors, and it's what caused the
  `error-debug.json` leak above.
  Fix: replaced with a proper Winston file transport
  (`logs/error-debug.log`), non-blocking and structured.
  **Follow-up recommended:** current transport has no `maxsize`/`maxFiles`
  set, so the log file will grow unbounded — add rotation limits before
  relying on this in a long-running deployment.

### Testing
- `tests/health.test.js` updated to assert `status` is one of
  `['healthy', 'degraded']` and that a `database` field is present,
  instead of asserting a hardcoded `'healthy'` that no longer reflected
  reality once the check became real.
- Full suite: 32/32 passing after these changes.

### Known follow-ups (not yet fixed)
- Winston error log has no rotation/size cap — see note above.
- `error-debug.json` was removed from the working tree but remains in git
  history at commit `af8f1a1`; not rewritten since no secrets were exposed
  (only a local folder path).

## [4.0.0] - Prior release

- PostgreSQL persistence via Sequelize, replacing earlier SQLite storage.
- Server-Sent Events (SSE) for real-time batch investigation progress.
- AI-powered chat assistant, executive briefings, and natural-language
  history search (Groq `llama-3.3-70b-versatile`).
- MITRE ATT&CK technique mapping and threat actor attribution engine.
- 6-tab analyst dashboard (Overview, Intelligence, Evidence, Relationships,
  Timeline, Settings).
