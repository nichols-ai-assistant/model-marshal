// Model Marshal Script v2
// Dispatch to multiple AI models, compare responses, export PDF

const TEST_MODE = true; // Set false to query real models via OpenRouter

var globalResults = [];

document.addEventListener('DOMContentLoaded', function() {
    var dispatchBtn = document.getElementById('dispatchBtn');
    var generatePdfBtn = document.getElementById('generatePdfBtn');
    var status = document.getElementById('status');
    var testBanner = document.getElementById('testModeBanner');

    // Show test mode banner and pre-populate
    if (TEST_MODE) {
        testBanner.style.display = 'block';
        status.className = 'status-info';
        status.innerHTML = 'TEST MODE — Using pre-populated sample data. Responses shown below.';
        document.getElementById('synthesis').value = 'Key insight: Models agree on data infrastructure as the foundation but diverge on approach. Grok is most direct, Gemini most technical, GPT most structured, Llama most privacy-focused, Claude most balanced. Recommended: start with predictive maintenance.';
        loadTestData();
    } else {
        status.innerHTML = 'Ready. Enter your OpenRouter API key and question, then click Dispatch.';
    }

    // Dispatch button
    dispatchBtn.addEventListener('click', async function() {
        var apiKey = document.getElementById('apiKey').value.trim();
        var query = document.getElementById('query').value.trim();

        if (!apiKey || !query) {
            status.className = 'status-error';
            status.innerHTML = 'Please enter both an API key and a question.';
            return;
        }

        if (TEST_MODE) {
            status.className = 'status-info';
            status.innerHTML = 'TEST MODE — Using sample data. Toggle TEST_MODE=false to query real models.';
            loadTestData();
            return;
        }

        dispatchBtn.disabled = true;
        dispatchBtn.innerHTML = 'Querying...';
        status.className = 'status-info';
        status.innerHTML = 'Inferring context and dispatching to models...';
        globalResults = [];

        var models = [
            { name: 'Claude Sonnet 4.6', id: 'anthropic/claude-sonnet-4.6', shortId: 'Sonnet 4.6' },
            { name: 'ChatGPT', id: 'openai/gpt-5.4', shortId: 'GPT-5.4' },
            { name: 'Grok', id: 'x-ai/grok-4-fast', shortId: 'Grok 4 Fast' },
            { name: 'Gemini', id: 'google/gemini-2.5-flash', shortId: 'Gemini 2.5 Flash' },
            { name: 'Llama', id: 'meta-llama/llama-3.3-70b-instruct', shortId: 'Llama 3.3' }
        ];

        async function callModel(modelId, messages) {
            var response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + apiKey,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': window.location.origin,
                    'X-Title': 'Model Marshal'
                },
                body: JSON.stringify({ model: modelId, messages: messages, temperature: 0.7, max_tokens: 1200 })
            });
            if (!response.ok) {
                var err = await response.text();
                throw new Error('API error ' + response.status + ': ' + err);
            }
            var data = await response.json();
            return data.choices[0].message.content.trim();
        }

        function getModelPrompt(modelName) {
            var prompts = {
                'Claude Sonnet 4.6': 'You are a nuanced expert consultant providing analysis with ethical awareness and practical constraints. Give concrete recommendations with implementation challenges noted.',
                'ChatGPT': 'You are a strategic consultant using established frameworks. Provide systematic comprehensive analysis with specific examples and metrics.',
                'Grok': 'You are a no-nonsense operator. Cut through hype, give direct practical advice based on field experience. Focus on measurable results.',
                'Gemini': 'You are a technical expert with deep implementation knowledge. Provide specific technical guidance including timelines, budgets, and integration requirements.',
                'Llama': 'You are an expert focused on open-source solutions and data sovereignty. Emphasize privacy, on-premise options, and vendor independence.'
            };
            return prompts[modelName] || 'You are a business strategy expert.';
        }

        try {
            // Quick domain inference
            var domain = await callModel('anthropic/claude-sonnet-4.6', [
                { role: 'user', content: 'In 2-3 words, identify the main domain of this query: "' + query + '" — respond with only the domain.' }
            ]);

            for (var i = 0; i < models.length; i++) {
                var model = models[i];
                status.innerHTML = 'Querying ' + model.name + '...';
                var messages = [
                    { role: 'system', content: getModelPrompt(model.name) + ' Context: ' + domain },
                    { role: 'user', content: query }
                ];
                var response = await callModel(model.id, messages);
                globalResults.push({
                    model: model.name,
                    shortId: model.shortId,
                    response: response,
                    scores: 'Pending scoring...',
                    systemPrompt: domain
                });
            }

            renderResults(globalResults);
            status.className = 'status-success';
            status.innerHTML = 'All models responded. Review results below, add your synthesis, then generate PDF.';

        } catch (err) {
            status.className = 'status-error';
            status.innerHTML = 'Error: ' + err.message;
            console.error(err);
        } finally {
            dispatchBtn.disabled = false;
            dispatchBtn.innerHTML = 'Dispatch to Models';
        }
    });

    // PDF button
    generatePdfBtn.addEventListener('click', function() {
        var query = document.getElementById('query').value;
        var synthesis = document.getElementById('synthesis').value;
        var status = document.getElementById('status');

        if (!globalResults || globalResults.length === 0) {
            status.className = 'status-error';
            status.innerHTML = 'No results to export. Click Dispatch first.';
            return;
        }

        try {
            generatePDF(globalResults, query, '', synthesis);
            status.className = 'status-success';
            status.innerHTML = 'PDF downloaded!';
        } catch (err) {
            status.className = 'status-error';
            status.innerHTML = 'PDF error: ' + err.message;
            console.error(err);
        }
    });
});

