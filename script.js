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

            return await callModel('anthropic/claude-3.5-sonnet-20240620', [{ role: 'user', content: inferencePrompt }]);
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

            return await callModel('anthropic/claude-3.5-sonnet-20240620', [{ role: 'user', content: scoringPrompt }]);
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

    // Function to generate PDF
    function generatePDF(results, query, systemPrompt, synthesis) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        let yPos = 20;

        // Header
        doc.setFontSize(16);
        doc.text(`Model Marshal Report - Query: ${query}`, 20, yPos);
        yPos += 10;
        doc.setFontSize(12);
        doc.text(`Inferred System Prompt: ${systemPrompt}`, 20, yPos);
        yPos += 20;

        // Sections for each model
        doc.setFontSize(12);
        results.forEach(result => {
            doc.setFont(undefined, 'bold');
            doc.text(`${result.model}:`, 20, yPos);
            yPos += 10;
            doc.setFont(undefined, 'normal');
            doc.text(`System Prompt: ${result.systemPrompt}`, 20, yPos);
            yPos += 10;
            const responseLines = doc.splitTextToSize(result.response, 170);
            doc.text(responseLines, 20, yPos);
            yPos += responseLines.length * 7 + 10;

            doc.setFont(undefined, 'bold');
            doc.text('Scores:', 20, yPos);
            yPos += 10;
            doc.setFont(undefined, 'normal');
            const scoreLines = doc.splitTextToSize(result.scores, 170);
            doc.text(scoreLines, 20, yPos);
            yPos += scoreLines.length * 7 + 20;

            if (yPos > 270) {
                doc.addPage();
                yPos = 20;
            }
        });

        // Bottom: Ethical Synthesis
        if (yPos > 250) {
            doc.addPage();
            yPos = 20;
        }
        doc.setFont(undefined, 'bold');
        doc.setFontSize(14);
        doc.text(`Ben's Ethical Synthesis`, 20, yPos);
        yPos += 10;
        doc.setFontSize(12);
        doc.setFont(undefined, 'normal');
        const synthesisLines = doc.splitTextToSize(synthesis, 170);
        doc.text(synthesisLines, 20, yPos);

        // Auto-download
        doc.save('model-marshal-report.pdf');

        status.innerHTML = 'PDF generated and downloaded successfully!';
    }
});