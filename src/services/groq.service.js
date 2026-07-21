// src/services/groq.service.js
const axios = require('axios');

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Free-tier Groq model. Fast and good enough for short SOC summaries.
const MODEL = 'llama-3.3-70b-versatile';

function isEnabled() {
    return Boolean(process.env.GROQ_API_KEY);
}

function buildPrompt(iocType, iocValue, assessment) {
    const findingsList =
        (assessment.findings && assessment.findings.length > 0) ?
            assessment.findings.map(f => `- ${f}`).join('\n') :
            '- No specific findings from threat intel sources';

    const attackList =
        (assessment.attackTechniques && assessment.attackTechniques.length > 0) ?
            assessment.attackTechniques
                .map(t => `- ${t.techniqueId} (${t.technique}) [Tactic: ${t.tactic}, Confidence: ${t.confidence}% - ${t.confidenceLabel}]\n  Explanation: ${t.explanation || 'N/A'}`)
                .join('\n') :
            '- None identified';

    let actorSummary = '- None attributed or identified';
    if (assessment.actor) {
        const a = assessment.actor;
        actorSummary = `Threat Actor: ${a.primary_name} (Aliases: ${(a.aliases || []).slice(0, 4).join(', ')})\nOrigin Country: ${a.country || 'Unknown'}\nAttribution Confidence: ${a.confidenceLabel || 'MED'} (${a.confidence || 0}%)\nMotivations: ${(a.motivations || []).join(', ')}\nTargeted Sectors: ${(a.sectors || []).join(', ')}\nAssociated Campaigns: ${(a.campaigns || []).slice(0, 3).join(' | ')}`;
    }

    return `You are a Senior SOC Analyst mapping threat intelligence to MITRE ATT&CK and known Threat Actors. Write a concise (3-5 sentence) executive threat synthesis for the following IOC investigation.
Highlight who is likely behind this attack (attribution and motivations), explain key provider findings and top MITRE ATT&CK techniques, and conclude with a specific defensive mitigation based on their known TTPs. Avoid repetitive hedging language like "it appears".

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
${attackList}

Write the analyst note now. Synthesize the attribution, findings, and techniques clearly without just listing raw numbers.`;
}

/**
 * Generates a short natural-language SOC analyst note from an
 * assessment object. Returns null (not an error) if no API key is
 * configured, so this is purely additive and never blocks the
 * investigation pipeline.
 */
async function generateAnalystSummary(iocType, iocValue, assessment) {
    if (!isEnabled()) {
        return null;
    }

    try {
        const response = await axios.post(
            GROQ_API_URL,
            {
                model: MODEL,
                messages: [
                    {
                        role: 'user',
                        content: buildPrompt(iocType, iocValue, assessment)
                    }
                ],
                max_tokens: 220,
                temperature: 0.3
            },
            {
                timeout: 12000,
                headers: {
                    Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const text = response.data?.choices?.[0]?.message?.content?.trim();

        if (!text) {
            return null;
        }

        return {
            text,
            model: MODEL,
            provider: 'groq'
        };

    } catch (error) {
        // AI enrichment is best-effort. Never throw - just omit it.
        return {
            error: true,
            message: error.response?.data?.error?.message || error.message
        };
    }
}

module.exports = {
    generateAnalystSummary,
    isEnabled
};