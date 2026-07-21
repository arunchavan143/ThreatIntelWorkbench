# API Reference - Threat Intel Workbench Pro V3

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

---

### 6. Health Check
Returns system status, uptime, and API key health validation across configured providers.

```http
GET /health
```

#### Response Example
```json
{
  "status": "healthy",
  "uptime": 3600,
  "timestamp": "2026-07-21T13:40:00Z"
}
```

---

## ⚠️ Error Handling
All endpoints follow a consistent error structure when encountering validation failures or upstream timeouts:

```json
{
  "success": false,
  "error": "Invalid IP address format specified.",
  "code": "VALIDATION_ERROR"
}
```
