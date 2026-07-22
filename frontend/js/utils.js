// ============================================================
// UTILITY FUNCTIONS
// ============================================================

function detectType(value) {
    if (!value) return null;
    const v = value.trim();
    // IP (IPv4)
    if (/^(\d{1,3}\.){3}\d{1,3}$/.test(v)) return 'ip';
    // Domain
    if (/^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/.test(v)) return 'domain';
    // Hash: MD5 (32), SHA1 (40), SHA256 (64)
    if (/^[a-fA-F0-9]{32}$/.test(v) || /^[a-fA-F0-9]{40}$/.test(v) || /^[a-fA-F0-9]{64}$/.test(v)) return 'hash';
    // URL
    if (/^https?:\/\//i.test(v)) return 'url';
    return 'unknown';
}

function formatDate(isoString) {
    if (!isoString) return 'N/A';
    const d = new Date(isoString);
    return d.toLocaleString('en-US', { 
        month: 'short', day: 'numeric', 
        hour: '2-digit', minute: '2-digit',
        hour12: true 
    });
}

function getVerdictColor(score) {
    if (score >= 80) return { color: '#ef4444', label: 'CRITICAL', emoji: '🔴' };
    if (score >= 60) return { color: '#f59e0b', label: 'HIGH', emoji: '🟠' };
    if (score >= 30) return { color: '#3b82f6', label: 'MEDIUM', emoji: '🔵' };
    return { color: '#22c55e', label: 'LOW', emoji: '🟢' };
}

function getVerdictClass(verdict) {
    const map = {
        'LOW': 'verdict-low',
        'MEDIUM': 'verdict-medium',
        'HIGH': 'verdict-high',
        'CRITICAL': 'verdict-critical'
    };
    return map[verdict] || 'verdict-low';
}

function truncate(str, len = 20) {
    if (!str) return '';
    return str.length > len ? str.slice(0, len) + '...' : str;
}

function getProviderStatus(provider) {
    if (!provider) return { status: 'offline', icon: 'fa-circle-xmark', class: 'status-error' };
    if (provider.success === false) return { status: 'Error', icon: 'fa-circle-xmark', class: 'status-error' };
    return { status: 'Online', icon: 'fa-circle-check', class: 'status-online' };
}

function getTypeBadgeClass(type) {
    const map = {
        'ip': 'ip',
        'domain': 'domain',
        'hash': 'hash',
        'url': 'url'
    };
    return map[type] || 'ip';
}

function safeString(val) {
    if (val === null || val === undefined) return 'N/A';
    return String(val);
}

function parseMarkdown(str) {
    if (str === null || str === undefined) return '';
    let text = String(str).trim();

    // 1. Escape unsafe HTML (<, >) while preserving basic entities
    text = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    // 2. Normalize inline numbered/bulleted lists from AI (e.g. "are: 1. **T1190:** text 2. **T1204:** text") to separate lines
    text = text.replace(/(\s|^)(\d+\.\s+\*\*)/g, '\n\n$2');
    text = text.replace(/(\s|^)([-*+]\s+\*\*)/g, '\n\n$2');

    // 3. Code blocks (```lang ... ```)
    text = text.replace(/```(?:[a-zA-Z0-9-]*)\r?\n?([\s\S]*?)```/g, (match, code) => {
        return `<pre style="background:rgba(15,23,42,0.95);border:1px solid rgba(139,92,246,0.35);border-radius:8px;padding:12px;overflow-x:auto;font-family:var(--font-mono);font-size:12px;color:#e2e8f0;margin:10px 0;"><code>${code.trim()}</code></pre>`;
    });

    // 4. Inline code (`...`)
    text = text.replace(/`([^`]+)`/g, '<code style="background:rgba(139,92,246,0.2);color:#c084fc;padding:2px 6px;border-radius:4px;font-family:var(--font-mono);font-size:12px;">$1</code>');

    // 5. Headings (### Title or ## Title)
    text = text.replace(/(?:^|\n)###\s+([^\n]+)/g, '<h4 style="color:#c084fc;font-size:14px;margin:12px 0 6px 0;font-weight:700;">$1</h4>');
    text = text.replace(/(?:^|\n)##\s+([^\n]+)/g, '<h3 style="color:#fff;font-size:15px;margin:14px 0 8px 0;font-weight:700;">$1</h3>');

    // 6. Numbered MITRE TTPs / bold numbered items (e.g., "\n1. **T1190: Exploit Public-Facing Application**: text")
    text = text.replace(/(?:^|\n)(\d+)\.\s+\*\*([^*]+)\*\*:?\s*([^\n]*)/g, (match, num, title, desc) => {
        return `<div style="margin-top:10px;padding:10px 12px;background:rgba(30,41,59,0.5);border:1px solid rgba(139,92,246,0.3);border-left:3px solid #a855f7;border-radius:8px;"><div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;"><span style="background:rgba(139,92,246,0.3);border:1px solid #c084fc;color:#fff;border-radius:4px;padding:1px 6px;font-size:11px;font-weight:700;font-family:var(--font-mono);">${num}</span><strong style="color:#fff;font-size:13px;font-weight:600;">${title.trim()}</strong></div>${desc ? `<div style="color:var(--text-light);font-size:12px;line-height:1.5;margin-top:4px;">${desc.trim()}</div>` : ''}</div>`;
    });

    // 7. General numbered list items (`1. Item` without bold)
    text = text.replace(/(?:^|\n)(\d+)\.\s+([^\n]+)/g, '<div style="margin-top:6px;display:flex;gap:8px;align-items:baseline;"><span style="color:#c084fc;font-weight:700;font-family:var(--font-mono);">$1.</span><span style="color:var(--text-light);line-height:1.5;">$2</span></div>');

    // 8. Bullet lists (`- Item` or `* Item`)
    text = text.replace(/(?:^|\n)[-*+]\s+([^\n]+)/g, '<div style="margin-top:6px;display:flex;gap:8px;align-items:baseline;"><i class="fa-solid fa-chevron-right" style="color:#a855f7;font-size:10px;margin-top:3px;flex-shrink:0;"></i><span style="color:var(--text-light);line-height:1.5;">$1</span></div>');

    // 9. Bold (**text** or __text__)
    text = text.replace(/\*\*([^*]+)\*\*/g, '<strong style="color:#fff;font-weight:600;">$1</strong>');
    text = text.replace(/__([^_]+)__/g, '<strong style="color:#fff;font-weight:600;">$1</strong>');

    // 10. Italics (*text* or _text_)
    text = text.replace(/(?:\*([^*]+)\*|_([^_]+)_)/g, (match, p1, p2) => `<em>${p1 || p2}</em>`);

    // 11. Clean up remaining newlines into <br/>
    text = text.replace(/\r?\n\r?\n/g, '<br/><br/>');
    text = text.replace(/\r?\n/g, '<br/>');
    text = text.replace(/(<\/div>|<\/h3>|<\/h4>|<\/pre>)<br\/>/g, '$1');
    text = text.replace(/<br\/><br\/>(<\/div>|<div)/g, '$1');

    return text;
}

