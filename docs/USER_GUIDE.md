# User Guide - Threat Intel Workbench Pro V4

Welcome to the **Threat Intel Workbench Pro** User Guide. This document walks you through investigating Indicators of Compromise (IOCs), interpreting multi-source threat intelligence, analyzing MITRE ATT&CK mapping and Threat Actor attribution, and generating professional reports.

---

## 🚀 Getting Started

### 1. Investigating an IOC

1. Open the application in your browser at `http://localhost:3000`.
2. In the top search bar, select the appropriate **IOC Type**:
   - **IP Address**: e.g., `8.8.8.8`, `77.90.185.20`
   - **Domain**: e.g., `google.com`, `evil-domain.local`
   - **File Hash**: e.g., MD5, SHA-1, SHA-256
   - **URL**: e.g., `https://suspicious-site.tld/login.php`
   - **Batch**: Check multiple indicators simultaneously
3. Enter the indicator value into the input field and click **Investigate**.

---

## 🔍 Understanding Investigation Results

The investigation dashboard is divided into 6 professional analyst tabs:

### 📊 1. Overview Tab
- **AI Summary**: Natural language threat analysis powered by Groq (`llama-3.3-70b-versatile`). Summarizes key findings, provider consensus, and potential impact.
- **AI False Positive Triage**: Automated balancing evaluation analyzing benign context vs. threat indicators, providing a clear triage verdict (`Likely True Positive`, `Likely Benign/False Positive`, etc.) and explanation.
- **Immediate Action Recommendations & Next Steps**: Bulleted containment instructions, defensive mitigation guidance, and prioritized investigative follow-ups.
- **Risk Ring & Verdict**: Visual score gauge ranging from `0` to `100` with verdict labels (`CLEAN`, `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).
- **Provider Status Cards**: At-a-glance summary cards showing detection counts and status for VirusTotal, AbuseIPDB, Shodan, AlienVault OTX, URLScan, and more.
- **Infrastructure Details**: Geolocation map data, Autonomous System Number (ASN), ISP, and registration details.

### 🧠 2. Intelligence Tab
- **Threat Actor Profile Box**: Multi-source correlation engine identifying likely Advanced Persistent Threat (APT) groups behind the indicator (e.g., `APT29 / Cozy Bear`, `Lazarus Group`, `Conti`, `Scattered Spider`). Displays origin flags, known aliases, primary motivations, targeted industry sectors, and historical campaigns.
- **MITRE ATT&CK® Techniques**: Interactive color-coded grid cards mapping observed behaviors (`T1059`, `T1566`, `T1071`, `T1016`) to MITRE ATT&CK tactics (`Initial Access`, `Execution`, `Command and Control`). Click any card to view detailed mitigation steps.
- **Provider Breakdown**: Visual status bars highlighting real-time threat severity across each integrated intelligence provider (`Critical`, `Warning`, `Clean`, `Offline`).
- **Related IOCs**: Comprehensive list of associated domains, IP addresses, and file hashes harvested from AlienVault OTX pulses and VirusTotal infrastructure resolutions.
- **Observed TTPs**: Numbered list of Tactics, Techniques, and Procedures documented for the indicator.
- **Related Intelligence Reports**: Interactive cards displaying AlienVault OTX threat pulses, indicator counts, dates, and author summaries. Click to open full descriptions.

### 📜 3. Evidence Tab
- Displays unedited, raw JSON responses returned from every integrated API provider.
- Includes quick **Copy JSON** and **Download as JSON** buttons for chain-of-custody documentation and auditing.

### 🌐 4. Relationships Tab
- Interactive node network visualization illustrating the structural relationships between the queried indicator, resolved IP addresses, associated domains, and communicating hashes.

### ⏱️ 5. Timeline Tab
- Chronological historical record showing initial observation dates, SSL/TLS certificate validity windows, WHOIS registration timestamps, and recent pulse detections.

### ⚙️ 6. Settings Tab
- **API Health Check**: Real-time status indicators confirming API key validity (`Configured vs. Placeholder`) across all integrated providers.
- **Cache Management**: Monitor in-memory and file-based cache utilization (`keys`, `hits`, `misses`) with one-click instant purge capability.
- **Rate Limit Status**: Track API consumption (`100 req/15min`) and remaining quota thresholds.

---

## 🤖 AI-Powered Intelligence & Analytical Suite

Threat Intel Workbench Pro provides a 10/10 AI analytical toolkit powered by Groq Llama 3.3 70B:

### 💬 1. AI Conversational Assistant (`Priority 4`)
- Located as a floating robot button (`✨ AI Assistant`) in the bottom right corner of any page.
- **Contextual Awareness**: Automatically inherits the active indicator, risk score, MITRE techniques, and APT profile.
- **Quick-Chip Prompts**: Click pre-built chips like *"Explain MITRE techniques"*, *"Why is this score high?"*, or *"Immediate containment steps"* for instant analysis.
- **Custom Queries**: Ask complex questions in natural language. All responses are formatted via our custom `parseMarkdown` engine into structured glassmorphic cards with numbered TTP badges.

### 📑 2. AI Smart Report & Alert Generator (`Priority 5, 7 & 8`)
- Click **✨ AI Smart Report Generator** in the top action bar of any active investigation.
- Generates multi-format dossiers inside an interactive modal with tab switching:
  1. **Executive Summary**: C-suite CISO briefing focusing on business risk, attribution, and containment.
  2. **Technical Report**: Exhaustive SOC incident report detailing observables, detection counts, MITRE TTPs, and detection engineering rules (SIEM/EDR).
  3. **Slack / Email Alert (`Priority 7`)**: High-urgency incident notification template with emoji headers and bulleted mandatory blocking actions.
  4. **IR Timeline (`Priority 8`)**: Chronological Incident Response table projecting pre-attack staging, initial alerts, and SOC triage milestones.
- **Smart Pruning (`sanitizeForAI`)**: Trims heavy raw API payloads under `~1.5KB` before sending, preventing `413 Request Entity Too Large` and context window overflow.
- **One-Click Export**: Copy clean Markdown to clipboard or click **Download Report** (`.md`).

### 📦 3. AI Bulk IOC Analysis & Campaign Tracking (`Priority 6 & 9`)
- When querying up to 10 indicators in the **Batch** tab, the platform generates a top-level **AI Bulk Correlation & Campaign Tracking** card.
- **Pattern Synthesis**: Highlights shared infrastructure characteristics across indicators.
- **ASN & Infrastructure Correlation**: Identifies common ASNs, subnets, or domain registrars.
- **Threat Campaign Tracking**: Determines whether indicators belong to a coordinated APT campaign or isolated events.

### 🔎 4. AI Natural Language History Search (`Priority 10`)
- Located right below the primary search bar on the home dashboard (`Press Ctrl+Enter to investigate`).
- Enter natural language queries such as *"Show high risk domains investigated today"* or *"Find indicators associated with Lazarus Group"*.
- Returns an AI explanation along with interactive, clickable indicator chips (`[ 8.8.8.8 (CRITICAL) ]`) that load the full investigation instantly.

---

## 📑 Exporting Reports & Preserving Evidence

To share investigation results across your organization:
1. **AI Dossier (`.md` / Clipboard)**: Use the **✨ AI Smart Report Generator** to generate C-suite executive summaries, SOC technical reports, or Slack/Email alerts (`Priority 7`).
2. **Executive PDF Briefing**: Click **Export PDF** in the action bar to trigger a clean, print-friendly dossier.
3. **SIEM / SOAR Ingestion (`.csv` / `.json`)**: Navigate to the **Evidence** tab or use the action bar buttons (`Export CSV`, `Export JSON`) to download raw telemetry for ingestion into Splunk, Sentinel, or Cortex XSOAR.
