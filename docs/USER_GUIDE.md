# User Guide - Threat Intel Workbench Pro V3

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
- **Risk Ring & Verdict**: Visual score gauge ranging from `0` to `100` with verdict labels (`CLEAN`, `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).
- **Provider Status Cards**: At-a-glance summary cards showing detection counts and status for VirusTotal, AbuseIPDB, Shodan, AlienVault OTX, URLScan, and more.
- **Infrastructure Details**: Geolocation map data, Autonomous System Number (ASN), ISP, and registration details.
- **Actionable Recommendations**: Clear containment, defensive mitigation, and blocklist guidance based on the risk score.

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
- **API Health Check**: Real-time status indicators confirming API key validity across all configured providers.
- **Cache Management**: Monitor in-memory and file-based cache performance with one-click purge capability.
- **Rate Limit Status**: Track API consumption and remaining quota thresholds.

---

## 📑 Exporting Reports

To share investigation results with executive leadership or incident response teams:
1. Click the **Export PDF** button located in the top navigation bar to generate a cleanly formatted executive briefing report.
2. Navigate to the **Evidence** tab to download raw JSON or export indicators in CSV format suitable for SIEM/SOAR ingestion.
