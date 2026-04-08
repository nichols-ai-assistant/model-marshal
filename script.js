// Model Marshal Script
// Standalone JS for local web app with inferred system prompts, preview, and synthesis

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('queryForm');
    const status = document.getElementById('status');
    const previewDiv = document.getElementById('preview');

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        const apiKey = document.getElementById('apiKey').value;
        const query = document.getElementById('query').value;

        if (!apiKey || !query) {
            status.innerHTML = 'Please enter API key and query.';
            return;
        }

        status.innerHTML = 'Inferring system prompt...';

        // Models to query
        const models = [
            { name: 'Claude Sonnet', id: 'anthropic/claude-sonnet-4.6' },
            { name: 'ChatGPT', id: 'openai/gpt-5.4' },
            { name: 'Grok', id: 'x-ai/grok-4.1-fast' },
            { name: 'Gemini', id: 'google/gemini-3-flash-preview' },
            { name: 'Llama', id: 'meta-llama/llama-3.3-70b-instruct' }
        ];

        const results = [];
        let systemPrompt = '';

        // Function to call OpenRouter API
        async function callModel(modelId, messages) {
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': window.location.origin, // Optional: for OpenRouter tracking
                    'X-Title': 'Model Marshal' // Optional
                },
                body: JSON.stringify({
                    model: modelId,
                    messages: messages,
                    temperature: 0.7,
                    max_tokens: 1000
                })
            });

            if (!response.ok) {
                const errBody = await response.text();
                throw new Error(`API error ${response.status}: ${errBody}`);
            }

            const data = await response.json();
            return data.choices[0].message.content.trim();
        }

        // Function to generate system prompt
        async function generateSystemPrompt(query) {
            const inferencePrompt = `Analyze this user query: "${query}"

Infer the main domain or topic (e.g., manufacturing, finance, healthcare).

Suggest a concise system prompt starting with "You are an expert in [domain]" or if general, "You are an AI assistant specialized in business operations".

Output only the system prompt, nothing else.`;

            return await callModel('anthropic/claude-sonnet-4.6', [{ role: 'user', content: inferencePrompt }]);
        }

        // Function to score response with Sonnet
        async function scoreResponse(responseText, modelName) {
            const scoringPrompt = `Score the following AI response on a scale of 1-10 for:
1. Tone: neutral/professional (1=emotional/biased, 10=neutral/professional)
2. Authoritativeness: expert/fact-based (1=speculative/general, 10=expert/fact-based)
3. Objectivity: unbiased (1=opinionated, 10=unbiased)

Provide scores and a 1-sentence justification excerpt from the response.

Response to score: "${responseText.replace(/"/g, '\\"')}" from ${modelName}

Format as:
Tone: X/10 - [1-sentence excerpt]
Authoritativeness: Y/10 - [1-sentence excerpt]
Objectivity: Z/10 - [1-sentence excerpt]`;

            return await callModel('anthropic/claude-sonnet-4.6', [{ role: 'user', content: scoringPrompt }]);
        }

        try {
            systemPrompt = await generateSystemPrompt(query);
            status.innerHTML = 'Dispatching to models...';

            for (const model of models) {
                status.innerHTML = `Querying ${model.name}...`;
                const messages = [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: query }
                ];
                const response = await callModel(model.id, messages);
                status.innerHTML = `Scoring ${model.name} response...`;
                const scores = await scoreResponse(response, model.name);
                results.push({ model: model.name, response, scores, systemPrompt });
            }

            status.innerHTML = 'Displaying preview...';

            // Generate preview HTML
            let modelsHtml = '';
            results.forEach(result => {
                modelsHtml += `
                <div class="model-card">
                    <h3>${result.model}</h3>
                    <div class="prompt-section"><strong>System Prompt:</strong> ${result.systemPrompt}</div>
                    <div class="response-section"><strong>Response:</strong><br>${result.response.replace(/\n/g, '<br>')}</div>
                    <div class="scores-section"><strong>Scores:</strong><br>${result.scores.replace(/\n/g, '<br>')}</div>
                </div>`;
            });

            document.getElementById('modelsContainer').innerHTML = modelsHtml;
            document.getElementById('synthesis').value = 'Human ethical interpretation: [Enter your summary here]';
            previewDiv.style.display = 'block';
            status.innerHTML = 'Preview ready. Add your synthesis and generate PDF.';

            // Add event listener for PDF button
            const generateBtn = document.getElementById('generatePdf');
            generateBtn.onclick = function() {
                const synthesis = document.getElementById('synthesis').value;
                generatePDF(results, query, systemPrompt, synthesis);
            };

        } catch (error) {
            status.innerHTML = `Error: ${error.message}`;
            console.error(error);
        }
    });

    // ============================================================
    // PDF Generation — Upstate AI report style
    // Pages: Cover | Model Responses | Synthesis | About Upstate AI
    // ============================================================

    const COLORS = {
        forest: [26, 58, 46],     // #1a3a2e
        forestMid: [45, 87, 69],   // #2d5745
        orange: [255, 105, 0],     // #ff6900
        cream: [247, 244, 234],    // #f7f4ea
        white: [255, 255, 255],
        darkText: [40, 40, 40],
        mutedText: [120, 120, 120]
    };

    function addFooter(doc, pageNum, totalPages) {
        doc.setFontSize(9);
        doc.setTextColor(...COLORS.mutedText);
        doc.text('Upstate AI | ben@up-state-ai.com | (315) 313-5998 | up-state-ai.com', 20, 287);
        doc.text(`Page ${pageNum} of ${totalPages}`, 185, 287, { align: 'right' });
    }

    function newPage(doc) {
        doc.addPage();
        return 20;
    }

    function generatePDF(results, query, systemPrompt, synthesis) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ unit: 'mm', format: 'letter' });

        const W = 216, H = 279; // Letter size
        let y = 0;
        let pageCount = 1;

        // ============================================================
        // PAGE 1: COVER
        // ============================================================
        doc.setFillColor(...COLORS.forest);
        doc.rect(0, 0, W, H, 'F');

        // Logo / Brand wordmark
        doc.setFontSize(28);
        doc.setTextColor(...COLORS.white);
        doc.setFont(undefined, 'bold');
        doc.text('upstate', W / 2, 50, { align: 'center' });

        // Orange divider line
        doc.setFillColor(...COLORS.orange);
        doc.rect(W / 2 - 30, 58, 60, 2, 'F');

        // Title
        doc.setFontSize(22);
        doc.setFont(undefined, 'bold');
        doc.text('AI Readiness Assessment Results', W / 2, 85, { align: 'center' });

        // Horizontal rule
        doc.setFillColor(...COLORS.orange);
        doc.rect(W / 2 - 50, 92, 100, 1, 'F');

        // Subtitle / query
        doc.setFontSize(13);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(220, 220, 220);
        const queryLines = doc.splitTextToSize(`Query: ${query}`, 140);
        doc.text(queryLines, W / 2, 110, { align: 'center' });

        // Date
        const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        doc.setFontSize(11);
        doc.setTextColor(180, 180, 180);
        doc.text(`Generated ${dateStr}`, W / 2, 130, { align: 'center' });

        // Tagline
        doc.setFontSize(14);
        doc.setTextColor(...COLORS.orange);
        doc.setFont(undefined, 'bold');
        doc.text('PUT AI TO WORK', W / 2, H - 45, { align: 'center' });

        // Contact
        doc.setFontSize(10);
        doc.setTextColor(200, 200, 200);
        doc.setFont(undefined, 'normal');
        doc.text('ben@up-state-ai.com  |  (315) 313-5998  |  up-state-ai.com', W / 2, H - 35, { align: 'center' });

        // ============================================================
        // PAGE 2+: MODEL RESPONSE PAGES
        // ============================================================
        results.forEach((result, idx) => {
            y = newPage(doc);
            pageCount++;

            // Page header bar
            doc.setFillColor(...COLORS.forest);
            doc.rect(0, 0, W, 18, 'F');
            doc.setFontSize(12);
            doc.setTextColor(...COLORS.white);
            doc.setFont(undefined, 'bold');
            doc.text(`${result.model}  —  AI Model Comparison`, 20, 12);

            // Model name accent
            doc.setFillColor(...COLORS.orange);
            doc.rect(0, 18, 5, 50, 'F');

            y = 28;

            // System Prompt box (cream)
            doc.setFillColor(...COLORS.cream);
            doc.roundedRect(15, y, W - 30, 22, 3, 3, 'F');
            doc.setFontSize(8);
            doc.setTextColor(...COLORS.mutedText);
            doc.setFont(undefined, 'bold');
            doc.text('SYSTEM PROMPT', 20, y + 6);
            doc.setFont(undefined, 'normal');
            doc.setTextColor(...COLORS.darkText);
            doc.setFontSize(9);
            const spLines = doc.splitTextToSize(result.systemPrompt, W - 40);
            doc.text(spLines.slice(0, 3), 20, y + 12);

            y += 28;

            // Response section
            doc.setFontSize(9);
            doc.setTextColor(...COLORS.forest);
            doc.setFont(undefined, 'bold');
            doc.text('RESPONSE', 15, y);
            y += 5;

            doc.setFont(undefined, 'normal');
            doc.setTextColor(...COLORS.darkText);
            doc.setFontSize(9);
            const respLines = doc.splitTextToSize(result.response, W - 30);
            const respBlock = respLines.slice(0, 28);
            doc.text(respBlock, 15, y);
            y += respBlock.length * 4.5 + 5;

            if (respLines.length > 28) {
                doc.setTextColor(...COLORS.mutedText);
                doc.setFontSize(8);
                doc.text(`[+ ${respLines.length - 28} more lines]`, 15, y);
                y += 6;
            }

            // Scores section (cream box)
            doc.setFillColor(...COLORS.cream);
            doc.roundedRect(15, y, W - 30, 35, 3, 3, 'F');
            y += 6;

            doc.setFontSize(9);
            doc.setTextColor(...COLORS.forest);
            doc.setFont(undefined, 'bold');
            doc.text('EVALUATION SCORES', 20, y);
            y += 7;

            doc.setFont(undefined, 'normal');
            doc.setTextColor(...COLORS.darkText);
            doc.setFontSize(8.5);
            const scoreLines = doc.splitTextToSize(result.scores, W - 40);
            doc.text(scoreLines.slice(0, 5), 20, y);

            // Footer
            addFooter(doc, pageCount, results.length + 3);
        });

        // ============================================================
        // SYNTHESIS PAGE
        // ============================================================
        y = newPage(doc);
        pageCount++;

        // Header bar
        doc.setFillColor(...COLORS.forest);
        doc.rect(0, 0, W, 18, 'F');
        doc.setFontSize(12);
        doc.setTextColor(...COLORS.white);
        doc.setFont(undefined, 'bold');
        doc.text('SYNTHESIS  —  Human Analysis', 20, 12);

        y = 28;

        // Query reminder
        doc.setFillColor(...COLORS.cream);
        doc.roundedRect(15, y, W - 30, 18, 3, 3, 'F');
        doc.setFontSize(8);
        doc.setTextColor(...COLORS.mutedText);
        doc.setFont(undefined, 'bold');
        doc.text('ORIGINAL QUERY', 20, y + 6);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(...COLORS.darkText);
        doc.setFontSize(9);
        const qLines = doc.splitTextToSize(query, W - 40);
        doc.text(qLines.slice(0, 2), 20, y + 12);

        y += 24;

        // Inferred system prompt
        doc.setFontSize(8);
        doc.setTextColor(...COLORS.mutedText);
        doc.setFont(undefined, 'bold');
        doc.text('INFERRED SYSTEM PROMPT', 15, y);
        y += 5;
        doc.setFont(undefined, 'normal');
        doc.setTextColor(...COLORS.darkText);
        doc.setFontSize(9);
        const sysLines = doc.splitTextToSize(systemPrompt, W - 30);
        doc.text(sysLines.slice(0, 3), 15, y);
        y += sysLines.slice(0, 3).length * 4.5 + 8;

        // Synthesis label
        doc.setFontSize(10);
        doc.setTextColor(...COLORS.forest);
        doc.setFont(undefined, 'bold');
        doc.text('ANALYST SYNTHESIS', 15, y);
        y += 7;

        // Orange left border on synthesis
        doc.setFillColor(...COLORS.orange);
        doc.rect(15, y - 3, 3, 30, 'F');

        doc.setFillColor(...COLORS.cream);
        doc.roundedRect(18, y - 3, W - 33, 40, 3, 3, 'F');
        doc.setFont(undefined, 'normal');
        doc.setTextColor(...COLORS.darkText);
        doc.setFontSize(10);
        const synthLines = doc.splitTextToSize(synthesis, W - 45);
        doc.text(synthLines.slice(0, 8), 23, y + 6);

        y += 48;

        // Model comparison summary table
        doc.setFontSize(9);
        doc.setTextColor(...COLORS.forest);
        doc.setFont(undefined, 'bold');
        doc.text('MODEL COMPARISON AT A GLANCE', 15, y);
        y += 6;

        // Table header
        doc.setFillColor(...COLORS.forest);
        doc.rect(15, y, W - 30, 7, 'F');
        doc.setFontSize(8);
        doc.setTextColor(...COLORS.white);
        doc.setFont(undefined, 'bold');
        doc.text('Model', 18, y + 5);
        doc.text('Tone', 75, y + 5);
        doc.text('Authority', 115, y + 5);
        doc.text('Objectivity', 155, y + 5);
        y += 7;

        results.forEach((r, i) => {
            const bg = i % 2 === 0 ? COLORS.cream : COLORS.white;
            doc.setFillColor(...bg);
            doc.rect(15, y, W - 30, 7, 'F');
            doc.setFontSize(8);
            doc.setTextColor(...COLORS.darkText);
            doc.setFont(undefined, 'normal');
            doc.text(r.model, 18, y + 5);

            // Parse scores
            const scoreText = r.scores || '';
            const toneMatch = scoreText.match(/Tone:\s*(\d+)/);
            const authMatch = scoreText.match(/Authoritativeness:\s*(\d+)/);
            const objMatch = scoreText.match(/Objectivity:\s*(\d+)/);
            const t = toneMatch ? toneMatch[1] : '-';
            const a = authMatch ? authMatch[1] : '-';
            const o = objMatch ? objMatch[1] : '-';

            doc.text(`${t}/10`, 78, y + 5);
            doc.text(`${a}/10`, 118, y + 5);
            doc.text(`${o}/10`, 160, y + 5);
            y += 7;
        });

        addFooter(doc, pageCount, results.length + 3);

        // ============================================================
        // LAST PAGE: ABOUT UPSTATE AI
        // ============================================================
        y = newPage(doc);
        pageCount++;

        // Header bar
        doc.setFillColor(...COLORS.forest);
        doc.rect(0, 0, W, 18, 'F');
        doc.setFontSize(12);
        doc.setTextColor(...COLORS.white);
        doc.setFont(undefined, 'bold');
        doc.text('ABOUT UPSTATE AI', 20, 12);

        y = 28;

        doc.setFontSize(10);
        doc.setTextColor(...COLORS.forest);
        doc.setFont(undefined, 'bold');
        doc.text('Upstate AI helps businesses in manufacturing, professional services, and logistics cut through the noise and put AI to work.', 15, y);
        y += 8;

        doc.setFont(undefined, 'normal');
        doc.setTextColor(...COLORS.darkText);
        doc.setFontSize(9);
        doc.text('We deliver practical AI implementations that create real operational value — not pilot projects that die in a slide deck.', 15, y, { maxWidth: W - 30 });

        y += 14;

        // Founder bio
        doc.setFillColor(...COLORS.cream);
        doc.roundedRect(15, y, W - 30, 22, 3, 3, 'F');
        doc.setFillColor(...COLORS.orange);
        doc.rect(15, y, 4, 22, 'F');
        doc.setFontSize(9);
        doc.setTextColor(...COLORS.forest);
        doc.setFont(undefined, 'bold');
        doc.text('Ben Nichols, Founder', 23, y + 7);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(...COLORS.darkText);
        doc.setFontSize(8.5);
        doc.text('AI professor at Syracuse University. 15 years in analytics, product, and tech.', 23, y + 13);
        doc.text('Builds AI systems that actually run in production.', 23, y + 19);

        y += 28;

        // Services grid
        doc.setFontSize(9);
        doc.setTextColor(...COLORS.forest);
        doc.setFont(undefined, 'bold');
        doc.text('OUR SERVICES', 15, y);
        y += 7;

        const services = [
            ['AI Workshop', 'Half-day interactive session'],
            ['AI Audit', 'Full operational analysis'],
            ['AI Execution', 'End-to-end project management'],
            ['AI Advisory', 'Monthly strategic check-ins']
        ];

        services.forEach((svc, i) => {
            const col = i % 2;
            const row = Math.floor(i / 2);
            const sx = 15 + col * 95;
            const sy = y + row * 22;

            doc.setFillColor(...COLORS.cream);
            doc.roundedRect(sx, sy, 88, 18, 3, 3, 'F');
            doc.setFontSize(9);
            doc.setTextColor(...COLORS.forest);
            doc.setFont(undefined, 'bold');
            doc.text(svc[0], sx + 5, sy + 7);
            doc.setFont(undefined, 'normal');
            doc.setTextColor(...COLORS.mutedText);
            doc.setFontSize(8);
            doc.text(svc[1], sx + 5, sy + 13);
        });

        y += 50;

        // Contact box
        doc.setFillColor(...COLORS.forest);
        doc.roundedRect(15, y, W - 30, 30, 3, 3, 'F');
        doc.setFontSize(10);
        doc.setTextColor(...COLORS.white);
        doc.setFont(undefined, 'bold');
        doc.text("Let's talk about your AI strategy.", W / 2, y + 10, { align: 'center' });
        doc.setFont(undefined, 'normal');
        doc.setFontSize(9);
        doc.text('ben@up-state-ai.com  |  (315) 313-5998  |  up-state-ai.com', W / 2, y + 20, { align: 'center' });

        addFooter(doc, pageCount, pageCount);

        // Auto-download
        const timestamp = new Date().toISOString().slice(0, 10);
        doc.save(`model-marshal-report-${timestamp}.pdf`);
        status.innerHTML = `PDF generated and downloaded as model-marshal-report-${timestamp}.pdf`;
    }
});