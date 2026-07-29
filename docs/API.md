# Threat Intel Workbench Pro V4 - API Documentation

## Overview

- **Base URL:** `http://localhost:3000/api`
- **Response Format:** All endpoints return JSON
- **Error Format:** `{ "success": false, "error": "message" }`

## Authentication

This tool is designed for local SOC analyst use. Authentication is intentionally omitted for simplicity. In production, add an API key middleware if needed.

## Rate Limiting

- **Limit:** 100 requests per 15-minute window
- **Headers:** `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

---

## Endpoints

### 1. IP Investigation

**Endpoint:** `GET /investigate/ip/:ip`

**Description:** Investigate an IP address using all integrated threat intelligence sources.

**Parameters:**
| Name | Type | Location | Required | Description |
|------|------|----------|----------|-------------|
| ip | string | path | Yes | IPv4 or IPv6 address (e.g., 8.8.8.8) |

**Response (200 OK):**
```json
{
  "success": true,
  "cached": false,
  "data": {
    "ioc": { "type": "ip", "value": "8.8.8.8" },
    "risk": {
      "score": 0,
      "verdict": "LOW",
      "color": "#22c55e",
      "confidence": 100,
      "sources": 4,
      "total_sources": 6
    },
    "ai_summary": {
      "text": "Google's public DNS resolver shows no malicious activity...",
      "model": "llama-3.3-70b-versatile",
      "provider": "groq"
    },
    "providers": {
      "virustotal": {
        "success": true,
        "detections": 0,
        "total": 37,
        "ratio": "0/37"
      },
      "abuseipdb": {
        "success": true,
        "abuse_score": 0,
        "country": "US"
      },
      "shodan": { "success": true, "ports": [443, 53] },
      "otx": { "success": true, "pulses": 0 }
    },
    "enrichment": {
      "geolocation": {
        "success": true,
        "country": "United States",
        "city": "Ashburn",
        "isp": "Google LLC"
      },
      "asn": {
        "success": true,
        "asn": "15169",
        "as_name": "Google Public DNS"
      }
    },
    "processing_time": "1234ms",
    "timestamp": "2026-07-27T12:34:56.789Z",
    "investigation_id": "inv_1234567890"
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": "Invalid IP address format"
}
```

**Error Response (500):**
```json
{
  "success": false,
  "error": "Internal server error"
}
```

---

### 2. Domain Investigation

**Endpoint:** `GET /investigate/domain/:domain`

**Description:** Investigate a domain name with WHOIS, DNS, SSL, and threat intelligence.

**Parameters:**
| Name | Type | Location | Required | Description |
|------|------|----------|----------|-------------|
| domain | string | path | Yes | Domain name (e.g., google.com) |

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "ioc": { "type": "domain", "value": "google.com" },
    "risk": {
      "score": 0,
      "verdict": "LOW",
      "confidence": 80,
      "sources": 2,
      "total_sources": 7
    },
    "ai_summary": {
      "text": "Google.com is a legitimate domain with no malicious activity...",
      "model": "llama-3.3-70b-versatile"
    },
    "providers": {
      "virustotal": { "success": true, "detections": 0, "total": 31 },
      "otx": { "success": true, "pulses": 0 }
    },
    "enrichment": {
      "whois": {
        "success": true,
        "registrar": "MarkMonitor, Inc.",
        "creation_date": "1997-09-15"
      },
      "dns": {
        "success": true,
        "a": ["142.250.1.1"],
        "mx": [{ "priority": 10, "exchange": "alt1.aspmx.l.google.com" }]
      },
      "ssl": {
        "success": true,
        "subject": "*.google.com",
        "issuer": "Google Trust Services"
      },
      "subdomains": {
        "success": true,
        "subdomains": ["mail.google.com", "drive.google.com"],
        "count": 2
      }
    },
    "processing_time": "2899ms",
    "investigation_id": "inv_1234567890"
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": "Invalid domain format"
}
```

---

### 3. Hash Investigation

**Endpoint:** `GET /investigate/hash/:hash`

**Description:** Investigate a file hash (MD5, SHA1, or SHA256) using VirusTotal and OTX.

**Parameters:**
| Name | Type | Location | Required | Description |
|------|------|----------|----------|-------------|
| hash | string | path | Yes | MD5 (32 hex), SHA1 (40 hex), or SHA256 (64 hex) |

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "ioc": { "type": "hash", "value": "44d88612fea8a8f36de82e1278abb02f" },
    "risk": {
      "score": 95,
      "verdict": "CRITICAL",
      "color": "#ef4444",
      "confidence": 100,
      "sources": 2,
      "total_sources": 2
    },
    "ai_summary": {
      "text": "This hash corresponds to WannaCry ransomware...",
      "model": "llama-3.3-70b-versatile"
    },
    "providers": {
      "virustotal": {
        "success": true,
        "detections": 38,
        "total": 72,
        "ratio": "38/72",
        "file_type": "PE32 executable"
      },
      "otx": {
        "success": true,
        "pulses": 15,
        "malware_family": "WannaCry"
      }
    },
    "processing_time": "1500ms",
    "investigation_id": "inv_1234567890"
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": "Invalid hash format. Must be MD5, SHA1, or SHA256"
}
```

---

### 4. URL Investigation

**Endpoint:** `GET /investigate/url?url=https://example.com`

