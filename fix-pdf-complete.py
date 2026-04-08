#!/usr/bin/env python3
"""Complete fix for Model Marshal PDF with all required changes"""

import re

# Read the file
with open('script.js', 'r') as f:
    lines = f.readlines()

# Find and update the PDF button click handler (around line 125-145)
new_lines = []
in_pdf_handler = False
handler_updated = False

for i, line in enumerate(lines):
    if 'generatePdfBtn.addEventListener' in line and not handler_updated:
        # Start of PDF handler - inject userInfo collection
        new_lines.append(line)
        new_lines.append('        var query = document.getElementById(\'query\').value;\n')
        new_lines.append('        var synthesis = document.getElementById(\'synthesis\').value;\n')
        new_lines.append('        var status = document.getElementById(\'status\');\n')
        new_lines.append('        \n')
        new_lines.append('        // Collect user info\n')
        new_lines.append('        var userInfo = {\n')
        new_lines.append('            name: document.getElementById(\'name\').value || \'\',\n')
        new_lines.append('            title: document.getElementById(\'title\').value || \'\',\n')
        new_lines.append('            company: document.getElementById(\'company\').value || \'\',\n')
        new_lines.append('            domain: document.getElementById(\'domain\').value || \'\',\n')
        new_lines.append('            email: document.getElementById(\'email\').value || \'\'\n')
        new_lines.append('        };\n')
        new_lines.append('\n')
        in_pdf_handler = True
        # Skip next 3 lines (old var declarations)
        for _ in range(3):
            i += 1
        continue
    elif in_pdf_handler and 'generatePDF(globalResults' in line:
        # Update the function call
        new_lines.append('            generatePDF(globalResults, query, \'\', synthesis, userInfo);\n')
        handler_updated = True
        in_pdf_handler = False
        continue
    elif in_pdf_handler and ('var query' in line or 'var synthesis' in line or 'var status' in line):
        # Skip these - already added above
        continue
    else:
        new_lines.append(line)

# Write back
with open('script.js', 'w') as f:
    f.writelines(new_lines)

print("✅ Step 1: Updated PDF button handler with userInfo collection")

# Now update function signatures
with open('script.js', 'r') as f:
    content = f.read()

# Update generatePDF signature
content = content.replace(
    'function generatePDF(results, query, systemPrompt, synthesis) {',
    'function generatePDF(results, query, systemPrompt, synthesis, userInfo) {'
)

# Update buildPDFHTML call inside generatePDF
content = content.replace(
    'var pdfContainer = buildPDFHTML(results, query, synthesis);',
    'var pdfContainer = buildPDFHTML(results, query, synthesis, userInfo || {});'
)

# Update buildPDFHTML signature
content = content.replace(
    'function buildPDFHTML(results, query, synthesis) {',
    'function buildPDFHTML(results, query, synthesis, userInfo) {'
)

# Update totalPages calculation (cover + summary + 5 models + synthesis + about = 9)
content = content.replace(
    'var totalPages = results.length + 3;',
    'var totalPages = results.length + 4;  // cover + summary + models + synthesis + about'
)

# Write back
with open('script.js', 'w') as f:
    f.write(content)

print("✅ Step 2: Updated function signatures")
print("✅ Step 3: Updated totalPages calculation")
print("\n🎯 Ready for cover page and summary page HTML updates")
