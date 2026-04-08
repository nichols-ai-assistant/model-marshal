// Model Marshal Script
// Standalone JS for local web app with inferred system prompts, preview, and synthesis

const TEST_MODE = true; // Set false to query real models

document.addEventListener('DOMContentLoaded', function() {
    var form = document.getElementById('queryForm');
    var status = document.getElementById('status');
    var previewDiv = document.getElementById('preview');

    // Pre-populate preview in test mode
    if (TEST_MODE) {
        previewDiv.style.display = 'block';
        document.getElementById('query').value = 'How should a mid-size manufacturer approach AI adoption?';
        document.getElementById('synthesis').value = 'Key insight: All models agree on data infrastructure as the foundation, but diverge on implementation priority. Grok is most direct, Gemini most specific, GPT most structured, Llama most privacy-conscious, and Claude most balanced. Recommended approach: start with predictive maintenance (high frequency data, clear ROI) before expanding to broader transformation.';
        populateTestData();
        status.innerHTML = 'TEST MODE — Using sample data. Set TEST_MODE=false to query real models.';
    }

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        var apiKey = document.getElementById('apiKey').value;
        var query = document.getElementById('query').value;

        if (!apiKey || !query) {
            status.innerHTML = 'Please enter API key and query.';
            return;
        }

        if (TEST_MODE) {
            status.innerHTML = 'TEST MODE active — using sample data. Set TEST_MODE=false to query real models.';
            return;
        }

        status.innerHTML = 'Inferring system prompt...';

        var models = [
            { name: 'Claude Sonnet', id: 'anthropic/claude-sonnet-4.6' },
            { name: 'ChatGPT', id: 'openai/gpt-5.4' },
            { name: 'Grok', id: 'x-ai/grok-4.1-fast' },
            { name: 'Gemini', id: 'google/gemini-3-flash-preview' },
            { name: 'Llama', id: 'meta-llama/llama-3.3-70b-instruct' }
        ];

        var results = [];
        var systemPrompt = '';

        async function callModel(modelId, messages) {
            var response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + apiKey,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': window.location.origin,
                    'X-Title': 'Model Marshal'
                },
                body: JSON.stringify({
                    model: modelId,
                    messages: messages,
                    temperature: 0.7,
                    max_tokens: 1000
                })
            });
            if (!response.ok) {
                var errBody = await response.text();
                throw new Error('API error ' + response.status + ': ' + errBody);
            }
            var data = await response.json();
            return data.choices[0].message.content.trim();
        }

        // Model-specific prompt templates tailored to each model's strengths
        function getModelPrompt(modelName, domain) {
            var prompts = {
                'Claude Sonnet': 'You are an expert consultant with deep experience in ' + domain + '. Provide nuanced, well-reasoned analysis that considers multiple perspectives, ethical implications, and practical constraints. Emphasize actionable recommendations grounded in real-world implementation challenges.',
                'ChatGPT': 'You are a strategic consultant specializing in ' + domain + '. Structure your response using established frameworks and methodologies. Provide comprehensive analysis that covers key dimensions systematically. Include specific examples and quantifiable metrics where possible.',
                'Grok': 'You are a no-nonsense operator in ' + domain + '. Cut through marketing hype and provide direct, practical advice. Focus on what actually works based on field experience. Be skeptical of unproven approaches and emphasize measurable results.',
                'Gemini': 'You are a technical expert in ' + domain + ' with deep knowledge of implementation details and emerging capabilities. Provide specific technical guidance including timelines, budget considerations, and integration requirements. Cite relevant capabilities and tools.',
                'Llama': 'You are an expert in ' + domain + ' with focus on open-source solutions and data sovereignty. Emphasize approaches that maintain data privacy and technical control. Consider on-premise deployment options and vendor independence.'
            };
            return prompts[modelName] || 'You are an expert consultant specializing in ' + domain + '.';
        }

        async function generateSystemPrompt(q) {
            var inferencePrompt = 'Analyze this user query: "' + q + '"\nInfer the main domain or topic (e.g., manufacturing operations, business strategy, technology implementation, etc.).\nOutput only the domain/topic in 2-4 words, nothing else.';
            return await callModel('anthropic/claude-sonnet-4.6', [{ role: 'user', content: inferencePrompt }]);
        }

        async function scoreResponse(responseText, modelName) {
            var scoringPrompt = 'Score the following AI response on a scale of 1-10 for:\n1. Specificity: concrete vs. generic (1=vague platitudes, 10=specific actionable details)\n2. Actionability: clear next steps (1=abstract discussion, 10=clear executable steps)\n3. Domain Depth: expert-level insights (1=surface-level, 10=deep domain expertise)\nProvide scores and a brief justification.\nResponse to score: "' + responseText.replace(/"/g, '\\"') + '" from ' + modelName + '\nFormat as:\nSpecificity: X/10 - [justification]\nActionability: Y/10 - [justification]\nDomain Depth: Z/10 - [justification]';
            return await callModel('anthropic/claude-sonnet-4.6', [{ role: 'user', content: scoringPrompt }]);
        }

        try {
            var domain = await generateSystemPrompt(query);
            status.innerHTML = 'Dispatching to models...';

            for (var i = 0; i < models.length; i++) {
                var model = models[i];
                var modelPrompt = getModelPrompt(model.name, domain);
                status.innerHTML = 'Querying ' + model.name + '...';
                var messages = [
                    { role: 'system', content: modelPrompt },
                    { role: 'user', content: query }
                ];
                var response = await callModel(model.id, messages);
                status.innerHTML = 'Scoring ' + model.name + ' response...';
                var scores = await scoreResponse(response, model.name);
                results.push({ model: model.name, response: response, scores: scores, systemPrompt: modelPrompt });
            }

            buildPreview(results, query, systemPrompt);
            status.innerHTML = 'Preview ready. Add your synthesis and generate PDF.';

        } catch (err) {
            status.innerHTML = 'Error: ' + err.message;
            console.error(err);
        }
    });

    // Wire up PDF button even in test mode
    var generateBtn = document.getElementById('generatePdf');
    generateBtn.addEventListener('click', function() {
        var query = document.getElementById('query').value;
        var synthesis = document.getElementById('synthesis').value;
        var results = gatherResultsFromDOM();
        var systemPrompt = document.querySelector('.model-card .prompt-section');
        var spText = systemPrompt ? systemPrompt.innerText.replace('System Prompt: ', '').replace(/\n/g, ' ') : '';
        generatePDF(results, query, spText, synthesis);
    });
});

