// src/services/geolocation.service.js
const axios = require('axios');

class GeolocationService {
    async getLocation(ip) {
        try {
            const response = await axios.get(`http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,region,city,lat,lon,isp,org,as,timezone`);
            if (response.data.status === 'fail') {
                throw new Error(response.data.message || 'Location lookup failed');
            }
            const data = response.data;
            return {
                success: true,
                country: data.country,
                countryCode: data.countryCode,
                region: data.region,
                city: data.city,
                lat: data.lat,
                lon: data.lon,
                isp: data.isp,
                org: data.org,
                as: data.as,
                timezone: data.timezone,
                provider: 'geolocation'
            };
        } catch (error) {
            console.error('Geolocation Error:', error.message);
            return {
                success: false,
                error: error.message,
                provider: 'geolocation'
            };
        }
    }
}

module.exports = new GeolocationService();