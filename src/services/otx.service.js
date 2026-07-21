const axios = require('axios');

class OTXService {
    constructor() {
        this.apiKey = process.env.OTX_API_KEY;
        this.baseUrl = 'https://otx.alienvault.com/api/v1';
    }

    _extractPulseMetadata(pulseInfo = {}) {
        let adversary = null;
        const attackIds = new Set();
        const malwareFamilies = new Set();
        const targetCountries = new Set();
        const industries = new Set();

        const pulseList = Array.isArray(pulseInfo.pulses) ? pulseInfo.pulses : [];
        if (pulseInfo.adversary && !adversary) adversary = pulseInfo.adversary;

        pulseList.forEach(p => {
            if (p.adversary && !adversary) adversary = p.adversary;
            if (Array.isArray(p.attack_ids)) {
                p.attack_ids.forEach(id => attackIds.add(typeof id === 'object' ? (id.display_name || id.id || id.name) : id));
            }
            if (Array.isArray(p.malware_families)) {
                p.malware_families.forEach(m => malwareFamilies.add(typeof m === 'object' ? (m.display_name || m.name) : m));
            }
            if (Array.isArray(p.target_countries)) p.target_countries.forEach(c => targetCountries.add(c));
            if (Array.isArray(p.industries)) p.industries.forEach(i => industries.add(i));
            if (Array.isArray(p.indicators)) {
                p.indicators.forEach(ind => {
                    if (ind.adversary && !adversary) adversary = ind.adversary;
                    if (Array.isArray(ind.attack_ids)) ind.attack_ids.forEach(id => attackIds.add(typeof id === 'object' ? (id.display_name || id.id || id.name) : id));
                    if (Array.isArray(ind.malware_families)) ind.malware_families.forEach(m => malwareFamilies.add(typeof m === 'object' ? (m.display_name || m.name) : m));
                });
            }
        });

        if (!adversary && pulseInfo.related && pulseInfo.related.alienvault && Array.isArray(pulseInfo.related.alienvault.adversary)) {
            adversary = pulseInfo.related.alienvault.adversary[0] || null;
        }
        if (!adversary && pulseInfo.related && pulseInfo.related.other && Array.isArray(pulseInfo.related.other.adversary)) {
            adversary = pulseInfo.related.other.adversary[0] || null;
        }

        return {
            adversary,
            attack_ids: Array.from(attackIds),
            malware_families: Array.from(malwareFamilies),
            target_countries: Array.from(targetCountries),
            industries: Array.from(industries),
            pulses_list: pulseList
        };
    }

    async investigateIP(ip) {
        try {
            const response = await axios.get(`${this.baseUrl}/indicators/IPv4/${ip}/general`, {
                headers: { 'X-OTX-API-KEY': this.apiKey }
            });

            const data = response.data;
            const meta = this._extractPulseMetadata(data.pulse_info);

            return {
                success: true,
                pulses: data.pulse_info?.count || 0,
                tags: data.pulse_info?.tags || [],
                activity: data.pulse_info?.participants || 0,
                related_indicators: data.pulse_info?.related || [],
                pulse_info: data.pulse_info || {},
                ...meta,
                provider: 'otx'
            };
        } catch (error) {
            console.error('OTX Error:', error.message);
            return {
                success: false,
                error: error.message,
                provider: 'otx'
            };
        }
    }

    async investigateDomain(domain) {
        try {
            const response = await axios.get(`${this.baseUrl}/indicators/domain/${domain}/general`, {
                headers: { 'X-OTX-API-KEY': this.apiKey }
            });

            const data = response.data;
            const meta = this._extractPulseMetadata(data.pulse_info);

            return {
                success: true,
                pulses: data.pulse_info?.count || 0,
                tags: data.pulse_info?.tags || [],
                related_indicators: data.pulse_info?.related || [],
                pulse_info: data.pulse_info || {},
                ...meta,
                provider: 'otx'
            };
        } catch (error) {
            console.error('OTX Domain Error:', error.message);
            return {
                success: false,
                error: error.message,
                provider: 'otx'
            };
        }
    }

    async investigateHash(hash) {
        try {
            const response = await axios.get(`${this.baseUrl}/indicators/file/${hash}/general`, {
                headers: { 'X-OTX-API-KEY': this.apiKey }
            });

            const data = response.data;
            const meta = this._extractPulseMetadata(data.pulse_info);

            return {
                success: true,
                pulses: data.pulse_info?.count || 0,
                tags: data.pulse_info?.tags || [],
                related_indicators: data.pulse_info?.related || [],
                pulse_info: data.pulse_info || {},
                file_type: data.file_class || 'unknown',
                ...meta,
                provider: 'otx'
            };
        } catch (error) {
            console.error('OTX Hash Error:', error.message);
            return {
                success: false,
                error: error.message,
                provider: 'otx'
            };
        }
    }
}

module.exports = new OTXService();