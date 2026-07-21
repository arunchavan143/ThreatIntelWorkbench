# 🛡️ Threat Intel Workbench Pro

<div align="center">

![Node.js](https://img.shields.io/badge/Node.js-v18%2B-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-v4-000000?style=for-the-badge&logo=express&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6%2B-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![CSS3](https://img.shields.io/badge/Styling-Modern%20CSS-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)

**A high-performance, multi-source Indicator of Compromise (IOC) investigation & intelligence correlation platform.**  
Designed for Security Operations Centers (SOC), Threat Analysts, and Incident Responders.

</div>

---

## 📸 Screenshots & Visual Preview

> **Note for Contributors / Setup:**  
> Please upload your screenshots into the `docs/screenshots/` folder (or update the paths below) to showcase the interface.

| **1. Search & Dashboard Overview** | **2. Investigation Overview & Risk Engine** |
| :---: | :---: |
| ![Search Dashboard](docs/screenshots/01-search-dashboard.png)<br>*(Multi-IOC search: IP, Domain, Hash, URL, and Batch input)* | ![Overview Tab](docs/screenshots/02-overview-risk-score.png)<br>*(Unified risk scoring, AI synthesis, and infrastructure map)* |

| **3. Intelligence & MITRE ATT&CK TTPs** | **4. Evidence & Raw Telemetry Inspector** |
| :---: | :---: |
| ![Intelligence Tab](docs/screenshots/03-intelligence-mitre-ttps.png)<br>*(MITRE technique mapping, threat actors, and related pulses)* | ![Evidence Tab](docs/screenshots/04-evidence-telemetry.png)<br>*(Syntax-highlighted API telemetry with one-click copy & download)* |

| **5. Radial Relationship Network Graph** | **6. PDF Dossier & Export Capabilities** |
| :---: | :---: |
| ![Relationships Tab](docs/screenshots/05-relationships-graph.png)<br>*(Interactive SVG network connecting ports, ASN, and detections)* | ![Export Dossier](docs/screenshots/06-export-report.png)<br>*(Printable executive PDF reports, CSV data dumps, and JSON logs)* |

---

## 🌟 Key Features

### 🔍 Multi-Type IOC & Batch Investigation
- **IP Address Investigation**: IPv4 and IPv6 analysis with ASN, ISP, geolocation, and open port scanning.
- **Domain Name Investigation**: Subdomain discovery, WHOIS/DNS enrichment, and reputation checks.
- **File Hash Investigation**: SHA256, SHA1, and MD5 multi-engine malware detections and category tags.
- **URL Investigation**: Sandbox web scanning, screenshot capture indicators, and phishing verification.
- **High-Speed Batch Mode**: Investigate up to **10 IOCs simultaneously** with summarized success/failure breakdown tables.

### 🧠 Integrated Threat Intelligence Providers
Correlates real-time data across industry-leading threat intelligence engines and AI inference APIs:

| Provider | Description | Capability | Rate Limit |
| :--- | :--- | :--- | :--- |
| **VirusTotal** | Multi-engine anti-malware and domain reputation scanner | Detections, categories, vendor breakdown | 4 req/min |
| **AbuseIPDB** | Crowdsourced IP address abuse reporting and confidence metrics | Abuse confidence scores, reporter history | 30 req/min |
| **Shodan** | Search engine for internet-connected devices | Open ports, running services, banner grabs | 60 req/min |
| **AlienVault OTX** | Open Threat Exchange collaborative pulse database | Threat pulses, adversary attribution, TTP tags | 60 req/min |
| **URLScan.io** | Sandbox scanner for web sites and URL indicator analysis | DOM snapshots, HTTP requests, screenshot metrics | 30 req/min |
| **Groq AI** | High-speed LLM inference engine (`llama-3.3-70b-versatile`) | Executive AI threat synthesis and risk summaries | 30 req/min |

---

## 🖥️ Interactive Investigation Tabs

1. **📊 Overview Tab**:
   - Multi-source weighted **Risk Verdict Engine** (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`, `CLEAN`).
   - Automated **AI Executive Summary** explaining key threat findings.
   - Interactive infrastructure details (ASN, Country, ISP) and quick telemetry metrics.
2. **🧩 Intelligence Tab**:
   - **MITRE ATT&CK Matrix Mapping**: Clickable tactics and techniques observed across provider pulses.
   - **Threat Actor Profiles**: Associated campaigns, malware families, and confidence indicators.
   - **Observed TTPs & Related IOCs**: Categorized indicator lists with defensive safeguard checks.
3. **🧾 Evidence Tab**:
   - **Raw Telemetry Inspector**: Navigate individual provider JSON payloads cleanly.
   - One-click **Copy Provider JSON** or download the complete payload for forensic archiving.
4. **🕸️ Relationships Tab**:
   - **Interactive Radial Node Graph**: Standalone zero-dependency SVG visualization connecting central IOCs to open ports, infrastructure, and threat pulses.
   - Click any node to copy its indicator or pivot directly to further investigations.
5. **⏳ Timeline & Settings Tabs**:
   - **Chronological Milestones**: Track first/last seen scan dates, SSL expiry, and certificate transparency history.
   - **Live Feed Health Monitor**: Real-time API connectivity checks and uptime tracking.
6. **📥 Comprehensive Export Utilities**:
   - **PDF Report Generation**: Pop-up print-ready executive dossier with risk breakdowns and recommendations.
   - **CSV Export**: Standardized tabular export for ingestion into SIEMs or Excel.
   - **JSON Dump**: Complete investigation payload download.

---

## 🚀 Installation & Setup

### Prerequisites
- **Node.js**: `v18.0.0` or higher
- **npm**: `v8.0.0` or higher

### 1. Clone the Repository
```bash
git clone https://github.com/arunchavan143/demo12.git
cd threat-intel-workbench-backend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the root directory by copying or configuring the variables below:
```bash
# Server Port
PORT=3000

# Threat Intelligence Provider API Keys (Optional - will gracefully fallback if omitted)
VIRUSTOTAL_API_KEY=your_virustotal_api_key_here
ABUSEIPDB_API_KEY=your_abuseipdb_api_key_here
SHODAN_API_KEY=your_shodan_api_key_here
OTX_API_KEY=your_alienvault_otx_api_key_here
URLSCAN_API_KEY=your_urlscan_api_key_here
GROQ_API_KEY=your_groq_api_key_here
```

### 4. Start the Application

#### Development Mode (with auto-restart via nodemon)
```bash
npm run dev
```

#### Production Mode
```bash
npm start
```

Access the platform in your browser at:  
👉 **`http://localhost:3000`**

---

## 🔌 REST API Reference

The backend exposes RESTful endpoints suitable for automation, SOAR integration, and custom tooling:

### `GET /api/investigate/:type/:value`
Investigate a single indicator of compromise.
- **Parameters**:
  - `type`: `ip` | `domain` | `hash` | `url`
  - `value`: The target indicator string (e.g., `8.8.8.8`)
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "ioc": { "value": "8.8.8.8", "type": "ip" },
      "risk": { "verdict": "LOW", "score": 15, "confidence": 85 },
      "providers": { "virustotal": { ... }, "abuseipdb": { ... } },
      "enrichment": { "geolocation": { ... }, "asn": { ... } },
      "ai_summary": { "text": "..." },
      "processing_time": "1420ms"
    }
  }
  ```

### `POST /api/batch`
Perform multi-indicator batch investigations.
- **Request Body**:
  ```json
  {
    "indicators": ["8.8.8.8", "google.com", "44d88612fea8a8f36de82e1278abb02f"]
  }
  ```

### `GET /health`
Returns system uptime, cache statistics, and real-time feed connectivity checks.

### `POST /api/export/json` & `POST /api/export/csv`
Server-side data formatting and file download endpoints.

---

## 📁 Project Structure

```text
threat-intel-workbench-backend/
├── frontend/                  # Static SPA Frontend
│   ├── css/
│   │   └── style.css          # Design system & responsive layout styling
│   ├── js/
│   │   ├── tabs/              # Modular tab renderers
│   │   │   ├── evidence.js    # Raw JSON telemetry viewer & download
│   │   │   ├── export.js      # PDF dossier, CSV, and JSON export utilities
│   │   │   ├── intelligence.js# MITRE ATT&CK, actor profiles, and related IOCs
│   │   │   └── relationships.js# Radial SVG indicator network graph
│   │   ├── api.js             # Client-side API fetch client & batch handlers
│   │   ├── app.js             # Main application lifecycle & event orchestration
│   │   ├── ui.js              # Overview, Timeline, and Settings UI helpers
│   │   └── utils.js           # Client-side string & date formatting helpers
│   └── index.html             # Single Page Application (SPA) structure
├── src/                       # Express Backend
│   ├── config/                # Constants, provider metadata, and risk weights
│   ├── middleware/            # Rate limiting, logging, auth & error handling
│   ├── routes/                # Modular REST route definitions
│   ├── services/              # API clients (VirusTotal, AbuseIPDB, Shodan, OTX, Groq, etc.)
│   ├── utils/                 # Data formatters, validators, and helpers
│   └── app.js                 # Express server entry point
├── docs/
│   └── screenshots/           # Screenshot image directory
├── .env                       # Environment configuration (API keys)
├── .eslintrc.json             # Code quality and linter rules
├── package.json               # Project scripts & dependencies
└── README.md                  # Project documentation
```

---

## 🧪 Code Quality & Verification

Run syntax checks across the codebase:
```bash
node -c src/app.js
```

Run linter validation:
```bash
npm run lint
```

---

## 🤝 Contributing
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to your branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License
This project is licensed under the **MIT License** - see the LICENSE file for details.