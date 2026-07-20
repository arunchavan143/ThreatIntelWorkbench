// ============================================================
// UI RENDERING FUNCTIONS
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
    
    // Build HTML
    let html = '';
    
    // AI Summary
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
                ${(aiSummary.findings || ['No findings']).map(f => `
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
    
    // Source Telemetry
    html += `<div class="card">
        <div class="card-title"><i class="fa-solid fa-satellite-dish"></i> Source Telemetry</div>
        ${Object.entries(providers).map(([key, prov]) => {
            const status = getProviderStatus(prov);
            return `<div class="source-row">
                <span class="name"><span style="color:${prov.success ? 'var(--success)' : 'var(--danger)'};">●</span> ${key.charAt(0).toUpperCase() + key.slice(1)}</span>
                <span class="status ${status.class}"><i class="fa-regular ${status.icon}"></i> ${status.status}</span>
            </div>`;
        }).join('')}
    </div>`;
    
    // Threat Vectors (simplified)
    html += `<div class="card">
        <div class="card-title"><i class="fa-solid fa-biohazard"></i> Threat Vector Risk</div>
        ${['Malware', 'Phishing', 'C2 Infra', 'Botnet', 'Ransomware'].map(v => `
            <div class="vector-row">
                <span class="name">${v}</span>
                <div class="bar-track"><div class="bar-fill" style="width:0%;background:var(--success);"></div></div>
                <span class="count">0</span>
            </div>
        `).join('')}
    </div>`;
    
    // Provider Breakdown
    html += `<div class="card">
        <div class="card-title"><i class="fa-solid fa-table"></i> Provider Breakdown</div>
        ${Object.entries(providers).map(([key, prov]) => {
            const score = prov.success ? (prov.detections || prov.abuse_score || 0) : 0;
            const barClass = score > 50 ? 'danger' : score > 20 ? 'warning' : 'clean';
            const label = prov.success ? 
                (prov.detections !== undefined ? `${prov.detections} detections` :
                 prov.abuse_score !== undefined ? `${prov.abuse_score}%` : 'OK') : 'Error';
            return `<div class="provider-bar">
                <span class="name">${key.charAt(0).toUpperCase() + key.slice(1)}</span>
                <div class="bar-track"><div class="bar-fill ${barClass}" style="width:${Math.min(score, 100)}%;"></div></div>
                <span class="count">${label}</span>
            </div>`;
        }).join('')}
    </div>`;
    
    // Infrastructure
    html += `<div class="card">
        <div class="card-title"><i class="fa-solid fa-building-columns"></i> Infrastructure</div>
        ${enrichment.geolocation ? `
            <div class="infra-row"><span class="label">ISP / Carrier</span><span class="value">${safeString(enrichment.geolocation.isp)}</span></div>
            <div class="infra-row"><span class="label">Country</span><span class="value">${safeString(enrichment.geolocation.country)}</span></div>
            <div class="infra-row"><span class="label">City</span><span class="value">${safeString(enrichment.geolocation.city)}</span></div>
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
// LOAD INVESTIGATION
// ============================================================
async function loadInvestigation(value, type) {
    if (!value) return;
    
    // Show loading state
    const btn = document.getElementById('investigateBtn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Investigating...';
    btn.disabled = true;
    
    try {
        let result;
        switch (type) {
            case 'ip': result = await investigateIP(value); break;
            case 'domain': result = await investigateDomain(value); break;
            case 'hash': result = await investigateHash(value); break;
            case 'url': result = await investigateURL(value); break;
            default: throw new Error('Unsupported type');
        }
        
        if (result.success) {
            // Store in localStorage
            addRecentInvestigation(value, type);
            
            // Show results page
            document.getElementById('page-search').classList.add('hidden');
            document.getElementById('page-results').classList.add('active');
            
            // Render overview
            renderOverview(result.data);
            
            // Update footer stats
            updateFooterStats(result.data);
            
            // Update IOC in top bar
            document.querySelector('.topbar-left .logo').textContent = `🛡️ Investigating: ${value}`;
        } else {
            alert('Error: ' + (result.error || 'Investigation failed'));
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
    
    btn.innerHTML = originalText;
    btn.disabled = false;
}

// ============================================================
// RECENT INVESTIGATIONS (localStorage)
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
    // Remove if exists
    const filtered = recent.filter(item => item.value !== value);
    // Add to front
    filtered.unshift({ value, type, timestamp: new Date().toISOString() });
    // Keep only last 20
    const trimmed = filtered.slice(0, 20);
    localStorage.setItem('recentIOCs', JSON.stringify(trimmed));
    renderRecentChips();
}

function clearRecentInvestigations() {
    localStorage.removeItem('recentIOCs');
    renderRecentChips();
}

// ============================================================
// FOOTER STATS
// ============================================================
function updateFooterStats(data) {
    // Update cache
    const cacheEl = document.getElementById('cachePercent');
    if (cacheEl) {
        // Try to get from health
        getHealth().then(h => {
            if (h && h.cache && h.cache.hitRate !== undefined) {
                cacheEl.textContent = h.cache.hitRate + '%';
            }
        }).catch(() => {});
    }
    
    // Show investigation ID
    if (data && data.investigation_id) {
        document.getElementById('apiCalls').textContent = data.investigation_id.slice(-6);
    }
}

// ============================================================
// EXPORT PDF (placeholder)
// ============================================================
function exportPDF() {
    alert('PDF Export will be available in the next version.');
}

// ============================================================
// COPY IOC
// ============================================================
function copyIOC(value) {
    navigator.clipboard.writeText(value).then(() => {
        const btn = document.getElementById('copyBtn');
        const original = btn.innerHTML;
        btn.innerHTML = '<i class="fa-regular fa-check"></i>';
        setTimeout(() => btn.innerHTML = original, 2000);
    }).catch(() => {
        // Fallback
        const input = document.createElement('input');
        input.value = value;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
    });
}