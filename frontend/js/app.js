// ============================================================
// MAIN APPLICATION
// ============================================================

let currentIOC = null;
let currentType = 'ip';

document.addEventListener('DOMContentLoaded', () => {
    // Load feed status
    getHealth().then(health => {
        window.lastHealthData = health;
        renderFeedStatus(health);
        if (health && health.uptime) {
            document.getElementById('uptime').textContent = (health.uptime / 60).toFixed(1) + 'm';
        }
    }).catch(() => {
        document.querySelectorAll('.feed-pill').forEach(p => {
            p.querySelector('.dot').classList.add('offline');
        });
    });
    
    renderRecentChips();
    updatePlaceholder('ip');
    
    // Input tabs
    document.querySelectorAll('.input-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.input-tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            const type = this.dataset.type;
            currentType = type;
            updatePlaceholder(type);
            document.querySelector('.search-hint').textContent = 
                type === 'batch' ? 'Enter multiple IOCs separated by commas' : 'Press Ctrl+Enter to investigate';
        });
    });
    
    // Search button
    document.getElementById('investigateBtn').addEventListener('click', performSearch);
    
    // AI Natural Language Search (Priority 10)
    const aiSearchBtn = document.getElementById('aiHistorySearchBtn');
    const aiSearchInput = document.getElementById('aiHistorySearchInput');
    const performAiSearch = async () => {
        if (!aiSearchInput || !aiSearchInput.value.trim()) return;
        const q = aiSearchInput.value.trim();
        const resBox = document.getElementById('aiHistorySearchResults');
        if (!resBox) return;
        resBox.style.display = 'block';
        resBox.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Searching historical investigations with Groq AI...';
        try {
            const resp = await fetch('/api/history/ai-search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: q })
            });
            const data = await resp.json();
            if (data.success) {
                let html = `<div style="font-weight:600;color:#fff;margin-bottom:8px;"><i class="fa-solid fa-wand-magic-sparkles" style="color:#c084fc;"></i> ${typeof parseMarkdown === 'function' ? parseMarkdown(data.answer) : data.answer}</div>`;
                if (data.matching_iocs && data.matching_iocs.length) {
                    html += `<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px;">` +
                        data.matching_iocs.map(m => `<span class="chip" onclick="loadInvestigation('${typeof safeString === 'function' ? safeString(m.ioc) : m.ioc}', '${typeof safeString === 'function' ? safeString(m.type || 'ip') : (m.type || 'ip')}')" style="cursor:pointer;background:rgba(139,92,246,0.2);border:1px solid #c084fc;color:#fff;padding:4px 10px;border-radius:14px;">${typeof safeString === 'function' ? safeString(m.ioc) : m.ioc} (${typeof safeString === 'function' ? safeString(m.verdict || 'UNKNOWN') : (m.verdict || 'UNKNOWN')})</span>`).join('') +
                        `</div>`;
                }
                resBox.innerHTML = html;
            } else {
                resBox.innerHTML = `<span style="color:var(--danger)">Error: ${typeof safeString === 'function' ? safeString(data.error || 'Search failed') : (data.error || 'Search failed')}</span>`;
            }
        } catch (e) {
            resBox.innerHTML = '<span style="color:var(--danger)">Error communicating with AI Search service.</span>';
        }
    };
    if (aiSearchBtn) aiSearchBtn.addEventListener('click', performAiSearch);
    if (aiSearchInput) aiSearchInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') performAiSearch(); });

    // Enter key
    document.getElementById('searchInput').addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || (e.ctrlKey && e.key === 'Enter')) {
            e.preventDefault();
            performSearch();
        }
    });
    
    // Back button
    document.getElementById('backBtn').addEventListener('click', () => {
        document.getElementById('page-search').classList.remove('hidden');
        document.getElementById('page-results').classList.remove('active');
        document.getElementById('logoText').textContent = '🛡️ Threat Intel Workbench';
    });
    
    // Copy button
    document.getElementById('copyBtn').addEventListener('click', function() {
        const ioc = this.dataset.ioc || currentIOC;
        if (ioc) copyIOC(ioc);
    });
    
    // Export PDF
    document.getElementById('exportPDFBtn').addEventListener('click', function() {
        if (typeof exportPDF === 'function') exportPDF();
    });
    
    // Clear recent
    document.getElementById('clearRecent').addEventListener('click', clearRecentInvestigations);
    
    // Sidebar navigation
    document.querySelectorAll('.results-sidebar .nav-item').forEach(item => {
        item.addEventListener('click', function() {
            document.querySelectorAll('.results-sidebar .nav-item').forEach(i => i.classList.remove('active'));
            this.classList.add('active');
            const tab = this.dataset.tab;
            document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
            const panel = document.getElementById(tab + 'Tab');
            if (panel) panel.classList.add('active');
        });
    });
});

