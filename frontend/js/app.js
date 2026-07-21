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
    let html = `
    <div style="margin-bottom:16px;">
        <h2 style="font-weight:600;font-size:18px;margin-bottom:4px;">📦 Batch Investigation</h2>
        <p style="color:var(--text-dark);font-size:13px;">Batch ID: ${result.batch_id || 'N/A'}</p>
    </div>
    <div class="two-col">
        <div class="card">
            <div class="card-title">Summary</div>
            <div class="infra-row"><span class="label">Total IOCs</span><span class="value">${summary.total || 0}</span></div>
            <div class="infra-row"><span class="label">Successful</span><span class="value" style="color:var(--success);">${summary.successful || 0}</span></div>
            <div class="infra-row"><span class="label">Failed</span><span class="value" style="color:var(--danger);">${summary.failed || 0}</span></div>
        </div>
        <div class="card">
            <div class="card-title">Types</div>
            ${Object.entries(summary.types || {}).map(([type, count]) => `
                <div class="infra-row"><span class="label">${type}</span><span class="value">${count || 0}</span></div>
            `).join('')}
        </div>
    </div>
    <div class="card" style="margin-bottom:14px;">
        <div class="card-title">Results</div>
        ${(result.results || []).map(r => `
            <div style="padding:8px 0;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;">
                <span style="font-family:var(--font-mono);font-size:12px;">${r.indicator}</span>
                <span style="font-size:11px;color:var(--text-dark);">${r.type}</span>
                <span style="font-size:11px;${r.error ? 'color:var(--danger);' : 'color:var(--success);'}">
                    ${r.error ? '❌ ' + r.error : '✅ Done'}
                </span>
            </div>
        `).join('')}
    </div>
    `;
    container.innerHTML = html;
}

// Expose functions globally (for onclick attributes)
window.loadInvestigation = loadInvestigation;
window.exportPDF = exportPDF;
window.copyIOC = copyIOC;
window.clearRecentInvestigations = clearRecentInvestigations;