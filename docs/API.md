# API Reference - Threat Intel Workbench Pro V4

This document describes the REST API endpoints provided by the **Threat Intel Workbench Pro** backend service.

---

## 🌐 Base URL
When running locally:
```http
http://localhost:3000/api
```

## 🔒 Authentication
No authentication header is required when accessing the API locally. Ensure your API keys for upstream providers are configured inside `.env`.

---

## 🚀 Endpoints

### 1. Investigate IP Address
Retrieves multi-source threat intelligence, geolocation, ASN, MITRE ATT&CK mapping, and risk score for an IPv4 or IPv6 address.

```http
GET /investigate/ip/:ip
```

#### Parameters
| Parameter | Type | In | Description |
|-----------|------|----|-------------|
| `ip` | string | path | The IP address to investigate (e.g., `8.8.8.8`, `77.90.185.20`) |

#### Response Example
```json
{
  "success": true,
  "data": {
    "ioc": {
      "type": "ip",
      "value": "8.8.8.8"
    },
    "risk": {
      "score": 12,
      "verdict": "LOW",
      "factors": []
    },
    "providers": {
      "virustotal": { "success": true, "detections": 0, "total": 88 },
      "abuseipdb": { "success": true, "abuse_score": 0 },
      "shodan": { "success": true, "ports": [53, 443] },
      "otx": { "success": true, "pulses": 5, "pulses_list": [...] }
    },
    "enrichment": {
      "geolocation": { "country": "United States", "city": "Mountain View" },
      "asn": { "number": "AS15169", "organization": "Google LLC" },
      "mitre": [
        { "techniqueId": "T1016", "technique": "System Network Configuration Discovery", "confidence": 90 }
      ],
      "actor": {
        "id": "scattered_spider",
        "primary_name": "Scattered Spider",
        "confidence": 85,
        "confidenceLabel": "HIGH"
      }
    }
  }
}
```

---

### 2. Investigate Domain
Retrieves intelligence, WHOIS registration details, DNS resolutions, and risk scoring for a domain name.

```http
GET /investigate/domain/:domain
```

#### Parameters
| Parameter | Type | In | Description |
|-----------|------|----|-------------|
| `domain` | string | path | The domain name to investigate (e.g., `google.com`) |

---

### 3. Investigate File Hash
Retrieves malware family classification, vendor detections, OTX pulses, and MITRE mapping for a file hash.

```http
GET /investigate/hash/:hash
```

#### Parameters
| Parameter | Type | In | Description |
|-----------|------|----|-------------|
| `hash` | string | path | MD5, SHA-1, or SHA-256 hash string |

---

### 4. Investigate URL
Retrieves screenshot analysis, URLScan telemetry, and phishing risk evaluation for a URL string.

```http
GET /investigate/url?url=:url
```

#### Parameters
| Parameter | Type | In | Description |
|-----------|------|----|-------------|
| `url` | string | query | URL-encoded string to investigate |

---

### 5. Batch Investigation
Performs concurrent or queued investigation across multiple indicators in a single HTTP request.

```http
POST /investigate/batch
Content-Type: application/json
```

#### Request Body
```json
{
  "indicators": [
    "8.8.8.8",
    "google.com",
    "44d88612fea8a8f36de82e1278abb02f"
  ]
}
```

#### Response Example
```json
{
  "success": true,
  "batch_id": "BATCH_1753198000000",
  "total": 3,
  "successful": 3,
  "failed": 0,
  "batch_ai_synthesis": {
    "pattern_summary": "Analysis across 3 indicators reveals distinct operational separation...",
    "infrastructure_correlation": [
      "8.8.8.8 (Google AS15169) - DNS resolving infrastructure",
      "google.com - High reputation domain"
    ],
    "campaign_tracking": "No unified coordinated APT campaign detected across these 3 disparate indicators."
  },
  "results": [
    {
      "indicator": "8.8.8.8",
      "type": "ip",
      "status": "success",
      "data": { ... }
    }
  ]
}
```

---

### 6. Health Check
Returns system status, uptime, memory/cache utilization, and API key configuration verification across all integrated providers.

```http
GET /health
```

