// Model Marshal Script v3
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
        document.getElementById('query').value = 'How can AI improve operational efficiency?';
        document.getElementById('apiKey').value = 'YOUR_TEST_API_KEY';
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
            status.innerHTML = 'Using sample data. Toggle TEST_MODE=false to query real models.';
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
            { name: 'Gemini', id: 'google/gemini-3-flash', shortId: 'Gemini 3 Flash' },
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
                globalResults.push({ model: model.shortId, response: response });
            }

            // Trigger PDF generation after responses are collected
            generateAssessmentPDF({ name: lead.name, company: lead.company }, globalResults);
 
        } catch (e) {
            console.error('Error during model dispatch:', e);
            status.className = 'status-error';
            status.innerHTML = 'Error during model dispatch: ' + e.message;
        } finally {
            dispatchBtn.disabled = false;
            dispatchBtn.innerHTML = 'Dispatch';
        }
    });

    // PDF generation button click
    generatePdfBtn.addEventListener('click', function() {
        if (globalResults.length === 0) {
            alert('No results to generate PDF. You must dispatch first.');
            return;
        }
        generateAssessmentPDF();
    });
});