// ============================================================
// UI RENDERING FUNCTIONS - COMPLETE
// ============================================================

// ============================================================
// RENDER FEED STATUS
// ============================================================
function renderFeedStatus(health) {
    const container = document.getElementById('feedStatus');
    const services = [
        { key: 'virustotal', label: 'VirusTotal' },
        { key: 'abuseipdb', label: 'AbuseIPDB' },
        { key: 'shodan', label: 'Shodan' },
        { key: 'otx', label: 'OTX' },
        { key: 'urlscan', label: 'URLScan' }
    ];
    
    container.innerHTML = services.map(s => {
        const active = health?.apis?.[s.key] || false;
        return `<div class="feed-pill">
            <div class="dot ${active ? '' : 'offline'}"></div>
            ${s.label}
        </div>`;
    }).join('');
}

// ============================================================
// RENDER RECENT CHIPS
// ============================================================
function renderRecentChips() {
    const container = document.getElementById('recentChips');
    const recent = getRecentInvestigations();
    
    if (recent.length === 0) {
        container.innerHTML = '<div style="color:var(--text-dark);font-size:11px;">No recent investigations</div>';
        return;
    }
    
    container.innerHTML = recent.map(item => `
        <div class="ioc-chip" onclick="window.loadInvestigation('${item.value}', '${item.type}')">
            <span class="type-badge ${getTypeBadgeClass(item.type)}">${item.type.toUpperCase()}</span>
            ${truncate(item.value, 20)}
        </div>
    `).join('');
}

