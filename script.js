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
        
        // Collect user info
        var userInfo = {
            name: document.getElementById('name').value || '',
            title: document.getElementById('title').value || '',
            company: document.getElementById('company').value || '',
            domain: document.getElementById('domain').value || '',
            email: document.getElementById('email').value || ''
        };

        if (!globalResults || globalResults.length === 0) {
            status.className = 'status-error';
            status.innerHTML = 'No results to export. Click Dispatch first.';
            return;
        }

        try {
            generatePDF(globalResults, query, '', synthesis, userInfo);
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


function generatePDF(results, query, systemPrompt, synthesis, userInfo) {
    var timestamp = new Date().toISOString().slice(0, 10);

    // Build HTML template (no QR code)
        var pdfContainer = buildPDFHTML(results, query, synthesis, userInfo || {});

        // Create processing overlay
        var overlay = document.createElement('div');
        overlay.id = 'pdf-overlay';
        overlay.style.cssText = 'position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: #1a3a2e; z-index: 10000;';
        overlay.innerHTML = '<div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; color: white; font-family: -apple-system, sans-serif;">' +
            '<div style="width: 56px; height: 56px; border: 4px solid rgba(255,105,0,0.25); border-top-color: #ff6900; border-radius: 50%; animation: pdfspin 0.8s linear infinite; margin: 0 auto 28px;"></div>' +
            '<div style="font-size: 22px; font-weight: 700; margin-bottom: 10px; letter-spacing: -0.02em;">Generating Your Report</div>' +
            '<div style="font-size: 14px; color: rgba(247,244,234,0.6);">Preparing your Model Marshal report...</div>' +
            '</div>' +
            '<style>@keyframes pdfspin { to { transform: rotate(360deg); } }</style>';
        document.body.appendChild(overlay);

        // Give browser time to render
        setTimeout(function() {
            html2canvas(pdfContainer, { scale: 2, useCORS: true, allowTaint: true }).then(function(canvas) {
                var jsPDFLib = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;
                if (jsPDFLib) {
                    var pdf = new jsPDFLib({ unit: 'px', format: [816, 1056], orientation: 'portrait' });
                    var pageHeight = 1056;
                    var imgData = canvas.toDataURL('image/jpeg', 0.98);
                    var imgHeight = (canvas.height * 816) / canvas.width;
                    var heightLeft = imgHeight;
                    var position = 0;

                    pdf.addImage(imgData, 'JPEG', 0, position, 816, imgHeight);
                    heightLeft -= pageHeight;

                    while (heightLeft > 0) {
                        position -= pageHeight;
                        pdf.addPage([816, 1056]);
                        pdf.addImage(imgData, 'JPEG', 0, position, 816, imgHeight);
                        heightLeft -= pageHeight;
                    }

                    pdf.save('model-marshal-report-' + timestamp + '.pdf');
                }
                // Clean up
                if (pdfContainer && pdfContainer.parentNode) pdfContainer.parentNode.removeChild(pdfContainer);
                if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
            }).catch(function(err) {
                console.error('PDF generation error:', err);
                alert('PDF generation failed: ' + err.message);
                if (pdfContainer && pdfContainer.parentNode) pdfContainer.parentNode.removeChild(pdfContainer);
                if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
            });
        }, 3500);
    });
}

