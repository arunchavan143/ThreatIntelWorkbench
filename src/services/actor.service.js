// src/services/actor.service.js

/**
 * ActorService: Comprehensive Threat Actor database and correlation engine.
 * Maps indicators, provider tags (OTX, VT), and MITRE techniques to known APT groups,
 * ransomware syndicates, and cybercrime organizations with alias resolution and attribution scoring.
 */
class ActorService {
    constructor() {
        // Curated profiles of top threat actor groups with flags, motivations, and campaigns
        this.actorProfiles = {
            'apt29': {
                id: 'apt29',
                primary_name: 'APT29 (Cozy Bear)',
                aliases: ['Cozy Bear', 'The Dukes', 'G0016', 'UNC2452', 'Nobelium', 'Midnight Blizzard'],
                country: 'Russia',
                flag: '🇷🇺',
                motivations: ['Espionage', 'Political Intelligence', 'Strategic Reconnaissance'],
                sectors: ['Government', 'Defense', 'Technology', 'Diplomacy', 'Think Tanks'],
                techniques: ['T1566', 'T1071', 'T1059', 'T1133', 'T1210'],
                campaigns: [
                    'SolarWinds Supply Chain Attack (2020)',
                    'CozyDuke / Operation Ghost (2015-2019)',
                    'Democratic National Committee Breach (2016)',
                    'Microsoft Corporate Email Account Compromise (2024)'
                ],
                mitre_id: 'G0016',
                description: 'State-sponsored cyber espionage group attributed to Russia\'s Foreign Intelligence Service (SVR). Known for highly covert, long-term persistence in diplomatic and technological targets.'
            },
            'lazarus': {
                id: 'lazarus',
                primary_name: 'Lazarus Group',
                aliases: ['HIDDEN COBRA', 'Zinc', 'G0032', 'AppleJeus', 'Labyrinth Chollima', 'TraderTraitor'],
                country: 'North Korea',
                flag: '🇰🇵',
                motivations: ['Financial Gain', 'Espionage', 'Cryptocurrency Theft', 'Regime Funding'],
                sectors: ['Financial Services', 'Cryptocurrency Exchanges', 'Defense', 'Media', 'Aerospace'],
                techniques: ['T1486', 'T1059', 'T1071', 'T1566', 'T1210'],
                campaigns: [
                    'Sony Pictures Entertainment Hack (2014)',
                    'Bangladesh Bank Heist / SWIFT Attacks (2016)',
                    'WannaCry Global Ransomware Epidemic (2017)',
                    'Ronin Network ($625M Crypto Bridge Heist) (2022)'
                ],
                mitre_id: 'G0032',
                description: 'Prolific state-sponsored cyber syndicate attributed to North Korea\'s Reconnaissance General Bureau (RGB). Operates both disruptive wiper/ransomware campaigns and multi-billion dollar financial thefts.'
            },
            'conti': {
                id: 'conti',
                primary_name: 'Conti Ransomware Syndicate',
                aliases: ['Conti', 'Wizard Spider', 'G0102', 'Ryuk Gang', 'TrickBot Operators'],
                country: 'Russia',
                flag: '🇷🇺',
                motivations: ['Financial Gain', 'Extortion', 'Data Ransom'],
                sectors: ['Healthcare', 'Manufacturing', 'Critical Infrastructure', 'Government', 'Retail'],
                techniques: ['T1486', 'T1059', 'T1083', 'T1003', 'T1588'],
                campaigns: [
                    'Ireland Health Service Executive (HSE) Cyberattack (2021)',
                    'Government of Costa Rica National Outbreak (2022)',
                    'Global Enterprise Ransomware Extortion Campaigns (2020-2022)'
                ],
                mitre_id: 'G0102',
                description: 'One of the most destructive Ransomware-as-a-Service (RaaS) operations in history. Known for aggressive double-extortion tactics against hospital networks and municipal infrastructure.'
            },
            'apt28': {
                id: 'apt28',
                primary_name: 'APT28 (Fancy Bear)',
                aliases: ['Fancy Bear', 'Sofacy', 'Sednit', 'G0007', 'Strontium', 'Forest Blizzard'],
                country: 'Russia',
                flag: '🇷🇺',
                motivations: ['Espionage', 'Information Operations', 'Disruption', 'Political Destabilization'],
                sectors: ['Government', 'Military/NATO', 'Journalists', 'Elections', 'Energy'],
                techniques: ['T1566', 'T1059', 'T1071', 'T1003', 'T1021'],
                campaigns: [
                    'German Bundestag Hack (2015)',
                    'WADA & Olympic Games Data Leaks (2016)',
                    'VPNFilter Global Router Botnet (2018)'
                ],
                mitre_id: 'G0007',
                description: 'Cyber warfare unit attributed to Russia\'s Main Intelligence Directorate (GRU Unit 26165). Specializes in zero-day exploitation, credential harvesting, and high-impact leak operations.'
            },
            'lockbit': {
                id: 'lockbit',
                primary_name: 'LockBit Ransomware Operators',
                aliases: ['LockBit Gang', 'ABCD Ransomware', 'LockBit 2.0', 'LockBit 3.0 (Black)'],
                country: 'Russia / Eastern Europe',
                flag: '🇷🇺',
                motivations: ['Financial Gain', 'Double & Triple Extortion'],
                sectors: ['Automotive', 'Logistics', 'Financial', 'Legal', 'Critical Infrastructure'],
                techniques: ['T1486', 'T1059', 'T1083', 'T1210', 'T1071'],
                campaigns: [
                    'Royal Mail UK Cyber Disruption (2023)',
                    'Boeing Parts & Distribution Compromise (2023)',
                    'ICBC US Treasury Clearing Disruption (2023)'
                ],
                mitre_id: 'G0143',
                description: 'The world\'s most active Ransomware-as-a-Service affiliate network between 2021-2024. Features automated self-spreading capabilities and fast file encryption engines.'
            },
            'sandworm': {
                id: 'sandworm',
                primary_name: 'Sandworm Team',
                aliases: ['Sandworm', 'Voodoo Bear', 'G0034', 'Seashell Blizzard', 'BlackEnergy Gang'],
                country: 'Russia',
                flag: '🇷🇺',
                motivations: ['Sabotage', 'Critical Infrastructure Disruption', 'Wiper Operations'],
                sectors: ['Power & Energy Grid', 'Transportation', 'Telecommunications', 'Government'],
                techniques: ['T1486', 'T1210', 'T1059', 'T1071', 'T1083'],
                campaigns: [
                    'Ukraine Electrical Grid Blackout (BlackEnergy/Industroyer) (2015-2016)',
                    'NotPetya Global Wiper Attack ($10B+ Damages) (2017)',
                    'Olympic Destroyer Winter Olympics Sabotage (2018)'
                ],
                mitre_id: 'G0034',
                description: 'Elite Russian military cyber sabotage unit attributed to GRU Unit 74455. Responsible for the most destructive cyber-physical attacks against electrical grids and global logistics.'
            },
            'emotet': {
                id: 'emotet',
                primary_name: 'Emotet (TA542)',
                aliases: ['TA542', 'Mummy Spider', 'G0036', 'Geodo', 'Heodo'],
                country: 'Russia / Eastern Europe',
                flag: '🇷🇺',
                motivations: ['Financial Gain', 'Initial Access Brokering', 'Malware Distribution'],
                sectors: ['All Sectors', 'Enterprise Networks', 'Government', 'Education'],
                techniques: ['T1566', 'T1059', 'T1027', 'T1071'],
                campaigns: [
                    'Global Office Macro Phishing Epidemics (2018-2021)',
                    'Ryuk & Conti Ransomware Initial Access Delivery (2020)'
                ],
                mitre_id: 'G0036',
                description: 'Formerly the world\'s largest botnet and initial access distributor, operating modular banking trojans that delivered secondary high-impact ransomware payloads.'
            },
            'scattered_spider': {
                id: 'scattered_spider',
                primary_name: 'Scattered Spider',
                aliases: ['Scattered Spider', '0ktapus', 'Star Blizzard', 'Octo Tempest', 'UNC3944'],
                country: 'United States / United Kingdom',
                flag: '🌐',
                motivations: ['Financial Gain', 'Data Extortion', 'Ransomware Affiliate Operations'],
                sectors: ['Hospitality & Casinos', 'Telecommunications', 'BPO / IT Help Desks', 'Cryptocurrency'],
                techniques: ['T1133', 'T1071', 'T1059', 'T1486'],
                campaigns: [
                    'MGM Resorts & Caesars Entertainment Compromises (2023)',
                    'Twilio & Cloudflare Help Desk Social Engineering Attacks (2022)'
                ],
                mitre_id: 'G0148',
                description: 'Aggressive native-English speaking cybercrime collective specializing in advanced social engineering, SIM swapping, and help-desk MFA fatigue to deploy ALPHV/BlackCat ransomware.'
            }
        };

        // Build alias mapping index for O(1) case-insensitive lookups
        this.aliasIndex = new Map();
        for (const [key, profile] of Object.entries(this.actorProfiles)) {
            this.aliasIndex.set(key.toLowerCase(), profile);
            this.aliasIndex.set(profile.primary_name.toLowerCase(), profile);
            profile.aliases.forEach(alias => {
                this.aliasIndex.set(alias.toLowerCase(), profile);
            });
        }
    }

