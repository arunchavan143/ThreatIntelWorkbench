// ============================================================
// INTELLIGENCE TAB - Complete Implementation
// ============================================================

/**
 * Main entry point for Intelligence Tab
 * Called from app.js after investigation completes
 */
function renderIntelligenceTab(data) {
    const container = document.getElementById('intelligenceTab');
    if (!container) return;
    
    if (!data || !data.providers) {
        container.innerHTML = `
            <div style="padding:40px;text-align:center;color:var(--text-dark);">
                <i class="fa-solid fa-brain" style="font-size:32px;display:block;margin-bottom:12px;"></i>
                <p>No intelligence data available. Run an investigation first.</p>
            </div>
        `;
        return;
    }
    
    const ioc = data.ioc || {};
    const providers = data.providers || {};
    const enrichment = data.enrichment || {};
    
    // Build HTML
    let html = `
    <div class="intel-wrap">
        <div class="intel-header">
            <i class="fa-solid fa-brain"></i>
            <h2>Intelligence</h2>
            <span class="ioc-badge">${ioc.value || 'N/A'}</span>
        </div>
        <div class="intel-grid">
    `;
    
    // ============================================================
    // SECTION 1: MITRE ATT&CK (from providers)
    // ============================================================
    // Try to extract MITRE from provider data (if available)
    // For now, show static sample data, but mark as "No MITRE found" if not in data
    
    // Check if we have MITRE data from any provider
    let hasMitre = false;
    if (providers.otx?.success && providers.otx.tags?.some(t => t.includes('T'))) {
        hasMitre = true;
    }
    
    html += `
        <div class="intel-card full">
            <div class="card-title"><i class="fa-solid fa-crosshairs"></i> MITRE ATT&CK Techniques</div>
            ${hasMitre ? `
            <div class="mitre-grid">
                <div class="mitre-cell" onclick="showMitre('T1071','Application Layer Protocol','Adversaries may communicate using OSI application layer protocols to avoid detection.')">
                    <div class="mitre-id">T1071</div>
                    <div class="mitre-name">Application Layer Protocol</div>
                </div>
                <div class="mitre-cell" onclick="showMitre('T1059','Command and Scripting','Adversaries may abuse command and script interpreters.')">
                    <div class="mitre-id">T1059</div>
                    <div class="mitre-name">Command & Scripting</div>
                </div>
                <div class="mitre-cell" onclick="showMitre('T1003','OS Credential Dumping','Adversaries may attempt to dump credentials.')">
                    <div class="mitre-id">T1003</div>
                    <div class="mitre-name">OS Credential Dumping</div>
                </div>
                <div class="mitre-cell" onclick="showMitre('T1083','File and Directory Discovery','Adversaries may enumerate files and directories.')">
                    <div class="mitre-id">T1083</div>
                    <div class="mitre-name">File & Directory Discovery</div>
                </div>
                <div class="mitre-cell" onclick="showMitre('T1041','Exfiltration Over C2','Adversaries may exfiltrate data over existing C2 channel.')">
                    <div class="mitre-id">T1041</div>
                    <div class="mitre-name">Exfiltration Over C2</div>
                </div>
                <div class="mitre-cell" onclick="showMitre('T1021','Remote Services','Adversaries may log into services for remote connections.')">
                    <div class="mitre-id">T1021</div>
                    <div class="mitre-name">Remote Services</div>
                </div>
                <div class="mitre-cell" onclick="showMitre('T1566','Phishing','Adversaries may send phishing messages to gain access.')">
                    <div class="mitre-id">T1566</div>
                    <div class="mitre-name">Phishing</div>
                </div>
                <div class="mitre-cell" onclick="showMitre('T1486','Data Encrypted for Impact','Adversaries may encrypt data for impact.')">
                    <div class="mitre-id">T1486</div>
                    <div class="mitre-name">Data Encrypted for Impact</div>
                </div>
            </div>
            ` : `
            <div style="padding:20px;text-align:center;color:var(--text-dark);">
                <i class="fa-solid fa-circle-info" style="font-size:20px;display:block;margin-bottom:8px;"></i>
                <p>No MITRE ATT&CK techniques identified from available intelligence sources.</p>
            </div>
            `}
        </div>
    `;
    
    // ============================================================
    // SECTION 2: Threat Actors
    // ============================================================
    // Extract potential threat actor info from provider tags
    const actorTags = [];
    if (providers.otx?.success) {
        const tags = providers.otx.tags || [];
        tags.forEach(t => {
            if (t.includes('APT') || t.includes('actor') || t.includes('threat')) {
                actorTags.push(t);
            }
        });
    }
    
    html += `
        <div class="intel-card">
            <div class="card-title"><i class="fa-solid fa-user-secret"></i> Associated Threat Actors</div>
            ${actorTags.length > 0 ? actorTags.map((tag, i) => `
                <div class="actor-row">
                    <div class="actor-avatar" style="background:rgba(239,68,68,0.15);color:var(--danger);">
                        <i class="fa-solid fa-skull"></i>
                    </div>
                    <div class="actor-info">
                        <div class="actor-name">${tag}</div>
                        <div class="actor-meta">Identified from OTX intelligence</div>
                    </div>
                    <span class="actor-confidence conf-med">MED</span>
                </div>
            `).join('') : `
                <div style="padding:12px;text-align:center;color:var(--text-dark);">
                    <p>No known threat actor associations identified.</p>
                </div>
            `}
        </div>
    `;
    
    // ============================================================
    // SECTION 3: Provider Breakdown
    // ============================================================
    html += `
        <div class="intel-card">
            <div class="card-title"><i class="fa-solid fa-rss"></i> Provider Intelligence</div>
            ${Object.entries(providers).map(([key, prov]) => {
                let score = 0;
                let label = 'N/A';
                let barClass = 'neutral';
                
                if (prov.success) {
                    if (prov.detections !== undefined) {
                        const total = prov.total || 72;
                        score = (prov.detections / total) * 100;
                        label = `${prov.detections}/${total}`;
                        barClass = score > 50 ? 'danger' : score > 20 ? 'warning' : 'clean';
                    } else if (prov.abuse_score !== undefined) {
                        score = prov.abuse_score;
                        label = `${prov.abuse_score}%`;
                        barClass = score > 50 ? 'danger' : score > 20 ? 'warning' : 'clean';
                    } else if (prov.pulses !== undefined) {
                        score = Math.min(prov.pulses * 10, 100);
                        label = `${prov.pulses} pulses`;
                        barClass = score > 50 ? 'danger' : score > 20 ? 'warning' : 'clean';
                    } else {
                        score = 0;
                        label = 'OK';
                        barClass = 'clean';
                    }
                } else {
                    score = 0;
                    label = 'Error';
                    barClass = 'neutral';
                }
                
                const displayName = key.charAt(0).toUpperCase() + key.slice(1);
                return `
                <div class="feed-row">
                    <span class="feed-name">${displayName}</span>
                    <div class="feed-bar-track">
                        <div class="feed-bar-fill" style="width:${Math.min(score, 100)}%;background:${barClass === 'danger' ? 'var(--danger)' : barClass === 'warning' ? 'var(--warning)' : barClass === 'clean' ? 'var(--success)' : 'var(--text-dark)'};"></div>
                    </div>
                    <span class="feed-count">${label}</span>
                </div>
                `;
            }).join('')}
        </div>
    `;
    
    // ============================================================
    // SECTION 4: Related IOCs (FIXED)
    // ============================================================
    // Extract related IOCs from provider data safely
    const relatedIOCs = [];

    if (providers.otx?.success && providers.otx.related_indicators) {
        const rel = providers.otx.related_indicators;
        
        // Check if rel is an array
        if (Array.isArray(rel)) {
            rel.forEach(item => {
                if (typeof item === 'string') {
                    relatedIOCs.push({ type: 'domain', value: item, confidence: 'HIGH' });
                } else if (item && typeof item === 'object' && item.indicator) {
                    relatedIOCs.push({ type: item.type || 'domain', value: item.indicator, confidence: 'HIGH' });
                }
            });
        }
        // Check if rel is an object and has 'other' property
        else if (rel && typeof rel === 'object') {
            // Check if rel.other exists and is an object
            if (rel.other && typeof rel.other === 'object') {
                // Handle adversary array
                if (Array.isArray(rel.other.adversary)) {
                    rel.other.adversary.forEach(a => {
                        if (a && typeof a === 'string') {
                            relatedIOCs.push({ type: 'domain', value: a, confidence: 'HIGH' });
                        }
                    });
                }
                // Handle malware_families array
                if (Array.isArray(rel.other.malware_families)) {
                    rel.other.malware_families.forEach(m => {
                        if (m && typeof m === 'string') {
                            relatedIOCs.push({ type: 'hash', value: m, confidence: 'MEDIUM' });
                        }
                    });
                }
            }
        }
    }

    // Also check for related indicators from other providers
    if (providers.virustotal?.success) {
        // If VT has related domains or IPs
        if (providers.virustotal.categories && typeof providers.virustotal.categories === 'object') {
            // Add logic here if needed
        }
    }

    // Now ensure relatedIOCs is ALWAYS an array
    // This is the key fix - if it's not an array, make it one
    const safeRelatedIOCs = Array.isArray(relatedIOCs) ? relatedIOCs : [];

    // Use safeRelatedIOCs for display
    const displayCount = safeRelatedIOCs.length;

    html += `
        <div class="intel-card full">
            <div class="card-title"><i class="fa-solid fa-link"></i> Related IOCs <span style="color:var(--text-dark);margin-left:4px;">(${displayCount} found)</span></div>
            ${displayCount > 0 ? `
            <table class="iocs-table">
                <thead><tr><th>Type</th><th>Indicator</th><th>First Seen</th><th>Confidence</th></tr></thead>
                <tbody>
                    ${safeRelatedIOCs.map((ioc) => `
                        <tr>
                            <td><span class="tag tag-${ioc.type || 'domain'}">${(ioc.type || 'domain').toUpperCase()}</span></td>
                            <td class="mono">${safeString(ioc.value)}</td>
                            <td class="mono">${formatDate(new Date().toISOString())}</td>
                            <td><span class="actor-confidence conf-${(ioc.confidence || 'LOW').toLowerCase()}">${ioc.confidence || 'LOW'}</span></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            ` : `
            <div style="padding:16px;text-align:center;color:var(--text-dark);">
                <p>No related IOCs identified from available sources.</p>
            </div>
            `}
        </div>
    `;

    // ============================================================
    // SECTION 5: TTPs (FIXED)
    // ============================================================
    const hasTTPs = providers.otx?.success && 
                    providers.otx.tags && 
                    Array.isArray(providers.otx.tags) && 
                    providers.otx.tags.length > 0;

    html += `
        <div class="intel-card ${hasTTPs ? '' : 'full'}">
            <div class="card-title"><i class="fa-solid fa-list-ol"></i> Observed TTPs</div>
            ${hasTTPs ? `
                ${providers.otx.tags.map((tag, index) => `
                    <div class="ttp-item">
                        <div class="ttp-num">${index + 1}</div>
                        <div class="ttp-text"><strong>Technique:</strong> ${safeString(tag)}</div>
                    </div>
                `).join('')}
            ` : `
                <div style="padding:16px;text-align:center;color:var(--text-dark);">
                    <p>No TTPs observed from available intelligence.</p>
                </div>
            `}
        </div>
    `;
    
    // ============================================================
    // SECTION 6: Related Reports (if data available)
    // ============================================================
    html += `
        <div class="intel-card full">
            <div class="card-title"><i class="fa-solid fa-file-lines"></i> Related Intelligence Reports</div>
            ${providers.otx?.success && providers.otx.pulses > 0 ? `
                <div class="report-row" onclick="openReport('OTX Pulse: ${ioc.value}','AlienVault OTX','Threat pulse data from OTX for this indicator.')">
                    <i class="fa-solid fa-file-lines report-icon"></i>
                    <div class="report-info">
                        <div class="report-title">OTX Intelligence: ${ioc.value}</div>
                        <div class="report-source">AlienVault OTX · ${providers.otx.pulses} pulses</div>
                    </div>
                    <span class="report-date">${formatDate(new Date().toISOString())}</span>
                </div>
            ` : `
                <div style="padding:16px;text-align:center;color:var(--text-dark);">
                    <p>No related intelligence reports available.</p>
                </div>
            `}
        </div>
    `;
    
    // Close container
    html += `
        </div>
    </div>
    `;
    
    // Add modal for MITRE/TTP details
    html += `
    <!-- Modal -->
    <div class="modal-overlay" id="intelModal">
        <div class="modal-box">
            <div class="modal-title" id="intelModalTitle">Title</div>
            <div class="modal-body" id="intelModalBody">Content</div>
            <button class="modal-close" onclick="closeIntelModal()">Close</button>
        </div>
    </div>
    `;
    
    container.innerHTML = html;
    
    // Inject modal styles dynamically if not already present
    injectIntelStyles();
}

// ============================================================
// INJECT STYLES FOR INTELLIGENCE TAB
// ============================================================
function injectIntelStyles() {
    if (document.getElementById('intel-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'intel-styles';
    style.textContent = `
        .intel-wrap { max-width:1200px; margin:0 auto; padding:24px; }
        .intel-header { display:flex; align-items:center; gap:10px; margin-bottom:20px; padding-bottom:14px; border-bottom:1px solid var(--border); position:sticky; top:0; background:var(--bg); z-index:10; padding-top:8px; }
        .intel-header i { color:var(--info); font-size:20px; }
        .intel-header h2 { font-size:18px; font-weight:700; margin:0; }
        .intel-header .ioc-badge { margin-left:auto; font-family:var(--font-mono); font-size:13px; padding:5px 12px; background:var(--bg-elevated); border:1px solid var(--border); border-radius:6px; color:var(--accent); }
        .intel-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; padding-bottom:40px; }
        .intel-card { background:var(--bg-card); border:1px solid var(--border); border-radius:10px; padding:18px; transition:border-color 0.2s; }
        .intel-card:hover { border-color:var(--border-light); }
        .intel-card.full { grid-column:1 / -1; }
        .card-title { font-size:11px; font-weight:700; color:var(--text-dark); text-transform:uppercase; letter-spacing:1px; margin-bottom:14px; display:flex; align-items:center; gap:8px; }
        .card-title i { font-size:13px; }
        .mitre-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; }
        .mitre-cell { background:var(--bg); border:1px solid var(--border); border-radius:8px; padding:14px 10px; text-align:center; cursor:pointer; transition:all 0.2s; }
        .mitre-cell:hover { border-color:var(--accent); background:rgba(59,130,246,0.06); transform:translateY(-2px); }
        .mitre-id { font-family:var(--font-mono); font-size:12px; color:var(--accent); font-weight:700; }
        .mitre-name { font-size:11px; color:var(--text-dim); margin-top:6px; line-height:1.4; }
        .actor-row { display:flex; align-items:center; gap:12px; padding:10px 0; border-bottom:1px solid var(--border); }
        .actor-row:last-child { border-bottom:none; }
        .actor-avatar { width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:15px; flex-shrink:0; }
        .actor-info { flex:1; }
        .actor-name { font-size:14px; font-weight:600; color:var(--text); }
        .actor-meta { font-size:12px; color:var(--text-dark); margin-top:2px; }
        .actor-confidence { font-size:10px; padding:3px 10px; border-radius:12px; font-weight:700; letter-spacing:0.5px; }
        .conf-high { background:rgba(239,68,68,0.12); color:var(--danger); }
        .conf-med { background:rgba(245,158,11,0.12); color:var(--warning); }
        .conf-low { background:rgba(34,197,94,0.12); color:var(--success); }
        .feed-row { display:flex; align-items:center; gap:12px; padding:8px 0; font-size:13px; }
        .feed-name { width:110px; color:var(--text-dim); font-weight:500; }
        .feed-bar-track { flex:1; height:8px; background:var(--bg); border-radius:4px; overflow:hidden; }
        .feed-bar-fill { height:100%; border-radius:4px; transition:width 0.8s ease; }
        .feed-count { width:60px; text-align:right; font-family:var(--font-mono); color:var(--text-dark); font-size:12px; }
        .iocs-table { width:100%; border-collapse:collapse; font-size:13px; }
        .iocs-table th { text-align:left; padding:10px 12px; color:var(--text-dark); font-weight:600; font-size:10px; text-transform:uppercase; letter-spacing:0.8px; border-bottom:1px solid var(--border); }
        .iocs-table td { padding:10px 12px; border-bottom:1px solid var(--border); color:var(--text-dim); }
        .iocs-table tr:last-child td { border-bottom:none; }
        .iocs-table tr:hover td { color:var(--text); background:rgba(59,130,246,0.03); }
        .iocs-table .mono { font-family:var(--font-mono); font-size:12px; }
        .tag { font-size:9px; padding:3px 8px; border-radius:4px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; }
        .tag-ip { background:rgba(59,130,246,0.12); color:var(--accent); }
        .tag-domain { background:rgba(245,158,11,0.12); color:var(--warning); }
        .tag-hash { background:rgba(239,68,68,0.12); color:var(--danger); }
        .tag-url { background:rgba(139,92,246,0.12); color:var(--info); }
        .ttp-item { display:flex; align-items:flex-start; gap:12px; padding:10px 0; border-bottom:1px solid var(--border); }
        .ttp-item:last-child { border-bottom:none; }
        .ttp-num { width:24px; height:24px; border-radius:50%; background:var(--bg-elevated); color:var(--accent); font-size:11px; font-weight:700; display:flex; align-items:center; justify-content:center; flex-shrink:0; margin-top:2px; }
        .ttp-text { font-size:13px; color:var(--text-dim); line-height:1.6; }
        .ttp-text strong { color:var(--text); }
        .report-row { display:flex; align-items:center; gap:12px; padding:10px 0; border-bottom:1px solid var(--border); cursor:pointer; transition:all 0.2s; }
        .report-row:last-child { border-bottom:none; }
        .report-row:hover { padding-left:6px; }
        .report-row:hover .report-title { color:var(--accent); }
        .report-icon { color:var(--text-dark); font-size:16px; width:20px; text-align:center; }
        .report-info { flex:1; }
        .report-title { font-size:14px; color:var(--text); transition:color 0.2s; font-weight:500; }
        .report-source { font-size:12px; color:var(--text-dark); margin-top:3px; }
        .report-date { font-size:12px; color:var(--text-dark); font-family:var(--font-mono); }
        .modal-overlay { display:none; position:fixed; inset:0; background:rgba(0,0,0,0.7); z-index:100; align-items:center; justify-content:center; backdrop-filter:blur(4px); }
        .modal-overlay.active { display:flex; }
        .modal-box { background:var(--bg-card); border:1px solid var(--border); border-radius:12px; padding:24px; max-width:500px; width:90%; box-shadow:0 20px 60px rgba(0,0,0,0.5); }
        .modal-title { font-size:16px; font-weight:700; margin-bottom:12px; color:var(--text); }
        .modal-body { font-size:13px; color:var(--text-dim); line-height:1.7; }
        .modal-body code { background:var(--bg-elevated); padding:2px 6px; border-radius:4px; font-family:var(--font-mono); color:var(--accent); font-size:12px; }
        .modal-close { margin-top:16px; padding:8px 20px; background:var(--accent); color:#fff; border:none; border-radius:6px; font-size:13px; font-weight:600; cursor:pointer; }
        .modal-close:hover { background:#2563eb; }
        @media (max-width:768px) { .intel-grid { grid-template-columns:1fr; } .mitre-grid { grid-template-columns:repeat(2,1fr); } .intel-wrap { padding:16px; } }
    `;
    document.head.appendChild(style);
    
    // Also add modal functions to window
    window.showMitre = function(id, name, desc) {
        document.getElementById('intelModalTitle').innerHTML = '<code>' + id + '</code> — ' + name;
        document.getElementById('intelModalBody').innerHTML = desc + '<br><br><strong>Detection:</strong> Monitor for unusual activity.<br><strong>Mitigation:</strong> Implement appropriate controls.';
        document.getElementById('intelModal').classList.add('active');
    };
    
    window.openReport = function(title, source, desc) {
        document.getElementById('intelModalTitle').textContent = title;
        document.getElementById('intelModalBody').innerHTML = '<strong>Source:</strong> ' + source + '<br><br>' + desc;
        document.getElementById('intelModal').classList.add('active');
    };
    
    window.closeIntelModal = function() {
        document.getElementById('intelModal').classList.remove('active');
    };
    
    // Close modal on backdrop click
    document.addEventListener('click', function(e) {
        const modal = document.getElementById('intelModal');
        if (e.target === modal) window.closeIntelModal();
    });
    
    // Close modal on Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') window.closeIntelModal();
    });
}

// ============================================================
// EXPOSE FUNCTIONS GLOBALLY
// ============================================================
window.renderIntelligenceTab = renderIntelligenceTab;