#### Response Example
```json
{
  "status": "healthy",
  "version": "4.0.0",
  "timestamp": "2026-07-21T15:20:00.000Z",
  "uptime": 3600.45,
  "cache": {
    "keys": 12,
    "hits": 45,
    "misses": 14,
    "ksize": 182,
    "vsize": 148290
  },
  "providers": {
    "virustotal": { "configured": true, "placeholder": false },
    "abuseipdb": { "configured": true, "placeholder": false },
    "shodan": { "configured": true, "placeholder": false },
    "otx": { "configured": true, "placeholder": false },
    "urlscan": { "configured": true, "placeholder": false },
    "groq": { "configured": true, "placeholder": false }
  }
}
```

---

### 7. API System Metadata
Returns gateway documentation, dynamic semantic version (`4.0.0`), status, and available REST endpoint definitions.

```http
GET /api
```

#### Response Example
```json
{
  "name": "Threat Intel Workbench Pro API Gateway",
  "version": "4.0.0",
  "status": "operational",
  "endpoints": {
    "health": "/health",
    "investigate": {
      "ip": "/api/investigate/ip/:ip",
      "domain": "/api/investigate/domain/:domain",
      "hash": "/api/investigate/hash/:hash",
      "url": "/api/investigate/url?url=:url",
      "batch": "/api/investigate/batch",
      "chat": "/api/investigate/chat"
    },
    "export": {
      "aiBrief": "/api/export/ai-brief"
    },
    "history": {
      "aiSearch": "/api/history/ai-search"
    }
  }
}
```

---

### 8. AI Conversational Chat Assistant (`Priority 4`)
Engages Groq (`llama-3.3-70b-versatile`) in an interactive analytical dialogue contextualized by the active indicator investigation.

```http
POST /investigate/chat
Content-Type: application/json
```

#### Request Body
```json
{
  "messages": [
    { "role": "user", "content": "Explain technique T1016 observed for this IP." }
  ],
  "context": {
    "ioc": { "type": "ip", "value": "77.90.185.20" },
    "risk": { "score": 85, "verdict": "CRITICAL" },
    "findings": ["VirusTotal: 14/88 detections", "AbuseIPDB: 100% abuse confidence"],
    "mitre": [{ "techniqueId": "T1016", "technique": "System Network Configuration Discovery" }],
    "actor": { "primary_name": "Lazarus Group" }
  }
}
```

#### Response Example
```json
{
  "success": true,
  "reply": "MITRE Technique **T1016 (System Network Configuration Discovery)** indicates that adversaries check operating system network settings to map network architecture...",
  "model": "llama-3.3-70b-versatile"
}
```

---

### 9. AI Smart Report & Alert Generator (`Priority 5, 7 & 8`)
Synthesizes comprehensive, structured Markdown dossiers across multiple formats: C-suite **Executive Summary**, **Technical Report**, **Slack/Email Alert (`Priority 7`)**, and **Incident Response Timeline (`Priority 8`)**. Accepts pruned payload summaries (`sanitizeForAI`) under `~1.5KB` and supports up to `10MB` request payloads.

```http
POST /export/ai-brief
Content-Type: application/json
```

#### Request Body
```json
{
  "format": "technical",
  "data": {
    "ioc": { "type": "ip", "value": "77.90.185.20" },
    "risk": { "score": 85, "verdict": "CRITICAL" },
    "findings": ["VirusTotal: 14/88 detections", "Shodan: 4 vulnerabilities"],
    "enrichment": { "actor": { "primary_name": "Lazarus Group" } }
  }
}
```

#### Response Example
```json
{
  "success": true,
  "format": "technical",
  "report": "# Technical SOC Incident Report\n## Observable: 77.90.185.20\n...",
  "model": "llama-3.3-70b-versatile"
}
```

---

### 10. AI Natural Language History Search (`Priority 10`)
Performs conversational intelligence queries against stored and cached investigations using Groq AI. Returns actionable explanations alongside matching historical indicators.

```http
POST /history/ai-search
Content-Type: application/json
```

#### Request Body
```json
{
  "query": "Show me all high risk IP addresses investigated today"
}
```

#### Response Example
```json
{
  "success": true,
  "answer": "Here are the high-risk IP indicators currently tracked in your investigation history:",
  "matching_iocs": [
    {
      "ioc": "77.90.185.20",
      "type": "ip",
      "verdict": "CRITICAL",
      "score": 85
    }
  ]
}
```

---

## ⚠️ Error Handling
All endpoints follow a consistent error structure when encountering validation failures, payload limits (`413 Request Entity Too Large`), or upstream timeouts:

```json
{
  "success": false,
  "error": "Invalid IP address format specified.",
  "code": "VALIDATION_ERROR"
}
```
