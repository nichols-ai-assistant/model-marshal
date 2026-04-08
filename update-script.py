#!/usr/bin/env python3
"""Update script.js with all required changes for Model Marshal PDF improvements"""

import re

# Read the clean script
with open('script-clean.js', 'r') as f:
    content = f.read()

# 1. Update PDF button click handler to collect userInfo
old_pdf_handler = '''    generatePdfBtn.addEventListener('click', function() {
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
    });'''

new_pdf_handler = '''    generatePdfBtn.addEventListener('click', function() {
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
    });'''

content = content.replace(old_pdf_handler, new_pdf_handler)

# 2. Update generatePDF function signature
content = content.replace(
    'function generatePDF(results, query, systemPrompt, synthesis) {',
    'function generatePDF(results, query, systemPrompt, synthesis, userInfo) {'
)

# 3. Update buildPDFHTML call
content = content.replace(
    'var pdfContainer = buildPDFHTML(results, query, synthesis);',
    'var pdfContainer = buildPDFHTML(results, query, synthesis, userInfo);'
)

# 4. Update buildPDFHTML function signature
content = content.replace(
    'function buildPDFHTML(results, query, synthesis) {',
    'function buildPDFHTML(results, query, synthesis, userInfo) {'
)

# 5. Update totalPages calculation (cover + summary + 5 models + synthesis + about = 9 pages)
content = content.replace(
    'var totalPages = results.length + 3;',
    'var totalPages = results.length + 4;  // cover + summary + models + synthesis + about'
)

# Write updated content
with open('script.js', 'w') as f:
    f.write(content)

print("✅ Updated script.js with userInfo parameter support")
print("✅ Updated totalPages calculation")
print("Next: Update cover page and add summary page")
