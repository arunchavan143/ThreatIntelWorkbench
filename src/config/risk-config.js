module.exports = {
    // Risk levels
    levels: {
        CRITICAL: {
            min: 80,
            max: 100,
            label: 'CRITICAL',
            color: '#ef4444',
            emoji: '🔴'
        },
        HIGH: {
            min: 60,
            max: 79,
            label: 'HIGH',
            color: '#f59e0b',
            emoji: '🟠'
        },
        MEDIUM: {
            min: 30,
            max: 59,
            label: 'MEDIUM',
            color: '#3b82f6',
            emoji: '🔵'
        },
        LOW: {
            min: 0,
            max: 29,
            label: 'LOW',
            color: '#22c55e',
            emoji: '🟢'
        }
    },

    // Detection thresholds per provider
    providerThresholds: {
        virustotal: {
            maliciousThreshold: 5, // >= 5 detections = high risk
            suspiciousThreshold: 2
        },
        abuseipdb: {
            abuseThreshold: 50, // >= 50% abuse score
            highThreshold: 30
        }
    },

    // Confidence scoring
    confidenceFactors: {
        sourceCount: 0.3, // More sources = higher confidence
        consistency: 0.4, // Sources agree = higher confidence
        recency: 0.3 // Recent data = higher confidence
    }
};