window.parseMarkdown = parseMarkdown;

function sanitizeForAI(data) {
    if (!data) return {};
    const findings = [];
    const prov = data.providers || {};
    if (prov.virustotal?.success) findings.push(`VirusTotal: ${prov.virustotal.detections || 0} detections (${prov.virustotal.ratio || '0/0'})`);
    if (prov.abuseipdb?.success) findings.push(`AbuseIPDB: ${prov.abuseipdb.abuse_score || 0}% abuse score`);
    if (prov.shodan?.success && prov.shodan.vulnerabilities?.length > 0) findings.push(`Shodan: ${prov.shodan.vulnerabilities.length} vulnerabilities`);
    if (prov.otx?.success && prov.otx.pulses > 0) findings.push(`OTX: ${prov.otx.pulses} threat pulses`);
    if (data.enrichment?.geolocation?.success) findings.push(`Location: ${data.enrichment.geolocation.country || 'Unknown'}`);
    if (findings.length === 0 && Array.isArray(data.ai_summary?.findings)) {
        findings.push(...data.ai_summary.findings);
    }

    return {
        ioc: data.ioc || null,
        risk: data.risk || null,
        findings,
        ai_summary: {
            summary: data.ai_summary?.summary || data.ai_summary?.text || null,
            false_positive_triage: data.ai_summary?.false_positive_triage || null,
            attackTechniques: data.ai_summary?.attackTechniques || []
        },
        enrichment: {
            geolocation: data.enrichment?.geolocation ? {
                country: data.enrichment.geolocation.country,
                city: data.enrichment.geolocation.city,
                isp: data.enrichment.geolocation.isp
            } : null,
            asn: data.enrichment?.asn ? {
                asn: data.enrichment.asn.asn,
                as_name: data.enrichment.asn.as_name
            } : null,
            actor: data.enrichment?.actor || null
        },
        providers_summary: {
            virustotal: prov.virustotal ? { success: prov.virustotal.success, detections: prov.virustotal.detections, ratio: prov.virustotal.ratio } : null,
            abuseipdb: prov.abuseipdb ? { success: prov.abuseipdb.success, abuse_score: prov.abuseipdb.abuse_score } : null,
            shodan: prov.shodan ? { success: prov.shodan.success, ports: (prov.shodan.ports || []).slice(0, 10) } : null,
            otx: prov.otx ? { success: prov.otx.success, pulses: prov.otx.pulses } : null,
            urlscan: prov.urlscan ? { success: prov.urlscan.success, malicious: prov.urlscan.malicious } : null
        }
    };
}

window.sanitizeForAI = sanitizeForAI;