function updatePlaceholder(type) {
    const input = document.getElementById('searchInput');
    const placeholders = {
        'ip': 'Enter IP address...',
        'domain': 'Enter domain name...',
        'hash': 'Enter SHA256, SHA1, or MD5 hash...',
        'url': 'Enter URL (e.g., https://example.com)...',
        'batch': 'Enter multiple IOCs separated by commas...'
    };
    input.placeholder = placeholders[type] || placeholders['ip'];
}

function performSearch() {
    const input = document.getElementById('searchInput');
    const value = input.value.trim();
    if (!value) {
        alert('Please enter an IOC to investigate.');
        return;
    }
    currentIOC = value;
    
    if (currentType === 'batch') {
        const items = value.split(',').map(s => s.trim()).filter(s => s);
        if (items.length === 0) { alert('Please enter at least one IOC.'); return; }
        if (items.length > 10) { alert('Maximum 10 IOCs per batch.'); return; }
        performBatchInvestigation(items);
        return;
    }
    
    const detected = detectType(value);
    let type = currentType;
    if (detected !== 'unknown' && detected !== type) {
        type = detected;
        document.querySelectorAll('.input-tab').forEach(t => {
            t.classList.toggle('active', t.dataset.type === type);
        });
    }
    loadInvestigation(value, type);
}

// ============================================================
// LOAD INVESTIGATION - MAIN FUNCTION
// ============================================================
async function loadInvestigation(value, type) {
    if (!value) return;
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
            addRecentInvestigation(value, type);
            document.getElementById('page-search').classList.add('hidden');
            document.getElementById('page-results').classList.add('active');
            
            // ============================================================
            // RENDER ALL TABS
            // ============================================================
            // 1. Overview Tab
            if (typeof renderOverview === 'function') renderOverview(result.data);
            
            // 2. Intelligence Tab
            if (typeof renderIntelligenceTab === 'function') renderIntelligenceTab(result.data);
            
            // 3. Evidence Tab
            if (typeof renderEvidenceTab === 'function') renderEvidenceTab(result.data);
            
            // 4. Relationships Tab
            if (typeof renderRelationshipsTab === 'function') renderRelationshipsTab(result.data);

            // 5. Timeline Tab
            if (typeof renderTimelineTab === 'function') renderTimelineTab(result.data);

            // 6. Settings Tab
            if (typeof renderSettingsTab === 'function') renderSettingsTab(result.data, window.lastHealthData);
            
            // Update global state for AI Chat & Report Generator
            window.currentEvidenceData = result.data;
            window.currentIOC = result.data.ioc || null;
            window.currentRisk = result.data.risk || null;
            window.currentFindings = result.data.ai_summary?.findings || [];
            window.currentMitre = result.data.ai_summary?.attackTechniques || [];
            window.currentActor = result.data.enrichment?.actor || null;

            // Update footer and header
            if (typeof updateFooterStats === 'function') updateFooterStats(result.data);
            document.getElementById('logoText').textContent = `🛡️ Investigating: ${value}`;
            const copyBtn = document.getElementById('copyBtn');
            if (copyBtn) copyBtn.dataset.ioc = value;
        } else {
            alert('Error: ' + (result.error || 'Investigation failed'));
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
    btn.innerHTML = originalText;
    btn.disabled = false;
}

