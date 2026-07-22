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
    // SECTION 0: AI TACTICAL ASSESSMENT & RECOMMENDATIONS (Quick Wins)
    // ============================================================
    const aiSummary = data.ai_summary || null;
    if (aiSummary && (aiSummary.false_positive_triage || aiSummary.action_recommendations || aiSummary.next_steps)) {
        html += `
        <div class="intel-card full" style="border:1px solid rgba(139,52,246,0.35);background:linear-gradient(135deg, rgba(139,52,246,0.08) 0%, rgba(15,23,42,0.95) 100%);">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;padding-bottom:10px;border-bottom:1px solid rgba(255,255,255,0.08);">
                <div style="display:flex;align-items:center;gap:10px;">
                    <i class="fa-solid fa-wand-magic-sparkles" style="color:#c084fc;font-size:18px;"></i>
                    <h3 style="margin:0;font-size:16px;color:#fff;">AI Tactical Defense Briefing</h3>
                </div>
                <span style="background:rgba(192,132,252,0.15);color:#c084fc;padding:3px 10px;border-radius:12px;font-size:11px;font-weight:600;">Groq Llama 3.3 70B</span>
            </div>
            
            ${aiSummary.summary ? `<div style="font-size:13px;color:var(--text-light);margin-bottom:14px;line-height:1.6;">${safeString(aiSummary.summary)}</div>` : ''}

            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:14px;">
                ${aiSummary.false_positive_triage ? `
                <div style="padding:12px;border-radius:8px;background:rgba(59,130,246,0.08);border:1px solid rgba(59,130,246,0.25);">
                    <div style="font-weight:600;font-size:13px;color:#60a5fa;margin-bottom:6px;"><i class="fa-solid fa-scale-balanced"></i> False Positive Triage: <span style="color:#fff;">${safeString(aiSummary.false_positive_triage.verdict || 'UNKNOWN')}</span></div>
                    <div style="font-size:12px;color:var(--text-light);line-height:1.5;">${safeString(aiSummary.false_positive_triage.explanation || '')}</div>
                </div>
                ` : ''}

                ${Array.isArray(aiSummary.action_recommendations) && aiSummary.action_recommendations.length > 0 ? `
                <div style="padding:12px;border-radius:8px;background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.25);">
                    <div style="font-weight:600;font-size:13px;color:#f87171;margin-bottom:6px;"><i class="fa-solid fa-shield-halved"></i> Immediate Action Recommendations</div>
                    <ul style="margin:0;padding-left:18px;font-size:12px;color:var(--text-light);line-height:1.6;">
                        ${aiSummary.action_recommendations.map(r => `<li><strong style="color:#fff;">${safeString(r)}</strong></li>`).join('')}
                    </ul>
                </div>
                ` : ''}

                ${Array.isArray(aiSummary.next_steps) && aiSummary.next_steps.length > 0 ? `
                <div style="padding:12px;border-radius:8px;background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.25);">
                    <div style="font-weight:600;font-size:13px;color:#34d399;margin-bottom:6px;"><i class="fa-solid fa-magnifying-glass-arrow-right"></i> Investigative Next Steps</div>
                    <ul style="margin:0;padding-left:18px;font-size:12px;color:var(--text-light);line-height:1.6;">
                        ${aiSummary.next_steps.map(s => `<li>${safeString(s)}</li>`).join('')}
                    </ul>
                </div>
                ` : ''}
            </div>
        </div>
        `;
    }

    // ============================================================
    // SECTION 1: THREAT ACTOR PROFILE (from actor.service.js)
    // ============================================================
    const actorProfile = enrichment.actor || null;
    if (actorProfile) {
        const flag = actorProfile.flag || '🚩';
        const confLabel = actorProfile.confidenceLabel || 'HIGH';
        const confScore = actorProfile.confidence || 90;
        const aliases = Array.isArray(actorProfile.aliases) && actorProfile.aliases.length > 0
            ? actorProfile.aliases.join(', ') : 'None documented';
        const motivations = Array.isArray(actorProfile.motivations) && actorProfile.motivations.length > 0
            ? actorProfile.motivations.map(m => `<span style="display:inline-block;background:rgba(245,158,11,0.15);color:#f59e0b;padding:2px 8px;border-radius:12px;font-size:11px;margin-right:6px;margin-bottom:4px;">${safeString(m)}</span>`).join('')
            : 'Unspecified';
        const sectors = Array.isArray(actorProfile.sectors) && actorProfile.sectors.length > 0
            ? actorProfile.sectors.map(s => `<span style="display:inline-block;background:rgba(59,130,246,0.15);color:#3b82f6;padding:2px 8px;border-radius:12px;font-size:11px;margin-right:6px;margin-bottom:4px;">${safeString(s)}</span>`).join('')
            : 'Unspecified';
        const campaigns = Array.isArray(actorProfile.campaigns) && actorProfile.campaigns.length > 0
            ? actorProfile.campaigns.map(c => `<li style="margin-bottom:4px;color:var(--text-light);"><i class="fa-solid fa-calendar-check" style="color:#22c55e;margin-right:6px;"></i> ${safeString(c)}</li>`).join('')
            : '<li style="color:var(--text-dark);">No specific campaign entries documented</li>';

        html += `
        <div class="intel-card full" style="border:1px solid rgba(239,68,68,0.3);background:linear-gradient(135deg, rgba(239,68,68,0.06) 0%, rgba(15,23,42,0.95) 100%);">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;margin-bottom:16px;padding-bottom:12px;border-bottom:1px solid rgba(255,255,255,0.08);">
                <div style="display:flex;align-items:center;gap:14px;">
                    <div style="font-size:36px;width:56px;height:56px;border-radius:12px;background:rgba(239,68,68,0.15);display:flex;align-items:center;justify-content:center;border:1px solid rgba(239,68,68,0.3);">
                        ${flag}
                    </div>
                    <div>
                        <div style="display:flex;align-items:center;gap:8px;">
                            <h3 style="margin:0;font-size:20px;color:#fff;">${safeString(actorProfile.primary_name)}</h3>
                            <span class="actor-confidence conf-${confLabel.toLowerCase()}" style="font-size:11px;padding:3px 8px;">Confidence: ${confScore}% (${confLabel})</span>
                        </div>
                        <div style="color:var(--text-dark);font-size:12px;margin-top:4px;"><i class="fa-solid fa-globe" style="margin-right:4px;"></i> Country of Origin: <strong style="color:var(--text-light);">${safeString(actorProfile.country || 'Unknown')}</strong> | MITRE ID: <strong style="color:var(--text-light);">${safeString(actorProfile.mitre_id || 'N/A')}</strong></div>
                    </div>
                </div>
                <div style="font-size:12px;color:var(--text-dark);max-width:320px;text-align:right;">
                    <em>${safeString(actorProfile.matched_reason || 'Correlated via multi-source threat intelligence.')}</em>
                </div>
            </div>
            
            ${actorProfile.description ? `<p style="font-size:13px;color:var(--text-light);line-height:1.5;margin-bottom:16px;">${safeString(actorProfile.description)}</p>` : ''}
            
            <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(280px, 1fr));gap:16px;">
                <div style="background:rgba(0,0,0,0.25);padding:12px;border-radius:8px;border:1px solid rgba(255,255,255,0.05);">
                    <div style="font-size:12px;color:var(--text-dark);margin-bottom:6px;font-weight:600;"><i class="fa-solid fa-tags" style="color:#f59e0b;margin-right:6px;"></i>Known Aliases</div>
                    <div style="font-size:12px;color:var(--text-light);line-height:1.4;">${aliases}</div>
                </div>
                <div style="background:rgba(0,0,0,0.25);padding:12px;border-radius:8px;border:1px solid rgba(255,255,255,0.05);">
                    <div style="font-size:12px;color:var(--text-dark);margin-bottom:6px;font-weight:600;"><i class="fa-solid fa-bullseye" style="color:#f59e0b;margin-right:6px;"></i>Primary Motivations</div>
                    <div>${motivations}</div>
                </div>
                <div style="background:rgba(0,0,0,0.25);padding:12px;border-radius:8px;border:1px solid rgba(255,255,255,0.05);">
                    <div style="font-size:12px;color:var(--text-dark);margin-bottom:6px;font-weight:600;"><i class="fa-solid fa-building-shield" style="color:#3b82f6;margin-right:6px;"></i>Targeted Sectors</div>
                    <div>${sectors}</div>
                </div>
                <div style="background:rgba(0,0,0,0.25);padding:12px;border-radius:8px;border:1px solid rgba(255,255,255,0.05);">
                    <div style="font-size:12px;color:var(--text-dark);margin-bottom:6px;font-weight:600;"><i class="fa-solid fa-history" style="color:#22c55e;margin-right:6px;"></i>Known Historical Campaigns</div>
                    <ul style="margin:0;padding-left:0;list-style:none;font-size:12px;">
                        ${campaigns}
                    </ul>
                </div>
            </div>
        </div>
        `;
    }

    // ============================================================
    // SECTION 1: MITRE ATT&CK (from backend correlation)
    // ============================================================
    const mitreTechniques = Array.isArray(enrichment.mitre) ? enrichment.mitre : [];
    
    html += `
        <div class="intel-card full">
            <div class="card-title"><i class="fa-solid fa-crosshairs"></i> MITRE ATT&CK® Techniques <span style="color:var(--text-dark);margin-left:4px;">(${mitreTechniques.length} mapped)</span></div>
            ${mitreTechniques.length > 0 ? `
            <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(220px, 1fr));gap:14px;margin-top:12px;">
                ${mitreTechniques.map(tech => `
                <div onclick="showMitreDetails('${safeString(tech.techniqueId)}', '${safeString(tech.technique)}', '${safeString(tech.tactic)}', ${tech.confidence || 0}, '${safeString(tech.confidenceLabel || 'LOW')}', '${safeString((tech.explanation || '').replace(/'/g, "\\'"))}', [${(tech.mitigations || []).map(m => `'${safeString(m).replace(/'/g, "\\'")}'`).join(',')}])" style="background:rgba(0,0,0,0.35);border-radius:10px;padding:14px;border:1px solid rgba(255,255,255,0.08);cursor:pointer;transition:all 0.2s ease;display:flex;flex-direction:column;justify-content:space-between;" onmouseover="this.style.borderColor='var(--danger)';this.style.transform='translateY(-2px)'" onmouseout="this.style.borderColor='rgba(255,255,255,0.08)';this.style.transform='none'">
                    <div>
                        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                            <span style="font-family:var(--font-mono);font-size:14px;color:#f59e0b;font-weight:700;background:rgba(245,158,11,0.12);padding:3px 8px;border-radius:6px;border:1px solid rgba(245,158,11,0.25);">${safeString(tech.techniqueId)}</span>
                            <span style="padding:3px 8px;border-radius:12px;font-size:10px;font-weight:700;background:${(tech.confidence || 0) >= 80 ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)'};color:${(tech.confidence || 0) >= 80 ? '#22c55e' : '#f59e0b'};border:1px solid ${(tech.confidence || 0) >= 80 ? 'rgba(34,197,94,0.3)' : 'rgba(245,158,11,0.3)'};">
                                ${tech.confidence || 0}% (${safeString(tech.confidenceLabel || 'LOW')})
                            </span>
                        </div>
                        <div style="font-size:14px;font-weight:600;color:var(--text-light);line-height:1.4;margin:6px 0;">
                            ${safeString(tech.technique)}
                        </div>
                    </div>
                    <div style="font-size:11px;color:var(--text-dark);margin-top:10px;padding-top:8px;border-top:1px solid rgba(255,255,255,0.05);display:flex;align-items:center;gap:6px;">
                        <i class="fa-solid fa-layer-group" style="color:var(--text-dark);"></i> Tactic: <strong style="color:var(--text-light);">${safeString(tech.tactic)}</strong>
                    </div>
                </div>
                `).join('')}
            </div>
            ` : `
            <div style="padding:20px;text-align:center;color:var(--text-dark);">
                <i class="fa-solid fa-circle-info" style="font-size:20px;display:block;margin-bottom:8px;"></i>
                <p>No specific MITRE ATT&CK® techniques mapped for this indicator.</p>
            </div>
            `}
        </div>
    `;
    
    // ============================================================
    // SECTION 2: Threat Actors (from MITRE correlation + OTX tags)
    // ============================================================
    const actorList = [];
    const seenActors = new Set();
    
    if (actorProfile) {
        seenActors.add(actorProfile.primary_name.toLowerCase());
        actorList.push({
            name: actorProfile.primary_name,
            source: actorProfile.matched_reason || 'Multi-source attribution correlation',
            conf: actorProfile.confidenceLabel || 'HIGH'
        });
    }
    
    // Add actors from MITRE techniques
    mitreTechniques.forEach(t => {
        if (Array.isArray(t.actors)) {
            t.actors.forEach(a => {
                if (!seenActors.has(a.toLowerCase())) {
                    seenActors.add(a.toLowerCase());
                    actorList.push({ name: a, source: `Associated with technique ${t.techniqueId}`, conf: t.confidenceLabel || 'MED' });
                }
            });
        }
    });
    
    // Add actors from OTX tags
    if (providers.otx?.success) {
        const tags = Array.isArray(providers.otx.tags) ? providers.otx.tags : [];
        tags.forEach(t => {
            if (typeof t === 'string' && (t.includes('APT') || t.includes('actor') || t.includes('threat') || t.includes('Group'))) {
                if (!seenActors.has(t.toLowerCase())) {
                    seenActors.add(t.toLowerCase());
                    actorList.push({ name: t, source: 'AlienVault OTX Pulse Tag', conf: 'HIGH' });
                }
            }
        });
    }
    
    html += `
        <div class="intel-card">
            <div class="card-title"><i class="fa-solid fa-user-secret"></i> Associated Threat Actors <span style="color:var(--text-dark);margin-left:4px;">(${actorList.length})</span></div>
            ${actorList.length > 0 ? actorList.map(actor => `
                <div class="actor-row">
                    <div class="actor-avatar" style="background:rgba(239,68,68,0.15);color:var(--danger);">
                        <i class="fa-solid fa-skull"></i>
                    </div>
                    <div class="actor-info">
                        <div class="actor-name">${safeString(actor.name)}</div>
                        <div class="actor-meta">${safeString(actor.source)}</div>
                    </div>
                    <span class="actor-confidence conf-${(actor.conf || 'med').toLowerCase()}">${actor.conf || 'MED'}</span>
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
                let barClass = 'clean';
                let status = 'Unknown';
                let statusColor = 'var(--text-dark)';
                
                if (prov.success) {
                    if (prov.detections !== undefined) {
                        const total = prov.total || 72;
                        score = (prov.detections / total) * 100;
                        label = `${prov.detections}/${total}`;
                        if (score > 50) { barClass = 'danger'; status = 'Critical'; statusColor = 'var(--danger)'; }
                        else if (score > 20) { barClass = 'warning'; status = 'Warning'; statusColor = 'var(--warning)'; }
                        else { barClass = 'clean'; status = 'Clean'; statusColor = 'var(--success)'; }
                    } else if (prov.abuse_score !== undefined) {
                        score = prov.abuse_score;
                        label = `${prov.abuse_score}%`;
                        if (score > 50) { barClass = 'danger'; status = 'Critical'; statusColor = 'var(--danger)'; }
                        else if (score > 30) { barClass = 'warning'; status = 'Warning'; statusColor = 'var(--warning)'; }
                        else { barClass = 'clean'; status = 'Clean'; statusColor = 'var(--success)'; }
                    } else if (prov.pulses !== undefined) {
                        score = Math.min(prov.pulses * 5, 100);
                        label = `${prov.pulses} pulses`;
                        if (prov.pulses > 10) { barClass = 'danger'; status = 'Active'; statusColor = 'var(--danger)'; }
                        else if (prov.pulses > 0) { barClass = 'warning'; status = 'Observed'; statusColor = 'var(--warning)'; }
                        else { barClass = 'clean'; status = 'Low'; statusColor = 'var(--success)'; }
                    } else {
                        score = 0;
                        label = 'OK';
                        barClass = 'clean';
                        status = 'Clean';
                        statusColor = 'var(--success)';
                    }
                } else {
                    score = 0;
                    label = 'Error';
                    barClass = 'neutral';
                    status = 'Offline';
                    statusColor = 'var(--text-dark)';
                }
                
                const displayName = key.charAt(0).toUpperCase() + key.slice(1);
                return `
                <div class="feed-row" style="display:flex;align-items:center;gap:12px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
                    <span class="feed-name" style="width:110px;font-weight:600;color:var(--text-light);">${displayName}</span>
                    <div class="feed-bar-track" style="flex:1;height:8px;background:rgba(255,255,255,0.08);border-radius:4px;overflow:hidden;">
                        <div class="feed-bar-fill" style="width:${Math.min(score, 100)}%;height:100%;background:${barClass === 'danger' ? 'var(--danger)' : barClass === 'warning' ? '#f59e0b' : barClass === 'clean' ? '#22c55e' : 'var(--text-dark)'};transition:width 0.3s ease;"></div>
                    </div>
                    <span class="feed-count" style="width:90px;text-align:right;font-family:var(--font-mono);font-size:12px;color:var(--text-light);">${label}</span>
                    <span style="font-size:11px;font-weight:600;color:${statusColor};width:70px;text-align:right;">${status}</span>
                </div>
                `;
            }).join('')}
        </div>
    `;
    
    // ============================================================
    // SECTION 4: Related IOCs (FIXED & HARVESTED FROM ALL SOURCES)
    // ============================================================
    const relatedIOCs = [];

    // Helper to detect IOC type from string format
    const detectIOCType = (val = '') => {
        const str = String(val).trim();
        if (/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(str)) return 'ip';
        if (/^[a-fA-F0-9]{32,64}$/.test(str)) return 'hash';
        if (str.includes('http://') || str.includes('https://')) return 'url';
        return 'domain';
    };

    // 1. Harvest from OTX related_indicators
    if (providers.otx?.success && providers.otx.related_indicators) {
        const rel = providers.otx.related_indicators;
        if (Array.isArray(rel)) {
            rel.forEach(item => {
                const val = typeof item === 'object' ? (item.indicator || item.value) : item;
                if (val && typeof val === 'string' && val !== ioc.value && !relatedIOCs.some(r => r.value === val)) {
                    relatedIOCs.push({ type: detectIOCType(val), value: val, confidence: 'HIGH' });
                }
            });
        } else if (rel && typeof rel === 'object') {
            Object.values(rel).forEach(category => {
                if (category && typeof category === 'object') {
                    Object.values(category).forEach(items => {
                        if (Array.isArray(items)) {
                            items.forEach(item => {
                                const val = typeof item === 'object' ? (item.indicator || item.value) : item;
                                if (val && typeof val === 'string' && val !== ioc.value && !relatedIOCs.some(r => r.value === val)) {
                                    relatedIOCs.push({ type: detectIOCType(val), value: val, confidence: 'MEDIUM' });
                                }
                            });
                        }
                    });
                }
            });
        }
    }

    // 2. Harvest from OTX pulses (pulses_list or pulse_info.pulses)
    if (providers.otx?.success) {
        const pList = providers.otx.pulses_list || providers.otx.pulse_info?.pulses || [];
        if (Array.isArray(pList)) {
            pList.forEach(pulse => {
                if (Array.isArray(pulse.indicators)) {
                    pulse.indicators.forEach(ind => {
                        const val = ind.indicator || ind.value;
                        if (val && typeof val === 'string' && val !== ioc.value && !relatedIOCs.some(r => r.value === val)) {
                            const indType = (ind.type || detectIOCType(val)).toLowerCase();
                            const cleanType = indType.includes('ip') ? 'ip' : indType.includes('hash') || indType.includes('file') ? 'hash' : 'domain';
                            relatedIOCs.push({ type: cleanType, value: val, confidence: 'HIGH' });
                        }
                    });
                }
            });
        }
    }

    // 3. Harvest from VirusTotal associated domains/resolutions
    if (providers.virustotal?.success) {
        const vt = providers.virustotal;
        const vtList = vt.associated_domains || vt.resolutions || [];
        if (Array.isArray(vtList)) {
            vtList.forEach(item => {
                const val = typeof item === 'object' ? (item.domain || item.ip || item.value) : item;
                if (val && typeof val === 'string' && val !== ioc.value && !relatedIOCs.some(r => r.value === val)) {
                    relatedIOCs.push({ type: detectIOCType(val), value: val, confidence: 'HIGH' });
                }
            });
        }
    }

    const safeRelatedIOCs = relatedIOCs.slice(0, 30);
    const displayCount = safeRelatedIOCs.length;

    html += `
        <div class="intel-card full">
            <div class="card-title"><i class="fa-solid fa-link"></i> Related IOCs <span style="color:var(--text-dark);margin-left:4px;">(${displayCount} found)</span></div>
            ${displayCount > 0 ? `
            <table class="iocs-table">
                <thead><tr><th>Type</th><th>Indicator</th><th>First Seen</th><th>Confidence</th></tr></thead>
                <tbody>
                    ${safeRelatedIOCs.map((iocItem) => `
                        <tr>
                            <td><span class="tag tag-${iocItem.type || 'domain'}">${(iocItem.type || 'domain').toUpperCase()}</span></td>
                            <td class="mono">${safeString(iocItem.value)}</td>
                            <td class="mono">${formatDate(new Date().toISOString())}</td>
                            <td><span class="actor-confidence conf-${(iocItem.confidence || 'LOW').toLowerCase()}">${iocItem.confidence || 'LOW'}</span></td>
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
    const ttpItems = [];
    if (providers.otx?.success && Array.isArray(providers.otx.tags) && providers.otx.tags.length > 0) {
        providers.otx.tags.forEach((tag, index) => {
            if (tag) ttpItems.push({ num: index + 1, text: `<strong>Technique:</strong> ${safeString(tag)}` });
        });
    } else if (Array.isArray(mitreTechniques) && mitreTechniques.length > 0) {
        mitreTechniques.forEach((tech, index) => {
            ttpItems.push({ 
                num: index + 1, 
                text: `<strong>${safeString(tech.techniqueId)}:</strong> ${safeString(tech.technique)} <span style="color:var(--text-dark);font-size:11px;">(Confidence: ${tech.confidence || 0}%)</span>` 
            });
        });
    }

    const hasTTPs = ttpItems.length > 0;

    html += `
        <div class="intel-card ${hasTTPs ? '' : 'full'}">
            <div class="card-title"><i class="fa-solid fa-list-ol"></i> Observed TTPs</div>
            ${hasTTPs ? `
                ${ttpItems.map(item => `
                    <div class="ttp-item">
                        <div class="ttp-num">${item.num}</div>
                        <div class="ttp-text">${item.text}</div>
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
    // SECTION 6: Related Reports (FIXED WITH METADATA & COUNT)
    // ============================================================
    const reports = [];
    if (providers.otx?.success) {
        const pulseList = providers.otx.pulses_list || providers.otx.pulse_info?.pulses || [];
        if (Array.isArray(pulseList) && pulseList.length > 0) {
            pulseList.slice(0, 10).forEach(pulse => {
                const indCount = Array.isArray(pulse.indicators) ? pulse.indicators.length : (pulse.indicator_count || 0);
                reports.push({
                    title: pulse.name || 'OTX Pulse',
                    source: `AlienVault OTX · ${safeString(pulse.author_name || 'AlienVault')} · ${indCount} indicators`,
                    date: pulse.created || new Date().toISOString(),
                    desc: pulse.description || 'Threat pulse intelligence data.'
                });
            });
        } else if (providers.otx.pulses > 0) {
            reports.push({
                title: `OTX Intelligence: ${ioc.value}`,
                source: `AlienVault OTX · ${providers.otx.pulses} pulses`,
                date: new Date().toISOString(),
                desc: 'Threat pulse data from OTX for this indicator.'
            });
        }
    }

    html += `
        <div class="intel-card full">
            <div class="card-title"><i class="fa-solid fa-file-lines"></i> Related Intelligence Reports</div>
            ${reports.length > 0 ? reports.map(rep => `
                <div class="report-row" onclick="openReport('${safeString(rep.title).replace(/'/g, "\\\\'")}','${safeString(rep.source).replace(/'/g, "\\\\'")}','${safeString(rep.desc).replace(/'/g, "\\\\'")}')" style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px;border-bottom:1px solid rgba(255,255,255,0.05);cursor:pointer;transition:background 0.2s ease;" onmouseover="this.style.background='rgba(255,255,255,0.03)'" onmouseout="this.style.background='transparent'">
                    <div style="display:flex;align-items:flex-start;gap:12px;">
                        <i class="fa-solid fa-file-lines report-icon" style="color:#3b82f6;font-size:18px;margin-top:2px;"></i>
                        <div class="report-info">
                            <div class="report-title" style="font-weight:600;color:var(--text-light);font-size:14px;">${safeString(rep.title)}</div>
                            <div class="report-source" style="font-size:12px;color:var(--text-dark);margin-top:4px;">${safeString(rep.source)}</div>
                        </div>
                    </div>
                    <span class="report-date" style="font-family:var(--font-mono);font-size:12px;color:var(--text-dark);white-space:nowrap;">${formatDate(rep.date)}</span>
                </div>
            `).join('') : `
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
    
    window.showMitreDetails = function(id, name, tactic, confidence, confLabel, explanation, mitigations) {
        document.getElementById('intelModalTitle').innerHTML = '<code>' + safeString(id) + '</code> — ' + safeString(name);
        let htmlBody = '<div style="margin-bottom:10px;"><strong>Tactic:</strong> <span style="color:var(--info);">' + safeString(tactic) + '</span> &nbsp;|&nbsp; <strong>Confidence:</strong> <span class="actor-confidence conf-' + (confLabel || 'low').toLowerCase() + '">' + (confLabel || 'LOW') + ' (' + (confidence || 0) + '%)</span></div>';
        if (explanation) {
            htmlBody += '<div style="margin-bottom:12px;background:rgba(59,130,246,0.06);padding:10px;border-radius:6px;border-left:3px solid var(--accent);"><strong>AI / Signal Correlation:</strong><br>' + safeString(explanation) + '</div>';
        }
        if (mitigations && Array.isArray(mitigations) && mitigations.length > 0) {
            htmlBody += '<strong>Recommended Mitigations (STIX Course of Action):</strong><ul style="margin:8px 0 0 16px;padding:0;list-style:disc;">';
            mitigations.forEach(function(m) {
                htmlBody += '<li style="margin-bottom:6px;">' + safeString(m) + '</li>';
            });
            htmlBody += '</ul>';
        } else {
            htmlBody += '<strong>Mitigation:</strong> Enforce standard defensive hardening and continuous monitoring.';
        }
        document.getElementById('intelModalBody').innerHTML = htmlBody;
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