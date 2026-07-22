// src/services/groq.service.js
const axios = require('axios');
const { isKeyConfigured } = require('../middleware/auth');

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

function isEnabled() {
    return isKeyConfigured('GROQ_API_KEY');
}

// Helper to make safe Groq API requests with fallback
async function callGroq(messages, options = {}) {
    if (!isEnabled()) return null;
    try {
        const payload = {
            model: MODEL,
            messages: messages,
            max_tokens: options.max_tokens || 550,
            temperature: options.temperature !== undefined ? options.temperature : 0.3
        };
        if (options.json) {
            payload.response_format = { type: 'json_object' };
        }
        const response = await axios.post(GROQ_API_URL, payload, {
            timeout: options.timeout || 14000,
            headers: {
                Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        return response.data?.choices?.[0]?.message?.content?.trim() || null;
    } catch (error) {
        console.error('Groq API Error:', error.response?.data?.error?.message || error.message);
        return null;
    }
}

function buildPrompt(iocType, iocValue, assessment) {
    const findingsList = (assessment.findings && assessment.findings.length > 0) ?
        assessment.findings.map(f => `- ${f}`).join('\n') : '- No specific findings from threat intel sources';

    const attackList = (assessment.attackTechniques && assessment.attackTechniques.length > 0) ?
        assessment.attackTechniques
            .map(t => `- ${t.techniqueId} (${t.technique}) [Tactic: ${t.tactic}, Confidence: ${t.confidence}% - ${t.confidenceLabel}]\n  Explanation: ${t.explanation || 'N/A'}`)
            .join('\n') : '- None identified';

    let actorSummary = '- None attributed or identified';
    if (assessment.actor) {
        const a = assessment.actor;
        actorSummary = `Threat Actor: ${a.primary_name} (Aliases: ${(a.aliases || []).slice(0, 4).join(', ')})\nOrigin Country: ${a.country || 'Unknown'}\nAttribution Confidence: ${a.confidenceLabel || 'MED'} (${a.confidence || 0}%)\nMotivations: ${(a.motivations || []).join(', ')}\nTargeted Sectors: ${(a.sectors || []).join(', ')}\nAssociated Campaigns: ${(a.campaigns || []).slice(0, 3).join(' | ')}`;
    }

    return `You are a Senior SOC Analyst and Incident Commander mapping threat intelligence to MITRE ATT&CK and known Threat Actors.
Analyze the following indicator findings and output your response strictly as a valid JSON object. Do not include markdown formatting or outside text.

Must return JSON exactly adhering to this schema:
{
  "summary": "Concise 3-4 sentence executive synthesis highlighting attribution, motivations, key provider detections, and top TTPs.",
  "false_positive_triage": {
    "verdict": "CONFIRMED_THREAT | LIKELY_BENIGN | CDN_CLOUD_INFRASTRUCTURE | INCONCLUSIVE",
    "explanation": "Brief reasoning assessing if this looks like legitimate cloud hosting, benign infrastructure, a false positive pattern, or a confirmed malicious indicator."
  },
  "action_recommendations": [
    "Specific immediate containment action (e.g. BLOCK on perimeter firewall)",
    "Secondary tactical action (e.g. Isolate communicating endpoints)"
  ],
  "next_steps": [
    "Concrete follow-up investigation step 1 (e.g. Query proxy logs for requests over last 48 hours)",
    "Concrete follow-up investigation step 2 (e.g. Inspect EDR telemetry for spawned child processes)"
  ],
  "timeline": [
    {"time": "Historical / Day -3", "event": "Historical domain registration / earlier threat pulse observation."},
    {"time": "Day -1", "event": "First detection across active feeds."},
    {"time": "Day 0 (Current)", "event": "SOC investigation initiated; risk score computed."}
  ],
  "slack_alert": "🚨 THREAT ALERT: ${assessment.verdict} ${iocType.toUpperCase()} Detected\\n\\nIOC: ${iocValue}\\nRisk: ${assessment.verdict} (${assessment.score}/100)\\nAttribution: ${assessment.actor ? assessment.actor.primary_name : 'Unknown'}\\nAction: Review containment recommendations right away.",
  "campaign_tracking": "Brief assessment on whether this aligns with known actor campaigns or recurring sector targeting."
}

IOC Type: ${iocType}
IOC Value: ${iocValue}
Risk Score: ${assessment.score}/100
Risk Level: ${assessment.risk}
Verdict: ${assessment.verdict}
Confidence: ${assessment.confidence}%
Sources responded: ${assessment.sourcesResponded}/${assessment.totalSources}

Threat Actor Attribution Context:
${actorSummary}

Provider Findings:
${findingsList}

MITRE ATT&CK Techniques Mapped:
${attackList}`;
}

/**
 * Priority 1, 2, 3, 7, 8, 9: Generates structured analyst summary + triage + timeline + alert
 */
async function generateAnalystSummary(iocType, iocValue, assessment) {
    if (!isEnabled()) return null;

    try {
        const rawContent = await callGroq([{ role: 'user', content: buildPrompt(iocType, iocValue, assessment) }], { json: true, max_tokens: 650 });
        if (!rawContent) return null;

        let parsedJson = null;
        try {
            parsedJson = JSON.parse(rawContent);
        } catch (e) {
            return { text: rawContent, model: MODEL, provider: 'groq' };
        }

        return {
            text: parsedJson.summary || rawContent,
            summary: parsedJson.summary || rawContent,
            false_positive_triage: parsedJson.false_positive_triage || {
                verdict: 'INCONCLUSIVE',
                explanation: 'Manual analyst review recommended.'
            },
            action_recommendations: Array.isArray(parsedJson.action_recommendations) ? parsedJson.action_recommendations : ['Conduct standard SOC triage review.'],
            next_steps: Array.isArray(parsedJson.next_steps) ? parsedJson.next_steps : ['Verify endpoint logs for IOC hits over the past 7 days.'],
            timeline: Array.isArray(parsedJson.timeline) ? parsedJson.timeline : [
                { time: 'Day 0', event: `Investigation conducted for ${iocType}: ${iocValue}` }
            ],
            slack_alert: parsedJson.slack_alert || `🚨 THREAT ALERT: ${assessment.verdict} ${iocType} (${iocValue}) - Score: ${assessment.score}/100`,
            campaign_tracking: parsedJson.campaign_tracking || 'No recurring campaign overlaps identified in current telemetry.',
            model: MODEL,
            provider: 'groq'
        };
    } catch (error) {
        return { error: true, message: error.message };
    }
}

/**
 * Priority 4: AI Chat Assistant (Conversational Q&A on current investigation & history)
 */
async function chat(messages = [], context = {}) {
    if (!isEnabled()) {
        return { error: true, message: 'Groq API key not configured. Add GROQ_API_KEY to environment.' };
    }

    const systemPrompt = `You are an expert AI SOC Assistant inside the Threat Intel Workbench.
You help analysts investigate indicators of compromise (IOCs), explain MITRE ATT&CK TTPs, interpret risk scores, and suggest containment strategies.
Current Investigation Context:
- IOC: ${context.ioc ? `${context.ioc.type} (${context.ioc.value})` : 'None currently selected'}
- Risk Score: ${context.risk ? `${context.risk.score}/100 (${context.risk.verdict})` : 'N/A'}
- Findings: ${Array.isArray(context.findings) ? context.findings.join('; ') : 'N/A'}
- Attributed Actor: ${context.actor ? `${context.actor.primary_name} (${context.actor.country || 'Unknown'})` : 'None'}
- MITRE Techniques: ${Array.isArray(context.mitre) ? context.mitre.map(m => `${m.techniqueId} ${m.technique}`).join(', ') : 'None'}

Be helpful, concise, technically rigorous, and direct. When asked why a score is high or low, explain based on provider findings and active sources.`;

    const fullMessages = [
        { role: 'system', content: systemPrompt },
        ...messages.slice(-8) // keep last 8 messages for context window efficiency
    ];

    const reply = await callGroq(fullMessages, { max_tokens: 450, temperature: 0.4 });
    if (!reply) {
        return { error: true, message: 'AI Chat service currently unavailable.' };
    }

    return { success: true, reply, model: MODEL };
}

/**
 * Priority 5: AI Report Export (Multiple Formats)
 */
async function generateExportReport(data = {}, format = 'executive') {
    if (!isEnabled()) {
        return { error: true, message: 'Groq API key not configured.' };
    }

    const ioc = data.ioc || { type: 'unknown', value: 'unknown' };
    const risk = data.risk || { score: 0, verdict: 'LOW' };
    const findings = Array.isArray(data.findings) && data.findings.length > 0 
        ? data.findings.slice(0, 10) 
        : (Array.isArray(data.ai_summary?.findings) && data.ai_summary.findings.length > 0 
            ? data.ai_summary.findings.slice(0, 10) 
            : ['Multi-engine provider telemetry detections']);
    const actor = data.enrichment?.actor || null;

    let prompt = '';
    if (format === 'executive') {
        prompt = `Write a polished, C-suite executive summary (3 paragraphs max) detailing the security investigation for ${ioc.type.toUpperCase()} "${ioc.value}" (Risk: ${risk.verdict}, Score: ${risk.score}/100). Focus on business impact, attribution (${actor ? actor.primary_name : 'Unknown'}), and immediate containment recommendations. Format in clear Markdown.`;
    } else if (format === 'technical') {
        prompt = `Write an exhaustive technical SOC incident report for ${ioc.type.toUpperCase()} "${ioc.value}". Include exact IOC observables, provider detection metrics (${findings.join(', ')}), MITRE ATT&CK TTP breakdowns, network filtering rules (firewall/proxy), and detection engineering suggestions (SIEM/EDR rules). Format cleanly in Markdown.`;
    } else if (format === 'timeline') {
        prompt = `Build a detailed chronological Incident Response Timeline in Markdown table format for ${ioc.type.toUpperCase()} "${ioc.value}". Estimate plausible pre-attack infrastructure staging, initial detection alerts, and SOC triage milestones based on these findings: ${findings.join('; ')}.`;
    } else if (format === 'alert') {
        prompt = `Generate a high-urgency Slack / Email alert template for security teams regarding ${ioc.type.toUpperCase()} "${ioc.value}" (${risk.verdict} - Score: ${risk.score}/100). Include emoji headers, bulleted key facts, attribution, and mandatory blocking actions.`;
    } else {
        prompt = `Summarize the investigation for ${ioc.value} in clean Markdown.`;
    }

    const content = await callGroq([{ role: 'user', content: prompt }], { max_tokens: 600, temperature: 0.3 });
    if (!content) {
        return { error: true, message: 'Failed to generate export report.' };
    }

    return { success: true, format, report: content, model: MODEL };
}

/**
 * Priority 6: AI-Powered Bulk IOC Analysis & Campaign Tracking
 */
async function analyzeBatch(batchResults = [], history = []) {
    if (!isEnabled() || !batchResults.length) return null;

    const summaryItems = batchResults.map(r => 
        `${r.ioc?.type || 'ioc'}: ${r.ioc?.value || 'unknown'} (Verdict: ${r.risk?.verdict || 'N/A'}, Score: ${r.risk?.score || 0})`
    ).slice(0, 10).join('\n');

    const historyItems = (history && history.length) ?
        history.slice(0, 10).map(h => `${h.ioc} (${h.type}): ${h.verdict}`).join('; ') : 'No prior historical items';

    const prompt = `You are an AI Threat Intelligence Analyst conducting bulk correlation across a batch of investigated indicators.
Analyze the following batch items and provide your output strictly as valid JSON:
{
  "pattern_summary": "High-level synthesis across all batch items (e.g. shared infrastructure, coordinated campaigns, or mixed benign/malicious ratios).",
  "infrastructure_correlation": [
    "Specific correlation observation 1 (e.g. 3 IPs share common ASN or subnet staging)",
    "Specific correlation observation 2 (e.g. High ratio of phishing domains targeting credential harvesting)"
  ],
  "campaign_tracking": "Assessment comparing these indicators against known threat actor profiles or historical patterns."
}

Batch Items:
${summaryItems}

Historical Telemetry Context:
${historyItems}`;

    const raw = await callGroq([{ role: 'user', content: prompt }], { json: true, max_tokens: 450 });
    if (!raw) return null;

    try {
        const parsed = JSON.parse(raw);
        return {
            pattern_summary: parsed.pattern_summary || 'Analyzed batch indicators.',
            infrastructure_correlation: Array.isArray(parsed.infrastructure_correlation) ? parsed.infrastructure_correlation : [],
            campaign_tracking: parsed.campaign_tracking || 'No specific historical campaign correlations identified.',
            model: MODEL
        };
    } catch (e) {
        return { pattern_summary: raw, infrastructure_correlation: [], campaign_tracking: '', model: MODEL };
    }
}

/**
 * Priority 10: AI Natural Language Search across investigation history
 */
async function searchNaturalLanguage(query = '', history = []) {
    if (!isEnabled()) {
        return { error: true, message: 'Groq API key not configured.' };
    }
    if (!history || !history.length) {
        return { success: true, query, answer: 'Investigation history is currently empty.', matching_iocs: [] };
    }

    const historySummary = history.slice(0, 30).map((h, i) =>
        `[#${i}] IOC: ${h.ioc} (${h.type}) | Verdict: ${h.verdict} | Score: ${h.risk_score} | Sources: ${(h.sources || []).join(', ')} | Date: ${h.timestamp}`
    ).join('\n');

    const prompt = `You are an AI Search Engine for SOC investigation logs.
The analyst asked: "${query}"

Here are up to 30 recent investigation log entries:
${historySummary}

Respond strictly as valid JSON:
{
  "answer": "Natural language summary addressing the query directly (e.g. 'Found 3 CRITICAL IP investigations from the past week...')",
  "matching_indices": [0, 2] // array of exact integer indices from the log list above that match the query
}`;

    const raw = await callGroq([{ role: 'user', content: prompt }], { json: true, max_tokens: 400 });
    if (!raw) {
        return { error: true, message: 'Search processing failed.' };
    }

    try {
        const parsed = JSON.parse(raw);
        const indices = Array.isArray(parsed.matching_indices) ? parsed.matching_indices : [];
        const matchingIocs = indices.map(idx => history[idx]).filter(Boolean);
        return {
            success: true,
            query,
            answer: parsed.answer || 'Found relevant historical investigations.',
            matching_iocs: matchingIocs,
            model: MODEL
        };
    } catch (e) {
        return { success: true, query, answer: raw, matching_iocs: history.slice(0, 5), model: MODEL };
    }
}

module.exports = {
    generateAnalystSummary,
    chat,
    generateExportReport,
    analyzeBatch,
    searchNaturalLanguage,
    isEnabled
};