// ============================================================
// RENDER OVERVIEW TAB
// ============================================================
function renderOverview(data) {
    const container = document.getElementById('overviewTab');
    if (!data) {
        container.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text-dark);">No data</div>';
        return;
    }
    
    const risk = data.risk || {};
    const verdictInfo = getVerdictColor(risk.score || 0);
    const verdictClass = getVerdictClass(risk.verdict);
    const isBenign = risk.verdict === 'LOW';
    const aiSummary = data.ai_summary || {};
    const providers = data.providers || {};
    const enrichment = data.enrichment || {};
    
    // ============================================================
    // BUILD FINDINGS FROM PROVIDER DATA (FIX)
    // ============================================================
    const findings = [];
    if (providers.virustotal?.success) {
        findings.push(`VirusTotal: ${providers.virustotal.detections || 0} detections (${providers.virustotal.ratio || '0/0'})`);
    }
    if (providers.abuseipdb?.success) {
        findings.push(`AbuseIPDB: ${providers.abuseipdb.abuse_score || 0}% abuse score`);
    }
    if (providers.shodan?.success && providers.shodan.vulnerabilities?.length > 0) {
        findings.push(`Shodan: ${providers.shodan.vulnerabilities.length} vulnerabilities`);
    }
    if (providers.otx?.success && providers.otx.pulses > 0) {
        findings.push(`OTX: ${providers.otx.pulses} threat pulses`);
    }
    if (enrichment.geolocation?.success) {
        findings.push(`Location: ${enrichment.geolocation.country || 'Unknown'}`);
    }
    if (enrichment.asn?.success) {
        findings.push(`ASN: ${enrichment.asn.asn || 'N/A'} (${enrichment.asn.as_name || 'N/A'})`);
    }
    if (findings.length === 0) findings.push('No threats detected from any source');

    // ============================================================
    // BUILD HTML
    // ============================================================
    let html = '';
    
    // AI Summary Card
    html += `
    <div class="ai-summary ${isBenign ? 'benign' : 'malicious'}">
        <div class="ai-icon ${isBenign ? 'benign' : 'malicious'}">
            <i class="fa-solid ${isBenign ? 'fa-check' : 'fa-triangle-exclamation'}"></i>
        </div>
        <div class="ai-content">
            <div class="header">
                <div class="title"><i class="fa-solid fa-wand-magic-sparkles"></i> AI Analyst Executive Summary</div>
                <span class="verdict-badge ${verdictClass}">${verdictInfo.emoji} ${risk.verdict || 'UNKNOWN'}</span>
            </div>
            <div class="ai-text">${aiSummary.text || 'No AI summary available.'}</div>
            <div class="ai-meta">
                <div class="ai-meta-item">Confidence: <strong>${risk.confidence || 0}%</strong></div>
                <div class="ai-meta-item">Sources: <strong>${risk.sources || 0}/${risk.total_sources || 0}</strong></div>
                <div class="ai-meta-item">Risk Score: <strong>${risk.score || 0}/100</strong></div>
                <div class="ai-meta-item">Verdict: <strong style="color:${verdictInfo.color};">${risk.verdict || 'UNKNOWN'}</strong></div>
            </div>
            <div class="key-findings">
                ${findings.map(f => `
                    <div class="finding"><i class="fa-solid fa-check-circle"></i> ${f}</div>
                `).join('')}
            </div>
        </div>
        <div class="score-ring">
            <div class="ring-container">
                <svg width="80" height="80" viewBox="0 0 100 100">
                    <circle class="ring-bg" cx="50" cy="50" r="42"></circle>
                    <circle class="ring-fill" id="scoreRing" cx="50" cy="50" r="42"
                        stroke="${verdictInfo.color}" 
                        stroke-dasharray="264" 
                        stroke-dashoffset="${264 - (risk.score / 100) * 264}">
                    </circle>
                </svg>
                <div class="ring-value" style="color:${verdictInfo.color};">${risk.score || 0}</div>
            </div>
            <div class="ring-label">Threat Score</div>
        </div>
    </div>
    `;
    
    // Two Column Grid
    html += `<div class="two-col">`;
    
    // Source Telemetry (with response times)
    html += `<div class="card">
        <div class="card-title"><i class="fa-solid fa-satellite-dish"></i> Source Telemetry</div>
        ${Object.entries(providers).map(([key, prov]) => {
            const status = getProviderStatus(prov);
            // Try to get response time if available
            let time = '';
            if (prov && prov.response_time) time = prov.response_time;
            else if (prov && prov.timestamp) time = '—';
            return `<div class="source-row">
                <span class="name"><span style="color:${prov.success ? 'var(--success)' : 'var(--danger)'};">●</span> ${key.charAt(0).toUpperCase() + key.slice(1)}</span>
                <span class="status ${status.class}">
                    <i class="fa-regular ${status.icon}"></i> ${status.status}
                    ${time ? ` · ${time}ms` : ''}
                </span>
            </div>`;
        }).join('')}
    </div>`;
    
    // Threat Vectors (simplified, but color-coded based on risk)
    const vectorRisk = risk.score || 0;
    const vectorColors = vectorRisk >= 80 ? 'danger' : vectorRisk >= 60 ? 'warning' : 'clean';
    html += `<div class="card">
        <div class="card-title"><i class="fa-solid fa-biohazard"></i> Threat Vector Risk</div>
        ${['Malware', 'Phishing', 'C2 Infra', 'Botnet', 'Ransomware'].map(v => `
            <div class="vector-row">
                <span class="name">${v}</span>
                <div class="bar-track"><div class="bar-fill ${vectorColors}" style="width:${vectorRisk}%;"></div></div>
                <span class="count">${vectorRisk >= 60 ? 'High' : vectorRisk >= 30 ? 'Med' : 'Low'}</span>
            </div>
        `).join('')}
    </div>`;
    
    // Provider Breakdown (with detection ratios)
    html += `<div class="card">
        <div class="card-title"><i class="fa-solid fa-table"></i> Provider Breakdown</div>
        ${Object.entries(providers).map(([key, prov]) => {
            let score = 0;
            let label = 'Error';
            if (prov.success) {
                if (prov.detections !== undefined) {
                    score = prov.detections;
                    label = `${prov.detections}/${prov.total || 72}`;
                } else if (prov.abuse_score !== undefined) {
                    score = prov.abuse_score;
                    label = `${prov.abuse_score}%`;
                } else {
                    score = 0;
                    label = 'OK';
                }
            }
            const barClass = score > 50 ? 'danger' : score > 20 ? 'warning' : 'clean';
            const percent = Math.min(score, 100);
            return `<div class="provider-bar">
                <span class="name">${key.charAt(0).toUpperCase() + key.slice(1)}</span>
                <div class="bar-track"><div class="bar-fill ${barClass}" style="width:${percent}%;"></div></div>
                <span class="count">${label}</span>
            </div>`;
        }).join('')}
    </div>`;
    
    // Infrastructure (enriched)
    html += `<div class="card">
        <div class="card-title"><i class="fa-solid fa-building-columns"></i> Infrastructure</div>
        ${enrichment.geolocation ? `
            <div class="infra-row"><span class="label">ISP / Carrier</span><span class="value">${safeString(enrichment.geolocation.isp)}</span></div>
            <div class="infra-row"><span class="label">Country</span><span class="value">${safeString(enrichment.geolocation.country)}</span></div>
            <div class="infra-row"><span class="label">City</span><span class="value">${safeString(enrichment.geolocation.city)}</span></div>
            ${enrichment.geolocation.lat ? `<div class="infra-row"><span class="label">Coordinates</span><span class="value">${enrichment.geolocation.lat}, ${enrichment.geolocation.lon}</span></div>` : ''}
        ` : ''}
        ${enrichment.asn ? `
            <div class="infra-row"><span class="label">ASN</span><span class="value">${safeString(enrichment.asn.asn)}</span></div>
            <div class="infra-row"><span class="label">Organization</span><span class="value">${safeString(enrichment.asn.as_name)}</span></div>
        ` : ''}
        ${enrichment.whois ? `
            <div class="infra-row"><span class="label">Registrar</span><span class="value">${safeString(enrichment.whois.registrar)}</span></div>
            <div class="infra-row"><span class="label">Created</span><span class="value">${safeString(enrichment.whois.creation_date)}</span></div>
        ` : ''}
        ${!enrichment.geolocation && !enrichment.asn && !enrichment.whois ? `
            <div style="color:var(--text-dark);font-size:12px;">No infrastructure data available</div>
        ` : ''}
    </div>`;
    
    html += `</div>`; // End two-col
    
    // Recommendations
    html += `<div class="card" style="margin-bottom:14px;">
        <div class="card-title"><i class="fa-solid fa-list-check"></i> Recommended Actions</div>
        ${risk.verdict === 'LOW' ? `
            <div class="rec-row"><i class="fa-solid fa-check-circle"></i> No immediate blocking required</div>
            <div class="rec-row"><i class="fa-solid fa-check-circle"></i> Monitor periodic intelligence updates</div>
            <div class="rec-row"><i class="fa-solid fa-check-circle"></i> Document finding if appears in recurring alert logs</div>
        ` : risk.verdict === 'MEDIUM' ? `
            <div class="rec-row"><i class="fa-solid fa-triangle-exclamation" style="color:var(--warning);"></i> Investigate further</div>
            <div class="rec-row"><i class="fa-solid fa-check-circle"></i> Cross-reference with other sources</div>
            <div class="rec-row"><i class="fa-solid fa-check-circle"></i> Monitor for 24 hours</div>
        ` : `
            <div class="rec-row"><i class="fa-solid fa-triangle-exclamation" style="color:var(--danger);"></i> Block immediately at firewall</div>
            <div class="rec-row"><i class="fa-solid fa-triangle-exclamation" style="color:var(--danger);"></i> Alert SOC team</div>
            <div class="rec-row"><i class="fa-solid fa-triangle-exclamation" style="color:var(--danger);"></i> Investigate infrastructure</div>
            <div class="rec-row"><i class="fa-solid fa-check-circle"></i> Generate full incident report</div>
        `}
    </div>`;
    
    // Investigation Timeline
    html += `<div class="card">
        <div class="card-title"><i class="fa-solid fa-clock-rotate-left"></i> Investigation Timeline</div>
        <div class="timeline-row">
            <div class="timeline-dot" style="background:var(--success);"></div>
            <span class="timeline-text">Investigation initiated</span>
            <span class="timeline-time">${formatDate(data.timestamp)}</span>
        </div>
        <div class="timeline-row">
            <div class="timeline-dot" style="background:var(--warning);"></div>
            <span class="timeline-text">All providers queried</span>
            <span class="timeline-time">${formatDate(data.timestamp)}</span>
        </div>
        <div class="timeline-row">
            <div class="timeline-dot" style="background:${verdictInfo.color};"></div>
            <span class="timeline-text">Assessment: ${risk.verdict || 'UNKNOWN'}</span>
            <span class="timeline-time">${formatDate(data.timestamp)}</span>
        </div>
        ${data.processing_time ? `
        <div class="timeline-row">
            <div class="timeline-dot" style="background:var(--text-dark);"></div>
            <span class="timeline-text">Processing time: ${data.processing_time}</span>
            <span class="timeline-time">-</span>
        </div>` : ''}
    </div>`;
    
    container.innerHTML = html;
}