async function performBatchInvestigation(items) {
    const btn = document.getElementById('investigateBtn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Batch investigating...';
    btn.disabled = true;
    
    try {
        const result = await investigateBatch(items);
        if (result.success) {
            document.getElementById('page-search').classList.add('hidden');
            document.getElementById('page-results').classList.add('active');
            renderBatchResults(result);
        } else {
            alert('Batch Error: ' + (result.error || 'Failed'));
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
    btn.innerHTML = originalText;
    btn.disabled = false;
}

function renderBatchResults(result) {
    const container = document.getElementById('overviewTab');
    const summary = result.summary || {};
    const ai = result.batch_ai_synthesis || null;

    let html = `
    <div style="margin-bottom:16px;display:flex;justify-content:space-between;align-items:center;">
        <div>
            <h2 style="font-weight:700;font-size:20px;margin-bottom:4px;color:#fff;"><i class="fa-solid fa-layer-group" style="color:var(--accent);"></i> Bulk IOC Investigation & AI Synthesis</h2>
            <p style="color:var(--text-dim);font-size:13px;margin:0;">Batch ID: <span style="font-family:var(--font-mono);">${result.batch_id || 'N/A'}</span></p>
        </div>
        <button onclick="document.getElementById('page-results').classList.remove('active');document.getElementById('page-search').classList.remove('hidden');" style="background:var(--bg-elevated);color:var(--text-light);border:1px solid var(--border);padding:6px 14px;border-radius:8px;font-size:12px;cursor:pointer;"><i class="fa-solid fa-arrow-left"></i> Back to Search</button>
    </div>

    ${ai ? `
    <div class="card" style="padding:24px;margin-bottom:20px;border:1px solid rgba(139,92,246,0.4);background:linear-gradient(135deg, rgba(139,92,246,0.12) 0%, rgba(15,23,42,0.95) 100%);">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;padding-bottom:12px;border-bottom:1px solid rgba(255,255,255,0.08);">
            <i class="fa-solid fa-wand-magic-sparkles" style="color:#c084fc;font-size:20px;"></i>
            <h3 style="margin:0;font-size:16px;color:#fff;">AI Bulk Correlation & Campaign Tracking (Priority 6 & 9)</h3>
            <span style="margin-left:auto;background:rgba(192,132,252,0.15);color:#c084fc;padding:3px 10px;border-radius:12px;font-size:11px;font-weight:600;">Groq Llama 3.3 70B</span>
        </div>
        <div style="margin-bottom:14px;">
            <div style="font-size:11px;color:#a855f7;font-weight:700;text-transform:uppercase;margin-bottom:4px;">Pattern Synthesis Across Batch</div>
            <div style="font-size:13px;color:#fff;line-height:1.5;">${typeof parseMarkdown === 'function' ? parseMarkdown(ai.pattern_summary) : safeString(ai.pattern_summary)}</div>
        </div>
        ${ai.infrastructure_correlation && ai.infrastructure_correlation.length ? `
        <div style="margin-bottom:14px;">
            <div style="font-size:11px;color:#a855f7;font-weight:700;text-transform:uppercase;margin-bottom:4px;">Infrastructure & ASN Correlation</div>
            <ul style="margin:0;padding-left:20px;font-size:13px;color:var(--text-light);line-height:1.5;">
                ${ai.infrastructure_correlation.map(c => `<li>${typeof parseMarkdown === 'function' ? parseMarkdown(c) : safeString(c)}</li>`).join('')}
            </ul>
        </div>
        ` : ''}
        ${ai.campaign_tracking ? `
        <div style="padding:10px 14px;background:rgba(30,41,59,0.7);border-left:3px solid #c084fc;border-radius:6px;">
            <div style="font-size:11px;color:#c084fc;font-weight:700;text-transform:uppercase;margin-bottom:2px;"><i class="fa-solid fa-crosshairs"></i> Threat Actor Campaign Tracking</div>
            <div style="font-size:13px;color:var(--text-light);">${typeof parseMarkdown === 'function' ? parseMarkdown(ai.campaign_tracking) : safeString(ai.campaign_tracking)}</div>
        </div>
        ` : ''}
    </div>
    ` : ''}

    <div class="two-col" style="margin-bottom:20px;">
        <div class="card" style="padding:18px;">
            <div class="card-title" style="margin-bottom:12px;"><i class="fa-solid fa-chart-pie"></i> Batch Execution Metrics</div>
            <div class="infra-row"><span class="label">Total Indicators</span><span class="value" style="font-weight:700;">${summary.total || 0}</span></div>
            <div class="infra-row"><span class="label">Successfully Investigated</span><span class="value" style="color:var(--success);font-weight:700;">${summary.successful || 0}</span></div>
            <div class="infra-row"><span class="label">Failed / Rate Limited</span><span class="value" style="color:var(--danger);font-weight:700;">${summary.failed || 0}</span></div>
        </div>
        <div class="card" style="padding:18px;">
            <div class="card-title" style="margin-bottom:12px;"><i class="fa-solid fa-tags"></i> Indicator Type Distribution</div>
            ${Object.entries(summary.types || {}).map(([type, count]) => `
                <div class="infra-row"><span class="label" style="text-transform:uppercase;">${type}</span><span class="value">${count || 0}</span></div>
            `).join('')}
        </div>
    </div>

    <div class="card" style="padding:20px;">
        <div class="card-title" style="margin-bottom:14px;"><i class="fa-solid fa-list-check"></i> Individual Indicator Results</div>
        <div style="display:flex;flex-direction:column;gap:8px;">
        ${(result.results || []).map(r => `
            <div style="padding:12px 16px;border:1px solid var(--border);border-radius:8px;background:var(--bg-elevated);display:flex;justify-content:space-between;align-items:center;transition:border-color 0.2s;">
                <div style="display:flex;align-items:center;gap:12px;">
                    <span style="font-size:16px;">${r.type === 'ip' ? '🌐' : r.type === 'domain' ? '🔗' : r.type === 'hash' ? '🛡️' : '📄'}</span>
                    <div>
                        <div style="font-family:var(--font-mono);font-size:14px;font-weight:600;color:#fff;">${typeof safeString === 'function' ? safeString(r.indicator) : r.indicator}</div>
                        <div style="font-size:11px;color:var(--text-dim);text-transform:uppercase;">Type: ${r.type}</div>
                    </div>
                </div>
                <div style="display:flex;align-items:center;gap:14px;">
                    <span style="font-size:12px;font-weight:600;padding:4px 10px;border-radius:12px;${r.error ? 'background:rgba(239,68,68,0.15);color:var(--danger);' : 'background:rgba(34,197,94,0.15);color:var(--success);'}">
                        ${r.error ? '<i class="fa-solid fa-xmark"></i> ' + (typeof safeString === 'function' ? safeString(r.error) : r.error) : '<i class="fa-solid fa-check"></i> Completed'}
                    </span>
                    ${!r.error ? `<button onclick="loadInvestigation('${typeof safeString === 'function' ? safeString(r.indicator) : r.indicator}', '${r.type}')" style="background:var(--accent);color:#fff;border:none;padding:6px 12px;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer;"><i class="fa-solid fa-arrow-right"></i> Inspect Deeply</button>` : ''}
                </div>
            </div>
        `).join('')}
        </div>
    </div>
    `;
    container.innerHTML = html;
}

// Expose functions globally (for onclick attributes)
window.loadInvestigation = loadInvestigation;
window.exportPDF = exportPDF;
window.copyIOC = copyIOC;
window.clearRecentInvestigations = clearRecentInvestigations;