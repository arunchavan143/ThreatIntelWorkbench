// ============================================================
// RELATIONSHIPS TAB - NETWORK GRAPH & INDICATOR MAPPING
// ============================================================
function renderRelationshipsTab(data) {
    const container = document.getElementById('relationshipsTab');
    if (!container) return;
    if (!data) {
        container.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text-dark);">No relationship data available.</div>';
        return;
    }

    const ioc = data.ioc || { value: 'Unknown', type: 'ip' };
    const providers = data.providers || {};
    const enrichment = data.enrichment || {};
    const risk = data.risk || {};

    // Build connected nodes list
    const nodes = [];
    // Central node
    nodes.push({ id: 'root', label: ioc.value, type: ioc.type, category: 'central', risk: risk.verdict || 'UNKNOWN', icon: 'fa-bullseye' });

    // Infrastructure nodes
    if (enrichment.asn && enrichment.asn.asn) {
        nodes.push({ id: 'asn', label: `${enrichment.asn.asn} (${enrichment.asn.as_name || 'ASN'})`, type: 'ASN', category: 'infra', icon: 'fa-network-wired' });
    }
    if (enrichment.geolocation && enrichment.geolocation.country) {
        nodes.push({ id: 'geo', label: `${enrichment.geolocation.city || ''} ${enrichment.geolocation.country} (${enrichment.geolocation.isp || 'ISP'})`.trim(), type: 'Location', category: 'infra', icon: 'fa-earth-americas' });
    }

    // Shodan Ports
    if (providers.shodan && providers.shodan.success && providers.shodan.ports) {
        providers.shodan.ports.slice(0, 8).forEach(port => {
            nodes.push({ id: `port_${port}`, label: `Port ${port}`, type: 'Service Port', category: 'service', icon: 'fa-ethernet' });
        });
    }

    // VirusTotal Detections
    if (providers.virustotal && providers.virustotal.success && providers.virustotal.vendors_detected) {
        providers.virustotal.vendors_detected.slice(0, 6).forEach((v, idx) => {
            nodes.push({ id: `vt_${idx}`, label: `${v.vendor} (${v.category})`, type: 'VT Engine', category: 'threat', icon: 'fa-bug' });
        });
    }

    // OTX Pulses & Related Indicators
    if (providers.otx && providers.otx.success && providers.otx.related_indicators) {
        providers.otx.related_indicators.slice(0, 6).forEach((ind, idx) => {
            nodes.push({ id: `otx_${idx}`, label: ind.indicator || ind, type: ind.type || 'Related IOC', category: 'indicator', icon: 'fa-link' });
        });
    }

    // AbuseIPDB Reports
    if (providers.abuseipdb && providers.abuseipdb.success && providers.abuseipdb.total_reports > 0) {
        nodes.push({ id: 'abuse', label: `${providers.abuseipdb.total_reports} Abuse Reports (${providers.abuseipdb.abuse_score || 0}% confidence)`, type: 'Abuse Metrics', category: 'threat', icon: 'fa-user-shield' });
    }

    // Calculate SVG positions (radial layout around center [450, 220])
    const centerX = 450;
    const centerY = 220;
    const radius = 160;
    const outerNodes = nodes.filter(n => n.id !== 'root');
    const totalOuter = outerNodes.length;

    outerNodes.forEach((n, idx) => {
        const angle = (idx * (2 * Math.PI / totalOuter)) - Math.PI / 2;
        n.x = Math.round(centerX + radius * Math.cos(angle));
        n.y = Math.round(centerY + radius * Math.sin(angle));
    });

    let html = `
    <div style="max-width:1000px;margin:0 auto;padding:24px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;padding-bottom:14px;border-bottom:1px solid var(--border);">
            <div style="display:flex;align-items:center;gap:10px;">
                <i class="fa-solid fa-project-diagram" style="color:var(--info);font-size:20px;"></i>
                <div>
                    <h2 style="font-size:18px;font-weight:700;margin:0;">Indicator Relationship Graph</h2>
                    <span style="font-size:12px;color:var(--text-dark);">Visual map of connected infrastructure, open ports, and threat detections</span>
                </div>
            </div>
            <span style="font-family:var(--font-mono);font-size:12px;color:var(--text-dim);background:var(--bg-elevated);padding:4px 10px;border-radius:6px;border:1px solid var(--border);">Connected Entities: ${nodes.length - 1}</span>
        </div>

        <div class="card" style="padding:20px;margin-bottom:24px;background:var(--bg-card);position:relative;overflow:hidden;">
            <div style="position:absolute;top:14px;left:14px;display:flex;gap:12px;font-size:11px;color:var(--text-dark);">
                <span style="display:flex;align-items:center;gap:4px;"><span style="width:10px;height:10px;border-radius:50%;background:#ef4444;display:inline-block;"></span> Threat / Detection</span>
                <span style="display:flex;align-items:center;gap:4px;"><span style="width:10px;height:10px;border-radius:50%;background:#3b82f6;display:inline-block;"></span> Infrastructure</span>
                <span style="display:flex;align-items:center;gap:4px;"><span style="width:10px;height:10px;border-radius:50%;background:#10b981;display:inline-block;"></span> Service / Port</span>
                <span style="display:flex;align-items:center;gap:4px;"><span style="width:10px;height:10px;border-radius:50%;background:#f59e0b;display:inline-block;"></span> Related IOC</span>
            </div>

            <svg viewBox="0 0 900 440" style="width:100%;height:400px;background:radial-gradient(circle at 50% 50%, rgba(30,41,59,0.3) 0%, transparent 70%);border-radius:8px;">
                <!-- Connecting lines -->
                ${outerNodes.map(n => `
                    <line x1="${centerX}" y1="${centerY}" x2="${n.x}" y2="${n.y}" stroke="var(--border)" stroke-width="1.5" stroke-dasharray="4" />
                `).join('')}

                <!-- Outer nodes -->
                ${outerNodes.map(n => {
                    const color = n.category === 'threat' ? '#ef4444' : n.category === 'infra' ? '#3b82f6' : n.category === 'service' ? '#10b981' : '#f59e0b';
                    return `
                    <g class="graph-node" style="cursor:pointer;" onclick="copyIOC('${escapeHTML(n.label)}')">
                        <circle cx="${n.x}" cy="${n.y}" r="26" fill="var(--bg-elevated)" stroke="${color}" stroke-width="2.5" />
                        <text x="${n.x}" y="${n.y + 4}" text-anchor="middle" fill="${color}" font-family="FontAwesome" font-size="14">${getNodeIconChar(n.icon)}</text>
                        <text x="${n.x}" y="${n.y + 42}" text-anchor="middle" fill="var(--text)" font-size="11" font-weight="600">${escapeHTML(n.label.length > 24 ? n.label.slice(0, 22) + '...' : n.label)}</text>
                        <text x="${n.x}" y="${n.y + 56}" text-anchor="middle" fill="var(--text-dark)" font-size="10">${escapeHTML(n.type)}</text>
                    </g>
                    `;
                }).join('')}

                <!-- Central root node -->
                <g class="graph-node central">
                    <circle cx="${centerX}" cy="${centerY}" r="38" fill="var(--bg-card)" stroke="var(--primary)" stroke-width="3" />
                    <circle cx="${centerX}" cy="${centerY}" r="32" fill="var(--primary)" opacity="0.15" />
                    <text x="${centerX}" y="${centerY + 5}" text-anchor="middle" fill="var(--primary)" font-family="FontAwesome" font-size="20"></text>
                    <text x="${centerX}" y="${centerY + 56}" text-anchor="middle" fill="var(--text)" font-size="13" font-weight="700">${escapeHTML(ioc.value)}</text>
                    <text x="${centerX}" y="${centerY + 72}" text-anchor="middle" fill="var(--primary)" font-size="11" font-weight="600">${risk.verdict || 'CENTRAL IOC'}</text>
                </g>
            </svg>
        </div>

        <div class="two-col">
            <div class="card">
                <div class="card-title"><i class="fa-solid fa-server"></i> Associated Infrastructure & Services</div>
                ${outerNodes.filter(n => n.category === 'infra' || n.category === 'service').length === 0 ? `
                    <div style="color:var(--text-dark);font-size:12px;padding:10px 0;">No infrastructure nodes identified</div>
                ` : outerNodes.filter(n => n.category === 'infra' || n.category === 'service').map(n => `
                    <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border);">
                        <div>
                            <div style="font-weight:600;font-size:13px;color:var(--text);">${escapeHTML(n.label)}</div>
                            <div style="font-size:11px;color:var(--text-dark);">${escapeHTML(n.type)}</div>
                        </div>
                        <button onclick="copyIOC('${escapeHTML(n.label)}')" class="clear-btn" style="background:var(--bg-elevated);border:1px solid var(--border);padding:4px 8px;border-radius:4px;font-size:11px;cursor:pointer;"><i class="fa-regular fa-copy"></i></button>
                    </div>
                `).join('')}
            </div>

            <div class="card">
                <div class="card-title"><i class="fa-solid fa-triangle-exclamation"></i> Threat Detections & Related Indicators</div>
                ${outerNodes.filter(n => n.category === 'threat' || n.category === 'indicator').length === 0 ? `
                    <div style="color:var(--text-dark);font-size:12px;padding:10px 0;">No threat pulses or vendor detections found</div>
                ` : outerNodes.filter(n => n.category === 'threat' || n.category === 'indicator').map(n => `
                    <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border);">
                        <div>
                            <div style="font-weight:600;font-size:13px;color:var(--danger);">${escapeHTML(n.label)}</div>
                            <div style="font-size:11px;color:var(--text-dark);">${escapeHTML(n.type)}</div>
                        </div>
                        <button onclick="copyIOC('${escapeHTML(n.label)}')" class="clear-btn" style="background:var(--bg-elevated);border:1px solid var(--border);padding:4px 8px;border-radius:4px;font-size:11px;cursor:pointer;"><i class="fa-regular fa-copy"></i></button>
                    </div>
                `).join('')}
            </div>
        </div>
    </div>
    `;

    container.innerHTML = html;
}

function getNodeIconChar(iconClass) {
    const map = {
        'fa-bullseye': '',
        'fa-network-wired': '',
        'fa-earth-americas': 'd',
        'fa-ethernet': '',
        'fa-bug': '',
        'fa-link': '',
        'fa-user-shield': ''
    };
    return map[iconClass] || '';
}

window.renderRelationshipsTab = renderRelationshipsTab;