const { RISK_THRESHOLDS, PROVIDER_WEIGHTS } = require('../config/constants');

function calculateRisk(results, ioc) {
    const scores = [];
    const weights = [];

    // VirusTotal
    if (results.vt?.success) {
        const vtScore = calculateVTScore(results.vt);
        scores.push(vtScore);
        weights.push(PROVIDER_WEIGHTS.VIRUSTOTAL);
    }

    // AbuseIPDB
    if (results.abuse?.success) {
        const abuseScore = calculateAbuseScore(results.abuse);
        scores.push(abuseScore);
        weights.push(PROVIDER_WEIGHTS.ABUSEIPDB);
    }

    // Shodan
    if (results.shodan?.success) {
        const shodanScore = calculateShodanScore(results.shodan);
        scores.push(shodanScore);
        weights.push(PROVIDER_WEIGHTS.SHODAN);
    }

    // OTX
    if (results.otx?.success) {
        const otxScore = calculateOTXScore(results.otx);
        scores.push(otxScore);
        weights.push(PROVIDER_WEIGHTS.OTX);
    }

    // Calculate weighted average
    let weightedSum = 0;
    let totalWeight = 0;
    for (let i = 0; i < scores.length; i++) {
        weightedSum += scores[i] * weights[i];
        totalWeight += weights[i];
    }

    const finalScore = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
    const verdict = getVerdict(finalScore);
    const confidence = calculateConfidence(scores.length, results);

    return {
        score: finalScore,
        verdict: verdict.label,
        color: verdict.color,
        emoji: verdict.emoji,
        confidence: confidence,
        breakdown: getBreakdown(results),
        sources: scores.length,
        active_sources: Object.values(results).filter(r => r?.success).length
    };
}

function calculateVTScore(vt) {
    const maxDetections = 72;
    const ratio = vt.detections / maxDetections;
    return Math.min(ratio * 100, 100);
}

function calculateAbuseScore(abuse) {
    return Math.min(abuse.abuse_score, 100);
}

function calculateShodanScore(shodan) {
    let score = 0;
    // Vulnerabilities
    if (shodan.vulnerabilities?.length > 0) {
        score += Math.min(shodan.vulnerabilities.length * 15, 50);
    }
    // Open ports
    if (shodan.ports?.length > 10) {
        score += 20;
    } else if (shodan.ports?.length > 5) {
        score += 10;
    }
    return Math.min(score, 100);
}

function calculateOTXScore(otx) {
    if (otx.pulses > 0) {
        return Math.min(otx.pulses * 10, 100);
    }
    return 0;
}

function getVerdict(score) {
    if (score >= 80) {
        return { label: 'CRITICAL', color: '#ef4444', emoji: '🔴' };
    } else if (score >= 60) {
        return { label: 'HIGH', color: '#f59e0b', emoji: '🟠' };
    } else if (score >= 30) {
        return { label: 'MEDIUM', color: '#3b82f6', emoji: '🔵' };
    } else {
        return { label: 'LOW', color: '#22c55e', emoji: '🟢' };
    }
}

function calculateConfidence(sourceCount, results) {
    const totalSources = Object.keys(results).length;
    const activeSources = Object.values(results).filter(r => r?.success).length;
    const consistency = activeSources / totalSources;
    return Math.round(consistency * 100);
}

function getBreakdown(results) {
    const breakdown = {};
    for (const [key, result] of Object.entries(results)) {
        if (result?.success) {
            if (result.detections !== undefined) {
                breakdown[key] = Math.min(result.detections * 2, 100);
            } else if (result.abuse_score !== undefined) {
                breakdown[key] = result.abuse_score;
            } else if (result.pulses !== undefined) {
                breakdown[key] = Math.min(result.pulses * 10, 100);
            } else {
                breakdown[key] = 0;
            }
        } else {
            breakdown[key] = 0;
        }
    }
    return breakdown;
}

module.exports = { calculateRisk };