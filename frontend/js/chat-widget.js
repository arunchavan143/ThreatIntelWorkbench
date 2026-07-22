// ============================================================
// AI CHAT ASSISTANT WIDGET (Priority 4)
// ============================================================

const AIChatWidget = {
    messages: [],
    isOpen: false,
    init() {
        if (document.getElementById('ai-chat-floating-btn')) return;

        const widgetHtml = `
        <div id="ai-chat-floating-btn" class="ai-chat-btn" title="Ask AI SOC Assistant">
            <i class="fa-solid fa-robot"></i>
            <span class="pulse-ring"></span>
        </div>
        <div id="ai-chat-drawer" class="ai-chat-drawer hidden">
            <div class="chat-header">
                <div style="display:flex;align-items:center;gap:10px;">
                    <i class="fa-solid fa-wand-magic-sparkles" style="color:#c084fc;font-size:18px;"></i>
                    <div>
                        <h4 style="margin:0;color:#fff;font-size:15px;">AI SOC Assistant</h4>
                        <span style="font-size:11px;color:#a855f7;">Groq Llama 3.3 70B</span>
                    </div>
                </div>
                <button id="ai-chat-close-btn" class="chat-close-btn"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div id="ai-chat-body" class="chat-body">
                <div class="chat-bubble ai">
                    <div class="bubble-sender">AI Assistant</div>
                    <div class="bubble-text">Hello! I am your AI SOC Assistant. Ask me anything about this investigation, MITRE TTPs, or historical correlation!</div>
                </div>
            </div>
            <div class="quick-chips">
                <button class="chat-chip" data-q="Why did this indicator receive this risk score?">Why this score?</button>
                <button class="chat-chip" data-q="Explain the mapped MITRE ATT&CK techniques and mitigations.">Explain TTPs</button>
                <button class="chat-chip" data-q="What should be our immediate containment checklist?">Containment guide</button>
            </div>
            <div class="chat-footer">
                <input type="text" id="ai-chat-input" placeholder="Ask about this threat or historical logs..." autocomplete="off" />
                <button id="ai-chat-send-btn"><i class="fa-solid fa-paper-plane"></i></button>
            </div>
        </div>
        `;
        document.body.insertAdjacentHTML('beforeend', widgetHtml);
        this.bindEvents();
    },

    bindEvents() {
        const btn = document.getElementById('ai-chat-floating-btn');
        const drawer = document.getElementById('ai-chat-drawer');
        const closeBtn = document.getElementById('ai-chat-close-btn');
        const sendBtn = document.getElementById('ai-chat-send-btn');
        const input = document.getElementById('ai-chat-input');
        const chips = document.querySelectorAll('.chat-chip');

        if (btn) btn.addEventListener('click', () => this.toggleDrawer());
        if (closeBtn) closeBtn.addEventListener('click', () => this.toggleDrawer(false));

        if (sendBtn) sendBtn.addEventListener('click', () => this.sendMessage());
        if (input) {
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') this.sendMessage();
            });
        }

        chips.forEach(chip => {
            chip.addEventListener('click', () => {
                const q = chip.getAttribute('data-q');
                if (q && input) {
                    input.value = q;
                    this.sendMessage();
                }
            });
        });
    },

    toggleDrawer(show) {
        const drawer = document.getElementById('ai-chat-drawer');
        if (!drawer) return;
        this.isOpen = show !== undefined ? show : !this.isOpen;
        if (this.isOpen) {
            drawer.classList.remove('hidden');
            const input = document.getElementById('ai-chat-input');
            if (input) input.focus();
        } else {
            drawer.classList.add('hidden');
        }
    },

    appendBubble(role, text) {
        const body = document.getElementById('ai-chat-body');
        if (!body) return;
        const isAi = role === 'ai' || role === 'system' || role === 'assistant';
        const formattedText = isAi ? (typeof parseMarkdown === 'function' ? parseMarkdown(text) : text) : (typeof safeString === 'function' ? safeString(text) : text);
        const html = `
        <div class="chat-bubble ${isAi ? 'ai' : 'user'}">
            <div class="bubble-sender">${isAi ? 'AI Assistant' : 'You'}</div>
            <div class="bubble-text">${formattedText}</div>
        </div>
        `;
        body.insertAdjacentHTML('beforeend', html);
        body.scrollTop = body.scrollHeight;
    },

    async sendMessage() {
        const input = document.getElementById('ai-chat-input');
        if (!input || !input.value.trim()) return;
        const text = input.value.trim();
        input.value = '';

        this.appendBubble('user', text);
        this.messages.push({ role: 'user', content: text });

        // Show typing
        const body = document.getElementById('ai-chat-body');
        const typingId = `typing_${Date.now()}`;
        if (body) {
            body.insertAdjacentHTML('beforeend', `
                <div id="${typingId}" class="chat-bubble ai typing">
                    <div class="bubble-sender">AI Assistant</div>
                    <div class="bubble-text"><i class="fa-solid fa-spinner fa-spin"></i> Analyzing telemetry...</div>
                </div>
            `);
            body.scrollTop = body.scrollHeight;
        }

        try {
            // Build context from current global state if available
            const evidenceSanitized = typeof sanitizeForAI === 'function' ? sanitizeForAI(window.currentEvidenceData) : {};
            const context = {
                ioc: window.currentIOC || evidenceSanitized.ioc || null,
                risk: window.currentRisk || evidenceSanitized.risk || null,
                findings: (window.currentFindings && window.currentFindings.length > 0) ? window.currentFindings : (evidenceSanitized.findings || []),
                mitre: window.currentMitre || evidenceSanitized.ai_summary?.attackTechniques || [],
                actor: window.currentActor || evidenceSanitized.enrichment?.actor || null
            };

            const response = await fetch('/api/investigate/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: this.messages.slice(-10), context })
            });
            const data = await response.json();

            const typingElem = document.getElementById(typingId);
            if (typingElem) typingElem.remove();

            if (data.success && data.reply) {
                this.appendBubble('ai', data.reply);
                this.messages.push({ role: 'assistant', content: data.reply });
            } else {
                this.appendBubble('ai', data.error || data.message || 'Sorry, I encountered an issue processing your question.');
            }
        } catch (err) {
            const typingElem = document.getElementById(typingId);
            if (typingElem) typingElem.remove();
            this.appendBubble('ai', 'Error connecting to AI Assistant.');
            console.error('Chat error:', err);
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    AIChatWidget.init();
});
