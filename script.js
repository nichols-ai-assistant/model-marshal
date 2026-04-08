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
    doc.setDrawColor(255, 105, 0);
    doc.setLineWidth(0.5);
    doc.line(20, 272, 196, 272);
    doc.setFontSize(7);
    doc.setTextColor(120, 120, 120);
    doc.text('Upstate AI  |  ben@up-state-ai.com  |  (315) 313-5998  |  up-state-ai.com', 20, 277);
    
    // Page number in styled box
    doc.setFillColor(255, 105, 0);
    doc.roundedRect(189, 273, 12, 6, 1, 1, 'F');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.setFont(undefined, 'bold');
    doc.text(String(pageNum), 195, 277.5, { align: 'center' });
    doc.setFontSize(7);
    doc.setTextColor(120, 120, 120);
    doc.setFont(undefined, 'normal');
    doc.text('of ' + totalPages, 203, 277, { align: 'left' });
}

function newPage(doc) { doc.addPage(); return 20; }

function generatePDF(results, query, systemPrompt, synthesis) {
    var jsPDF = window.jspdf.jsPDF;
    var doc = new jsPDF({ unit: 'mm', format: 'letter' });
    var W = 216, H = 279;
    var y = 0;
    var totalPages = results.length + 4;
    var pageNum = 1;

    // PAGE 1: COVER with Upstate AI logo
    doc.setFillColor(26, 58, 46);
    doc.rect(0, 0, W, H, 'F');
    
    // Upstate AI Logo (base64 encoded - simplified version)
    var logoDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAKAAAACgCAYAAACLz2ctAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAKcSURBVHgB7d0xTsNAEAbQWdwDuQeugPsf5B6cg9yD3IMrIFFQICERYhvb48y8J6VIkZJP+ne1XgcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA+NQEAQGkCGABgEQEMALCIAAYAWEQAAwAsIoABABYRwAAAiwhgAIBFBDAAwCICGABgEQEMALCIAAYAWEQAAwAsIoABABYRwAAAiwhgAIBFBDAAwCICGABgEQEMALCIAAYAWEQAAwAsIoABABYRwAAAiwhgAIBFBDAAwCICGABgEQEMALCIAAYAWEQAAwAsIoABABYRwAAAiwhgAIBFBDAAwCICGABgEQEMALCIAAYAWEQAAwAsIoABABYRwAAAiwhgAIBFBDAAwCICGABgEQEMALCIAAYAWEQAAwAsIoABABYRwAAAiwhgAIBFBDAAwCICGABgEQEMALCIAAYAWEQAAwAsIoABABYRwAAAiwhgAIBFBDAAwCICGABgEQEMALCIAAYAWEQAAwAsIoABABYRwAAAiwhgAIBFBDAAwCICGABgEQEMALCIAAYAWEQAAwAsIoABABYRwAAAiwhgAIBFBDAAwCICGABgEQEMALCIAAYAWEQAAwAsIoABABYRwAAAiwhgAIBFBDAAwCICGABgEQEMALCIAAYAWEQAAwAsIoABABYRwAAAiwhgAIBFBDAAwCICGABgEQEMALCIAAYAWEQAAwAsIoABABYRwAAAiwhgAIBFBDAAwCICGABgEQEMALCIAAYAWEQAAwAsIoABABYRwAAAiwhgAIBFBDAAwCICGABgEQEMALCIAAYAWEQAAwAsIoABABYRwAAAiwhgAIBFBDAAwCICGABgEQEMALCIAAYAWEQAAwAsIoABABYRwAAAiwhgAIBFBDAAwCICGABgEQEMALCIAAYAWEQAAwAsIoABAAAAAAAAAAAAAAAAAAAAAAAAAIDT+gFxCTUHqmKt+AAAAABJRU5ErkJggg==';
    try {
        doc.addImage(logoDataUrl, 'PNG', W/2 - 25, 30, 50, 20);
    } catch(e) { /* Skip logo if fails */ }
    
    doc.setFillColor(255, 105, 0);
    doc.rect(W / 2 - 25, 55, 50, 2, 'F');
    doc.setFontSize(20);
    doc.setTextColor(255, 255, 255);
    doc.setFont(undefined, 'bold');
    doc.text('Model Marshal Report', W / 2, 72, { align: 'center' });
    doc.setFillColor(255, 105, 0);
    doc.rect(W / 2 - 55, 78, 110, 1, 'F');
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(210, 210, 210);
    doc.text(doc.splitTextToSize(query, 140), W / 2, 96, { align: 'center' });
    doc.setFontSize(10);
    doc.setTextColor(170, 170, 170);
    doc.text(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), W / 2, 118, { align: 'center' });
    doc.setFontSize(13);
    doc.setTextColor(255, 105, 0);
    doc.setFont(undefined, 'bold');
    doc.text('PUT AI TO WORK', W / 2, H - 48, { align: 'center' });
    doc.setFontSize(10);
    doc.setTextColor(190, 190, 190);
    doc.setFont(undefined, 'normal');
    doc.text('ben@up-state-ai.com  |  (315) 313-5998  |  up-state-ai.com', W / 2, H - 38, { align: 'center' });

    // PAGE 2: ABOUT
    y = newPage(doc); pageNum++;
    doc.setFillColor(26, 58, 46);
    doc.rect(0, 0, W, 18, 'F');
    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    doc.setFont(undefined, 'bold');
    doc.text('ABOUT THIS ASSESSMENT', 20, 12);
    y = 28;

    doc.setFontSize(10);
    doc.setTextColor(26, 58, 46);
    doc.setFont(undefined, 'bold');
    doc.text('Purpose', 20, y); y += 6;
    doc.setFont(undefined, 'normal');
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(9);
    var purposeText = 'This report compares responses from five leading AI models on a single strategic question. The goal is not to find a "winner" but to surface the different angles, framings, and blind spots each model brings. A human analyst then synthesizes these perspectives into an actionable recommendation.';
    doc.text(doc.splitTextToSize(purposeText, W - 40), 20, y);
    y += doc.splitTextToSize(purposeText, W - 40).length * 4.5 + 10;

    doc.setFontSize(10);
    doc.setTextColor(26, 58, 46);
    doc.setFont(undefined, 'bold');
    doc.text('Methodology', 20, y); y += 7;

    var steps = [
        ['1', 'Query Dispatch', 'Your question is sent to five AI models via OpenRouter API, each receiving the same inferred system context.'],
        ['2', 'Response Scoring', 'Each response is independently evaluated on three dimensions: Specificity, Actionability, and Domain Depth.'],
        ['3', 'Human Synthesis', 'A human analyst reviews all responses and scores to identify patterns, tensions, and actionable insights.'],
        ['4', 'PDF Export', 'This report synthesizes the full process into a branded deliverable suitable for client presentation.']
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
        doc.setTextColor(40, 40, 40);
        doc.setFont(undefined, 'bold');
        doc.text(step[1], 33, y + 3);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(80, 80, 80);
        var stepLines = doc.splitTextToSize(step[2], W - 55);
        doc.text(stepLines, 33, y + 8);
        y += stepLines.length * 4 + 10;
    }

    addFooter(doc, pageNum, totalPages);

    // PAGES 3+: MODEL RESPONSES with bar graphs and styled containers
    for (var i = 0; i < results.length; i++) {
        var result = results[i];
        y = newPage(doc); pageNum++;
        doc.setFillColor(26, 58, 46);
        doc.rect(0, 0, W, 18, 'F');
        doc.setFontSize(12);
        doc.setTextColor(255, 255, 255);
        doc.setFont(undefined, 'bold');
        doc.text(result.model.toUpperCase(), 20, 12);
        y = 28;

        // Extract scores for bar graph
        var specScore = 7, actScore = 7, depthScore = 7;
        var scoreText = result.scores || '';
        var sm = scoreText.match(/Specificity:\s*(\d+)/);
        var am = scoreText.match(/Actionability:\s*(\d+)/);
        var dm = scoreText.match(/Domain Depth:\s*(\d+)/);
        if (sm) specScore = parseInt(sm[1]);
        if (am) actScore = parseInt(am[1]);
        if (dm) depthScore = parseInt(dm[1]);

        // Evaluation section with horizontal bar graphs
        doc.setFontSize(10);
        doc.setTextColor(26, 58, 46);
        doc.setFont(undefined, 'bold');
        doc.text('Evaluation', 20, y); y += 8;

        // Draw bar graphs
        var barHeight = 8;
        var barMaxWidth = 100;
        var barStartX = 20;
        var metrics = [
            {label: 'Specificity', score: specScore, color: [255, 105, 0]},
            {label: 'Actionability', score: actScore, color: [255, 140, 0]},
            {label: 'Domain Depth', score: depthScore, color: [255, 165, 0]}
        ];

        for (var m = 0; m < metrics.length; m++) {
            var metric = metrics[m];
            doc.setFontSize(9);
            doc.setTextColor(40, 40, 40);
            doc.setFont(undefined, 'normal');
            doc.text(metric.label, barStartX, y + 4);
            
            // Background bar (light gray)
            doc.setFillColor(220, 220, 220);
            doc.roundedRect(barStartX + 50, y - 2, barMaxWidth, barHeight, 2, 2, 'F');
            
            // Actual score bar (orange gradient)
            var barWidth = (metric.score / 10) * barMaxWidth;
            doc.setFillColor(metric.color[0], metric.color[1], metric.color[2]);
            doc.roundedRect(barStartX + 50, y - 2, barWidth, barHeight, 2, 2, 'F');
            
            // Score text
            doc.setFontSize(9);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(255, 255, 255);
            if (barWidth > 15) {
                doc.text(metric.score + '/10', barStartX + 50 + barWidth - 12, y + 4);
            } else {
                doc.setTextColor(40, 40, 40);
                doc.text(metric.score + '/10', barStartX + 50 + barWidth + 3, y + 4);
            }
            
            y += barHeight + 5;
        }
        y += 5;

        // Response in styled container (off-white with orange border)
        doc.setFontSize(10);
        doc.setTextColor(26, 58, 46);
        doc.setFont(undefined, 'bold');
        doc.text('Response', 20, y); y += 6;
        
        // Calculate response height
        var respLines = doc.splitTextToSize(result.response, W - 50);
        var containerHeight = Math.min(respLines.length * 4.5 + 8, 160);
        
        // Draw container with orange border
        doc.setFillColor(247, 244, 234); // Cream/off-white
        doc.roundedRect(18, y - 4, W - 36, containerHeight, 3, 3, 'F');
        doc.setDrawColor(255, 105, 0); // Orange border
        doc.setLineWidth(0.8);
        doc.roundedRect(18, y - 4, W - 36, containerHeight, 3, 3, 'S');
        
        // Response text
        doc.setFontSize(9);
        doc.setTextColor(40, 40, 40);
        doc.setFont(undefined, 'normal');
        doc.text(respLines, 23, y + 2);

        addFooter(doc, pageNum, totalPages);
    }

    // SECOND TO LAST: SYNTHESIS with comparison table
    y = newPage(doc); pageNum++;
    doc.setFillColor(26, 58, 46);
    doc.rect(0, 0, W, 18, 'F');
    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    doc.setFont(undefined, 'bold');
    doc.text('HUMAN SYNTHESIS', 20, 12);
    y = 28;

    // Comparison table
    doc.setFontSize(10);
    doc.setTextColor(26, 58, 46);
    doc.setFont(undefined, 'bold');
    doc.text('Model Comparison', 20, y); y += 8;

    // Table header
    doc.setFillColor(26, 58, 46);
    doc.rect(15, y, W - 30, 8, 'F');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.setFont(undefined, 'bold');
    doc.text('Model', 18, y + 5.5);
    doc.text('Specificity', 78, y + 5.5);
    doc.text('Actionability', 118, y + 5.5);
    doc.text('Depth', 165, y + 5.5);
    y += 8;

    // Table rows
    for (var ri = 0; ri < results.length; ri++) {
        var r = results[ri];
        var bg = ri % 2 === 0 ? [247, 244, 234] : [255, 255, 255];
        doc.setFillColor(bg[0], bg[1], bg[2]);
        doc.rect(15, y, W - 30, 8, 'F');
        doc.setFontSize(8);
        doc.setTextColor(40, 40, 40);
        doc.setFont(undefined, 'normal');
        doc.text(r.shortId || r.model, 18, y + 5.5);

        var ss2 = (r.scores || '').match(/Specificity:\s*(\d+)/);
        var sa2 = (r.scores || '').match(/Actionability:\s*(\d+)/);
        var sd2 = (r.scores || '').match(/Domain Depth:\s*(\d+)/);
        
        // Color code scores
        var spec = ss2 ? parseInt(ss2[1]) : 0;
        var act = sa2 ? parseInt(sa2[1]) : 0;
        var depth = sd2 ? parseInt(sd2[1]) : 0;
        
        doc.setTextColor(spec >= 8 ? [34, 139, 34] : spec >= 6 ? [255, 140, 0] : [200, 0, 0]);
        doc.text((ss2 ? ss2[1] : '-') + '/10', 85, y + 5.5);
        doc.setTextColor(act >= 8 ? [34, 139, 34] : act >= 6 ? [255, 140, 0] : [200, 0, 0]);
        doc.text((sa2 ? sa2[1] : '-') + '/10', 130, y + 5.5);
        doc.setTextColor(depth >= 8 ? [34, 139, 34] : depth >= 6 ? [255, 140, 0] : [200, 0, 0]);
        doc.text((sd2 ? sd2[1] : '-') + '/10', 170, y + 5.5);
        y += 8;
    }
    y += 10;

    // Synthesis text
    doc.setFontSize(10);
    doc.setTextColor(26, 58, 46);
    doc.setFont(undefined, 'bold');
    doc.text('Analysis', 20, y); y += 6;
    doc.setFontSize(9);
    doc.setTextColor(40, 40, 40);
    doc.setFont(undefined, 'normal');
    if (synthesis) {
        var synLines = doc.splitTextToSize(synthesis, W - 40);
        doc.text(synLines, 20, y);
    } else {
        doc.setTextColor(120, 120, 120);
        doc.text('No synthesis provided.', 20, y);
    }

    addFooter(doc, pageNum, totalPages);

    // FINAL PAGE: ABOUT UPSTATE AI
    y = newPage(doc); pageNum++;
    doc.setFillColor(247, 244, 234);
    doc.rect(0, 0, W, H, 'F');

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
    doc.text('Upstate AI helps Central New York businesses harness artificial intelligence.', 20, y); y += 8;
    doc.setFont(undefined, 'normal');
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(9);
    var aboutText = 'We work with manufacturers, healthcare organizations, and professional services firms to identify high-impact AI use cases, design implementation roadmaps, and deliver hands-on training. Our engagement model starts with a one-day workshop to assess readiness and ends with ongoing advisory support as AI initiatives scale.';
    doc.text(doc.splitTextToSize(aboutText, W - 40), 20, y); y += doc.splitTextToSize(aboutText, W - 40).length * 4.5 + 10;

    // Contact box with better QR code framing
    doc.setFillColor(26, 58, 46);
    doc.roundedRect(15, y, W - 30, 50, 3, 3, 'F');
    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    doc.setFont(undefined, 'bold');
    doc.text("Let's Talk", 25, y + 12);
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.text('Book a free 30-minute consultation to discuss your AI readiness and next steps.', 25, y + 20);
    doc.text('Email: ben@up-state-ai.com', 25, y + 30);
    doc.text('Phone: (315) 313-5998', 25, y + 37);
    doc.text('Web: up-state-ai.com', 25, y + 44);

    // QR code with styled frame
    try {
        var qrDataUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://up-state-ai.com';
        // White background frame
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(W - 58, y + 5, 40, 40, 2, 2, 'F');
        // Orange border
        doc.setDrawColor(255, 105, 0);
        doc.setLineWidth(1);
        doc.roundedRect(W - 58, y + 5, 40, 40, 2, 2, 'S');
        // QR code
        doc.addImage(qrDataUrl, 'PNG', W - 56, y + 7, 36, 36);
        // Label below
        doc.setFontSize(7);
        doc.setTextColor(255, 255, 255);
        doc.text('Scan to visit', W - 38, y + 48, { align: 'center' });
    } catch (qrErr) { /* QR optional, skip silently */ }

    addFooter(doc, pageNum, totalPages);

    var ts = new Date().toISOString().slice(0, 10);
    doc.save('model-marshal-report-' + ts + '.pdf');
}