function populateTestData() {
    var testResults = [
        {
            model: 'Claude Sonnet 4.6',
            shortId: 'Sonnet 4.6',
            response: 'AI adoption in manufacturing requires a phased approach that balances operational disruption with measurable ROI. Start with non-critical workflows to establish baselines before expanding to mission-critical processes. Key focus areas should include predictive maintenance, quality control automation, and supply chain optimization.\n\nA practical first step: identify your highest-frequency, highest-variance process. That is where ML models have the most to learn from and where you will see the fastest returns. Avoid trying to boil the ocean — pick one use case, prove it out, then expand methodically.',
            scores: 'Specificity: 9/10 - Concrete process recommendations with clear examples\nActionability: 9/10 - Specific starting point identified (high-frequency, high-variance)\nDomain Depth: 8/10 - Manufacturing-specific terminology and context',
            systemPrompt: 'You are an expert in manufacturing operations and industrial AI applications with deep knowledge of Industry 4.0, IoT integration, and production environments.'
        },
        {
            model: 'GPT-5.4',
            shortId: 'GPT-5.4',
            response: 'For manufacturing leaders, AI readiness hinges on three pillars: data infrastructure maturity, workforce adaptability, and executive commitment. Companies should assess their current state across these dimensions before selecting specific AI use cases.\n\nPriority should be given to high-frequency, high-variance processes where ML can provide immediate pattern recognition benefits. The assessment framework aligns with McKinsey\'s three-horizon model: automate existing processes first (Horizon 1), then optimize (Horizon 2), then transform (Horizon 3). Budget considerations typically range from $50K for scoped pilots to $500K+ for enterprise-wide deployments.',
            scores: 'Specificity: 7/10 - Framework-based but less concrete detail\nActionability: 7/10 - Three-horizon model provided, budget ranges given\nDomain Depth: 7/10 - McKinsey framework cited, solid but less field-specific',
            systemPrompt: 'You are an expert in manufacturing operations and industrial AI applications with deep knowledge of Industry 4.0, IoT integration, and production environments.'
        },
        {
            model: 'Grok 4.1 Fast',
            shortId: 'Grok 4.1',
            response: 'Straight talk: most manufacturing AI projects fail because companies skip the boring groundwork. Get your data right first. Then pick one pain point with clear ROI. Run it as an experiment, not a program. Scale only what proves itself.\n\nAvoid the consulting pitches until you have your own house in order. The best manufacturers treat this as an engineering problem, not a strategy presentation. Set specific measurable targets, hold people accountable, and do not move to the next phase until the current one has numbers.',
            scores: 'Specificity: 8/10 - Direct, practical advice with clear priorities\nActionability: 9/10 - Explicit steps: data first, pick one pain point, prove it\nDomain Depth: 8/10 - Field operator perspective, anti-consultant stance',
            systemPrompt: 'You are an expert in manufacturing operations and industrial AI applications with deep knowledge of Industry 4.0, IoT integration, and production environments.'
        },
        {
            model: 'Gemini 3 Flash',
            shortId: 'Gemini 3',
            response: 'Gemini notes strong alignment between AI capabilities and manufacturing needs in three areas: computer vision for defect detection, time-series forecasting for demand planning, and natural language interfaces for maintenance documentation.\n\nImplementation timelines vary from 6 weeks for packaged solutions to 6 months for custom integrations. Budget ranges from $50K to $500K depending on scope. Key risk factor: data quality — most manufacturers discover their historical data is not ML-ready and needs 3-6 months of cleanup before any model training can begin.',
            scores: 'Specificity: 8/10 - Three specific AI areas identified with use cases\nActionability: 7/10 - Timeline and budget ranges provided\nDomain Depth: 8/10 - Technical capability knowledge, data quality insight',
            systemPrompt: 'You are an expert in manufacturing operations and industrial AI applications with deep knowledge of Industry 4.0, IoT integration, and production environments.'
        },
        {
            model: 'Llama 3.3 70B',
            shortId: 'Llama 3.3',
            response: 'Open-source models like Llama offer a compelling alternative for manufacturers concerned about data privacy. Running LLMs on-premise means sensitive operational data never leaves the facility.\n\nThe trade-off is internal ML expertise required for fine-tuning and deployment. Best suited for companies with strong data science teams already on staff. For organizations without this capability, fine-tuning-as-a-service providers can bridge the gap, though this adds dependency considerations.',
            scores: 'Specificity: 7/10 - Open-source alternative clearly positioned\nActionability: 6/10 - Trade-offs discussed but fewer concrete steps\nDomain Depth: 7/10 - Privacy and sovereignty focus, technical deployment detail',
            systemPrompt: 'You are an expert in manufacturing operations and industrial AI applications with deep knowledge of Industry 4.0, IoT integration, and production environments.'
        }
    ];

    var html = '';
    for (var i = 0; i < testResults.length; i++) {
        var r = testResults[i];
        html += '<div class="model-card"><h3>' + r.shortId + '</h3>' +
            '<div class="prompt-section"><strong>System Prompt:</strong> ' + r.systemPrompt + '</div>' +
            '<div class="response-section"><strong>Response:</strong><br>' + r.response.replace(/\n/g, '<br>') + '</div>' +
            '<div class="scores-section"><strong>Scores:</strong><br>' + r.scores.replace(/\n/g, '<br>') + '</div></div>';
    }
    document.getElementById('modelsContainer').innerHTML = html;
}