// ============================================================
// RECENT CHIPS & STORAGE HELPERS
// ============================================================
function getRecentInvestigations() {
    try {
        return JSON.parse(localStorage.getItem('recentIOCs') || '[]');
    } catch {
        return [];
    }
}

function addRecentInvestigation(value, type) {
    const recent = getRecentInvestigations();
    const filtered = recent.filter(item => item.value !== value);
    filtered.unshift({ value, type, timestamp: new Date().toISOString() });
    const trimmed = filtered.slice(0, 20);
    localStorage.setItem('recentIOCs', JSON.stringify(trimmed));
    renderRecentChips();
}

function clearRecentInvestigations() {
    localStorage.removeItem('recentIOCs');
    renderRecentChips();
}

function copyIOC(value) {
    if (!value && typeof currentIOC !== 'undefined') value = currentIOC;
    if (!value) return;
    navigator.clipboard.writeText(value).then(() => {
        const btn = document.getElementById('copyBtn');
        if (btn) {
            const original = btn.innerHTML;
            btn.innerHTML = '<i class="fa-regular fa-check" style="color:var(--success);"></i>';
            setTimeout(() => btn.innerHTML = original, 2000);
        }
    }).catch(() => {
        const input = document.createElement('input');
        input.value = value;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
    });
}