**Description:** Investigate a URL using URLScan.io.

**Parameters:**
| Name | Type | Location | Required | Description |
|------|------|----------|----------|-------------|
| url | string | query | Yes | Full URL to investigate |

**Response (200 OK):**
```json
{
  "success": true,
  "cached": false,
  "data": {
    "ioc": { "type": "url", "value": "https://google.com" },
    "risk": { "score": 0, "verdict": "LOW", "confidence": 80 },
    "providers": {
      "urlscan": {
        "success": true,
        "uuid": "019f7a87-cc88-753c-a7b5-f2efd4fdecbb",
        "page": {
          "title": "Google",
          "domain": "www.google.com",
          "server": "gws"
        },
        "verdicts": {
          "overall": { "malicious": false }
        }
      }
    },
    "processing_time": "3200ms",
    "investigation_id": "inv_1234567890"
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": "Missing 'url' query parameter"
}
```

---

### 5. Batch Investigation

**Endpoint:** `POST /investigate/batch`

**Description:** Investigate multiple IOCs in a single request (max 10).

**Headers:**
- `Content-Type: application/json`

**Request Body:**
```json
{
  "indicators": ["8.8.8.8", "google.com", "e9c028ecb3a6fb2e..."]
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "batch_id": "batch_1234567890",
  "summary": {
    "total": 3,
    "successful": 3,
    "failed": 0,
    "types": {
      "ip": 1,
      "domain": 1,
      "hash": 1,
      "url": 0,
      "unknown": 0
    }
  },
  "results": [
    {
      "indicator": "8.8.8.8",
      "type": "ip",
      "data": { ... }
    },
    {
      "indicator": "google.com",
      "type": "domain",
      "data": { ... }
    }
  ]
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": "Max 10 indicators per batch"
}
```

---

### 6. Batch Streaming (SSE)

**Endpoint:** `GET /investigate/batch-stream?batchId=...`

**Description:** Batch investigation with Server-Sent Events for real-time progress updates.

**Headers:**
- `Accept: text/event-stream`

**Response:** Server-Sent Events stream

**Event Format:**
```
data: {"batchId":"batch_123","total":3,"completed":1,"percentage":33,"results":[{"indicator":"8.8.8.8","data":{...}}],"current":"Processing 2/3","done":false}

data: {"batchId":"batch_123","total":3,"completed":2,"percentage":66,"results":[...],"done":false}

data: {"batchId":"batch_123","total":3,"completed":3,"percentage":100,"results":[...],"done":true}
```

**Error Events:**
```
event: error
data: {"error":"Failed to process indicator"}
```

---

### 7. Health Check

**Endpoint:** `GET /health`

**Description:** Check system health, database connectivity, and API key status. `status` is derived from real-time checks — it is not hardcoded.

**Response (200 OK) — database connected:**
```json
{
  "status": "healthy",
  "uptime": 123.45,
  "timestamp": "2026-07-27T12:34:56.789Z",
  "database": "connected",
  "apis": {
    "virustotal": true,
    "abuseipdb": true,
    "shodan": true,
    "otx": true,
    "urlscan": true,
    "groq": true
  },
  "cache": {
    "hits": 42,
    "misses": 15,
    "hitRate": 73,
    "keys": 5,
    "ttl": 1800
  }
}
```

**Response (200 OK) — database unreachable:**
```json
{
  "status": "degraded",
  "uptime": 123.45,
  "timestamp": "2026-07-27T12:34:56.789Z",
  "database": "disconnected",
  "apis": { "...": "..." },
  "cache": { "...": "..." }
}
```

