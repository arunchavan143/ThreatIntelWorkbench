# 🛡️ Threat Intel Workbench Pro V3

[![Version](https://img.shields.io/badge/Version-3.0.0--V3-F59E0B?style=flat-square)](https://github.com/arunchavan143/demo12)
[![Node.js](https://img.shields.io/badge/Node.js-22.x-339933?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express.js-4.x-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com/)
[![Docker](https://img.shields.io/badge/Docker-Supported-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com/)
[![MITRE ATT&CK](https://img.shields.io/badge/MITRE_ATT&CK-STIX_2.1-EF4444?style=flat-square&logo=mitre&logoColor=white)](https://attack.mitre.org/)
[![AI Powered](https://img.shields.io/badge/AI_Powered-Groq_Llama_3.3-8B5CF6?style=flat-square)](https://groq.com/)

**Threat Intel Workbench Pro** is an advanced, multi-source Security Operations Center (SOC) investigation platform designed for cybersecurity analysts, incident responders, and threat hunters. It correlates real-time telemetry across **15+ integrated intelligence providers**, maps observed indicators directly to the **MITRE ATT&CK® STIX 2.1 framework**, attributes threats to known **Threat Actor APT Profiles**, and generates natural-language executive summaries powered by **Groq AI (`llama-3.3-70b-versatile`)**.

---

## ✨ Key Features

- **🌐 Multi-Source Indicator Investigation**: Seamlessly query IP addresses, domain names, file hashes (MD5/SHA1/SHA256), URLs, and batch indicator lists from a unified, glassmorphism-powered dark UI.
- **🧠 AI-Powered Threat Analysis**: Automatically synthesizes complex telemetry across independent feeds into coherent, natural-language executive briefings and actionable defensive recommendations using Groq AI.
- **🎯 MITRE ATT&CK® Correlation**: Maps multi-source threat signals to documented STIX 2.1 tactics and techniques (`T1059`, `T1566`, `T1071`, `T1016`, etc.) complete with confidence scoring and interactive mitigation plans.
- **🕵️ Threat Actor Attribution Database**: Correlates indicators against an O(1) indexed alias database of 8+ major APT and ransomware groups (`APT29 Cozy Bear`, `Lazarus Group`, `Conti`, `APT28`, `Scattered Spider`, `LockBit`, `Sandworm`, `Emotet`) to reveal origin countries, primary motivations, and targeted industries.
- **📊 6 Professional Analyst Tabs**:
  1. **Overview**: AI summary, visual risk ring, provider consensus cards, and infrastructure data.
  2. **Intelligence**: APT actor profiles, MITRE grid cards, provider status bars, harvested IOC tables, observed TTPs, and AlienVault OTX pulse reports.
  3. **Evidence**: Raw JSON payloads from all providers with one-click copy and download for audit trails.
  4. **Relationships**: Interactive node network graph visualizing connected infrastructure.
  5. **Timeline**: Chronological indicator history including certificate and WHOIS milestones.
  6. **Settings**: Real-time API health checks, in-memory cache purge, and rate limit tracking.
- **📑 Executive Briefing Exports**: One-click generation of beautifully styled PDF investigation reports, CSV IOC feeds, and raw JSON evidence bundles.
- **🐳 Enterprise Docker & Compose Ready**: Multi-stage, secure Alpine-based containerization for instant local deployment or production staging.

---

## 🔌 Integrated Threat Intelligence Providers

| Provider | Telemetry Type | Integration Status |
| :--- | :--- | :--- |
| **VirusTotal** | File Detections, Vendor Categories, Associated Domains | ✅ Active |
| **AbuseIPDB** | IP Confidence Scores, Abuse Reports, ISP/Country Details | ✅ Active |
| **Shodan** | Open Ports, Vulnerabilities, Banner Grabbing | ✅ Active |
| **AlienVault OTX** | Threat Pulses, Related Adversaries, Attack IDs, Malware Tags | ✅ Active |
| **URLScan.io** | DOM Analysis, Screenshots, Phishing Detection | ✅ Active |
| **Groq AI** | Natural Language Synthesis (`llama-3.3-70b-versatile`) | ✅ Active |
| **MITRE ATT&CK®** | STIX 2.1 Tactics, Techniques, and Defensive Mitigations | ✅ Active |
| **Threat Actor DB** | O(1) Alias Index (`700+ aliases`), APT Profile Attribution | ✅ Active |

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v18.x or v22.x LTS
- **npm**: v9.x or higher
- **Docker & Docker Compose** *(Optional for containerized run)*

### Option 1: Local Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/threat-intel-workbench.git
   cd threat-intel-workbench
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   Create a `.env` file in the root directory (or copy `.env.example` if present) and insert your API keys:
   ```env
   PORT=3000
   GROQ_API_KEY=your_groq_api_key_here
   VIRUSTOTAL_API_KEY=your_virustotal_api_key_here
   ABUSEIPDB_API_KEY=your_abuseipdb_api_key_here
   SHODAN_API_KEY=your_shodan_api_key_here
   OTX_API_KEY=your_alienvault_otx_api_key_here
   URLSCAN_API_KEY=your_urlscan_api_key_here
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```

5. **Open the workbench**:
   Navigate to `http://localhost:3000` in your web browser.

---

### Option 2: Docker & Docker Compose Deployment

We provide a production-ready, multi-stage Alpine Docker setup that builds cleanly and securely in seconds.

1. **Ensure your `.env` file is populated** in the project root.
2. **Build and launch with Docker Compose**:
   ```bash
   docker-compose up --build -d
   ```
3. **Verify the container logs**:
   ```bash
   docker-compose logs -f app
   ```
4. Access your fully containerized workbench at `http://localhost:3000`.

To stop the container gracefully:
```bash
docker-compose down
```

---

## 📚 Documentation

Detailed documentation is available inside the [`docs/`](docs/) directory:
- 📖 **[User Guide (`docs/USER_GUIDE.md`)](docs/USER_GUIDE.md)**: Comprehensive breakdown of all tabs, investigation workflows, and export steps.
- ⚙️ **[API Reference (`docs/API.md`)](docs/API.md)**: Complete REST API specification with parameter tables and example JSON responses.
- 🧪 **[Interactive Walkthrough (`walkthrough.md`)](walkthrough.md)**: Engineering log of recent architectural enhancements and diagnostic resolutions.

---

## 🛠️ Technology Stack

- **Backend Architecture**: Node.js 22, Express.js, Axios, Node-Cache
- **Frontend Design System**: HTML5, CSS3 (Vanilla Glassmorphism Theme), Modular JavaScript
- **AI Synthesis Engine**: Groq SDK (`llama-3.3-70b-versatile`)
- **Intelligence Formatting**: STIX 2.1 compliant MITRE ATT&CK objects
- **DevOps & CI/CD**: Docker (Multi-stage Alpine), Docker Compose, ESLint

---

## 📝 License

This project is licensed under the **MIT License**. Designed and engineered for professional SOC analysts and defensive cybersecurity engineers.