function buildPDFHTML(results, query, synthesis, userInfo) {
    var date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    var totalPages = results.length + 4;  // cover + summary + 5 models + synthesis + about = 9

    function escapeHtml(text) {
        var div = document.createElement('div');
        div.textContent = text || '';
        return div.innerHTML;
    }

    // Create temporary container
    var container = document.createElement('div');
    container.id = 'pdf-report';
    container.style.cssText = 'position: absolute; left: 0; top: 0; width: 816px; z-index: 9999;';

    var pagesHTML = '';

    // PAGE 1: COVER WITH LOGO AND USER INFO
// Create the cover page with user information and title
pagesHTML += `
    <div class="pdf-page" style="width: 816px; height: 1056px; background: #1a3a2e; color: white; text-align: center; position: relative; font-family: -apple-system, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; padding: 80px 40px 60px 40px;">
            <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAACNgAAAWUCAYAAAAZQSkYAAAACXBIWXMAACxLAAAsSwGlPZapAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAOdEVYdFNvZnR3YXJlAEZpZ21hnrGWYwAAfvNJREFUeAHs2kFNA1EYRtH/vYGmrLAADpAAighO6ggsoAAksCChoZl5YIBv1YZ0co6Mm1sFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA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ARsAAAAAAAAAADiFgA0AAAAAAAAAAJxCwAYAAAAAAAAAAE4hYAMAAAAAAAAAAKcQsAEAAAAAAAAAgFMI2AAAAAAAAAAAwCkEbAAAAAAAAAAA4BQCNgAAAAAAAAAAcAoBGwAAAAAAAAAAOIWADQAAAAAAAAAAnELABgAAAAAAAAAATiFgAwAAAAAAAAAApxCwAQAAAAAAAACAUwjYAAAAAAAAAADAKQRsAAAAAAAAAADgFAI2AAAAAAAAAABwCgEbAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD4/9uBAxoAAACEQfZPbY5vAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAag4uRqhPaIYB7gAAAABJRU5ErkJggg==" alt="Upstate AI" style="width: 300px; margin-bottom: 40px;">
            <div style="width: 80px; height: 4px; background: #ff6900; margin: 30px auto;"></div>
            <h1 style="font-size: 38px; font-weight: 700; margin: 30px 0; color: #f7f4ea; letter-spacing: -0.02em;">Model Marshal<br>Report</h1>
            <div style="font-size: 14px; color: rgba(247,244,234,0.7); margin-top: 5px;">Name: ${escapeHtml(userInfo.name)}</div>
            <div style="font-size: 14px; color: rgba(247,244,234,0.7); margin-top: 5px;">Company: ${escapeHtml(userInfo.company)}</div>
            <div style="font-size: 14px; color: rgba(247,244,234,0.7); margin-top: 5px;">Email: ${escapeHtml(userInfo.email)}</div>
            <div style="font-size: 14px; color: rgba(247,244,234,0.7); margin-top: 5px;">Domain: ${escapeHtml(userInfo.domain)}</div>
            <div style="font-size: 14px; color: rgba(247,244,234,0.7); margin-top: 5px;">Title: ${escapeHtml(userInfo.title)}</div>
            <div style="font-size: 16px; color: rgba(247,244,234,0.8); margin: 40px 0; line-height: 1.6;">${escapeHtml(query)}</div>
            <div style="font-size: 14px; color: rgba(247,244,234,0.7); margin-top: 60px;">${date}</div>
        </div>
        <div style="position: absolute; bottom: 20px; left: 40px; right: 40px; font-size: 11px; color: rgba(247,244,234,0.8); border-top: 1px solid rgba(247,244,234,0.2); padding-top: 10px;">
            <div style="float: left;">Upstate AI | ben@up-state-ai.com | (315) 313-5998 | up-state-ai.com</div>
            <div style="float: right;">Page 1 of ${totalPages}</div>
            <div style="clear: both;"></div>
        </div>
    </div>`;
    
    // PAGE 2: ANALYSIS SUMMARY (White background, clean layout)
    pagesHTML += `
    <div class="pdf-page" style="width: 816px; height: 1056px; background: white; position: relative; font-family: -apple-system, sans-serif;">
        <div style="padding: 50px 40px;">
            <div style="background: #1a3a2e; color: white; padding: 15px 20px; margin: -50px -40px 30px -40px;">
                <h2 style="margin: 0; font-size: 24px; font-weight: 700;">Analysis Summary</h2>
            </div>
            
            <h3 style="color: #1a3a2e; font-size: 16px; font-weight: 700; margin: 0 0 10px 0;">Query</h3>
            <div style="background: #f7f4ea; padding: 15px; border-left: 4px solid #ff6900; border-radius: 4px; margin-bottom: 30px;">
                <p style="margin: 0; color: #2a2a2a; font-size: 13px; line-height: 1.6;">${escapeHtml(query)}</p>
            </div>
            
            <h3 style="color: #1a3a2e; font-size: 16px; font-weight: 700; margin: 0 0 15px 0;">Models Evaluated</h3>
            <div style="background: #f9f9f9; padding: 20px; border-radius: 6px; margin-bottom: 25px;">
                <div style="margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #e0e0e0;">
                    <div style="color: #ff6900; font-weight: 700; font-size: 13px; margin-bottom: 4px;">Claude Sonnet 4.6</div>
                    <p style="margin: 0; color: #555; font-size: 12px; line-height: 1.6;">Anthropic's latest model, excelling at nuanced analysis, following complex instructions, and producing well-structured outputs with strong reasoning capabilities.</p>
                </div>
                <div style="margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #e0e0e0;">
                    <div style="color: #ff6900; font-weight: 700; font-size: 13px; margin-bottom: 4px;">GPT-5.4</div>
                    <p style="margin: 0; color: #555; font-size: 12px; line-height: 1.6;">OpenAI's flagship model with exceptional performance across diverse tasks, structured problem-solving, and comprehensive knowledge synthesis.</p>
                </div>
                <div style="margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #e0e0e0;">
                    <div style="color: #ff6900; font-weight: 700; font-size: 13px; margin-bottom: 4px;">Grok-4-Fast</div>
                    <p style="margin: 0; color: #555; font-size: 12px; line-height: 1.6;">X.AI's model optimized for speed and directness, providing practical insights with minimal latency and straightforward communication style.</p>
                </div>
                <div style="margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #e0e0e0;">
                    <div style="color: #ff6900; font-weight: 700; font-size: 13px; margin-bottom: 4px;">Gemini 3 Flash</div>
                    <p style="margin: 0; color: #555; font-size: 12px; line-height: 1.6;">Google's fast, efficient model balancing speed with quality, strong at technical analysis and detailed explanations.</p>
                </div>
                <div>
                    <div style="color: #ff6900; font-weight: 700; font-size: 13px; margin-bottom: 4px;">Llama 3.3 70B</div>
                    <p style="margin: 0; color: #555; font-size: 12px; line-height: 1.6;">Meta's open-source model offering strong performance with transparency, privacy, and cost-effectiveness for on-premise deployments.</p>
                </div>
            </div>
            
            <h3 style="color: #1a3a2e; font-size: 16px; font-weight: 700; margin: 0 0 10px 0;">Evaluation Methodology</h3>
            <div style="color: #555; font-size: 12px; line-height: 1.8;">
                <p style="margin: 8px 0;"><strong style="color: #1a3a2e;">Specificity:</strong> Measures concrete details vs. generic statements. Higher scores indicate precise, measurable recommendations.</p>
                <p style="margin: 8px 0;"><strong style="color: #1a3a2e;">Actionability:</strong> Evaluates clarity of next steps and implementation guidance. Higher scores mean ready-to-execute advice.</p>
                <p style="margin: 8px 0;"><strong style="color: #1a3a2e;">Domain Depth:</strong> Assesses expert-level insights and industry knowledge. Higher scores reflect specialized expertise.</p>
            </div>
        </div>
        <div style="position: absolute; bottom: 20px; left: 40px; right: 40px; font-size: 11px; color: #556b5e; border-top: 1px solid #e0e0e0; padding-top: 10px;">
            <div style="float: left;">Upstate AI | ben@up-state-ai.com | (315) 313-5998 | up-state-ai.com</div>
            <div style="float: right;">Page 2 of ${totalPages}</div>
            <div style="clear: both;"></div>
        </div>
    </div>`;

    // PAGES 3-7: MODEL RESPONSES WITH BAR GRAPHS
    for (var i = 0; i < results.length; i++) {
        var result = results[i];
        var pageNum = i + 3;
        
        // Extract scores from text
        var scores = result.scores || '';
        var specMatch = scores.match(/Specificity:\s*(\d+)/);
        var actMatch = scores.match(/Actionability:\s*(\d+)/);
        var depthMatch = scores.match(/Domain Depth:\s*(\d+)/);
        var specScore = specMatch ? parseInt(specMatch[1]) : 7;
        var actScore = actMatch ? parseInt(actMatch[1]) : 7;
        var depthScore = depthMatch ? parseInt(depthMatch[1]) : 7;
        
        pagesHTML += `
        <div class="pdf-page" style="width: 816px; height: 1056px; background: white; position: relative; font-family: -apple-system, sans-serif;">
            <div style="padding: 50px 40px;">
                <div style="background: #1a3a2e; color: white; padding: 15px 20px; margin: -50px -40px 30px -40px;">
                    <h2 style="margin: 0; font-size: 24px; font-weight: 700;">${escapeHtml(result.shortId || result.model)}</h2>
                </div>
                
                <h3 style="color: #1a3a2e; font-size: 16px; font-weight: 700; margin: 20px 0 10px 0;">Evaluation Scores</h3>
                <div style="background: #f9f9f9; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
                    <div style="margin-bottom: 15px;">
                        <div style="font-size: 13px; color: #2a2a2a; margin-bottom: 5px; font-weight: 600;">Specificity</div>
                        <div style="background: #e0e0e0; height: 24px; border-radius: 4px; position: relative;">
                            <div style="background: linear-gradient(90deg, #ff6900, #ff8533); width: ${specScore * 10}%; height: 100%; border-radius: 4px; display: flex; align-items: center; justify-content: flex-end; padding-right: 8px;">
                                <span style="color: white; font-size: 12px; font-weight: 700;">${specScore}/10</span>
                            </div>
                        </div>
                    </div>
                    <div style="margin-bottom: 15px;">
                        <div style="font-size: 13px; color: #2a2a2a; margin-bottom: 5px; font-weight: 600;">Actionability</div>
                        <div style="background: #e0e0e0; height: 24px; border-radius: 4px; position: relative;">
                            <div style="background: linear-gradient(90deg, #ff6900, #ff8533); width: ${actScore * 10}%; height: 100%; border-radius: 4px; display: flex; align-items: center; justify-content: flex-end; padding-right: 8px;">
                                <span style="color: white; font-size: 12px; font-weight: 700;">${actScore}/10</span>
                            </div>
                        </div>
                    </div>
                    <div>
                        <div style="font-size: 13px; color: #2a2a2a; margin-bottom: 5px; font-weight: 600;">Domain Depth</div>
                        <div style="background: #e0e0e0; height: 24px; border-radius: 4px; position: relative;">
                            <div style="background: linear-gradient(90deg, #ff6900, #ff8533); width: ${depthScore * 10}%; height: 100%; border-radius: 4px; display: flex; align-items: center; justify-content: flex-end; padding-right: 8px;">
                                <span style="color: white; font-size: 12px; font-weight: 700;">${depthScore}/10</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <h3 style="color: #1a3a2e; font-size: 16px; font-weight: 700; margin: 20px 0 10px 0;">Response</h3>
                <div style="background: #f7f4ea; border-left: 4px solid #ff6900; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
                    <div style="color: #2a2a2a; font-size: 13px; line-height: 1.6; white-space: pre-wrap;">${escapeHtml(result.response)}</div>
                </div>
            </div>
            <div style="position: absolute; bottom: 20px; left: 40px; right: 40px; font-size: 11px; color: #556b5e; border-top: 1px solid #e0e0e0; padding-top: 10px;">
                <div style="float: left;">Upstate AI | ben@up-state-ai.com | (315) 313-5998 | up-state-ai.com</div>
                <div style="float: right;">Page ${pageNum} of ${totalPages}</div>
                <div style="clear: both;"></div>
            </div>
        </div>`;
    }

    // SYNTHESIS PAGE WITH COMPARISON TABLE
    var synthesisPageNum = totalPages - 1;
    pagesHTML += `
    <div class="pdf-page" style="width: 816px; height: 1056px; background: white; position: relative; font-family: -apple-system, sans-serif;">
        <div style="padding: 50px 40px;">
            <div style="background: #1a3a2e; color: white; padding: 15px 20px; margin: -50px -40px 30px -40px;">
                <h2 style="margin: 0; font-size: 24px; font-weight: 700;">Human Synthesis</h2>
            </div>
            
            <h3 style="color: #1a3a2e; font-size: 16px; font-weight: 700; margin: 0 0 15px 0;">Model Comparison</h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 12px;">
                <thead>
                    <tr style="background: #1a3a2e; color: white;">
                        <th style="padding: 10px; text-align: left; font-weight: 700;">Model</th>
                        <th style="padding: 10px; text-align: center; font-weight: 700;">Specificity</th>
                        <th style="padding: 10px; text-align: center; font-weight: 700;">Actionability</th>
                        <th style="padding: 10px; text-align: center; font-weight: 700;">Domain Depth</th>
                    </tr>
                </thead>
                <tbody>`;
    
    for (var ti = 0; ti < results.length; ti++) {
        var tr = results[ti];
        var bgColor = ti % 2 === 0 ? '#f7f4ea' : 'white';
        var tScores = tr.scores || '';
        var tSpec = (tScores.match(/Specificity:\s*(\d+)/) || [])[1] || '-';
        var tAct = (tScores.match(/Actionability:\s*(\d+)/) || [])[1] || '-';
        var tDepth = (tScores.match(/Domain Depth:\s*(\d+)/) || [])[1] || '-';
        
        pagesHTML += `
                    <tr style="background: ${bgColor};">
                        <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; font-weight: 600; color: #1a3a2e;">${escapeHtml(tr.shortId || tr.model)}</td>
                        <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; text-align: center; color: #2a2a2a;">${tSpec}/10</td>
                        <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; text-align: center; color: #2a2a2a;">${tAct}/10</td>
                        <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; text-align: center; color: #2a2a2a;">${tDepth}/10</td>
                    </tr>`;
    }
    
    pagesHTML += `
                </tbody>
            </table>
            
            <h3 style="color: #1a3a2e; font-size: 16px; font-weight: 700; margin: 30px 0 15px 0;">Analysis</h3>
            <div style="color: #2a2a2a; font-size: 13px; line-height: 1.8; white-space: pre-wrap;">${escapeHtml(synthesis || 'No synthesis provided.')}</div>
        </div>
        <div style="position: absolute; bottom: 20px; left: 40px; right: 40px; font-size: 11px; color: #556b5e; border-top: 1px solid #e0e0e0; padding-top: 10px;">
            <div style="float: left;">Upstate AI | ben@up-state-ai.com | (315) 313-5998 | up-state-ai.com</div>
            <div style="float: right;">Page ${synthesisPageNum} of ${totalPages}</div>
            <div style="clear: both;"></div>
        </div>
    </div>`;
    
    // FINAL PAGE: ABOUT UPSTATE AI (matching readiness assessment)
    pagesHTML += `
    <div class="pdf-page" style="width: 816px; height: 1056px; background: #f7f4ea; position: relative; font-family: -apple-system, sans-serif;">
        <div style="padding: 50px 40px;">
            <div style="background: #1a3a2e; color: white; padding: 15px 20px; margin: -50px -40px 30px -40px;">
                <h2 style="margin: 0; font-size: 24px; font-weight: 700;">About Upstate AI</h2>
            </div>
            
            <p style="color: #1a3a2e; font-size: 15px; font-weight: 700; margin: 0 0 12px 0;">Upstate AI helps Central New York businesses harness artificial intelligence.</p>
            <p style="color: #2a2a2a; font-size: 13px; line-height: 1.7; margin: 0 0 30px 0;">We work with manufacturers, healthcare organizations, and professional services firms to identify high-impact AI use cases, design implementation roadmaps, and deliver hands-on training. Our engagement model starts with a one-day workshop to assess readiness and ends with ongoing advisory support as AI initiatives scale.</p>
            
            <h3 style="color: #1a3a2e; font-size: 16px; font-weight: 700; margin: 30px 0 15px 0;">Services</h3>
            <table style="width: 100%; border-collapse: separate; border-spacing: 12px;">
                <tr>
                    <td style="width: 50%; background: white; padding: 18px; border-radius: 8px; vertical-align: top;">
                        <div style="font-size: 15px; font-weight: 700; color: #1a3a2e; margin-bottom: 8px;">AI Workshop</div>
                        <div style="font-size: 12px; line-height: 1.6; color: #556b5e;">Half-day interactive session for leadership teams covering industry-specific use cases and hands-on opportunity scoring.</div>
                    </td>
                    <td style="width: 50%; background: white; padding: 18px; border-radius: 8px; vertical-align: top;">
                        <div style="font-size: 15px; font-weight: 700; color: #1a3a2e; margin-bottom: 8px;">AI Audit</div>
                        <div style="font-size: 12px; line-height: 1.6; color: #556b5e;">Full operational analysis with data maturity evaluation and prioritized roadmap with ROI estimates.</div>
                    </td>
                </tr>
                <tr>
                    <td style="width: 50%; background: white; padding: 18px; border-radius: 8px; vertical-align: top;">
                        <div style="font-size: 15px; font-weight: 700; color: #1a3a2e; margin-bottom: 8px;">AI Readiness Assessment</div>
                        <div style="font-size: 12px; line-height: 1.6; color: #556b5e;">Understand where you stand today with a comprehensive assessment of your organization's AI readiness, infrastructure, and opportunities.</div>
                    </td>
                    <td style="width: 50%; background: white; padding: 18px; border-radius: 8px; vertical-align: top;">
                        <div style="font-size: 15px; font-weight: 700; color: #1a3a2e; margin-bottom: 8px;">Implementation Roadmap</div>
                        <div style="font-size: 12px; line-height: 1.6; color: #556b5e;">From concept to production with a phased implementation plan tailored to your team and budget.</div>
                    </td>
                </tr>
            </table>
            
            <div style="background: #1a3a2e; padding: 20px; border-radius: 8px; margin-top: 30px;">
                <h3 style="color: white; font-size: 16px; font-weight: 700; margin: 0 0 12px 0;">Let's Talk</h3>
                    <p style="color: #f7f4ea; font-size: 12px; line-height: 1.6; margin: 0 0 12px 0;">Book a free 30-minute consultation to discuss your AI readiness and next steps.</p>
                    <p style="color: #f7f4ea; font-size: 12px; margin: 4px 0;">Email: ben@up-state-ai.com</p>
                    <p style="color: #f7f4ea; font-size: 12px; margin: 4px 0;">Phone: (315) 313-5998</p>
                    <p style="color: #f7f4ea; font-size: 12px; margin: 4px 0;">Web: up-state-ai.com</p>
        </div>
        <div style="position: absolute; bottom: 20px; left: 40px; right: 40px; font-size: 11px; color: #556b5e; border-top: 1px solid #d0d0d0; padding-top: 10px;">
            <div style="float: left;">Upstate AI | ben@up-state-ai.com | (315) 313-5998 | up-state-ai.com</div>
            <div style="float: right;">Page ${totalPages} of ${totalPages}</div>
            <div style="clear: both;"></div>
        </div>
    </div>`;

    container.innerHTML = pagesHTML;
    document.body.appendChild(container);
    return container;
}