function updateFooterStats(data) {
    if (data && data.investigation_id) {
        const el = document.getElementById('apiCalls');
        if (el) el.textContent = data.investigation_id.slice(-6);
    }
}

// ============================================================
// RENDER TIMELINE TAB
// ============================================================
function renderTimelineTab(data) {
    const container = document.getElementById('timelineTab');
    if (!container) return;
    if (!data) {
        container.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text-dark);">No timeline data available.</div>';
        return;
    }

    const ioc = data.ioc || {};
    const risk = data.risk || {};
    const providers = data.providers || {};
    const enrichment = data.enrichment || {};
    const timestamp = data.timestamp || new Date().toISOString();

    const events = [
        { title: 'Investigation Request Initiated', subtitle: `IOC: ${ioc.value || 'N/A'} (${ioc.type || 'unknown'})`, time: formatDate(timestamp), status: 'success', icon: 'fa-play' }
    ];

    Object.entries(providers).forEach(([key, prov]) => {
        if (prov && prov.success) {
            events.push({
                title: `Provider Query: ${key.charAt(0).toUpperCase() + key.slice(1)}`,
                subtitle: `Returned telemetry (${prov.detections !== undefined ? prov.detections + ' detections' : prov.abuse_score !== undefined ? prov.abuse_score + '% abuse' : prov.pulses !== undefined ? prov.pulses + ' pulses' : 'Success'})`,
                time: formatDate(prov.scan_date || timestamp),
                status: 'online',
                icon: 'fa-check'
            });
        } else if (prov && prov.success === false) {
            events.push({
                title: `Provider Query Failed: ${key.charAt(0).toUpperCase() + key.slice(1)}`,
                subtitle: prov.error || 'Connection error or rate limited',
                time: formatDate(timestamp),
                status: 'error',
                icon: 'fa-xmark'
            });
        }
    });

    Object.entries(enrichment).forEach(([key, enr]) => {
        if (enr && enr.success) {
            events.push({
                title: `Enrichment Lookup: ${key.toUpperCase()}`,
                subtitle: `Successfully retrieved metadata`,
                time: formatDate(timestamp),
                status: 'online',
                icon: 'fa-database'
            });
        }
    });

    events.push({
        title: `Risk Assessment & AI Analysis Complete`,
        subtitle: `Verdict: ${risk.verdict || 'UNKNOWN'} (Score: ${risk.score || 0}/100, Confidence: ${risk.confidence || 0}%) · Processing time: ${data.processing_time || 'N/A'}`,
        time: formatDate(timestamp),
        status: risk.verdict === 'CRITICAL' || risk.verdict === 'HIGH' ? 'danger' : risk.verdict === 'MEDIUM' ? 'warning' : 'success',
        icon: 'fa-flag-checkered'
    });

    let html = `
    <div style="max-width:900px;margin:0 auto;padding:24px;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:24px;padding-bottom:14px;border-bottom:1px solid var(--border);">
            <i class="fa-solid fa-clock-rotate-left" style="color:var(--info);font-size:20px;"></i>
            <h2 style="font-size:18px;font-weight:700;margin:0;">Investigation Audit Timeline</h2>
            <span style="margin-left:auto;font-family:var(--font-mono);font-size:12px;color:var(--text-dim);background:var(--bg-elevated);padding:4px 10px;border-radius:6px;border:1px solid var(--border);">Total Duration: ${data.processing_time || 'N/A'}</span>
        </div>
        <div class="card" style="padding:24px;">
            <div style="position:relative;padding-left:24px;border-left:2px solid var(--border);margin-left:10px;">
                ${events.map((ev, i) => `
                <div style="position:relative;margin-bottom:${i === events.length - 1 ? '0' : '28px'};">
                    <div style="position:absolute;left:-35px;top:2px;width:20px;height:20px;border-radius:50%;background:${ev.status === 'danger' ? 'var(--danger)' : ev.status === 'warning' ? 'var(--warning)' : ev.status === 'error' ? 'var(--danger)' : 'var(--success)'};display:flex;align-items:center;justify-content:center;color:#fff;font-size:10px;box-shadow:0 0 0 4px var(--bg-card);">
                        <i class="fa-solid ${ev.icon}"></i>
                    </div>
                    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:4px;">
                        <span style="font-weight:600;font-size:14px;color:var(--text);">${ev.title}</span>
                        <span style="font-family:var(--font-mono);font-size:12px;color:var(--text-dark);">${ev.time}</span>
                    </div>
                    <div style="font-size:13px;color:var(--text-dim);line-height:1.4;">${ev.subtitle}</div>
                </div>
                `).join('')}
            </div>
        </div>
    </div>
    `;
    container.innerHTML = html;
}

