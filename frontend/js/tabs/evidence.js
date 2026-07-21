// ============================================================
// EVIDENCE TAB - RAW TELEMETRY & JSON INSPECTOR
// ============================================================
function renderEvidenceTab(data) {
    const container = document.getElementById('evidenceTab');
    if (!container) return;
    if (!data) {
        container.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text-dark);">No evidence telemetry available.</div>';
        return;
    }

    const providers = data.providers || {};
    const enrichment = data.enrichment || {};
    const risk = data.risk || {};
    const ioc = data.ioc || {};

    // Combine all sections for easy navigation and copying
    const sections = [];
    sections.push({ id: 'full', title: 'Complete Investigation Payload', icon: 'fa-file-code', data: data });
    sections.push({ id: 'risk', title: 'Risk Assessment Engine Results', icon: 'fa-shield-halved', data: risk });

    Object.entries(providers).forEach(([key, prov]) => {
        sections.push({
            id: `prov_${key}`,
            title: `Provider: ${key.charAt(0).toUpperCase() + key.slice(1)}`,
            icon: prov?.success ? 'fa-check-circle' : 'fa-triangle-exclamation',
            statusColor: prov?.success ? 'var(--success)' : 'var(--danger)',
            data: prov
        });
    });

    Object.entries(enrichment).forEach(([key, enr]) => {
        if (enr && Object.keys(enr).length > 0) {
            sections.push({
                id: `enr_${key}`,
                title: `Enrichment: ${key.toUpperCase()}`,
                icon: 'fa-database',
                statusColor: enr?.success ? 'var(--success)' : 'var(--text-dark)',
                data: enr
            });
        }
    });

    let html = `
    <div style="max-width:1000px;margin:0 auto;padding:24px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;padding-bottom:14px;border-bottom:1px solid var(--border);">
            <div style="display:flex;align-items:center;gap:10px;">
                <i class="fa-solid fa-code" style="color:var(--info);font-size:20px;"></i>
                <div>
                    <h2 style="font-size:18px;font-weight:700;margin:0;">Evidence & Telemetry Inspector</h2>
                    <span style="font-size:12px;color:var(--text-dark);">Raw API responses and computed enrichment evidence</span>
                </div>
            </div>
            <div style="display:flex;gap:10px;">
                <button class="clear-btn" onclick="copyEvidenceJSON('full')" style="background:var(--bg-elevated);border:1px solid var(--border);color:var(--text);padding:6px 12px;border-radius:6px;font-size:12px;cursor:pointer;display:flex;align-items:center;gap:6px;">
                    <i class="fa-regular fa-copy"></i> Copy Full Payload
                </button>
                <button class="clear-btn" onclick="downloadEvidenceJSON()" style="background:var(--primary);color:#fff;border:none;padding:6px 12px;border-radius:6px;font-size:12px;cursor:pointer;display:flex;align-items:center;gap:6px;font-weight:600;">
                    <i class="fa-solid fa-download"></i> Download JSON
                </button>
            </div>
        </div>

        <div style="display:grid;grid-template-columns:250px 1fr;gap:20px;">
            <div class="card" style="padding:12px;height:fit-content;position:sticky;top:20px;">
                <div style="font-size:11px;font-weight:700;color:var(--text-dark);text-transform:uppercase;margin-bottom:10px;padding:0 8px;">Telemetry Sections</div>
                ${sections.map((s, i) => `
                <div onclick="showEvidenceSection('${s.id}')" class="evidence-nav-item ${i === 0 ? 'active' : ''}" id="nav_${s.id}" style="padding:8px 10px;border-radius:6px;font-size:13px;cursor:pointer;display:flex;align-items:center;gap:8px;margin-bottom:4px;color:var(--text);background:${i === 0 ? 'var(--bg-elevated)' : 'transparent'};border:1px solid ${i === 0 ? 'var(--border)' : 'transparent'};">
                    <i class="fa-solid ${s.icon}" style="color:${s.statusColor || 'var(--info)'};font-size:14px;width:16px;"></i>
                    <span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${s.title}</span>
                </div>
                `).join('')}
            </div>

            <div>
                ${sections.map((s, i) => {
                    const jsonStr = JSON.stringify(s.data, null, 2) || '{}';
                    return `
                    <div class="card evidence-panel ${i === 0 ? 'active' : ''}" id="panel_${s.id}" style="display:${i === 0 ? 'block' : 'none'};padding:20px;">
                        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;padding-bottom:12px;border-bottom:1px solid var(--border);">
                            <div style="display:flex;align-items:center;gap:8px;">
                                <i class="fa-solid ${s.icon}" style="color:${s.statusColor || 'var(--info)'};"></i>
                                <span style="font-weight:600;font-size:15px;color:var(--text);">${s.title}</span>
                            </div>
                            <button onclick="copyEvidenceJSON('${s.id}')" class="clear-btn" style="background:var(--bg-elevated);border:1px solid var(--border);color:var(--text);padding:4px 10px;border-radius:6px;font-size:11px;cursor:pointer;display:flex;align-items:center;gap:4px;">
                                <i class="fa-regular fa-copy" id="btn_copy_${s.id}"></i> Copy
                            </button>
                        </div>
                        <pre style="margin:0;background:var(--bg-dark);padding:16px;border-radius:8px;border:1px solid var(--border);overflow-x:auto;max-height:600px;font-family:var(--font-mono);font-size:12px;color:#cbd5e1;line-height:1.5;"><code>${escapeHTML(jsonStr)}</code></pre>
                    </div>
                    `;
                }).join('')}
            </div>
        </div>
    </div>
    `;

    container.innerHTML = html;
    window.currentEvidenceData = data;
}

function showEvidenceSection(id) {
    document.querySelectorAll('.evidence-panel').forEach(p => p.style.display = 'none');
    document.querySelectorAll('.evidence-nav-item').forEach(n => {
        n.style.background = 'transparent';
        n.style.borderColor = 'transparent';
    });
    const panel = document.getElementById(`panel_${id}`);
    const nav = document.getElementById(`nav_${id}`);
    if (panel) panel.style.display = 'block';
    if (nav) {
        nav.style.background = 'var(--bg-elevated)';
        nav.style.borderColor = 'var(--border)';
    }
}

function copyEvidenceJSON(id) {
    if (!window.currentEvidenceData) return;
    let target = window.currentEvidenceData;
    if (id === 'risk') target = window.currentEvidenceData.risk;
    else if (id.startsWith('prov_')) target = (window.currentEvidenceData.providers || {})[id.replace('prov_', '')];
    else if (id.startsWith('enr_')) target = (window.currentEvidenceData.enrichment || {})[id.replace('enr_', '')];

    const jsonStr = JSON.stringify(target, null, 2);
    navigator.clipboard.writeText(jsonStr).then(() => {
        const btnIcon = document.getElementById(`btn_copy_${id}`);
        if (btnIcon) {
            btnIcon.className = 'fa-solid fa-check';
            btnIcon.style.color = 'var(--success)';
            setTimeout(() => {
                btnIcon.className = 'fa-regular fa-copy';
                btnIcon.style.color = 'inherit';
            }, 2000);
        }
    });
}

function downloadEvidenceJSON() {
    if (!window.currentEvidenceData) return;
    const jsonStr = JSON.stringify(window.currentEvidenceData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `threat-intel-${window.currentEvidenceData?.ioc?.value || 'investigation'}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function escapeHTML(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

window.renderEvidenceTab = renderEvidenceTab;
window.showEvidenceSection = showEvidenceSection;
window.copyEvidenceJSON = copyEvidenceJSON;
window.downloadEvidenceJSON = downloadEvidenceJSON;