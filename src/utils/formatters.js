// ============================================================
// src/utils/formatters.js - API & Telemetry Data Formatters
// ============================================================

function formatSuccessResponse(data, message = 'Success') {
    return {
        success: true,
        message,
        data,
        timestamp: new Date().toISOString()
    };
}

function formatErrorResponse(error, status = 500) {
    return {
        success: false,
        error: typeof error === 'string' ? error : (error.message || 'Unknown error occurred'),
        status,
        timestamp: new Date().toISOString()
    };
}

function formatIOCPayload(iocValue, iocType, riskResult, providers, enrichment, aiSummary, processingTimeMs) {
    return {
        ioc: {
            value: iocValue,
            type: iocType
        },
        risk: riskResult || {},
        providers: providers || {},
        enrichment: enrichment || {},
        ai_summary: aiSummary || {},
        processing_time: typeof processingTimeMs === 'number' ? `${processingTimeMs}ms` : processingTimeMs,
        timestamp: new Date().toISOString(),
        investigation_id: `inv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
    };
}

module.exports = {
    formatSuccessResponse,
    formatErrorResponse,
    formatIOCPayload
};