// ============================================================
// RENDER SETTINGS TAB
// ============================================================
function renderSettingsTab(data, health) {
    const container = document.getElementById('settingsTab');
    if (!container) return;

    const apis = health?.apis || {
        virustotal: true,
        abuseipdb: true,
        shodan: true,
        otx: true,
        urlscan: true,
        groq: true
    };

    let html = `
    <div style="max-width:900px;margin:0 auto;padding:24px;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:24px;padding-bottom:14px;border-bottom:1px solid var(--border);">
            <i class="fa-solid fa-gear" style="color:var(--info);font-size:20px;"></i>
            <h2 style="font-size:18px;font-weight:700;margin:0;">System & API Settings</h2>
        </div>
        <div class="two-col">
            <div class="card">
                <div class="card-title"><i class="fa-solid fa-key"></i> External API Key Status</div>
                ${Object.entries(apis).map(([key, active]) => `
                <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border);">
                    <span style="font-weight:500;font-size:13px;color:var(--text);text-transform:capitalize;">${key} API</span>
                    <span style="font-size:11px;padding:3px 8px;border-radius:4px;font-weight:700;${active ? 'background:rgba(34,197,94,0.12);color:var(--success);' : 'background:rgba(239,68,68,0.12);color:var(--danger);'}">
                        ${active ? '<i class="fa-solid fa-check"></i> Configured' : '<i class="fa-solid fa-xmark"></i> Missing'}
                    </span>
                </div>
                `).join('')}
            </div>
            <div class="card">
                <div class="card-title"><i class="fa-solid fa-memory"></i> Cache & Storage Management</div>
                <div style="padding:10px 0;border-bottom:1px solid var(--border);">
                    <div style="font-weight:500;font-size:13px;color:var(--text);margin-bottom:4px;">Local Storage Recent History</div>
                    <div style="font-size:12px;color:var(--text-dark);margin-bottom:10px;">Clear your recent investigation chips stored in browser localStorage.</div>
                    <button class="clear-btn" onclick="clearRecentInvestigations(); alert('Local recent history cleared.');"><i class="fa-solid fa-trash"></i> Clear Recent Chips</button>
                </div>
                <div style="padding:10px 0;">
                    <div style="font-weight:500;font-size:13px;color:var(--text);margin-bottom:4px;">Backend API Cache</div>
                    <div style="font-size:12px;color:var(--text-dark);">Server-side in-memory cache TTL is set to 30 minutes to reduce API quota consumption.</div>
                </div>
            </div>
        </div>
    </div>
    `;
    container.innerHTML = html;
}

// Export functions to global scope
window.copyIOC = copyIOC;
window.clearRecentInvestigations = clearRecentInvestigations;
window.getRecentInvestigations = getRecentInvestigations;
window.addRecentInvestigation = addRecentInvestigation;
window.renderTimelineTab = renderTimelineTab;
window.renderSettingsTab = renderSettingsTab;