    /**
     * Find actor profile by primary name (case-insensitive)
     */
    getActorByName(name) {
        if (!name) return null;
        const normalized = String(name).toLowerCase().trim();
        return this.aliasIndex.get(normalized) || null;
    }

    /**
     * Find actor profile by alias (case-insensitive)
     */
    getActorByAlias(alias) {
        return this.getActorByName(alias);
    }

    /**
     * Resolve all known aliases for a given actor name or alias
     */
    resolveAliases(nameOrAlias) {
        const actor = this.getActorByName(nameOrAlias);
        if (!actor) return [];
        return actor.aliases;
    }

    /**
     * Get MITRE techniques associated with a specific actor ID or name
     */
    getActorTechniques(actorId) {
        const actor = this.getActorByName(actorId);
        return actor ? actor.techniques : [];
    }

    /**
     * Get historical campaigns associated with a specific actor ID or name
     */
    getActorCampaigns(actorId) {
        const actor = this.getActorByName(actorId);
        return actor ? actor.campaigns : [];
    }

    /**
     * Multi-source correlation engine: identifies likely threat actors from investigation results.
     * @param {Object} context - { providers, mitre }
     * @returns {Object|null} Top matched actor profile with confidence rating and explanation
     */
    async getActorByIOC({ providers = {}, mitre = [] }) {
        const matches = new Map();

        // 1. Check direct OTX pulse adversary or pulse tags
        if (providers.otx?.success) {
            const otx = providers.otx;
            // Check explicit adversary field if parsed
            if (otx.adversary) {
                const found = this.getActorByName(otx.adversary);
                if (found) {
                    this._addMatch(matches, found, 92, 'HIGH', `Explicit attribution in AlienVault OTX intelligence pulse (${otx.adversary}).`);
                }
            }
            // Check tags and related indicators
            if (Array.isArray(otx.tags)) {
                otx.tags.forEach(t => {
                    const found = this.getActorByName(t);
                    if (found) {
                        this._addMatch(matches, found, 88, 'HIGH', `Matched AlienVault OTX pulse tag (${t}).`);
                    }
                });
            }
            if (otx.related_indicators && typeof otx.related_indicators === 'object') {
                if (otx.related_indicators.other && Array.isArray(otx.related_indicators.other.adversary)) {
                    otx.related_indicators.other.adversary.forEach(a => {
                        const found = this.getActorByName(a);
                        if (found) {
                            this._addMatch(matches, found, 90, 'HIGH', `Matched OTX related adversary indicator (${a}).`);
                        }
                    });
                }
                if (otx.related_indicators.alienvault && Array.isArray(otx.related_indicators.alienvault.adversary)) {
                    otx.related_indicators.alienvault.adversary.forEach(a => {
                        const found = this.getActorByName(a);
                        if (found) {
                            this._addMatch(matches, found, 90, 'HIGH', `Matched OTX AlienVault related adversary indicator (${a}).`);
                        }
                    });
                }
            }
            if (Array.isArray(otx.pulses_list)) {
                otx.pulses_list.forEach(p => {
                    const text = `${p.name || ''} ${p.description || ''}`.toLowerCase();
                    for (const profile of Object.values(this.actorProfiles)) {
                        const hit = profile.aliases.some(a => text.includes(a.toLowerCase())) ||
                                    text.includes(profile.primary_name.toLowerCase());
                        if (hit) {
                            this._addMatch(matches, profile, 88, 'HIGH', `Matched AlienVault OTX pulse description (${p.name || 'Pulse'}).`);
                        }
                    }
                });
            }
        }

        // 2. Check VirusTotal categories, vendors, and malware signatures
        if (providers.virustotal?.success) {
            const vt = providers.virustotal;
            const textBits = [];
            if (vt.categories) textBits.push(...Object.values(vt.categories));
            if (Array.isArray(vt.vendors_detected)) {
                vt.vendors_detected.forEach(v => {
                    if (v.category) textBits.push(v.category);
                    if (v.vendor) textBits.push(v.vendor);
                });
            }
            const combinedVT = textBits.join(' ').toLowerCase();

            for (const profile of Object.values(this.actorProfiles)) {
                const hit = profile.aliases.some(a => combinedVT.includes(a.toLowerCase())) ||
                            combinedVT.includes(profile.primary_name.toLowerCase()) ||
                            (profile.id === 'conti' && combinedVT.includes('ryuk')) ||
                            (profile.id === 'lazarus' && (combinedVT.includes('wannacry') || combinedVT.includes('hidden cobra')));

                if (hit) {
                    this._addMatch(matches, profile, 85, 'HIGH', `Matched malware family signature in VirusTotal vendor detections.`);
                }
            }
        }

        // 3. Check mapped MITRE techniques actor attribution
        if (Array.isArray(mitre) && mitre.length > 0) {
            mitre.forEach(tech => {
                if (Array.isArray(tech.actors)) {
                    tech.actors.forEach(actorName => {
                        const found = this.getActorByName(actorName);
                        if (found) {
                            this._addMatch(matches, found, 75, 'MEDIUM', `Correlated via shared MITRE ATT&CK technique (${tech.techniqueId} - ${tech.technique}).`);
                        }
                    });
                }
            });
        }

        // Return the top scored match if any exist
        if (matches.size > 0) {
            const sorted = Array.from(matches.values()).sort((a, b) => b.confidence - a.confidence);
            return sorted[0];
        }

        // If no explicit match found but high risk score exists, check if any generic signature fits or return null
        return null;
    }

    _addMatch(map, profile, score, label, reason) {
        if (!map.has(profile.id)) {
            map.set(profile.id, {
                ...profile,
                confidence: score,
                confidenceLabel: label,
                matched_reason: reason
            });
        } else {
            const existing = map.get(profile.id);
            if (score > existing.confidence) {
                existing.confidence = score;
                existing.confidenceLabel = label;
                existing.matched_reason = reason;
            }
        }
    }
}

module.exports = new ActorService();