`database` is checked via `sequelize.authenticate()` with a 2-second timeout on every call to `/health`, so it always reflects live Postgres connectivity rather than an assumption. When the database is unreachable, `status` flips to `"degraded"` — the endpoint still returns `200 OK` (it reports health, it doesn't gate on it), so check the `status` and `database` fields rather than the HTTP status code alone. `apis.*` reflects whether each provider key is present and non-placeholder in `.env`, not whether the provider is currently reachable.

---

### 7a. MITRE ATT&CK STIX Sync

**Endpoint:** `POST /api/mitre/sync`

**Description:** Downloads the current MITRE ATT&CK Enterprise STIX 2.1 bundle from `raw.githubusercontent.com/mitre/cti` and caches it locally at `data/enterprise-attack-cache.json` (~40MB, gitignored — regenerated on demand, not committed). This populates the actor attribution engine (`getIntrusionSets()`) with live MITRE data instead of the built-in curated fallback list. Safe to call repeatedly; a sync already in progress is a no-op.

**Response (200 OK):**
```json
{
  "success": true,
  "message": "MITRE ATT&CK STIX 2.1 dataset synchronization triggered successfully."
}
```

**Response (500) — e.g. network unreachable:**
```json
{
  "success": false,
  "error": "<error message>"
}
```
If sync fails, the app falls back to whatever cache already exists on disk (or the curated actor list if no cache exists yet) — investigation continues to work, it just won't reflect the latest MITRE dataset until sync succeeds.

---

### 8. Investigation History

**Endpoint:** `GET /history?limit=50`

**Description:** Retrieve recent investigation history from the database.

**Parameters:**
| Name | Type | Location | Required | Description |
|------|------|----------|----------|-------------|
| limit | integer | query | No | Max records (default: 50) |

**Response (200 OK):**
```json
{
  "success": true,
  "count": 50,
  "limit": 50,
  "data": [
    {
      "id": 1,
      "ioc": "8.8.8.8",
      "type": "ip",
      "risk_score": 0,
      "verdict": "LOW",
      "sources": 4,
      "timestamp": "2026-07-27T12:34:56.789Z"
    }
  ]
}
```

---

### 9. AI Chat Assistant

**Endpoint:** `POST /investigate/chat`

**Description:** Ask natural language questions about the current investigation.

**Headers:**
- `Content-Type: application/json`

**Request Body:**
```json
{
  "message": "Why is this score 75?",
  "investigation_id": "inv_1234567890"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "response": "The score is 75 because VirusTotal detected 15/72 and AbuseIPDB shows 85% abuse confidence...",
  "model": "llama-3.3-70b-versatile"
}
```

---

### 10. MITRE ATT&CK Sync

**Endpoint:** `POST /mitre/sync`

**Description:** Synchronize local MITRE STIX data with the latest MITRE CTI feed.

**Response (200 OK):**
```json
{
  "success": true,
  "message": "MITRE STIX data synchronized successfully",
  "techniques_updated": 142,
  "timestamp": "2026-07-27T12:34:56.789Z"
}
```

---

### 11. AI Report Generator

**Endpoint:** `POST /export/ai-report`

**Description:** Generate AI-powered intelligence reports in multiple formats.

**Headers:**
- `Content-Type: application/json`

**Request Body:**
```json
{
  "investigation_id": "inv_1234567890",
  "format": "executive"
}
```

**Supported Formats:**
| Format | Description |
|--------|-------------|
| `executive` | C-suite executive summary |
| `technical` | Detailed technical report |
| `alert` | Slack/email alert template |
| `timeline` | Incident response timeline |

**Response (200 OK):**
```json
{
  "success": true,
  "format": "executive",
  "content": "# Executive Summary\n\nCritical threat identified...",
  "investigation_id": "inv_1234567890"
}
```

---

### 12. History Search (Natural Language)

**Endpoint:** `POST /history/ai-search`

**Description:** Search historical investigations using natural language AI query.

**Headers:**
- `Content-Type: application/json`

**Request Body:**
```json
{
  "query": "Show me all critical IPs from last week"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "query": "Show me all critical IPs from last week",
  "answer": "Here are the critical IPs...",
  "matching_iocs": [
    {
      "ioc": "185.220.101.42",
      "type": "ip",
      "verdict": "CRITICAL"
    }
  ]
}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid input format |
| 404 | Not Found - Resource doesn't exist |
| 413 | Payload Too Large - Request exceeds size limit (10MB) |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Something went wrong |
