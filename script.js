
async function buildPDFHTML(results, query, systemPrompt, synthesis, additionalData) {
    var date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    // Create temporary container
    var container = document.createElement('div');
    container.id = 'pdf-report';
    container.style.cssText = 'position: absolute; left: 0; top: 0; width: 816px; z-index: 9999;';

    // Build cover page
    var coverHTML = `
        <div class="pdf-page" style="background: #1a3a2e; color: white; text-align: center; padding: 120px 60px;">
            <div style="font-size: 48px; font-weight: 800; margin-bottom: 20px;">upstate</div>
            <h1 style="font-size: 32px;">Model Marshal</h1>
            <h2 style="font-size: 20px;">AI Model Comparison Report</h2>
            <p>Query: ${escapeHtml(query)}</p>
            <p>Generated on ${date}</p>
        </div>
    `;

    // Input form HTML
    var inputFormHTML = `
        <div class="pdf-page" style="background: white; padding: 60px;">
            <h2 style="font-size: 24px; color: #1a3a2e;">Input Data</h2>
            <p>Name: ${escapeHtml(additionalData.name)}</p>
            <p>Business: ${escapeHtml(additionalData.business)}</p>
            <p>Domain URL: ${escapeHtml(additionalData.domainUrl)}</p>
            <p>Role: ${escapeHtml(additionalData.role)}</p>
            <p>Additional Data: ${escapeHtml(additionalData.additionalData)}</p>
        </div>
    `;

    // Build methodology page
    var methodHTML = `
        <div class="pdf-page" style="background: white; padding: 60px;">
            <h2 style="font-size: 24px; font-weight: 700; color: #1a3a2e; margin-bottom: 30px;">How Model Marshal Works</h2>
            
            <div style="margin-bottom: 30px;">
                <h3 style="font-size: 18px; font-weight: 600; color: #1a3a2e; margin-bottom: 15px;">1. Query Analysis</h3>
                <p style="font-size: 14px; line-height: 1.7; color: #333; margin-bottom: 10px;">Your query is analyzed to determine the domain and context, ensuring each model receives a prompt tailored to its strengths.</p>
            </div>

            <div style="margin-bottom: 30px;">
                <h3 style="font-size: 18px; font-weight: 600; color: #1a3a2e; margin-bottom: 15px;">2. Model-Specific Prompting</h3>
                <p style="font-size: 14px; line-height: 1.7; color: #333; margin-bottom: 15px;">Each model receives a customized system prompt:</p>
                <ul style="font-size: 13px; line-height: 1.8; color: #555; padding-left: 20px;">
                    <li><strong>Claude Sonnet:</strong> Nuanced analysis and ethical reasoning</li>
                    <li><strong>ChatGPT:</strong> Structured frameworks and comprehensive coverage</li>
                    <li><strong>Grok:</strong> Direct, practical, no-nonsense advice</li>
                    <li><strong>Gemini:</strong> Technical depth and implementation details</li>
                    <li><strong>Llama:</strong> Open-source focus and data sovereignty</li>
                </ul>
            </div>
        </div>
    `;

    // Build results pages
    var resultsHTML = '';
    results.forEach(function(r, idx) {
        var scoreText = r.scores || '';
        resultsHTML += `
            <div class="pdf-page" style="background: white; padding: 60px;">
                <div style="background: #1a3a2e; color: white; padding: 20px; margin: -60px -60px 30px; border-bottom: 4px solid #ff6900;">
                    <h2 style="font-size: 28px; font-weight: 700; margin: 0;">${escapeHtml(r.model)}</h2>
                </div>

                <h3 style="font-size: 20px; margin: 0;">Scores</h3>
                <p style="font-size: 16px; color: #555;">
                    Specificity: ${scoreText.match(/Specificity:\s*(\d+)/)[1]}/10<br>
                    Actionability: ${scoreText.match(/Actionability:\s*(\d+)/)[1]}/10<br>
                    Depth: ${scoreText.match(/Domain Depth:\s*(\d+)/)[1]}/10
                </p>

                <h3 style="font-size: 16px; margin: 0;">Response</h3>
                <div style="background: #f7f4ea; padding: 20px; border-radius: 8px;">${escapeHtml(r.response)}</div>
                <div style="position: absolute; bottom: 40px; left: 60px; right: 60px; border-top: 1px solid #e0e0e0; padding-top: 15px;">
                    <div style="float: left; font-size: 11px; font-weight: 700; color: #1a3a2e;">Model Marshal Report</div>
                    <div style="float: right; font-size: 11px; color: #666;">Page ${3 + idx}</div>
                </div>
            </div>
        `;
    });

    // Add QR Code
    var qrCodeHTML = `<div class='pdf-page' style='background: white; padding: 60px;'><h3>Scan to Connect</h3><img src='https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=https://up-state-ai.com' alt='QR Code' /></div>`;

    // Build About page
    var aboutHTML = `
        <div class='pdf-page' style='background: white; padding: 60px;'>
            <h2>About Upstate AI</h2>
            <p>We help businesses in manufacturing, professional services, and logistics build practical AI systems that solve real problems.</p>
            <p>No hype, just honest assessments and clear implementation plans.</p>
        </div>
    `;

    // Assemble the complete HTML content
    container.innerHTML = coverHTML + inputFormHTML + methodHTML + resultsHTML + qrCodeHTML + aboutHTML;
    
    document.body.appendChild(container);
    return container;
}