function buildPreview(results, query, systemPrompt) {
    var html = '';
    for (var i = 0; i < results.length; i++) {
        var result = results[i];
        html += '<div class="model-card"><h3>' + result.model + '</h3>' +
            '<div class="prompt-section"><strong>System Prompt:</strong> ' + result.systemPrompt + '</div>' +
            '<div class="response-section"><strong>Response:</strong><br>' + result.response.replace(/\n/g, '<br>') + '</div>' +
            '<div class="scores-section"><strong>Scores:</strong><br>' + result.scores.replace(/\n/g, '<br>') + '</div></div>';
    }
    document.getElementById('modelsContainer').innerHTML = html;
    document.getElementById('synthesis').value = 'Human ethical interpretation: [Enter your summary here]';
    document.getElementById('preview').style.display = 'block';
}

function gatherResultsFromDOM() {
    var cards = document.querySelectorAll('.model-card');
    var results = [];
    for (var i = 0; i < cards.length; i++) {
        var card = cards[i];
        var modelName = card.querySelector('h3') ? card.querySelector('h3').innerText : '';
        var responseEl = card.querySelector('.response-section');
        var scoresEl = card.querySelector('.scores-section');
        var promptEl = card.querySelector('.prompt-section');
        var responseText = responseEl ? responseEl.innerText.replace('Response:\n', '').replace(/<br>/g, '\n') : '';
        var scoresText = scoresEl ? scoresEl.innerText.replace('Scores:\n', '').replace(/<br>/g, '\n') : '';
        var promptText = promptEl ? promptEl.innerText.replace('System Prompt: ', '').replace(/<br>/g, '\n') : '';
        results.push({
            model: modelName,
            shortId: modelName,
            response: responseText,
            scores: scoresText,
            systemPrompt: promptText
        });
    }
    return results;
}