function loadTestData() {
    var testResults = [
        {
            model: 'Claude Sonnet 4.6',
            shortId: 'Sonnet 4.6',
            response: 'AI adoption in manufacturing requires a phased approach that balances operational disruption with measurable ROI. Start with non-critical workflows to establish baselines before expanding to mission-critical processes. Key focus areas: predictive maintenance, quality control automation, and supply chain optimization.\n\nFirst step: identify your highest-frequency, highest-variance process. That is where ML models have the most to learn from and where you will see the fastest returns. Avoid trying to boil the ocean — pick one use case, prove it out, then expand methodically.',
            scores: 'Specificity: 9/10 — Concrete process recommendations\nActionability: 9/10 — Clear starting point identified\nDomain Depth: 8/10 — Manufacturing-specific context'
        },
        {
            model: 'GPT-5.4',
            shortId: 'GPT-5.4',
            response: 'For manufacturing leaders, AI readiness hinges on three pillars: data infrastructure maturity, workforce adaptability, and executive commitment. Companies should assess their current state before selecting specific AI use cases.\n\nPriority should be given to high-frequency, high-variance processes. The framework aligns with McKinsey\'s three-horizon model: automate (Horizon 1), optimize (Horizon 2), transform (Horizon 3). Budget ranges from $50K for scoped pilots to $500K+ for enterprise deployments.',
            scores: 'Specificity: 7/10 — Framework-based but less detail\nActionability: 7/10 — Three-horizon model with budget ranges\nDomain Depth: 7/10 — McKinsey framework, solid but less field-specific'
        },
        {
            model: 'Grok 4 Fast',
            shortId: 'Grok 4 Fast',
            response: 'Straight talk: most manufacturing AI projects fail because companies skip the boring groundwork. Get your data right first. Pick one pain point with clear ROI. Run it as an experiment, not a program. Scale only what proves itself.\n\nAvoid consulting pitches until you have your own house in order. Treat this as an engineering problem. Set measurable targets, hold people accountable, and do not move to the next phase until the current one has numbers.',
            scores: 'Specificity: 8/10 — Direct, practical priorities\nActionability: 9/10 — Explicit steps: data first, pick one pain point\nDomain Depth: 8/10 — Field operator perspective'
        },
        {
            model: 'Gemini 2.5 Flash',
            shortId: 'Gemini 2.5 Flash',
            response: 'Gemini notes strong alignment between AI capabilities and manufacturing needs in three areas: computer vision for defect detection, time-series forecasting for demand planning, and natural language interfaces for maintenance documentation.\n\nImplementation timelines: 6 weeks for packaged solutions to 6 months for custom integrations. Budget: $50K–$500K. Key risk: data quality — most manufacturers discover their historical data needs 3–6 months of cleanup before any model training can begin.',
            scores: 'Specificity: 8/10 — Three specific AI areas with use cases\nActionability: 7/10 — Timeline and budget ranges provided\nDomain Depth: 8/10 — Technical knowledge, data quality insight'
        },
        {
            model: 'Llama 3.3 70B',
            shortId: 'Llama 3.3',
            response: 'Open-source models like Llama offer a compelling alternative for manufacturers concerned about data privacy. Running LLMs on-premise means sensitive operational data never leaves the facility.\n\nTrade-off: internal ML expertise required for fine-tuning and deployment. Best for companies with strong data science teams already on staff. Fine-tuning-as-a-service providers can bridge the gap, though this adds dependency.',
            scores: 'Specificity: 7/10 — Open-source alternative clearly positioned\nActionability: 6/10 — Trade-offs discussed, fewer concrete steps\nDomain Depth: 7/10 — Privacy and sovereignty focus'
        }
    ];

    globalResults = testResults;
    renderResults(testResults);
    document.getElementById('synthesisCard').style.display = 'block';
    document.getElementById('generatePdfBtn').style.display = 'inline-block';
}

function renderResults(results) {
    var container = document.getElementById('modelsContainer');
    var html = '';
    for (var i = 0; i < results.length; i++) {
        var r = results[i];
        html += '<div class="model-card">' +
            '<h3>' + r.shortId + '</h3>' +
            '<div class="model-card .scores" style="color:#ffd700;font-size:0.8rem;margin:0.5rem 0;">' + r.scores + '</div>' +
            '<div style="color:#c9d1d9;font-size:0.85rem;line-height:1.5;white-space:pre-wrap;">' + r.response + '</div>' +
            '</div>';
    }
    container.innerHTML = html;
    document.getElementById('synthesisCard').style.display = 'block';
}

// ============================================================
// PDF Generation — Upstate AI branded report
// ============================================================

var COLORS = {
    forest:    [26,  58,  46],
    orange:    [255, 105,   0],
    cream:     [247, 244, 234],
    white:     [255, 255, 255],
    darkText:  [40,   40,  40],
    mutedText: [120, 120, 120]
};

function addFooter(doc, pageNum, totalPages) {
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.3);
    doc.line(20, 284, 196, 284);
    doc.setFontSize(8);
    doc.setTextColor(160, 160, 160);
    doc.text('Upstate AI  |  ben@up-state-ai.com  |  (315) 313-5998  |  up-state-ai.com', 20, 289);
    doc.text('Page ' + pageNum + ' of ' + totalPages, 196, 289, { align: 'right' });
}

function newPage(doc) { doc.addPage(); return 20; }

