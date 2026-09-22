# Threat Intel Workbench Backend Architecture

## 1. Overview
The Threat Intel Workbench V4 is a local backend designed for SOC Analysts. It prioritizes speed, efficiency, and zero bloat. Data persistence is managed via PostgreSQL and Sequelize ORM.

## 2. What Data Is Stored (Database Schema)
The PostgreSQL database consists of 6 primary models:
- **investigations**: Stores high-level investigation context (Indicator, Type, Provider Count, Risk Score, Confidence, Verdict).
- **ai_chats**: Persists analyst AI conversations (Messages, Summary) to maintain ongoing context.
- **reports**: Tracks generated exports (PDF, HTML, MD, JSON).
- **api_usage**: Tracks daily API requests per provider to prevent exhaustion of free-tier quotas.
- **settings**: Application-level preferences (e.g., risk thresholds).
- **audit_logs**: Key lifecycle events (config changes, failures).

## 3. Why It Is Stored
We store this data to:
- Provide analysts with a searchable history of past indicators.
- Protect limited API keys from rate-limiting bans.
- Maintain an audit trail of decisions and reports.
**Note:** We do NOT store full, raw API JSON responses in the DB to prevent database bloat. Raw responses belong in memory caches.

## 4. Where It Is Stored
All relational data is stored in the local PostgreSQL instance via Sequelize.
Raw request/error logs are written to flat files via Winston (`logs/error-debug.log`).

## 5. Retention Policy
As a local tool, there is no hardcoded deletion. However, analysts are encouraged to use the settings interface to purge `audit_logs` older than 90 days.

## 6. Cache Policy (Part 6 Implementation)
To achieve "Intelligent Caching":
- Caching occurs at two layers: Route Level and Provider Level.
- **Provider Level Cache (`api-wrapper.js`)**: Before any HTTP call to VT, Shodan, OTX, etc., `NodeCache` is checked. If the exact same IOC is queried twice within the TTL window, the external call is skipped entirely, saving quota and time.
- API Usage counts (`updateApiUsage`) are ONLY incremented on successful, non-cached outbound network requests.
- **TTL**: Configurable via `.env` (default is 10 minutes to ensure fresh intelligence while preventing spam).

## 7. Database Relationships
While the tables operate independently for simplicity, logical links exist:
- `reports.investigation_id` maps to an `investigation_id` created during the initial indicator analysis.

## 8. Startup Sequence
When `npm start` is executed:
1. Express app initializes middleware (Helmet, CORS, Rate Limit).
2. `db.sequelize.authenticate()` tests the DB connection asynchronously (with a 3-second timeout).
3. The server starts listening on PORT 3000.
4. A professional diagnostic banner is printed, indicating exactly which API keys are configured, and the real-time status of the PostgreSQL connection. Failures gracefully log without crashing the server.