// ============================================================
// PDF Generation — Upstate AI report style
// Pages: Cover | Summary | Model Responses | Synthesis | About
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

function newPage(doc) {
    doc.addPage();
    return 20;
}

function generatePDF(results, query, systemPrompt, synthesis) {
    var jsPDF = window.jspdf.jsPDF;
    var doc = new jsPDF({ unit: 'mm', format: 'letter' });

    var W = 216, H = 279;
    var y = 0;
    var totalPages = results.length + 4;
    var pageNum = 1;

    // ============================================================
    // PAGE 1: COVER
    // ============================================================
    doc.setFillColor(26, 58, 46);
    doc.rect(0, 0, W, H, 'F');

    doc.setFontSize(30);
    doc.setTextColor(255, 255, 255);
    doc.setFont(undefined, 'bold');
    doc.text('upstate', W / 2, 52, { align: 'center' });

    doc.setFillColor(255, 105, 0);
    doc.rect(W / 2 - 25, 60, 50, 2, 'F');

    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text('AI Readiness Assessment Results', W / 2, 84, { align: 'center' });

    doc.setFillColor(255, 105, 0);
    doc.rect(W / 2 - 55, 90, 110, 1, 'F');

    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(210, 210, 210);
    var qLines = doc.splitTextToSize(query, 140);
    doc.text(qLines, W / 2, 108, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(170, 170, 170);
    var dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    doc.text('Generated ' + dateStr, W / 2, 130, { align: 'center' });

    doc.setFontSize(13);
    doc.setTextColor(255, 105, 0);
    doc.setFont(undefined, 'bold');
    doc.text('PUT AI TO WORK', W / 2, H - 48, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(190, 190, 190);
    doc.setFont(undefined, 'normal');
    doc.text('ben@up-state-ai.com  |  (315) 313-5998  |  up-state-ai.com', W / 2, H - 38, { align: 'center' });

    // ============================================================
    // PAGE 2: SUMMARY — Purpose & Methodology
    // ============================================================
    y = newPage(doc);
    pageNum++;

    doc.setFillColor(26, 58, 46);
    doc.rect(0, 0, W, 18, 'F');
    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    doc.setFont(undefined, 'bold');
    doc.text('ABOUT THIS ASSESSMENT', 20, 12);

    y = 28;

    // Purpose
    doc.setFontSize(10);
    doc.setTextColor(26, 58, 46);
    doc.setFont(undefined, 'bold');
    doc.text('Purpose', 20, y);
    y += 6;
    doc.setFont(undefined, 'normal');
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(9);
    var purposeText = 'This report compares responses from five leading AI models on a single strategic question relevant to your business context. The goal is not to find a "winner" but to surface the different angles, framings, and blind spots each model brings to the same problem. A human analyst then synthesizes these perspectives into an actionable recommendation.';
    var purposeLines = doc.splitTextToSize(purposeText, W - 40);
    doc.text(purposeLines, 20, y);
    y += purposeLines.length * 4.5 + 10;

    // Methodology
    doc.setFontSize(10);
    doc.setTextColor(26, 58, 46);
    doc.setFont(undefined, 'bold');
    doc.text('Methodology', 20, y);
    y += 7;

    var steps = [
        ['1', 'Query Dispatch', 'Your question is sent simultaneously to five AI models via OpenRouter API, each receiving the same inferred system context.'],
        ['2', 'Response Scoring', 'Each response is independently evaluated by Claude Sonnet on three dimensions: Specificity, Actionability, and Domain Depth (1-10 scale).'],
        ['3', 'Human Synthesis', 'A human analyst reviews all five responses and scores to identify patterns, tensions, and the most actionable insight.'],
        ['4', 'PDF Export', 'This report synthesizes the full process into a branded deliverable suitable for client presentation or internal strategy documentation.']
    ];

    for (var s = 0; s < steps.length; s++) {
        var step = steps[s];
        doc.setFillColor(255, 105, 0);
        doc.circle(25, y + 3, 4, 'F');
        doc.setFontSize(8);
        doc.setTextColor(255, 255, 255);
        doc.setFont(undefined, 'bold');
        doc.text(step[0], 23.5, y + 4.5);

        doc.setFontSize(9);
        doc.setTextColor(26, 58, 46);
        doc.setFont(undefined, 'bold');
        doc.text(step[1], 34, y + 4);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(40, 40, 40);
        var descLines = doc.splitTextToSize(step[2], W - 54);
        doc.text(descLines, 34, y + 9);
        y += 8 + descLines.length * 4.5 + 4;
    }

    y += 4;

    // Models compared
    doc.setFillColor(247, 244, 234);
    doc.roundedRect(15, y, W - 30, 28, 3, 3, 'F');
    doc.setFontSize(7.5);
    doc.setTextColor(120, 120, 120);
    doc.setFont(undefined, 'bold');
    doc.text('MODELS COMPARED IN THIS REPORT', 20, y + 7);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(9);
    var modelNames = '';
    for (var mi = 0; mi < results.length; mi++) {
        modelNames += (mi > 0 ? '  \u2022  ' : '') + results[mi].model;
    }
    var modelNameLines = doc.splitTextToSize(modelNames, W - 40);
    doc.text(modelNameLines, 20, y + 14);
    y += 18;

    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text('Scoring provider: Anthropic Claude Sonnet 4.6', 20, y + 6);

    addFooter(doc, pageNum, totalPages);

    // ============================================================
    // PAGE 3+: MODEL RESPONSE PAGES
    // ============================================================
    for (var idx = 0; idx < results.length; idx++) {
        var result = results[idx];

        y = newPage(doc);
        pageNum++;

        // Header bar
        doc.setFillColor(26, 58, 46);
        doc.rect(0, 0, W, 18, 'F');
        doc.setFontSize(11);
        doc.setTextColor(255, 255, 255);
        doc.setFont(undefined, 'bold');
        doc.text(result.model + '  \u2014  Model Response ' + (idx + 1) + ' of ' + results.length, 20, 12);

        // Orange accent bar
        doc.setFillColor(255, 105, 0);
        doc.rect(0, 18, W, 2.5, 'F');

        y = 26;

        // Model metadata + score badges
        var specScore = 7, actScore = 7, depthScore = 7;
        var scoreText = result.scores || '';
        var sm = scoreText.match(/Specificity:\s*(\d+)/);
        var am = scoreText.match(/Actionability:\s*(\d+)/);
        var dm = scoreText.match(/Domain Depth:\s*(\d+)/);
        if (sm) specScore = parseInt(sm[1]);
        if (am) actScore = parseInt(am[1]);
        if (dm) depthScore = parseInt(dm[1]);

        function scoreColor(s) {
            return s >= 8 ? [45, 87, 69] : s >= 6 ? [255, 165, 0] : [180, 50, 50];
        }

        // Model name badge
        doc.setFillColor(26, 58, 46);
        doc.roundedRect(15, y, 62, 10, 2, 2, 'F');
        doc.setFontSize(7.5);
        doc.setTextColor(255, 255, 255);
        doc.setFont(undefined, 'bold');
        doc.text('MODEL: ' + result.model.toUpperCase(), 18, y + 6.5);

        // Score badges
        var badges = [
            ['Specific: ' + specScore + '/10', specScore],
            ['Actionable: ' + actScore + '/10', actScore],
            ['Depth: ' + depthScore + '/10', depthScore]
        ];
        for (var bi = 0; bi < badges.length; bi++) {
            var bx = 84 + bi * 44;
            var bc = scoreColor(badges[bi][1]);
            doc.setFillColor(bc[0], bc[1], bc[2]);
            doc.roundedRect(bx, y, 42, 10, 2, 2, 'F');
            doc.setFontSize(7.5);
            doc.setTextColor(255, 255, 255);
            doc.setFont(undefined, 'bold');
            doc.text(badges[bi][0], bx + 2, y + 6.5);
        }

        y += 16;

        // System prompt (cream box)
        doc.setFillColor(247, 244, 234);
        doc.roundedRect(15, y, W - 30, 20, 3, 3, 'F');
        doc.setFillColor(255, 105, 0);
        doc.rect(15, y, 3, 20, 'F');
        doc.setFontSize(7);
        doc.setTextColor(120, 120, 120);
        doc.setFont(undefined, 'bold');
        doc.text('SYSTEM PROMPT', 22, y + 5.5);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(40, 40, 40);
        doc.setFontSize(8.5);
        var spText = result.systemPrompt || 'You are an expert consultant specializing in business strategy and operational efficiency.';
        var spLines = doc.splitTextToSize(spText, W - 48);
        doc.text(spLines.slice(0, 2), 22, y + 11);
        y += 26;

        // Response (off-white container with forest green left border)
        doc.setFillColor(250, 248, 242);
        doc.roundedRect(15, y, W - 30, 128, 3, 3, 'F');
        doc.setFillColor(26, 58, 46);
        doc.rect(15, y, 3, 128, 'F');

        doc.setFontSize(7.5);
        doc.setTextColor(26, 58, 46);
        doc.setFont(undefined, 'bold');
        doc.text('RESPONSE', 22, y + 6);

        doc.setFontSize(9);
        doc.setTextColor(40, 40, 40);
        doc.setFont(undefined, 'normal');
        var respLines = doc.splitTextToSize(result.response, W - 42);
        doc.text(respLines.slice(0, 40), 22, y + 13);
        y += 14 + 40 * 4.5;

        if (respLines.length > 40) {
            doc.setTextColor(120, 120, 120);
            doc.setFontSize(8);
            doc.text('[+ ' + (respLines.length - 40) + ' more lines — see full response in app]', 22, y);
            y += 6;
        }

        y += 8;

        // Scores breakdown
        doc.setFillColor(247, 244, 234);
        doc.roundedRect(15, y, W - 30, 38, 3, 3, 'F');
        doc.setFillColor(26, 58, 46);
        doc.rect(15, y, 3, 38, 'F');
        doc.setFontSize(7.5);
        doc.setTextColor(26, 58, 46);
        doc.setFont(undefined, 'bold');
        doc.text('EVALUATION SCORES', 22, y + 7);
        doc.setFontSize(9);
        doc.setTextColor(40, 40, 40);
        doc.setFont(undefined, 'normal');
        var scoreLines = doc.splitTextToSize(result.scores, W - 42);
        doc.text(scoreLines.slice(0, 5), 22, y + 14);

        addFooter(doc, pageNum, totalPages);
    }

    // ============================================================
    // SYNTHESIS PAGE
    // ============================================================
    y = newPage(doc);
    pageNum++;

    doc.setFillColor(26, 58, 46);
    doc.rect(0, 0, W, 18, 'F');
    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    doc.setFont(undefined, 'bold');
    doc.text('SYNTHESIS  \u2014  Human Analysis', 20, 12);

    y = 28;

    // Query reminder
    doc.setFillColor(247, 244, 234);
    doc.roundedRect(15, y, W - 30, 18, 3, 3, 'F');
    doc.setFontSize(7.5);
    doc.setTextColor(120, 120, 120);
    doc.setFont(undefined, 'bold');
    doc.text('ORIGINAL QUERY', 20, y + 6);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(9);
    var q2Lines = doc.splitTextToSize(query, W - 40);
    doc.text(q2Lines.slice(0, 2), 20, y + 12);
    y += 24;

    // Analyst synthesis
    doc.setFontSize(9);
    doc.setTextColor(26, 58, 46);
    doc.setFont(undefined, 'bold');
    doc.text('ANALYST SYNTHESIS', 15, y);
    y += 7;

    doc.setFillColor(255, 105, 0);
    doc.rect(15, y - 3, 3, 32, 'F');
    doc.setFillColor(247, 244, 234);
    doc.roundedRect(18, y - 3, W - 33, 35, 3, 3, 'F');
    doc.setFont(undefined, 'normal');
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(9.5);
    var synthLines = doc.splitTextToSize(synthesis, W - 46);
    doc.text(synthLines.slice(0, 7), 23, y + 5);
    y += 42;

    // Comparison table
    doc.setFontSize(9);
    doc.setTextColor(26, 58, 46);
    doc.setFont(undefined, 'bold');
    doc.text('MODEL COMPARISON AT A GLANCE', 15, y);
    y += 7;

    doc.setFillColor(26, 58, 46);
    doc.rect(15, y, W - 30, 8, 'F');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.setFont(undefined, 'bold');
    doc.text('Model', 18, y + 5.5);
    doc.text('Specificity', 78, y + 5.5);
    doc.text('Actionability', 118, y + 5.5);
    doc.text('Depth', 158, y + 5.5);
    y += 8;

    for (var ri = 0; ri < results.length; ri++) {
        var r = results[ri];
        var bg = ri % 2 === 0 ? [247, 244, 234] : [255, 255, 255];
        doc.setFillColor(bg[0], bg[1], bg[2]);
        doc.rect(15, y, W - 30, 8, 'F');
        doc.setFontSize(8);
        doc.setTextColor(40, 40, 40);
        doc.setFont(undefined, 'normal');
        doc.text(r.model, 18, y + 5.5);

        var ss2 = (r.scores || '').match(/Specificity:\s*(\d+)/);
        var sa2 = (r.scores || '').match(/Actionability:\s*(\d+)/);
        var sd2 = (r.scores || '').match(/Domain Depth:\s*(\d+)/);
        doc.text((ss2 ? ss2[1] : '-') + '/10', 80, y + 5.5);
        doc.text((sa2 ? sa2[1] : '-') + '/10', 120, y + 5.5);
        doc.text((sd2 ? sd2[1] : '-') + '/10', 162, y + 5.5);
        y += 8;
    }

    addFooter(doc, pageNum, totalPages);

    // ============================================================
    // LAST PAGE: ABOUT UPSTATE AI (exact match to assessment PDF)
    // ============================================================
    y = newPage(doc);
    pageNum++;

    doc.setFillColor(26, 58, 46);
    doc.rect(0, 0, W, 18, 'F');
    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    doc.setFont(undefined, 'bold');
    doc.text('ABOUT UPSTATE AI', 20, 12);

    y = 28;

    doc.setFontSize(10);
    doc.setTextColor(26, 58, 46);
    doc.setFont(undefined, 'bold');
    doc.text('We help businesses in manufacturing, professional services, and logistics build practical AI systems that solve real problems.', 15, y);
    y += 6;
    doc.setFont(undefined, 'normal');
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(9);
    doc.text('No hype, no generic advice. Just honest assessments, clear implementation plans, and hands-on support from people who understand both the technology and your industry.', 15, y, { maxWidth: W - 30 });
    y += 16;

    // Founder bio
    doc.setFillColor(247, 244, 234);
    doc.roundedRect(15, y, W - 30, 24, 3, 3, 'F');
    doc.setFillColor(255, 105, 0);
    doc.rect(15, y, 4, 24, 'F');
    doc.setFontSize(9);
    doc.setTextColor(26, 58, 46);
    doc.setFont(undefined, 'bold');
    doc.text('Ben Nichols, Founder', 23, y + 7);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(8.5);
    doc.text('AI professor at Syracuse University and consultant to manufacturers, professional services firms, and technology companies.', 23, y + 13);
    doc.text('Built and deployed machine learning systems in production environments for over a decade.', 23, y + 19);
    y += 30;

    // Services heading
    doc.setFontSize(9);
    doc.setTextColor(26, 58, 46);
    doc.setFont(undefined, 'bold');
    doc.text('Our Services', 15, y);
    y += 8;

    // 2x2 service grid
    var services = [
        ['AI Workshop', 'Half-day interactive session for leadership teams covering industry-specific use cases and hands-on opportunity scoring.'],
        ['AI Audit', 'Full operational analysis with data maturity evaluation and prioritized roadmap with ROI estimates.'],
        ['AI Execution', 'End-to-end project management from technical planning through vendor evaluation to deployment and training.'],
        ['AI Advisory', 'Monthly strategic check-ins, on-call guidance for AI decisions, and quarterly opportunity reviews.']
    ];

    for (var si = 0; si < services.length; si++) {
        var svc = services[si];
        var col = si % 2;
        var row = Math.floor(si / 2);
        var sx = 15 + col * 95;
        var sy = y + row * 24;

        doc.setFillColor(247, 244, 234);
        doc.roundedRect(sx, sy, 88, 20, 3, 3, 'F');
        doc.setFontSize(9);
        doc.setTextColor(26, 58, 46);
        doc.setFont(undefined, 'bold');
        doc.text(svc[0], sx + 5, sy + 7);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(120, 120, 120);
        doc.setFontSize(7.5);
        var svcDescLines = doc.splitTextToSize(svc[1], 80);
        doc.text(svcDescLines.slice(0, 2), sx + 5, sy + 13);
    }

    y += 50;

    // Let's Talk box with QR code
    doc.setFillColor(26, 58, 46);
    doc.roundedRect(15, y, W - 30, 38, 3, 3, 'F');

    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    doc.setFont(undefined, 'bold');
    doc.text("Let's Talk", 25, y + 12);

    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.text('Book a free 30-minute consultation to discuss your AI readiness and next steps.', 25, y + 20);

    doc.setFontSize(8.5);
    doc.text('Email: ben@up-state-ai.com', 25, y + 28);
    doc.text('Phone: (315) 313-5998', 25, y + 35);
    doc.text('Web: up-state-ai.com', 25, y + 42);

    // QR code
    try {
        var qrDataUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=https://up-state-ai.com';
        doc.addImage(qrDataUrl, 'PNG', W - 60, y + 3, 32, 32);
    } catch (qrErr) {
        // QR code optional — skip silently if API unreachable
    }

    addFooter(doc, pageNum, pageNum);

    // Auto-download
    var ts = new Date().toISOString().slice(0, 10);
    doc.save('model-marshal-report-' + ts + '.pdf');
    document.getElementById('status').innerHTML = 'PDF generated: model-marshal-report-' + ts + '.pdf';
}
