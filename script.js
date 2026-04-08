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


function generatePDF(results, query, systemPrompt, synthesis) {
    // Build HTML template
    var pdfContainer = buildPDFHTML(results, query, synthesis);
    var timestamp = new Date().toISOString().slice(0, 10);

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
}

function buildPDFHTML(results, query, synthesis) {
    var date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    var totalPages = results.length + 3;

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

    // PAGE 1: COVER
    pagesHTML += `
    <div class="pdf-page" style="width: 816px; height: 1056px; background: #1a3a2e; color: white; text-align: center; position: relative; font-family: -apple-system, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; padding: 120px 40px 60px 40px;">
            <div style="font-size: 48px; font-weight: 800; margin-bottom: 20px;">Model Marshal</div>
            <div style="width: 80px; height: 4px; background: #ff6900; margin: 30px auto;"></div>
            <h1 style="font-size: 32px; font-weight: 700; margin: 30px 0; color: #f7f4ea;">AI Response Comparison Report</h1>
            <div style="font-size: 16px; color: rgba(247,244,234,0.8); margin: 40px 0;">${escapeHtml(query)}</div>
            <div style="font-size: 14px; color: rgba(247,244,234,0.7); margin-top: 60px;">${date}</div>
        </div>
        <div style="position: absolute; bottom: 20px; left: 40px; right: 40px; font-size: 11px; color: rgba(247,244,234,0.8); border-top: 1px solid rgba(247,244,234,0.2); padding-top: 10px;">
            <div style="float: left;">Upstate AI | ben@up-state-ai.com | (315) 313-5998 | up-state-ai.com</div>
            <div style="float: right;">Page 1 of ${totalPages}</div>
            <div style="clear: both;"></div>
        </div>
    </div>`;

    // PAGES 2+: MODEL RESPONSES
    for (var i = 0; i < results.length; i++) {
        var result = results[i];
        var pageNum = i + 2;
        
        pagesHTML += `
        <div class="pdf-page" style="width: 816px; height: 1056px; background: white; position: relative; font-family: -apple-system, sans-serif;">
            <div style="padding: 50px 40px;">
                <div style="background: #1a3a2e; color: white; padding: 15px 20px; margin: -50px -40px 30px -40px;">
                    <h2 style="margin: 0; font-size: 24px; font-weight: 700;">${escapeHtml(result.shortId || result.model)}</h2>
                </div>
                
                <h3 style="color: #1a3a2e; font-size: 16px; font-weight: 700; margin: 20px 0 10px 0;">Response</h3>
                <div style="background: #f7f4ea; border-left: 4px solid #ff6900; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
                    <div style="color: #2a2a2a; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${escapeHtml(result.response)}</div>
                </div>
                
                <h3 style="color: #1a3a2e; font-size: 16px; font-weight: 700; margin: 20px 0 10px 0;">Evaluation</h3>
                <div style="color: #555; font-size: 13px; line-height: 1.8; white-space: pre-wrap;">${escapeHtml(result.scores)}</div>
            </div>
            <div style="position: absolute; bottom: 20px; left: 40px; right: 40px; font-size: 11px; color: #556b5e; border-top: 1px solid #e0e0e0; padding-top: 10px;">
                <div style="float: left;">Upstate AI | ben@up-state-ai.com | (315) 313-5998 | up-state-ai.com</div>
                <div style="float: right;">Page ${pageNum} of ${totalPages}</div>
                <div style="clear: both;"></div>
            </div>
        </div>`;
    }

    // LAST PAGE: SYNTHESIS
    pagesHTML += `
    <div class="pdf-page" style="width: 816px; height: 1056px; background: white; position: relative; font-family: -apple-system, sans-serif;">
        <div style="padding: 50px 40px;">
            <div style="background: #1a3a2e; color: white; padding: 15px 20px; margin: -50px -40px 30px -40px;">
                <h2 style="margin: 0; font-size: 24px; font-weight: 700;">Human Synthesis</h2>
            </div>
            <div style="color: #2a2a2a; font-size: 14px; line-height: 1.8; white-space: pre-wrap;">${escapeHtml(synthesis || 'No synthesis provided.')}</div>
            
            <div style="background: #f7f4ea; padding: 24px; border-radius: 8px; margin-top: 60px; border: 2px solid #ff6900;">
                <h3 style="color: #1a3a2e; font-size: 18px; font-weight: 700; margin: 0 0 15px 0;">Contact Us</h3>
                <p style="margin: 8px 0; color: #2a2a2a; font-size: 14px;"><strong>Email:</strong> ben@up-state-ai.com</p>
                <p style="margin: 8px 0; color: #2a2a2a; font-size: 14px;"><strong>Phone:</strong> (315) 313-5998</p>
                <p style="margin: 8px 0; color: #2a2a2a; font-size: 14px;"><strong>Web:</strong> up-state-ai.com</p>
            </div>
        </div>
        <div style="position: absolute; bottom: 20px; left: 40px; right: 40px; font-size: 11px; color: #556b5e; border-top: 1px solid #e0e0e0; padding-top: 10px;">
            <div style="float: left;">Upstate AI | ben@up-state-ai.com | (315) 313-5998 | up-state-ai.com</div>
            <div style="float: right;">Page ${totalPages} of ${totalPages}</div>
            <div style="clear: both;"></div>
        </div>
    </div>`;

    container.innerHTML = pagesHTML;
    document.body.appendChild(container);
    return container;
}
