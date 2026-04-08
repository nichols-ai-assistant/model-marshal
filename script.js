/* ==========================================
   AI Readiness Assessment
   Scoring, navigation, results, PDF, Sheets
   ========================================== */

(function () {
    'use strict';

    // ---- CONFIG ----
    // Replace this URL after deploying the Google Apps Script web app.
    // See APPS_SCRIPT_DEPLOYMENT.md for deployment instructions.
    // Example: 'https://script.google.com/macros/d/1MHJba5dUWLQhboUI8NYkEELA4VPHK2otxjKD_pDNdIOAUgbKuZv4mjrI/userweb?v=1'
    var APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyUOSgJg3Q1bSFYY_mohK7_ENn2DtTBP9jLShoCEJCkK0OJy9O01LqiDRgKZfSbbKYY/exec';

    var TOTAL_STEPS = 7; // 6 question sections + 1 lead capture
    var TOTAL_QUESTIONS = 12;

    var DIMENSIONS = [
        { key: 'data', label: 'Data Maturity', questions: [1, 2], desc: 'How centralized, accessible, and reliable your business data is' },
        { key: 'process', label: 'Process Documentation', questions: [3, 4], desc: 'How well your workflows are captured and transferable' },
        { key: 'tech', label: 'Technology Infrastructure', questions: [5, 6], desc: 'Your cloud readiness, integrations, and automation maturity' },
        { key: 'leadership', label: 'Leadership & Strategy', questions: [7, 8], desc: 'Executive buy-in, budget allocation, and strategic clarity' },
        { key: 'workforce', label: 'Workforce Readiness', questions: [9, 10], desc: 'Your team\'s tech comfort and access to training' },
        { key: 'governance', label: 'Governance & Risk', questions: [11, 12], desc: 'Data privacy practices and AI risk awareness' }
    ];

    var TIERS = {
        explorer: {
            name: 'Explorer',
            min: 12, max: 24,
            icon: '\uD83E\uDDED', // compass
            cssClass: 'tier-explorer',
            service: 'AI Workshop',
            servicePrice: '$2,000',
            serviceSlug: 'index.html#services',
            serviceDesc: 'Cut through the hype. Understand what AI can actually do for your business. An interactive half-day session covering industry-specific use cases, a hands-on AI Opportunity Scorecard exercise, and strategic Q&A with your leadership team.',
            summary: 'You\'re at the starting line, and that\'s exactly where most businesses are right now. AI isn\'t your next move; your next move is building the foundation that makes AI possible. The good news? Every step you take here pays off whether or not you ever touch AI, because better data and documented processes make everything run smoother.',
            actions: [
                'Get your critical data out of spreadsheets and into a proper system',
                'Document your 5 most repetitive workflows',
                'Pick one person to own the "what can technology do for us?" question'
            ]
        },
        builder: {
            name: 'Builder',
            min: 25, max: 36,
            icon: '\uD83D\uDD27', // wrench
            cssClass: 'tier-builder',
            service: 'AI Audit',
            servicePrice: '$5,000',
            serviceSlug: 'index.html#services',
            serviceDesc: 'We look under the hood of your operations and hand you a prioritized roadmap with ROI estimates. A full operational analysis, data maturity evaluation, and a clear, jargon-free executive report with your highest-value AI opportunities ranked.',
            summary: 'You\'ve got pieces in place. Data exists, some processes are documented, and leadership is paying attention. The gap right now is between interest and action. This is the critical moment: the businesses that ones that move from "we should look into AI" to "here\'s our first project" in the next 12 months will create real separation from competitors.',
            actions: [
                'Run a data quality audit on one business area (customer records, production logs, or inventory)',
                'Identify your single highest-ROI AI use case: repetitive process + available data + measurable impact',
                'Start the budget conversation with leadership ($15K-$75K is a realistic range for an SMB pilot)'
            ]
        },
        accelerator: {
            name: 'Accelerator',
            min: 37, max: 48,
            icon: '\uD83D\uDE80', // rocket
            cssClass: 'tier-accelerator',
            service: 'AI Execution',
            servicePrice: '$10,000',
            serviceSlug: 'index.html#services',
            serviceDesc: 'We manage your AI build from spec to launch. Clear technical plan, honest vendor evaluation, project management through delivery. You get a project manager who actually understands the technology, so nothing gets lost in translation.',
            summary: 'Your organization is in strong shape. The data, processes, infrastructure, and leadership alignment are there. Now it\'s about execution: picking the right first project, managing change, and measuring results. You\'re ahead of most businesses in the region, and moving quickly here locks in that advantage.',
            actions: [
                'Pick your first AI project and define success criteria before you build anything',
                'Check what AI features already exist in your current software (ERP, CRM, industry tools) before buying something new',
                'Write a one-page AI governance policy: who approves use cases, who reviews AI outputs'
            ]
        },
        leader: {
            name: 'Leader',
            min: 49, max: 60,
            icon: '\u2B50', // star
            cssClass: 'tier-leader',
            service: 'AI Advisory',
            servicePrice: '$1,000/mo',
            serviceSlug: 'index.html#services',
            serviceDesc: 'Monthly strategic check-ins, on-call guidance for AI decisions, and quarterly reviews to identify your next opportunity. A dedicated AI advisor who knows your business, your stack, and your goals.',
            summary: 'You\'re in the top tier of SMB AI readiness nationally, not just regionally. You have the data infrastructure, documented processes, technology stack, leadership commitment, and governance awareness that most businesses are still working toward. Your play now is strategic: building an AI roadmap that turns this foundation into measurable competitive advantage.',
            actions: [
                'Build a 12-18 month AI roadmap mapping 3-5 initiatives to specific business outcomes',
                'Explore advanced use cases: predictive maintenance, supply chain optimization, dynamic pricing, automated QC',
                'If you have years of proprietary data (production quality, process measurements), explore fine-tuning AI models on it'
            ]
        }
    };

    // ---- DOM ----
    var btnNext = document.getElementById('btnNext');
    var validationMsg = document.getElementById('validationMsg');
    var assessmentApp = document.getElementById('assessmentApp');
    var resultsSection = document.getElementById('resultsSection');

    // ---- NAVIGATION ----
    btnNext.addEventListener('click', function () {
        // Validate all 12 questions are answered
        for (var i = 1; i <= TOTAL_QUESTIONS; i++) {
            if (!document.querySelector('input[name="q' + i + '"]:checked')) {
                validationMsg.style.display = 'block';
                validationMsg.querySelector('p').textContent = 'Please answer all 12 questions before submitting.';
                return;
            }
        }
        // Validate lead capture fields
        var name = document.getElementById('leadName').value.trim();
        var email = document.getElementById('leadEmail').value.trim();
        var company = document.getElementById('leadCompany').value.trim();
        var industry = document.getElementById('leadIndustry').value;
        var size = document.getElementById('leadSize').value;
        if (!name || !email || !company || !industry || !size) {
            validationMsg.style.display = 'block';
            validationMsg.querySelector('p').textContent = 'Please fill in all required fields.';
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            validationMsg.style.display = 'block';
            validationMsg.querySelector('p').textContent = 'Please enter a valid email address.';
            return;
        }
        validationMsg.style.display = 'none';
        submitAssessment();
    });

    // ---- SCORING ----
    function computeScores() {
        var answers = {};
        for (var i = 1; i <= TOTAL_QUESTIONS; i++) {
            var el = document.querySelector('input[name="q' + i + '"]:checked');
            answers[i] = el ? parseInt(el.value, 10) : 0;
        }

        var totalScore = 0;
        var dimensionScores = {};
        DIMENSIONS.forEach(function (dim) {
            var s = 0;
            dim.questions.forEach(function (q) { s += answers[q]; });
            dimensionScores[dim.key] = s;
            totalScore += s;
        });

        var tierKey = 'explorer';
        if (totalScore >= 49) tierKey = 'leader';
        else if (totalScore >= 37) tierKey = 'accelerator';
        else if (totalScore >= 25) tierKey = 'builder';

        // Strongest / weakest
        var strongest = DIMENSIONS[0];
        var weakest = DIMENSIONS[0];
        DIMENSIONS.forEach(function (dim) {
            if (dimensionScores[dim.key] > dimensionScores[strongest.key]) strongest = dim;
            if (dimensionScores[dim.key] < dimensionScores[weakest.key]) weakest = dim;
        });

        return {
            answers: answers,
            totalScore: totalScore,
            dimensionScores: dimensionScores,
            tierKey: tierKey,
            tier: TIERS[tierKey],
            strongest: strongest,
            weakest: weakest
        };
    }

    // ---- RESULTS DISPLAY ----
    function renderResults(scores) {
        var tier = scores.tier;

        // Score ring animation
        document.getElementById('scoreValue').textContent = scores.totalScore;
        var circumference = 2 * Math.PI * 54; // r=54
        var fraction = scores.totalScore / 60;
        setTimeout(function () {
            document.getElementById('scoreRingFill').style.strokeDashoffset = circumference * (1 - fraction);
        }, 100);

        // Tier badge
        var badge = document.getElementById('tierBadge');
        badge.className = 'tier-badge ' + tier.cssClass;
        document.getElementById('tierIcon').textContent = tier.icon;
        document.getElementById('tierName').textContent = tier.name;
        document.getElementById('tierSummary').textContent = tier.summary;

        // Dimensions
        var grid = document.getElementById('dimensionGrid');
        grid.innerHTML = '';
        DIMENSIONS.forEach(function (dim) {
            var s = scores.dimensionScores[dim.key];
            var pct = (s / 10) * 100;
            var row = document.createElement('div');
            row.className = 'dimension-row';
            row.innerHTML = '<span class="dimension-label">' + dim.label + '</span>' +
                '<div class="dimension-bar-track"><div class="dimension-bar-fill" style="width:0%"></div></div>' +
                '<span class="dimension-score">' + s + '/10</span>';
            grid.appendChild(row);
            // Animate
            setTimeout(function () {
                row.querySelector('.dimension-bar-fill').style.width = pct + '%';
            }, 200);
        });

        document.getElementById('dimensionInsight').innerHTML =
            '<strong>Your strongest dimension:</strong> ' + scores.strongest.label +
            '. <strong>Your biggest opportunity:</strong> ' + scores.weakest.label + '.';

        // Actions
        var actionList = document.getElementById('actionList');
        actionList.innerHTML = '';
        tier.actions.forEach(function (a) {
            var li = document.createElement('li');
            li.textContent = a;
            actionList.appendChild(li);
        });

        // Service CTA
        var cta = document.getElementById('serviceCta');
        cta.innerHTML =
            '<span class="service-rec-badge">Recommended for You</span>' +
            '<h3 class="service-rec-title">' + tier.service + '</h3>' +
            '<p class="service-rec-price">Starting at ' + tier.servicePrice + '</p>' +
            '<p class="service-rec-desc">' + tier.serviceDesc + '</p>' +
            '<a href="' + tier.serviceSlug + '" class="service-rec-link">Learn More About ' + tier.service + ' &rarr;</a>';

        // Show results
        assessmentApp.style.display = 'none';
        resultsSection.style.display = 'block';
        resultsSection.querySelector('.results-container').classList.add('visible');
        window.scrollTo({ top: resultsSection.offsetTop - 80, behavior: 'smooth' });
    }

    // ---- SUBMIT ----
    function submitAssessment() {
        var scores = computeScores();
        var lead = {
            name: document.getElementById('leadName').value.trim(),
            email: document.getElementById('leadEmail').value.trim(),
            company: document.getElementById('leadCompany').value.trim(),
            industry: document.getElementById('leadIndustry').value,
            companySize: document.getElementById('leadSize').value
        };

        // Build dimension scores object for submission
        var dimScores = {};
        DIMENSIONS.forEach(function (dim) {
            dimScores[dim.label] = scores.dimensionScores[dim.key];
        });

        var payload = {
            name: lead.name,
            email: lead.email,
            company: lead.company,
            industry: lead.industry,
            companySize: lead.companySize,
            totalScore: scores.totalScore,
            tier: scores.tier.name,
            recommendedService: scores.tier.service,
            servicePrice: scores.tier.servicePrice,
            strongest: scores.strongest.label,
            weakest: scores.weakest.label,
            dimensionScores: dimScores,
            answers: scores.answers,
            timestamp: new Date().toISOString()
        };

        // Render results immediately (don't block on network)
        renderResults(scores);

        // Wire up PDF button
        document.getElementById('btnDownloadPdf').addEventListener('click', function () {
            try {
                generatePdf(scores, lead);
            } catch (err) {
                console.error('PDF generation error:', err);
                alert('Failed to generate PDF: ' + err.message + '. Please try refreshing the page.');
            }
        });

        // Send to Google Sheets (fire and forget, but log errors)
        if (APPS_SCRIPT_URL && APPS_SCRIPT_URL.trim().length > 0) {
            fetch(APPS_SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            }).catch(function (err) {
                console.warn('Sheets submission error:', err);
            });
        } else {
            console.info('Apps Script URL not configured. Assessment data (for manual entry):', payload);
        }
    }

    // ---- PDF GENERATION (4 pages exactly) ----
    function generatePdf(scores, lead) {
        // Build HTML template with all 4 pages
        var pdfContainer = buildPDFHTML(scores, lead);
        var companyName = (lead.company || lead.name || 'Assessment').replace(/[^a-zA-Z0-9]+/g, '_');

        // Create processing overlay
        var overlay = document.createElement('div');
        overlay.id = 'pdf-overlay';
        overlay.style.cssText = 'position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: #1a3a2e; z-index: 10000;';
        overlay.innerHTML = '<div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; color: white; font-family: -apple-system, sans-serif;">' +
            '<div style="width: 56px; height: 56px; border: 4px solid rgba(255,105,0,0.25); border-top-color: #ff6900; border-radius: 50%; animation: pdfspin 0.8s linear infinite; margin: 0 auto 28px;"></div>' +
            '<div style="font-size: 22px; font-weight: 700; margin-bottom: 10px; letter-spacing: -0.02em;">Generating Your Report</div>' +
            '<div style="font-size: 14px; color: rgba(247,244,234,0.6);">Preparing your 4-page AI Readiness Report...</div>' +
            '</div>' +
            '<style>@keyframes pdfspin { to { transform: rotate(360deg); } }</style>';
        document.body.appendChild(overlay);

        // Give browser time to render the container and overlay
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

                    pdf.save(companyName + '_AI_Readiness_Report.pdf');
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
        return;
    }

    function buildPDFHTML(scores, lead) {
        var date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

        // Create a temporary container in the DOM (hidden)
        var container = document.createElement('div');
        container.id = 'pdf-report';
        container.style.cssText = 'position: absolute; left: 0; top: 0; width: 816px; z-index: 9999;'; // Must be visible for html2canvas to capture

        container.innerHTML = `
        <style>
            @page { margin: 0; }
            * { box-sizing: border-box; }
            .pdf-page {
                width: 816px;
                height: 1056px;
                page-break-after: always;
                page-break-inside: avoid;
                position: relative;
                background: white;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
                overflow: hidden;
            }
            .pdf-footer {
                position: absolute;
                bottom: 20px;
                left: 40px;
                right: 40px;
                font-size: 11px;
                color: #556b5e;
                border-top: 1px solid #e0e0e0;
                padding-top: 10px;
                overflow: hidden;
            }
            .pdf-footer-left { font-weight: 700; float: left; }
            .pdf-footer-right { font-weight: 500; float: right; }
        </style>

        <!-- PAGE 1: COVER -->
        <div class="pdf-page" style="background: #1a3a2e; color: white; text-align: center;">
            <div style="max-width: 600px; margin: 0 auto; padding: 120px 40px 60px 40px;">
                <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAACNgAAAWUCAYAAAAZQSkYAAAACXBIWXMAACxLAAAsSwGlPZapAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAOdEVYdFNvZnR3YXJlAEZpZ21hnrGWYwAAfvNJREFUeAHs2kFNA1EYRtH/vYGmrLAADpAAighO6ggsoAAksCChoZl5YIBv1YZ0co6Mm1sFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADwD1oBAAAAZ2l8f94t/fKx1moZr9NmuysAjmI+7HfV2nWtVJ82T621jwIAADgBgw0AAACcqXH4ul9ae66V+o0WL/1i+1AAHMU8799q1E2tVJ/GbWtX7wUAAHACvQAAAAAAAAAAgD8ZbAAAAAAAAAAAIDDYAAAAAAAAAABAYLABAAAAAAAAAIDAYAMAAAAAAAAAAIHBBgAAAAAAAAAAAoMNAAAAAAAAAAAEBhsAAAAAAAAAAAgMNgAAAAAAAAAAEBhsAAAAAAAAAAAgMNgAAAAAAAAAAEBgsAEAAAAAAAAAgMBgAwAAAAAAAAAAgcEGAAAAAAAAAAACgw0AAAAAAAAAAAQGGwAAAAAAAAAACAw2AAAAAAAAAAAQGGwAAAAAAAAAACAw2AAAAAAAAAAAQGCwAQAAAAAAAACAwGADAAAAAAAAAACBwQYAAAAAAAAAAAKDDQAAAAAAAAAABAYbAAAAAAAAAAAIDDYAAAAAAAAAABAYbAAAAAAAAAAAIDDYAAAAAAAAAABAYLABAAAAAAAAAIDAYAMAAAAAAAAAAIHBBgAAAAAAAAAAAoMNAAAAAAAAAAAEBhsAAAAAAAAAAAgMNgAAAAAAAAAAEBhsAAAAAAAAAAAgMNgAAAAAAAAAAEBgsAEAAAAAAAAAgMBgAwAAAAAAAAAAgcEGAAAAAAAAAAACgw0AAAAAAAAAAAQGGwAAAAAAAAAACAw2AAAAAAAAAAAQGGwAAAAAAAAAACAw2AAAAAAAAAAAQGCwAQAAAAAAAACAwGADAAA/7N1vchRXlj/8c7NKsujfRIx6BS2vwHgFFiswrMDiXY/dEZZXAKwAHOF2zDvwCoxXgLwC4xVYvYJRR8wzCKkq75M3JQG2QQjQn8ybn09YqIQxlqoqqzLP/d5zAAAAAAAATiFgAwAAAAAAAAAApxCwAQAAAAAAAACAUwjYAAAAAAAAAADAKQRsAAAAAAAAAADgFAI2AAAAAAAAAABwCgEbAAAAAAAAAAA4xTwAAAAAgDfK27HefVrvvzjoPjfHt08zj93jW3vpQewFAAAAMGoCNgAAAABMVt6OjVjE9WhjPWbxSf85ut87+oj+8+Er/0Eq/9EZ/uJX/pv8Vf9pt/vYO/7Y7f6ef3V/z173+Wn3/9xL33efAQAAgMESsAEAAACgei+CNNGHaT6J1N9+GZ4pwZk2LtLG777Kr3xOL0I4T7uvd6OJX/vbbewK3gAAAMAwCNgAAAAAUJV+pFMJ0+T+47NIsRmHr4x1SjFU1/vgT46b/VdHwZvS8eZpd/vn7vNO+i52AgAAALh0AjYAAAAAjF7+R2xG+yJMU7rTHAVqhhumOavyc2xG7j4i7hx3utkRuAEAAIDLJWADAAAAwOgcd6kpwZPPuy9vdp/XKwjTnNWrgZvdOArc/NRV+nbSg77jDQAAAHDOBGwAAAAAGIVXQjVf/65LzbRtdB9b3X2y1d0nkb+Mx93XP6Xv41EAAAAA50bABgAA4IrlnLsF4v2yaLyxTP1CaaR89DlS87ez/SXtv47/sr3cpL1Z7jsalKu+3ZSu7QbAiPXjn1J8HoexFUI1p0txs/v1Zv4q7nefH3df/2CMFMCbvXou3p17ry+jXU9t93sprUcz+8/o//1bpLQX7fLfx3/hy/PxPNuLleWe83EAgDoI2AAAcGlyfrbR31gcBwc6J2GCE7No9iK3L0cbzI9CAgqSjF1fuD883Fg2y+spzT5Jue0K+Gmj+/2Ndvl8vayIHv9z5MWNfLb/QUovPpdb7cl/v+z+WeyXW3vdbz0tn3Nqdrvf/FeT0tOYrz1NZUEAYGD6bjUH8XUfGMlx/awvh7xQFoT7zjb9GKkc92K1HyG1GwAT05+LL/avl+vP087Fy7l3fzbdHJ9M5/as/4PXn4+ntr/o7c/HU+ymoxD8Xvf//bVJzdPuD+2m1dWnAQDAKExnMjUAABfqd+GB3O/8+1uKvJFLgCb3Czznsdt8L6W0W3YExnFRsvv7d/udgUICDEwJlC2XsdkX8CNvds/X6zFcffgmd0X+JuefY9Y+FWobh3z4bLNN6UlUqnte7jTztRvBpLzoVtPqVnNBHsVK3BO0mablcv+3yL8PuNekmeWPncPQb+xYNte7c6TPSpAmR/e+MvD3k1SC7znv5rb9WQgeAGC4BGwAAHhnvwsODKtg+fuQgN2AXKISMusWrW6maD6LlDdHv3h1tMP2aRv5p1k7e+pYGiYBG2rSB2ty3Imj8wou3k53kN0zPmpaBGyoUbk+bQ/zze4J8EkV5+HHSugmR9o5CsCv7gjcAABcPQEbAADeauQFyxK62el3AsZ8R0iA81RCNe3hs63UNJ/n2heEUxkv0hX4I35S4B8OARtqIFhz5frxUen7eBRUT8CGGpyMe2qb2ecR7c2an9Ov6q9rc/65ybPHrmsBAK6GgA0AAK/VL9rWWLAUEuAclOMjp3Sn+lDNKUqBv438w2wWOxayro6ADWMmWDM4gjYTIGDDWJ10i2wifdGdg5fRq9MeIXhyXZvbH9LKtZ0AAOBSCNgAAPDCi1BNbrdiIgXLlyGBtcfCNpym3ynbHnzd5rwdUy/o/4Hj6OoI2DBGgjWDt9M9Pt+k70N3hAoJ2DAmJ51qjoPtQjVvchK2adO3OtsAAFwsARuAN1gsnm2lSA+jeunRbP7R7eCdLBf7OSZgNl8b1blCLcXiyy4KCw28Kj0qnW3S/KPHAceOAgzNF92treAMuuOowp20i4Nnj1KTvgh4RY58ez6/9ig4k/z37jytiftdNepmMAaPYiXupQfdwi3vpB+vuky/BfzebneN/XHwVlPc+HFeUkpP29x+q8skAMDFaAIAgEnqi5aL/Sft8vn/tDnfDYXLKAGKNvKPJay1XDx/WBZHgsk6OPjf6/0x0ncHEa45u+446u6zchyVwLLjCCjyl3EnZvGLcM2obMVh/NY/dgAXrGz8KOeOL86/c2sDyHvo7sfrZcNgCfm5pgUAOH8CNgAAE/Nq0TIbzfB6fSekvPWiKHn4bDOYjFKELo/7rJn/4hj5AN1x9LvivuMIJqmMg8pf9cGau2GhdJy6x657DH/rR3sBnLMSrMnL53fa5fPfyrmj8+/zdHRNW67/nYsDAJwPARsAgIkowZrSUULR8l0ddeMoRclyHwbVelncT7/oWHPeHEcwNXk71vNXcT9yPOm+vB6M3UZ5LLvH9GH32G4EwAd6NVijo+rFKtf/r3aYDAAA3puADQBA5V4N1hx1ZuF9lKJkuQ8VJevUj0xrn/+iuH+xHEcwDX2nk8P4pbu5HdSmjI16kr/sPgO8B8GaK3TcYdK5OADA+xOwAQCoVB8YWD7/RbDmnL1SlNRme/xKgb9d7P9YdnQ6Ti6R4j5U65WuNRtBrTYixcPyWJdORQFwBoI1A/JilOv+L/ngQJc5AIB3IGADAFCZnJ9tlDEsJTDQFTEVyy5KV5Ts22wvnj8s93kwOovF85ulwJ8jbgZXQ9AGqpH/Hhv5K11rJma7dCoyMgo4jWDNcOUc19um/cU1LQDA2QnYAABU4mXhMpXAwGZwSfJWuc8VJcfj6FjZv58i/xgK/MMgaAOjlr+Mr2PWh2sEe6dnIw7jt+45cCcA/sAY1rE4uqYt9YRyrRQAALyRgA0AQAX+ULjkSnRFyTY9EQ4YtoOD/71+dKzosDBIJ0EbgTUYhTIeqB8JleJBWDidthR385fxo242QPFqV1VjWMej1BPKtZJrWgCANxOwAQAYsZNOHAqXA3Eyy36x/6NwwPDkfPDFrJk7Vkbh5S7aAAapjISKw3gSRkJxIsXN8pwQsoFpO+6q+ouuqiMl8A4AcCoBGwCAkdKJY7i6YvJN4YBhOSr0t49Ch4VRKbtoy9goxX0YlvxlXI9ZH64xEoo/KsGrX/J/OT+FqemvT5fGQdWjBN6bX5YH+17PAQBeIWADADBCebn/9ayZ/6ITx7AJB1y90uWp7L40Pm3Eutc5gTUYjvxlfB0pfolwDsIbrXcVx/vdc8XrNkzEyfVpd+4teFmV3L+el3FfrmkBAI4I2AAAjEgJC/Sz7HM8CMahDwfY+XcV+hFq7cGTsvsyGL0Skiq7ohX34er0gYnkHIQzSnE3fxX3A6hWOS9zfVq/Mu6rbdOTxeLZVgAATJyADQDASPTFy/a5WfajdLTzzxz7y1Pu5xKusYu2LuXxLMX9g4MDjytcsvxVPCyBiYB3s909d37J2zoeQW1yPviiXSbXp1ORYyNFepiX+/fLRoYAAJgoARsAgBE4KV4aCTV2eUs44OIdhdGScE2tutfBWdPqCgWXJG/Hev4qnnQ3twLez/U4jCdCNlCHvkvkcv9+u2wfRRkJx6S0Obb7jT82jgAAEyVgAwAwcHn5/I7iZUWOwwHlcQ3O3dFYqOZHYbQJaOK+4wguVgnXlGBE6E7Ah9sQsoHxO+kSWUIWwXQdj0E2MgoAmCIBGwCAAevDNTnfDapTHtey8zM4V8ZCTcvRcSRkAxch//0oEBGl+wicDyEbGLF8+GxTl0heyutHI6OciwMA0yJgAwAwUMvF84fCNXUrOz+Xy/3ftNc+H+WYUfCfnhz5ZgDnqg/XzIRruBBCNjBCebn/dZvSE10i+aOTjSOlk2gAAEyAgA0AwACVoEBXxtwK6lfaa/c7QYVsPsTRzknHzBTlnJ4GcG5eCddsBFwMIRsYkaOuqvEg4A3KxpGjTqKuaQGA+gnYAAAMTG6bHwUFJuZ4hv3h4bPN4J0tFs+2dHuariYWPwVwLvJ2rMcsuvMQwQcunJANjICuqpxV6SRq4wgAMAUCNgAAA2PEzVTl9SaVguTBF8GZlQJuinQ/mK5Zo4MNnIM+XHNoLBSXSsgGBqqM+2kX+09s/OCd6M4KAEyAgA0AAAxIu2wfHY074ixKAbf7tB5MUkrxNKVruwF8uIN4GMI1XL4SsvmxD3gBg1DCNf24n4jNgHd1HLI5ODhwTgEAVEnABgAABqa0YReyebv+Psp2vU9Zzkn3GjgH+au4HyluBlyN6yVkE8CVK51H2vb5L7qq8kG6a7RZk4VsAIAqCdgAAMAACdmcLh8+2yz3UTBpTSx+CuCD5C+jvNdsB1ytzT7oBVyZo3BNeiLAzvnI60I2AECNBGwAAGCghGzerG3Sw4DZX3YCeG/5y/g6UtwNGIbt48AXcMmEa7gYRyGb8vwKAIBKCNgAAMCACdn8mdFQFCnF05TSXgDvJf+9ex0VrmFouudk/kdsBnBpcs7rwjVcnKPnl5ANAFALARsAABi4PmSTD74IjnbXGg1FJ7fxcwDvpQ/XzOJJd3M9YGhy/Ji3LfTDZSjhmtweCNdwsbrnl5ANAFALARsAABiBdtk+Ojx8thkT1y4b3XzoNWm5E8D7mUUZs7cRMEzrcRhP8rYAGFy0dnlwP+d8PeCi5djIbfNjCXUFAMCICdgAAMBINKn58eDgYLIF8NwHjPJWQDH7y04A7yx/GSWouBkwbBtxGEK1cIGOxtA6t+bylDBX97z7MQAARkzABgAARiOvz2btj1NtrZ2bdD+gk1I8TSntBfBO8j/iZqS4GzAO2/m/YjuAc1fCNcauchVyxGZe7ruuAwBGS8AGAADGZKKttReLZ1s5h/b19HIbPwfwTvLfY6N7D7Ggxbg0cSdvG2cG52mxeH5TuIar1ObYXh7sC1ACAKMkYAMAACNTWmu3y4NJLZI2kb4IONak5U4A76bpwzUbAeOyHofxMIBzUTphpsiOKa5ek+5MefwxADBeAjYAADBKeWsqu/7y4bPN0ko84MTsLzsBnFn+Mr6OFDcDxmnTqCj4cKUDZtumJ1GCa3DlTsYfT6szKwAwfgI2AAAwVk3cPzx8thmVa1Ojew0vpBRPU0p7AZxJPxoqxYOAMevOefKXRkXCh+g7YGadzBiQMv54+VxHJQBgVARsAABgxJomPSyt3qNSRz9b3go4ltv4OYCzm8WTgBqkmNR4TDhPefn8jnNqhihH3JxKZ1YAoA4CNgAAMGb9rr9U7a6/dhFbAa9oIz8O4Ez60VChWwHVMCoK3kMJrLc53w0YqibdOTg40KUMABgFARsAABi53C04Vbvrr0nGQ/E78/na0wDe6ng01N2AmjRxJ28LjcFZ5ZzX2zbpZMbA5fX5LBsVBQCMgoANAADUoIn7te36y4fPNkuHnoBjKWInpbQXwNvN4k7363pAXdbjMCzCwlm1z+84n2YMcs7Xl4fP7gYAwMAJ2AAAQCXKrr+ySzUq0aZG9xp+J+f4NYC3yl/24/W2Auq0mf8RmwGcarF4ttVmY9UYkWRUFAAwfPMAAACqUHb95UU/Kupu1CDl0sFmelLsphxPc6S9yO2/cvf1a/9Ym9e7InT30fwtRS6jYNZzjqoL0m3kxwG8Xeq710C9cjzM2/FpehC6msFr5Pxso23TnUmeS3+4vVTOv3PsnpyPd3foXm5e30Xx5Jy8jbQ+S/G37rfWu/P3DZ2D3s/xqKhPAwBgoARsAACgJke7/h6vrq4+jRHrdy7mdiOmYa/N8UNKaWc2W/3gEUgHB/97vWlWNnLOm12R/5NuXWUzKjGfr436eQ2XIX/Zh2s2gouyd/zRByLf8GfWu4XV0lFuI7goG7GIekLFcM7aZdO9F+SN4G32ygjS3LY/52a2O5u1T1O6thvnpObz8ovSj4o62N+era49CACAARKwAQCAysyb9n736UaM2CwWm7VPtC3F/GXO91ZWru3EOVpd/Y8SQikffbeXMjZssdi/nnJspVn6bKy7acv99aHhI6hd/nuUblZbwYdL3eto7l9Lf+2DNPP+9t67dkzJ27EeB93j0hx3M0jxWUR/2wiMD5Xj6+7+faCLDfxeXjy/2UbeCl7r+Bz85+7mznmfh//RH8/Li8PDZ5vdd3Fz1sRntXeffG9NupPzs8fnGXYCADgvAjYAAFCZsjNy7Lv+UtN8Xm1H+26htm3z7Ysu6L/43x2FUnaOP/qdtCnNt5omPh9T2KZbgPg1gNPNdK95b6l/jewXXEuY5rxCG8d/z8kCa9G/N/fBm0W/sLrZfZTw42bwrtZ1sYE/a1O+bzTU73Xnw0+XbfvTfL724KoD28fXAOWjH+W1WKTtsZ2XX7y8npepbBq5FQAAA5MCgNdaLJ5tpUgPo3rp0Wz+0e3gnSwX+5MoV83ma6M6V1gu939TlIITaa+ZtZ+Odddfra+zpbifmvbWUB6XsoO272zTpM8j+nEmg9XmfOOyQkmvszh49qi7n74IeEWOfHs+v/YoBqDvXjOL34KzK6GaHD/FSjy66i4o/ePXxGb38YWwzTvZ6x6/j4fWxaYsmrfL5Hjkj3a7a+yP4wLl5fM73TnT3aB3UR0jL8Ji8fxmE/lrY6ReuurzfwCA16m75zoAAExWXm+XzZ0Yody3Ta9PbvMPqVm9MaTQUylYz1evbTWz/GkJCvRjUAZKcR3e4qh7DW+3273W3YuV+Gv6Lm6kfw5jxFD679hN38ej8j3FMj6OHLf775W3OeliA5PXB7uEa46lR9357cfNfG00AY35/KPH5fst33e5bghilpJzGwBgcARsAAC4GKlfwNotuwZT3wI7PTr5OPm9/vcHvKA/fnnrcIRhlW5h4HpUpnSuma2sbV91S/o3KaGf0oVjNlv7uARt0nHb+qEY2vcDQ9N3P4nYCt4s9eccJVDzcfou7g6t48mrXoRtuu+1+55vHY+v4k1yfN2P3IKJG2u4/jyVc8YSUCmdmsfaybM/Lz8KwHfn5elxTFjp5lM6jAcAwIDMAwAAPkQJyOS001V0f83NbHc2a5++TzEz57y+WOxfT6lZ725vzlJ80hXUStDCgskHON71txMj0j2PPktR0YSoEjTrx0INM1zzR8fjbh6VcFZ5/gyhTX33mvBzXLGy0BEDCzCUbk9tSk+icv1i2XztRvBmute82VE45V76bpwhle77Lourj/M/+tfiO8ZHvdZJF5u7MRDH58KDG7c7lZG6JZgw1nDF++rPCSJvxVR159ttm2/X1PHw+Dl8qx9hX67pJjoOO0Vzv7sWeDyWaykAoH462AAA8G5K8TLHt2UeejP76K+l40XZIThb/cuD0tb6fYvZpWDWj6vp/o6VlbXtspg6m6/9ddkuPo22/UYHi/czxl1/KeWNqEhXEL43xkWecjyW47Ac61d9/LWOf3gj3Wve4KRjzXf9x06MXPkZ+vFR3c8URkf9mS42TFzbpIcxUd256r1yTVrrONESfm+ajz5tc/ttTFJebxf7RgECAIMhYAMAwFnslcJlWWg/Kl6ubZcC5mXsIltd/Y+nJbxzNI/+o78ej6+ZdKvsd1V2PJYOQTEWNe3OTLF73BFmtE6CNjnSrasa6Vbrggmci1ncDF5Vzk2+qSVY80d90KaMjup+xojhjrm6AiddbGBy+jD9FLubdOelZTNGd554Nyp3tBnlL9tXeT5+pVLz9aiuZwGAqgnYAADwRqVrRR+qma/9tRQur3qRuxQW+x1887VbRzPp8+1JFhjfVVdwH8uuv5yfbURFY8FK95qoROkuVQJ2l33c6V4Fb/V1cKR0rVmJT9M/40FUrv8Zl/FpeI18KTsWmKZ0NBJ2UkpH1dLVpWzGiAkp5+NNk2+kFJP6uXWxAQCGRMAGAIA/2usLlrP8celaMdTOEWXkTgnbXMWC/yiNZdffoq7dt7NZfQufL9vUX054qHve/hzAa+Uv+9FQG8HLrjUPpnM+kP47dtM/+7FR1YQ5P9B6/kdsBkzIFLvXLNv4pnRUvYxuqkNUroOb2dr0RkbpYgMADISADQAAr0iPmtlHHx8VLK/txkgI2pzFOHb9LVNTTdG07Cwd03H0Lo7a1F+7W4J4F33MtbozwJul+CLY7RaXb0yha82bpO/ibiz7sVG7MXU5JtfJg2mbWPeavTISanV1bbKv968qI6Pairplvp0uNgDAMAjYAADQj2ApxcrZ/KPbY94JeBK0OS40TnJH46lGsOsvtcuNqEWu/zlYAkSvHHMXYqhdtOCq5b/3HQs2Y8pyPO5HQn0/tVEZf1a62cQybvT3ybRt5m1dnZiGSXWvSbHbzPLkRkK9TQm895tMpqK7ng0AgCsmYAMAMG17pSBXRkHVVKw87qzxaW7zD8ErRrDrL6VqOtjkSLsxERfVzSbpXgNvNo9p7+JOcS99H7fSA4HaE/3IqO4+mfzIqEU/Og2qN5nuNSVc0+QbtXaG/FBlk8l0QjZ5vQ+WAQBcIQEbAICJ6hauH5dxUKUgFxUqBdj56rUtY6P+YOBdbPJUduFW6GU3m/bbOCe5jZ8CeL0cn8dUlXBNGYvEa/X3zZRDNjl0OKB6i8Xzm5PoXiNccyZTCtk0kYzHBACulIANAMD07C3b+KaZr90a8ziosyrFxr4oqxPGsbzeHj7fCi5cSvl6TNDKyl+2y2tMnMOYtjZlYwDgNfI/+tFQGzFFOW4L17xdfx9191VM0/rxMQLVaiLXHyQTrnknUwnZ5IjNw8NnmwEAcEUEbAAApuTF7Pq1BzEhpShbxmC1OU97ZMKJmZ3dlyHntDHkbkEXqbzGlNeaD+selfZWVq7tBPBnOaa5e7uEa76PR8GZ9PfVdEM2NwMqlfOzjRIyiJoJ17yXErKZwjVvE8lrPABwZQRsAAAmIrf5h6b56NMpFym7xfq7OdKtOIfOGqOWY2Oou/6aJv0tqpHXF4v9SXaxKfpgW78wEu/VhSaF7jVwis2YGuGa9zLZkM1UQ2hMQrts7kTllsvFLeGa91Ouec9zZOsgpfTFVDcyAABXT8AGAGACyi62+eq1rSmMhHqb+fyjxx/eWWP8ZilVX5gfgqnfz2VhJDUflRFtj+Md5TZ+CuBPJjkeKsU94Zr3d3zffRPTYkwU9Up5MypWrl1XV/9D0PoDzOfX7r5vyH0cjD0GAK6OgA0AQOVKgbLsYgteOOmsMeWQTWkrP8Rdf22b/xUVObqfn23EhJVgXzNfu/WuO2nbpIMNvMG0xiKUcM13cTf4IOmf8aDclzEtmwGVWSyebZVulFGt9Mi164cr59+pyVV3bk1NfB4AAFdAwAYAoGI58m0FytcTsoloF/vbwYXLy/QwiJWVv2yXwN/Z/nTa6167dgJ4nc9iKlJ8K1xzfo7vyx9iKvKEjhUmo4lU7/iz7rqsma1OrdvWhSnXu8u23mCljQwAwFURsAEAqFQJ18zn1x4FbzT5kE1qvg4uXCn+Lg+EmYoS+DtLyCaF7jXwOvnvsdG9qFyPadiNuXDNuVuJ8n40ldfYzbwdg+vWB++rhAlyxZ2ZynWZkcbna3V17UGK2IlKtYvYCgCASyZgAwBQoWUb3wjXnM20QzZ5/fDw2WZw8Zp05+DgYCqL4qc6S8gmt/FTAH82n0y4Zi9W4kZ6UO9oi6vS36fLqHpsyO8sJzZSjaotl/WGa9oc35brsuDcpVm+HZW+5qeUdCoDAC6dgA0AQGXKwnXZqRac2YuQzVQWm17RpGZQbeZTtUGnvD6btT8K2Rw5Ctm0377p3zfR7ATwZzk+jynI8U16MN0Rjhct/Xd333b3cUzBdDo+MQHVjofqzv/n84/uBhei5lFRxkQBAFdBwAYAoCIlXFMWroN3VgqP3f13K6bnZs55OOMTcq435JRjY9a0vxgXdWRl5S/buc0//PnfpL20umpEFLxOmkRY4FH6Ph4FF6q/j3M8jtpNJZRG9WoeD9Vdi9wzGupi9RtwKt3I0B4mncoAgEslYAMAUIkyW1245sN0999OGa8Vk5LXl8v9wRQlczOB4noT95eL5w/ttoyYraxtpxS/C9PkvPw5gD/J27E+gW4cu7FS5y77QVqNaseGvGKjP3Zg5GodD1WuYY02vhxt24+Kqk5qBCkBgMslYAMAUIMUu8ez1flAZXffaaNrapSiGczs+lmeykiQvNW26cli8WwrJqzsVk7NRzde3VGbsvFQ8FqLCXSvyXHPaKjL093Xe93rb/3nj4s6gwlMTVNliMA17OUpm0lKoCkqkyNdH1RHVgCgegI2AAAVaJp8o4w4Cs7FfH7tbq0ttN9gOGOi5hO633NspEgPl8v936YctCkhm/IaFsddFJoQsIE32IyapXhsNNTlS9/1Y6J2ombd+23AyKXIm1Gd9Mg17OVa5lxhl7i8vljsT2GEJgAwEAI2AAAj1/Yz6xUmz1NZ8K+1hfbrDacoOcnnsqBN/7h3r2W3ult7aXX1aQCv80nUbD61EY0Dsqy8i03WwYZxy4fPNrtP1XXoaGatkYCXrNYuNk2kwYw8BgDqJ2ADADBipTjWFcnuBueuFB+jyh1+rzeoouS0uge99ErQZrl4/jDnZxsxIeWYa3N7K4A32Yh6PTIa6uqk/+7u+xT1jsdMlYfTqF4bubrwQLmOtUnkarSRqnu9T00MZuQxAFA/ARsAgPHaM7P+YjXztQeTCXuk+DwGIi/zzzFl/SiLvNUu02/tYv9J6WozmBFeF6wPtgF/krdjvXttqHf8wUroYnDV5nE3jkf1VWijP4ZgpFJqqguJ1TmqaBzm84/KaMCqXu9zd440leslAODqCdgAAIxUm/O3dv1drImNitoYSseUFNmIoGM5YrN0tWmXz/+n72pzNCIAmJoD3Wu4WN1jsFd1F5u6jyEqVkID5XwwapJiV6j6inW1hKjN8v82AwDgEgjYAACM0VFR8m5w4WqdU/867eEwxkS1KQnYvFbe6u6bJ1MdIQWT1lQcDtC9Zjjm8SBqNau4AxR1W+xX99zNutdcub5Ta2XaPNsMAIBLIGADADBCipKX63gUV61jE15q0iDaz8/nawI2p3l1hNTy+S9HI6SEbaBytYYDdK8ZkL6LTa2h4taIKMapzbm61//ZbBqbF4asdGqtbRNJjnYjAAAugYANAMDIlELYfH7tUXBp+lFcNbbR/pO8GQNQY8H3ouRu0eVohFQ66mqzeD6ILkTAOcuVdrBJ8UMwLKnajkKDCBHDu8rN7LOoSM7tT8YcD0Nu25+iIinVdawAAMM1DwAARmWpe82VKG202+Xzr7ubNe+A3iidUIZQ9M45/9xVSTeDd5C32oit5XJ/N3Laadr0bVpd1Q0I6vC3qM9u+k6YcmjKY5K/6jvZ1HW+k+OvASOUUr7ePX/rkdLjeE/d9UH3urS/HovYWKbYSG33dUrdR9O/R6bIG+XrHPnl69cYA6rp953dUn75dY602/2Me9Eu/93dIXu5SXuzk38/795X3+E6rlm59qi7vr0f1cjrQ7mWBQDqJmADADAipavHysq1neDSla4qy8Nn33Y37kTFlsvY7D49iivWds/1JqLq+/rCnIyQasoYqedP29x+W1rxKzbDiKVYr2qBtUhR1c75qqT4tnu+1fUenHSwYXxKoKQ7l9uIirytE2sfojk83Fg2y+spzT7pfmM9pbje/f5Gd1+s91fER/+U8bYn/9XLX3MFb5Z/CAV1P9HG774qP2NK/Ue5B9qTu2HZ/bPY7wM6x6Gcve5++7VJzdPuD+3+MXhfrm/bxf5O97dtRi2WbRmpthsAABdIwAYAYETayEYpXKEpdLFJOV2PAShBsq5AXN8O+kv2coRU9/qx2H/cvYb8ZMQcjFCNI6Laqw9z8gaL7rGZVRdydT7B+Cz2r/dBikqU8VC/+/rg4PpJkCbl9nqOuN6HaJqSEUllhtHxfxe8i+6c4UUoJ6WbbQnlNLkP36SUnnZ36G5u25+b7nabovu6noBN2842AgDgggnYAACMRYrd+czC+FU66mLzfz9Ear6OSqUh7fDObdX39WXrSus3u8WKm8vl/p1+hFR3/yYdsWAsagsH7Kbvwwi7gUr/Hbv5q74DwEbUQ8CG0Wlzripg06QmL5cH91Pkzb4jTbTrJ0EaGZrLUcL33afr0TQ3+/hSbXd8k3QrAwAuXBMAAIzDMr4Nrlwb6XFULMcwOtgUtd/XV+ZkhFRKT5bL/d+WB/+3nfOzjQAGKW9XGAwwHmr4KnyMumNpI2BMUl3P2RL2jtxuH4c8hN44dynlwVzLAgD1ErABABiJZiULGwxAGV2UInaiWnl9KGGL+u/rAShhm6a53y7Tb+1i/8li8WwrgGHZr3IR0jnN8HmM4Iql1OjGAe8g57QRAAAXTMAGAGAESsggpWu7wSDktq175/2yHVAXm/xDcClyxGaK9LDvarN4/lBXGxiIeYVdN+bGQw1ejY/RgY4ZjEuurIMNXLyyWSR7rQcALpSADQDACAgZDEuzcu1RVKxtZxsxELPZWtlBvxdcnpMRUrraABfjaXrgdX3o+scoVRayaQRsGJksYAPvbt9rPQBwoQRsAABGYDYzJmdIUkp7VY8uGtBu2XJfR87fBlfi1a42efn8jq42wDnQvWYscvwawJU4ODgYTEdJGJUBdWMFAOokYAMAMHApxVPjoYan5jFROdqNGJBmvvYgUuwGVyfHRpvz3dLVxvgo4AMJbYxHbWEoXQ0YjZW09HyF97CMxrEDAFwoARsAgIHLbfwcDE6zkh5HpVJqPokBKV1sck7fBANxND6qD9ocPtsM4GK1lY0IqW3sUM1qC7cmARvGYzmgjpIwJsloNQDgggnYAAAMXBu52iDHmPVdhartqpIGtwA1n3/0uOqxXKOUt9qUnrSL/SeCNsCZtbEXjMNCGAquipAAvKfU/C0AAC6QgA0AwMDN52sWNwYqL3Ol3YXy+hBHAKVZvt19sjA7MDliswRtlsv93xaLZ1sBcIr0vdDGWKT/Np4Rrk7WcQkAAAZIwAYAYMBSiqdlPE4wSClyvYuEh7PBFfVL16BlG/eCYcqxkSI9FLQBTrEbjM1u1CIL6TIeOQ+voySMQXeNvhEAABdIwAYAYMDatv1XMFjLmO9ErZrDjRig1dW1B21uvw2G6zhoY3QUnJOmqlCKgANXyfOP0WiaZMwNvI8UwmkAwIUSsAEAGLBukdoYhQFbWVnZjUotoxlsYXI+v3a3dHcKBu1kdFS72P9xiCPHgCuQBBxGaDcAYCRyFrABAC6WgA0AwIA1qRUiGLB+fFeqc+EptcNtS1/u99TkW7Xe97XJETfbZfptuXj+UNAGAODtsi4cAAAwSAI2AAADtsiNnd4Dl3OlXYZSHnRRP6Vru8vl4lYY9zAieatdNr8sD/a3Azi7RUVhwjb+HYxNPeNKW+cMjIqADbyX4W4UAQDqIGADADBg8/maDjZD17aVLhYOvzC5uvofT9ucbwUjkte7q9D7y+X+b7rZwASl+J+Aq7IqYANQv2FvFAEAxk/ABgBgwPoRRAxaqnVMUUr/GSOwsnJtJ0e+HYxLjo0yNiovn98J4HRrQgFwHtIDoyUZke5cKQAAgMERsAEAGK7dYPhytvB5xebza4+WbXwTjE6b8912sf9ENxt4s/SgooBNjr8GY/O3AAAAAHoCNgAA8AFyU2eXoZyXo1oEXV1deyBkM045YrNt05ODg4PrAbzJbtSgiVF0R6NKuwEAAAAfSMAGAGCgkoWAkWiqDNg0qRndImgJ2RgXNVI5NmZN+8vyYH87gD9LlXSxybEecBVqHekJAADApRKwAQCADzDLrRFRA1LGRbU53+huelzGqIn7efn8TgC/l+PXqIOAzfhsRA3a+HcAAADABxKwAQAAqrKycm2nmeVP7VYfpzbnu8vF84cBvFRLBxsBmzHaiBo08TQAAADgAwnYAAAA1Unp2m7T5BspWVAbp7zVLvZ/zDlbjIciVxMYXM/bQjZjUdVjJXQLAADAORCwAQAAqtSHbGZrn7Y53wtGJ0fczO3BEyEbiLrCAQeVdESZgkVcj1rUE1IDAADgCgnYAAAAVVtZuXY3R75t9/r45Jyv5+XzHwOmblFRN65ZRaGN+tUTcJzraMfIOG8FAIBBErABABioHHZ4j8EyeZzGYD6/9qiMjMpt/iEYle61cHO5eP4wYMLSf/cLrXtRgyxgMyKbUYe99KCS4wcAAIArJWADAAAfILV1jq/JkXajMmVk1Hz12pZuNmOUt/Jy/37AlNXyupXjk2Acanmsku41AAAAnA8BGwCA4doIhi+lKgM2NdPNZpzaHNt5+fxOwFTl+DXqoIPNeNTyWNVy7DAtui4BAMAACdgAAAxYzs82gkHLudIgVM7/joqddLNpZvnjFLETjEKb893Dw2ebAdNUSxeO9fylkM3QHT9GtYSIdwJGJmUBGwAAGCIBGwCAITuc6Y4ycE2T/hZVypMo6pegTTNfu5Ej3TI2ahya1PwofMgk5YpCAik2g2Gr6TGaGxHF+LRt/lcAAACDI2ADADBgy2Zph/fA5VTN7u7fy2lSu2bn848ez2ZrH+fItwVthi6v57aEbLIAIpOSvu9DArW8Nn8eDF0tj9FueuB9HQAAgPMhYAMAMGCp1vFDlegX+HOdYy5yM40ONn80n197JGgzfN2xdz3a53cCpqeWThzX83alAdUKHD82m1GHnYARSs5DAQBgkARsAACGLDWVjh+qxGK/2g5DOU+7qC9oM3xtju3Dw2ebAVOS4ueow3os42YwTAcVPTa5mmOGicnOPwEAYJAEbAAABi1vBoPVli4alZrn2SQ72PyRoM2wNU16aFQUE7MTtWjji2CYmopGeK3qYMNYNc7FAQBggARsAACGbcPi8YA1s0+iVisru8ELL4M26VYybmI4cmy0i/3tgIlI3/WvP7Usum4aEzU8+e+x0b221tLB5ml6IBzLOLVt2g0AAGBwBGwAAAZuUfEYotFL9XYYSinZNfsa8/lHj5v52o025xu5zT8EVy+lOzk/2wiYilRRyG8RAnJDM6toPFSKnwJGamVlWeu5+F5K8TQAAGCkBGwAJi7n5V8DGLQmUj0LHRXpF/RzbESFFL3fbmXl2s589dpWM8sfHwdtBJKuULts7gRMRY6foxY5vg6Gpp7HpI3HASOV0rXdqPP8cq+ZrX06m6+lZbv4tHSH7C6s7qWIx8ddIp1TAwAwaAI2ABPXpOY/g3dilzyXLaWodwzRiC2XsRm1ygrbZ1UWP46DNt0CQb4dySiKq5G3vD8zGSvxKOqxnr+MrWAQjh+LjajDbvpeYJiRS1Wek78Ygby6+h9PS3fI2cq1u8187VbpEjmbr/21mX30175bZDm3Fr4BAGBg5gHApOV6CqhQre443SxFSCN7hqWJ9EWOOuUcvwbv5HiX8aPycXj4bDPl2EpN+iK4NO2iXxi+G1C59CD28lf9QuNm1CBF6UD1KLh6R49FHYyHogI5p6cp8kbUZvl/m92vb+wwdXzdu/O6f1euiw8P/7+NlGbd9XFsdOfcG22k9VmKv3X/ug/u5PRKnavSjqMAAFwdARuAyUvrwbtZdAWaFHCp2sPnW92nB8EglE4Zbd0dbHaD91bGR3Wfdrrnyd3S6ahbJLijuH8JUvN1t+jyQBiRiSjhgc2ow0bpnJK+F7K5SpV1rykVT+fNjF7Ky3915zdRmzbPNiPeb4Tb8Xme7lQAAFwZI6IAJi+vn7TnBYarq6t+HgxG1eOhOm3KitbnoB8fNb/2aDZb+7hvc9/mH4yQukh5/TiMCPU7GhNVT5gsxZ28Ha5JrlJd3Wt20gPvt4xfTqnOc/Lk2hYAgPESsAGgs6+Y/Q6WSRcCLt/JmKhgEMp4qKjYfL4mYHPOSleb+eq1rRK2yZFvpze0vefDCCMyFWVMVNS1g38jFrEdXIn8ZR+u2YhatPFDQAXadlbrOflG6QgaAAAwQgI2AFTfieG8JWM+uCLtYt/C0wCUYnCuZyzHa6Q9I3YuVulq08zXbjSzXDrb3NPV5vwIIzIpKe5FTXJ8nbedZ1+2/Pd+/G1N55i7sfp+o2dgaFZWVnajUu1huhkAADBCAjYARMrpenBmOTWfBFyF1HwdXLl22dQzQuE1UhgPdVnKCKmVlWt3fzdCig9mTBRTkb7rO2HVFIhcj8N4GFyuWd+9pqZg4s5xhycYvT70XmkQW9dBAADGSsAGgMjRbgRnllLeCLgSef3w8NlmcGWOWpnnrahYzvFrcOlORkiVrjZGSH0YCzZMSopvoy6b+b+Miros+cvY6j5tRU1WKuvsxOTlZf45KnTUddCYKAAAxkfABuCNmsnsektp9llwdjl0/OHKzFKqunvK4LXNF1G5Ji13gitTutq8OkKq72pjhNQ7yaEzHxMyjwdRVxebUqm6Y1TUxTseDVXXeWXqu9fsBlSk5u6S7aKygB8AAJMgYAPwBrPcTqitdF7PBwcWo84g6x7CFSs7/XSxuRplh2Vbefea3qwxImog+rDN6rWtMkIqR7qVIh4HZ6DbF9PRj8Kpr4uNUVGXYRY/dr9uRF10r6E6bUr1npsbgQwAwAgJ2ADQa6PdDN6qzVkQiSuni80VadPXkSvfUZ9it4Q6gsGZzz963MzXbp2MkNLV5nRN1sWGCamxi00ZHfJV3A8uRP6y71xT2+vkbvrOeEXqM5+vlYBNpRvAhKIBABgfARuAN5lPa+EqNfF58Fa5MU6Lq6eLzeXru9fk2I7K5bb9NRi0kxFSpatNm/MNI6TeoEmfBExEpV1siu38VVQ/mvGy5S9jq3u+3I3aZN1rqFNKaS9FVNvFxuYRAADGRsAGgF5ZsM85rwenSpE3AwZg1jR2dV+idtlMo/Cb0mhGEJX3rBJ8iglbWbm283KEVL7dLb7sBMe8XzMxdXaxKR7kL6vrtHJl8t9jo7ugqfEccjd9H48CKpVzvSF4m0cAABgbARuAN1qrtAXvm7WHz7eCN8pHRR8hJAYh53x9ebBffUeVIciL5ze7X7diAmaz8QQ0lsuDzdw2PwqHHildbZr52o1+hFTpalPtKIEz2/DcYEoq7mKz3v1cP+btykc0XoI+XDOLJ1Hj9YzuNVSujfGE4N+HLjYAAIyJgA3AG5Q2vDExxkSdrk2NFvUMS5PuTL2Dx2VoU55Gt6AUu2X8UIxEivi8BM2ifa4g/4p+hNTqta1mlj9tc7437fFR+wI2TEu9XWw24jCeCNm8v1fCNRtRH91rqN58vlZGRFVbo9LFBgCAMRGwATjNxBalFDXeIhk3wdDk9bxMD4MLk5fP73QvjhsxBTntxJik3I8MaXNs6+b0ZyVos7Jy7W4ZHzXZoM2yNVaGSem72ES1nTyEbN5T5eGacs1+O6ByZQNYingaFdPFBgCAsRCwATjd5LrYNJFuBn+yWDzbmswiO6NSgnHCBRejdAdqc74bE9Hm9ocYib5zU46X4Ykm7guIvlkJ2jRNvnE8Omoy2na2ETAx6Z99F5vdqJOQzTuqPlwT8Sh9N57xlvAhctv+FBVzXQsAwFgI2ACcIue0G1OT0hc5ZyMV/qCJZDwUw9XE/YODA50azlF5HWzb9CQmI+2trFzbiZFYLmPzj7/XpOZHI9Pe7JXRUR/nSI9jCpJFeCaq7o4eQjZnNIFwTcRKtR2b4E+alQmcv/UjkNWjxqp0f3U9BgBMgYANwGna9t8xOd2i8sKuoVflw2ebZTdVwIDNZu2PipHnqJ3QaKgogaLlzzEiKZrP/vy7R6EoRd3T9UGb+Ue3cuTb1Y+NSuk/AybouKNHzR2rSsjml/wP5+dv0t83s/glag7XpLiXHkxw/CGTVc7h6h/52V3PluswRifngy9K99fXbYQAAKiNgA3AKVLkqmdcv1FqvrZQ/1I2C5wxyLGRl89/DD5YXu5/3eaYVtAwjWxHbMqbr/397jgQsjmb+fzaozI2KkVUuxu6O4/bCJiqlf59rOZxt+vda/6T/GU4T/+D7j75utw3Ue6jeu2m7+JuwNRMYNxnuQ4z+nVcDg7+93q7bB+V26/fCAEAUBcBG4BT5CbVXJQ+hV1DJxaLZ1u61zAW5bmal/v3g/fWFwdzPIhJSXuz2dpoQhb9OLTTugsJ2ZxZ2QndzNdu5VoXa1LVi8twqvSgD9fUPz4nxd38VTzM2473ch+U+6K7T+o/j6l7DBq8URt9h7LqGf06HuX6edbMXxmt/IaNEAAAFRGwAThF286m2cEmjnYNKWiUxUfdaxiX/thdCsi9j/KaN5vNp9gF6HH3WjeaQOksFptv/UNCNu9kvnptK1W4YJOzBXemLf0zHnSvh9V2qXrFVj8yans6ox3/qB8JddiPhNqK2qX49ngMGkzOysq1nfrHRBV5PS/Tw2DQXgnXvHrOvaEjNgBQOwEbgFOsrKzsxoRNvaDRhxTydAv1jFeZfV5moAdnVoIYJZAxxWO+ze2oupfkZna2tuNCNu8kzXLpBjDRzn1QsdW+08du1G8jDuO3qY2MOu5ac/94JNRG1G835kZDMXETGBNVHHVntXFkqEq94TXhmt5yuX8zAAAqJmADcIp+R/8kdge9XiloLA/2t2OC+sX2nO8GjFSZgS5kczZTDteU97h+J+yIpHdpOy5kc2ZlXFR3MHwbVUl2zzJ5/aioKY3TORoZVYI2W1G5V7rWTOd6bSVuHI8/g8lq5muTGWdr48gwlcek1BsiXt8tMuV0PQAAKiZgA/AWOafJjonqNenO1BYmSzvbfrEdRk7I5u0mHa4pctqJEcmHzzYj3nHsj5DNmS3zrLJRMtrTQ9GP00lRWYDuVBvdz/swf9V9VDg2Kv89Nrqf7cmEutYcSXEvPZju5hc4UTaC1Tja803aZX5wcHAgsDEQpavQcbjmjVITZ+s4CgAwUgI2AG+R8vJfMWnTm33dFQweGg1FLfqQjdbarzX5cE2nmbX3YkTanN+vuF5CNsvml8XiuXblp1hdXX065c59ULP0Xd/lZCemZasfG1VJ0ObFOKhZ/NZ9uRlTkuNx9xy+G0CvjWmMiTqS12dNFpa/YmUj2nLx/OFZOj3nHNfLnw8AgEoJ2AC8RU4T72AT05p9XX7O7ue1AEtV+tbaQja/c3Dwv9enHq4pO1/7sUAjkprm83hveT1F/tGxcLq8zD8HUKeVuNX9uhvTM+qgTR+s+TLulJ8hpjQO6qXdWI1vAnhhNlsrXQcnNC7tqMuwkM3VKPd7bg+edLe2zvwfLf9vMwAAKiVgA/AWs9nkdnq+1hRmX/etbs+wGwfGqDy328X+j3aSRZQuJrNmPulwTZFiObpxIfkcduwfBc727zsWXi/pYAPVSg+6xdjch2wmtCj7Oy+DNl/G4MeN5H/EZvle+2BN6ru3TPF9ay9W4obRUPB7ZUxU5Dyl0X/Gvl6RMqK3XaZf8jt2Em3zbDMAAColYAPwFse7+6dahP6dmmdfC9cwBaU7U9s+/2XKRclyrJcuJjHNRaqXUuym+f97HCNSirtxTtoc21M/Ft4kVxWwSc7f4A/S91FGwd2Oadvq7oNf8lfdx5exNaSuNsdjoLa7jxIEfhLle53yOUv3XBWugddr5vEopkbI5lKVTQltSuW96J3fh1ITnwUAQKUEbADOIEVMfkzUkaPZ17WFbIRrmJRSlFw2vywP9ic1YqAUYdvF/hPH+pGc870YmTby+Y7vOz4WFotnW0GlsoANvEb6LkrA0sidiOvdhd7D4642T/pgyxV0tikBnxehmsP4n+637sc5dGwbvRT3jp+rwGuUzWBl5GtMzXHIptbNX0PQXzsvn/9SNiXEe8o5rusYCgDUah4AvFVu25+iaTaDOArZRClm3FhdXR118Khc7Ofl84fdgvv5LtrC4HWFribuLxfPP2lm7b3jTl3VKiOh2mV+GFPvWnMixe58du1RjExKzSc5zlteT5Ee5uX+J9F8dK9vt081UtKBEN4k/TMe5H9074s57gTFZv/RrVbnr2K3u19Kp5+fu4+nXeXsaT9e6xyUDjWxiOvd318Whj/pPm7GofOTPzkK19wN4FTLnO81KW3G1OTYmDVt2TTyzWx17UFwbrrroq/bZXn9/fBwzGKxX97rdgIAoDICNgBn0Kb0VMuvVx2FbLpF69vz+Uej3FXY78hpn5dWtxsBk5W32jZtLhbP7s3n4wtcvE05zvMy3c8hRPeqts0/xMiUQGS7fL4ZF6Tfndk+v9k9Z27UHjh7m9QtWJQF5ipkARs4TQkw5H9ECNn8SXkd3IgSfinJzsM+dFNeT572rytN/Np/PnmNaf4wwqg9vr5IUQLNf+u+LouUZZFxvfu7NoLTCdfAma2sXNtpF/s7eapdr5q4n5fP/zPNPhpdd86hOTj43+vzZn6/uy7ajHPSRCrX4TsBAFAZARuAMyhFi+VivxRQ7S58oez6jx+7YsbdsRUzXu7I8XhC2f1XOnh0hdnP0yx/U0u4oB/9tsylpbXj/FV995p4FCOzXB5sXnjmox8ZlX4b4/vaecqp+STF+fcKugptbv8dwKmEbM6snE/0HW66++oouHvyxvTHl8xX37Da4F0I18A7m2wXm2NlBPByub/VNHnyQfn30Y9xasvY9Ng+7yuAlPpObQAA1dGQAeCMUtmxyJ+UYka3MP+kdIqIgeu71nTfa1c4KC2ELbrDK7pi2s0SLlgunj8cw/H8JovFs62uwPpbeW0Kx/mflO41Yyw8d+/Bn8clOS7S/3Z4+GwzJiilfD0qkaLZDeCt+kBDCrv/uVrCNfBeyoawNPUuIX1Qvikjo7aDMzvafPb8t76b50X8/RGbfYAHAKAyOtgAnFFu25+iaTaDP+kvmtv0pCtmfDvE+ddHO3IOvtbNAs4ib7XLtLVcPH/UzNp7YwljlGBNE+mLvj16Hc03zt9Iu9f0SujjMh/XrkjfpO59bWTHwYc6ODjo7ud2I6qRjYiiavmreBjn5eg1VsdOrkoZufW383xOp3/G7YCJmHoXmyO5jOW7f9yZ9bZuNm+WD59t5qa53+aLD9YvFvvl/7ETAAAVufBO6wC16LufLNNvwem6BdzcFXfm82uPYgDKontK6U5ZLA3e2Wy+NqpzhdJ1wmN93tKjJrc/pJVrOzEwL8JzWXjuLJZtfLM6wBDk21z5++/A3tcuUulgVUJ2UYkmlrfS/P89joqVBZI2pSdRubIzv5mv3Qh+J38lUgpvkv6p5vk6U7leamb546kFLPrOwmWzAb0mxYNo8reCNi/1wZquPnapz5PuOmq2cu1uAABUxIgogDMqF+WTb7t7Fl2xLkV6WAp3JdwSV6Asuufl8zvleyjfi8AFfIi8VRZvy/G0XB7cz6XDxVV+N93xXV5b+nFvy+f/YxTUGaXYHWO4plgur3ihYADva5fhaDRcPeGaYpEbHWwAgEkoXWyCF8rYo/ao0/Lkx0b1gexy/dxd1192CCul9FkAAFRGwAbgHXQLuz8HZ/PKgmTZEV8u6OOClf9HCQAczZDuFt0Fa+D8lOMpt9tt0/7y4rhePL95GTPVS6hnefB/28ehmj44Z3fmu8kjLrinaIZRlD1+X+t3B1/Ce9ply8t0fqNmBmI+X3saAAATsLJybcemsD8o17BN3C/Xr3l58PVRoHw6rjJY8+J7iHT9MmoGAACXSbtUgHdgTNQHSrEbOe3kaH+etbOnaXX1gxa+yqJ7G4vNaGafdF/dDF0szp0RUZxFSulp9wK5m9v256a/Pdt7n+O7L7wdHm4sm+X1lGafpNxe7wqBpWOOY/tDdK+9s9naxzFSQz2uywJGyvneEMenvavS9e24G1Q1UoqnzWzt06icEVHTZkQUvJkRUa9nRFTd1Kzeaq97dXjczNp7tT4/hjhGuftebqxUcM0EAHBiHgCcWbkAbxf7OzonvKe+kJe3UqSttmljudh/uTCfmt1ol//OJYTzGqntigSz+d+6P7veLZqVHTAbbbTrR83YrC3AVeqOxxKCuR5Nc7Mtv5GOju/OXneM73Z/4GRMy16O1N9O0e9iW+9eBNZzuZ1jvV0+Xy+HdCrrIbl1ZJ+TpsmjXZQ+KCPJcrsRA1TOBXJKm93z9mmb22/n82uPYoRqDNcUbdv+KwAAJqTUrA4P/+/bJjVfB6+z3o9AXqYycninu+L8YTaLnbGHbUqopj18tpWa5vPu2mQzBqbJqdQLdgIAoBICNgDvKLftT91q5WZwLl4szHeL6WW7+Ru3GTZHC+5H/00A47B+fIy/Ir/yazigL1x6lNLaboxU0yyvD73pZnmOH49EvNNE8yCa5U9jKdLXGq4pusfEeCgAYHLm82t32+XzL0IX0FOVsHx3vrjZLiPGGLbpuxUd5psvQjVNM9gNKqmJz7tPDwIAoBJNAPBOmpV+h/peAMCQpdgt7c9j1JrPYyxybLS5fVDa8ndF+h8Xi2dbMVBll2te7t+vNVxTtHbJAgATlFLay5G/Cc7sOGzzsD+PXz7/Zbl4/jAvnt8sIZYYiPK9lOuL5fLgfhn11o8Ca5r7Y+iwnSNdDwCAiuhgA/COSrFisXi+kyLfDAAYqJzzvbG3O+/eazdjhLpC982uSH9zudi/3/0Uj5uIn2K2ulPOIeKK5cNnm237/OHR2MZ6raxc2wkAgAkqo0vbxf4Xxpu/u5Muy23EVixTGX28lyKedr//c5Oap5HbvZivPb2o8/oShI/Dw41ls7ye0uyTlNvruXw/y1jv+3oed3Yel7x+2F2DOD8HAGohYAPwHnJuv+0upgVsABimFLvzWd9xbbQODg664nY79tb23feft44K9M/79vN9cT5iJ11igbkv1C8PNnPkr9uy0FL5ZLakew0AMHFplm/nZfoljIr6UOt9UCmlzbacRKfuTLM7r++DNyntdifaezm6zyVw0y7/3X/dnB6+SW13bp7SejSz/+z+/HqKvJFTbHR//Xq7fL5eZg70A9RzW81pe5P7LjY7AQBQAQEbgPdQdl30i2R2AwEwQE2Tb8TIzWKxWdtE25fF+bjTFeX7IEhOzdOcl7/Ocuye527Y0ka+Pcw3U9N81hXqN2NCiyvdWsRPAQAwYaWT5cHB/r1ZE/eDi7B+3O0m+rP8fBy+SX005nTN8Z847kaTX/xSr5zaze7TgwAAqICADcB7aiP/0F02bwYADEib873ZyEdDFalpPq+8znwUuMntZinDt6XOfrIbNuJp99VeTs3uWXbCpjLu6WQHbIrrXbF/o7SRL8X72u/D12mi2QkAgIlbXV170C72P7c5jKuW0uyzAACohIANwHsqM627RbCyE0i7XQCGIcXuyvza3ahAtxBwPaZp/cUiSNnVepadsCle7oCdYqLmVd0xkFZXnwYAAEZFMRB5PR8cXHeeDgDUoK6e6wCXLedvAwCGYa+G0VBFPny2GRYBeB/GQwEAvFBGReVItwOuWBv9mCgAgNETsAH4AM18rcwP3gsAuGLLNu6lCkZDFa029rynZp4fBAAAL8znHz1uc2uDGFcqJwEbAKAOAjYAHyCltFcWNAMArlR6tLq6Vk2woHt//SzgHaWInVpCZgAA52k+v3Y3pTCehyuT0sw1HgBQBQEbgA/UL2im2A0AuArde1AzW/0mKpFzXs862PAe2sg/BAAAf1I2iKUm3wpdmLky3XVefrYRAAAjJ2ADcA7aNptnDcBV2GuafKMUzKMWi/3rAe8qxe58fu1RAADwWqXTX5v7kA1cifYw3QwAgJETsAE4Bysr13bKWIIAgEtUxhTWNhKnjazoyrtbxrcBAMCpSv2qzdmoc65Gkz4JAICRE7ABOCdp1nex0WoXgEtRCuP9mMLaNM1nAe+ijElbyY8DAIC3Wlm5drfNrXAyVyBvBgDAyAnYAJyT0kGgdBIIALhgKeJxKYxHZXJ+thE5jIjinbRt/qG2Tk4AABdpZeUv2zoxcwU2+ms+AIARE7ABOEelk4ACBQAXKsVumn10Oyq0XDbCNbyb7niYz+NRAADwTrprilvlXCrgEi2XsRkAACMmYANwzoyKAuDClFE4Tb6RUqryfSZFfB7wDnLO93SvAQB4d+WaolxbCNlwmVIYCQwAjJuADcA5MyoKgAvxIlxTcZgg5c2As+q711x7FAAAvJdybSFkw+VyzQcAjJuADcAFMCoKgHO2t1wubtUcrsn52Ubk2Ag4o7bNVY5KAwC4TEI2XLKN/toPAGCkBGwALohZ1gCclxzp9urqfzyNii2XsRlwZunRysq1nQAA4IMJ2XCZXPsBAGMmYANwQcosazurAfhQOfLt+fyjx1G95vOAsyjj0matcZwAAOdIyIbLknK6HgAAIyVgA3CBys7qZRvfBAC8h6NwzbVHMQEpZUVWzqQEmGselwYAcFWEbLgUKWyuAABGS8AG4IKtrq49aHP7bQDAO5hSuObg4OB69wNvBLxFm/M9o6EAAC6OkA2XYCPnvB4AACMkYANwCboF0rspxdMAgLfba3O+MZVwTTGLxWbAW6SUnq6sXLsbAABcKCEbLtzy/zYDAGCEBGwALkG3ILSXmnxLYaJi5bEVogI+3N6yXdyYWoeO3Mw+CzhN9z6bmvZWAABwKY5CNh99miIeB5yzNs82AwBghARsAC6J3T8V6x7T8timHHsB8L7Ka8ksf7q6+h+TC+ulyJsBb7bXv89251IBAMClKRvGmvnarTKmM+AcpSZssgAARknABuASlYWh5XJRdl8LYlSkPKYW/YAPUUbfTDVAkA+fbXaf1gPeIEf+xvssAMDVKWM6l218E3BOco7rOWfXgQDA6AjYAFyy0pmgjP8IIZsqdIt+t6fYbQI4P7nNP6RmdbrdOeZrT5MRe7xB2S09n197FAAAXKnV1bUHXT3rU52ZOTfL/9sMAICREbABuAJCNnWw6Ad8qP51ZPXaVmm9HhNVfvbUfHQjRTwOeEU5Pspu6QAAYBBKPavvvBmxE/CB2jzbDACAkRGwAbgiQjbjZtEP+EB7pQOW15EjJWTTzNduldfWgPA+CwAwVKXzZnfufsO5Ox8kRfc8yg8CAGBkBGwArtCLkI32uqNi0Q/4IKWQOMuf6oD1Z+W1VaEe77MAAMNXzteMjOJ9tDm+bZqPPp3smGQAYNQEbACu2El7XQWJcbDoB3wIhcS3U6iftmUb33ifBQAYh5OaVm7zDwFv013jdXW1Gysra9tTHpMMAIybgA3AAPTtdcsM6xRPg8EyzoWhSBGPg7E5HgmlkHgWCvWT1B8jq6tr2sQDAIxIqWnNV69tlXM5IXnepNQxymaTrq62EwAAIyZgAzAQpSCRmo9utLn9NhiavbLDxjgXhiLN8jely0N3U1BjBLpC4o6RUO/upFDvuT4B3UJMGZnpGAEAGK9yLickz58cd61p5mu3bDYBAGogYAMwIOVCc2XlL9tlDFEwDF0hoCyM22HD0JQuD+W5aYfgoO2VcEhXSLxhJNT7O3mul6BSUJ3u3KfvVlS6FgUAAKP2sptNuuValZMRyWpqAEBNBGwABqiMISq7OxQjrlbfdaIrBFgYZ6jKc3M2W/tYKG94TrrWGHdzPvpRivO1G9rO16UU3FOzKoAGAFCZ+fyjx65Vp6tcDy/bxadGJAMANRKwARiosruj7OguM4qDS1eKQEddJxQCGL4Symtm+WMdPgZhr4RAdK25GNrOV6Pv7qTgDgBQt5NrVefvE5Fit3QvKtfDOlQCALUSsAEYsOMd+7fs+LlEx7OhSxEoYER0+Lh6ffvr2UcflxBIcGFO2s4r1I9TPxJKdycAgMl49fzdppBq7fUb1ZqPPi3diwIAoGICNgAjcLLjx6L5xSrdgsyGZuyOOnx89Klg3uXR/vpqKNSPT190nxm9CAAwRTaFVGnv+Bz/41K7dD0MAEyBgA3ASJRCRJlfXUYqKEScu73jFra3FAOoQXkea8V98Uqoo3S80v76ap0U6stj4fk+TOVYKa9HusMBAFA2hZT6lqDNqAnWAACTJWADMDJlpELTWEQ8Ly9HumhhS32M0rkYrwZrdLwajvJYeL4Pzl4JBpdjRdcaAABe9WrQRkfK0RCsAQAmT8AGYISMxfhwJwvkRrowBYI250OwZhxefb73o9Lsir0KLwrvJRgcAADwBv2YYx0pB+3kWng2X/urYA0AMHUCNgAjZn71e+jup3J/WSBniv4UtPG6cSaCNeNUnu+l+GtX7KWyoxUAgPfyp46Urlev2l7p+uxaGADg9wRsACqgre6ZHC36NR99Wu6vgAk7Cdp43TjVSVDgr4qJ43eyK7Yv1pfnfIqnwXkSrAEA4Fy4Xr1a5f7uN6b15/Zr266FAQB+bx4AVOM4OPLo8PDZZsqxlZr0RUxdit22zT/M52sPZhb84E9OXjdyfraxPIy7aZY+ixwbMU17XTHx6TLne4qIdSrF+u7To/JxcPC/11OabzVNfD7h5/yHKsGab73HwhXJcTsAoGK/u15dxmaT0tc5x/XgXPWhmrb9qVm59khYHgDgdCkAqNaUF8xLccAi+fQsl/u/TeG5XrpwHAcFLsSLkN40Xjv6UI1i4rSVsM0sms3UNJ/niM3gVN5jAQC4KqXW1R7mm2nWfCFs8/6EagAA3o+ADcBELBbPbzaRv+gWDm9Gvfqd9DnPHq+urhr/MUECNuev0rBNVzxMj3O0P89ma48VE3nVye7YaGNz4h2dfkcBHgCAoXnR2SbSF4Lyb+U6GADgHAjYAExMhcWHvTbHD91P9thOegRsLtYfunyUnYLrMQ57x+GAn5fR7qyu/ocAHmf2yvP+s+P3zbE87z/Yy1BNenwVrzkAAHBWOef1xWK/u05NN2dNfKa7zctura6DAQDOj4ANwISV4sNyebAZbXtzVLv0U+y2bfwkVMMfCdhcrpPgQY50vZmlTwZSwOyLiMscv6aUn85msSMYwHkqz/ummV0vHW4G9Lw/H8fvrymlndlsdceuVgAAxuokcNNEbHbntZ+NbJPIu+vO5SOnnWiXvwrUAABcHAEbAF4Y6qJhSt1ieRs/Hy2Wa2PLmwnYXL2j15GVjZTb622k9VmKT7ozzvV89LicRzFzr/v79lKO3RypKyC2/8p9KGD5dGXl/+16feCyvSjc53y9Tc1Gec6PpHjfd3Za5viXQA0AAFPw6vVqd+5brlU3RhiY3+vqZLs5p6clTNOm9HQ+X3vqXB4A4HII2ADwRpe+aNgVCLpF89J54l9NbnfLjhsL5rwLAZvhK2PqyufF4uXjlFLTvaa067//c7F7cns+P7qtEw1j8pr30L91v71+yeGbk0Dai/dWBXgAAPi9F8GbdrlxUv86540i76bUx7pz+RKiaXP+d9lw1lUC9maz9qnrYgCAqyVgA8B7KcWHlGbrZWG8FCC6le+jgkNq/nbaf1cKA03kvdJxonxdFtHL4rkCAedBwAYYixI2OwmapRRdMT+vn7yXlu5PTUr/+ba/4+Q9tf/7/vC+GrG2J0QDAAAfrpy7Hx4u10/qYGWDSHq19vCWWtjv/7L2X8d/6V5ujs7XX57D21gCADB0AjYAQDUEbAAAAAAAALgITQAAAAAAAAAAAG8kYAMAAAAAAAAAAKcQsAEAAAAAAAAAgFMI2AAAAAAAAAAAwCkEbAAAAAAAAAAA4BQCNgAAAAAAAAAAcAoBGwAAAAAAAAAAOIWADQAAAAAAAAAAnGIeAAAAAADwjvJ2rMciNiPFZ9F2tyOudx/l88Yf/uhu/5FjL5r4tbv9tKtMP00P+t8HAAAYhRQAAJVYLvd/6wq2G1G5ZpY/TunabgAAAFyy/I/YjDY+6yrLN+MoUPMhnkYTOzGLb4VtAACAoROwAQCqIWADAABw/vpONQdxs6smf9F9uRkX42l3Pfdt+j4eBQAAwAAJ2AAA1RCwAQAAOF/5y/i6qyLfjaPRT5ehjJK6J2gDAAAMjYANAFANARsAYCryV91ZD/Ba6Z9qnuehHwWV42F3cyOuxm73SN5O38VOAAAADEATAAAAAAAQR+Og8ldxP3I8ibjSDQwb5Xso30s/ogoAAOCKCdgAAAAAABD577ERh/FLd3M7hmO7fE95u/5upQAAwLAJ2AAAAAQAwLT1I6FmfbhmI4anD/703yMAAMAVEbABAAAAAJiw/FV8cTwSasijmNaPR0Z9EQAAAFdAwAYAAAAAYKKOAyuPYjweCdkAAABXQcAGAAAAAGCCjkcuPYrxeWRcFAAAcNkEbAAAAAAAJib/PTYix48xVt33nre7nwEAAOCSCNgAAAAAAExI3o71mMWT7uZ6jNd6HMaT/mcBAAC4BAI2AAAAAABTchh3ul83Yvw2jn8WAACACydgAwAAAAAwEfkfsdl92o56bB//TAAAABdKwAYAAAAAYCpyPIza1PgzAQAAgyNgAwAAAAAwAfnL2Io6RkP90Ub+r6q68gAAAAMkYAMAAAAAMAUp7kStmriTt2M9AAAALoiADQAAAABA5SruXnNiPQ7iZgAAAFwQARsAAAAAgNo18XXULsUXAQAAcEEEbAAAAAAAKpb/HhuR43rUbzP/IzYDAADgAgjYAAAAAADUbB7bMR2bAQAAcAEEbAAAAAAA6vZZTEWOzwMAAOACCNgAAAAAAFRqQuOhTlzP27EeAAAA50zABgAAAACgVvNJhWuOLIyJAgAAzp+ADQAAAABAvaYXsAkBGwAA4PwJ2AAAAAAA1OuTmJoc/xkAAADnTMAGAAAAAKBWOdZjeqbYtQcAALhgAjYAAAAAAPXaiOmZYqgIAAC4YAI2AAAAAAD12ojp2QgAAIBzJmADAAAAAAAAAACnELABAAAAAAAAAIBTCNgAAAAAAAAAAMApBGwAAAAAAOq1G9OzGwAAAOdMwAYAAAAAoFYp9mJqkoANAABw/gRsAAAAAABqlePXmJo2/h0AAADnTMAGAAAAAKBWU+xg08TTAAAAOGcCNgAAAAAA9dqJ6RGwAQAAzp2ADQAAAABAreYTDNjMBWwAAIDzJ2ADAAAAAFCp9CD2Ik0qcPK0+5l3AwAA4JwJ2AAAAAAA1O2nmIoUPwcAAMAFELABAAAAAKjbTkzFPB4EAADABRCwAQAAAACoWPquD9jsRP2MhwIAAC6MgA0AAAAAQO1y/BC1y/FtAAAAXBABGwAAAACA2q3G4+7XvajXbvo+HgUAAMAFEbABAAAAAKhcetCHa+5FrXLFPxsAADAIAjYAAAAAABOQ/hkPuk+7UR/dawAAgAsnYAMAAAAAMBUpbkdtavyZAACAwRGwAQAAAACYiPRd7ESKb6MW3c/S/0wAAAAXTMAGAAAAAGBK5nE36hgVtXv8swAAAFw4ARsAAAAAgAlJD2IvlnGju7kX47UXK3Gj/1kAAAAugYANAAAAAMDEpP+O3UhxK8aq+97Tgyq68AAAACMhYAMAAAAAMEHpu9iJHLdjbLrvuf/eAQAALpGADQAAAADARKXv49GoQjYlXFO+ZwAAgEsmYAMAAAAAMGF9YCXFje7mXgzXXvkehWsAAICrImADAAAAADBx/cilZXza3dyN4dmNlfjUWCgAAOAqCdgAAAAAABDpv4+CLJHi2xiK8r2UcM2DQQZ/AACACZkHAAAAAAB00oN+TNR2/kc8jhwPu9sbcTV2I8VtXWsAAICh0MEGAAAAAIDfKcGW9M/4OHLcjssdG1UCPt+U/7dwDQAAMCQCNgAAAAAAvFb6Ph69CNqkeBoXJcVO//9YiY+7/9+DAAAAGJgUAACVWC73f+sKshtRuWaWP07p2m4AAABcsvz37pprHtvdzc+666/r8SGOAjs/dR87utUAAABDJ2ADAFRDwAYAAODyHIdtSsimfHzSfawfX5Nt/OGP7naV6L3u3z3tPv+7+3qn++920oN+HFQAAACMgYANAFANARsAAAAAAAAuQhMAAAAAAAAAAMAbCdgAAAAAAAAAAMApBGwAAAAAAAAAAOAUAjYAAAAAAAAAAHAKARsAAAAAAAAAADiFgA0AAAAAAAAAAJxCwAYAAAAAAAAAAE4hYAMAAAAAAAAAAKcQsAEAAAAAAAAAgFMI2AAAAAAAAAAAwCkEbAAAAAAAAAAA4BQCNgAAAAAAAAAAcAoBGwAAAAAAAAAAOIWADQAAAAAAAAAAnELABgAAAAAAAAAATiFgAwAAAAAAAAAApxCwAQAAAAAAAACAUwjYAAAAAAAAAADAKQRsAAAAAAAAAADgFAI2AAAAAAAAAABwCgEbAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD4/9uBAxoAAACEQfZPbY5vAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAag4uRqhPaIYB7gAAAABJRU5ErkJggg==" alt="Upstate AI" style="width: 360px; margin-bottom: 50px;">
                <h1 style="font-size: 42px; font-weight: 800; margin: 0 0 10px 0; color: white; letter-spacing: -0.02em;">AI Readiness Assessment Results</h1>
                <div style="width: 80px; height: 4px; background: #ff6900; margin: 30px auto;"></div>
                <div style="margin: 50px 0;">
                    <p style="font-size: 24px; font-weight: 600; margin: 12px 0; color: white;">${escapeHtml(lead.name)}</p>
                    <p style="font-size: 20px; margin: 10px 0; color: #f7f4ea;">${escapeHtml(lead.company)}</p>
                    <p style="font-size: 16px; margin: 10px 0; color: rgba(247,244,234,0.8);">${escapeHtml(lead.email)}</p>
                    <p style="font-size: 14px; margin: 16px 0 0 0; color: rgba(247,244,234,0.7);">${date}</p>
                </div>
                <div style="margin-top: 60px; padding-top: 30px; border-top: 1px solid rgba(247,244,234,0.2);">
                    <p style="font-size: 13px; margin: 0 0 8px 0; color: rgba(247,244,234,0.7); text-transform: uppercase; letter-spacing: 0.1em;">Put AI to Work</p>
                    <p style="font-size: 16px; margin: 0; color: #f7f4ea;"><strong>ben@up-state-ai.com</strong> | <strong>(315) 313-5998</strong> | <strong>up-state-ai.com</strong></p>
                </div>
            </div>
            <div class="pdf-footer" style="color: rgba(247,244,234,0.8); border-top-color: rgba(247,244,234,0.2);">
                <div class="pdf-footer-left">Upstate AI | ben@up-state-ai.com | (315) 313-5998 | up-state-ai.com</div>
                <div class="pdf-footer-right">Page 1 of 4</div>
            </div>
        </div>

        <!-- PAGE 2: RESULTS -->
        <div class="pdf-page">
            <div style="padding: 50px 40px;">
                <h2 style="color: #1a3a2e; font-size: 32px; font-weight: 800; margin: 0 0 40px 0; letter-spacing: -0.02em;">YOUR ASSESSMENT RESULTS</h2>

                <div style="background: #f7f4ea; padding: 32px; border-radius: 12px; margin-bottom: 36px; border-left: 6px solid #ff6900;">
                    <div style="margin-bottom: 20px; overflow: hidden;">
                        <div style="float: left; font-size: 72px; font-weight: 900; color: #ff6900; line-height: 1; margin-right: 20px;">${scores.totalScore}</div>
                        <div style="float: left; padding-top: 16px;">
                            <div style="font-size: 20px; font-weight: 700; color: #1a3a2e; margin-bottom: 4px;">${escapeHtml(scores.tier.name)}</div>
                            <div style="font-size: 14px; color: #556b5e;">out of 60 points</div>
                        </div>
                    </div>
                    <p style="font-size: 15px; line-height: 1.7; color: #1a3a2e; margin: 0;">${escapeHtml(scores.tier.summary)}</p>
                </div>

                <h3 style="color: #1a3a2e; font-size: 20px; font-weight: 700; margin: 0 0 20px 0;">Dimension Scores</h3>
                ${buildDimensionBars(scores)}

                <div style="background: #fff; border: 2px solid #f7f4ea; border-radius: 8px; padding: 20px; margin-top: 28px;">
                    <div style="overflow: hidden;">
                        <div style="float: left; width: 48%;">
                            <div style="font-size: 12px; font-weight: 700; color: #ff6900; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 8px;">Strongest</div>
                            <div style="font-size: 16px; font-weight: 700; color: #1a3a2e; margin-bottom: 4px;">${escapeHtml(scores.strongest.label)}</div>
                            <div style="font-size: 13px; color: #556b5e; line-height: 1.5;">${escapeHtml(scores.strongest.desc)}</div>
                        </div>
                        <div style="float: right; width: 48%;">
                            <div style="font-size: 12px; font-weight: 700; color: #ff6900; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 8px;">Biggest Opportunity</div>
                            <div style="font-size: 16px; font-weight: 700; color: #1a3a2e; margin-bottom: 4px;">${escapeHtml(scores.weakest.label)}</div>
                            <div style="font-size: 13px; color: #556b5e; line-height: 1.5;">${escapeHtml(scores.weakest.desc)}</div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="pdf-footer">
                <div class="pdf-footer-left">Upstate AI | ben@up-state-ai.com | (315) 313-5998 | up-state-ai.com</div>
                <div class="pdf-footer-right">Page 2 of 4</div>
            </div>
        </div>

        <!-- PAGE 3: RECOMMENDATIONS -->
        <div class="pdf-page">
            <div style="padding: 50px 40px;">
                <h2 style="color: #1a3a2e; font-size: 32px; font-weight: 800; margin: 0 0 40px 0; letter-spacing: -0.02em;">YOUR NEXT STEPS</h2>

                <div style="margin-bottom: 36px;">
                    ${buildActionsList(scores)}
                </div>

                <div style="background: #ff6900; color: white; padding: 28px; border-radius: 12px; margin-top: 40px;">
                    <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 12px; opacity: 0.9;">Recommended Service</div>
                    <h3 style="font-size: 26px; font-weight: 800; margin: 0 0 8px 0; color: white;">${escapeHtml(scores.tier.service)}</h3>
                    <p style="font-size: 18px; font-weight: 700; margin: 0 0 16px 0; color: #f7f4ea;">Starting at ${escapeHtml(scores.tier.servicePrice)}</p>
                    <p style="font-size: 14px; line-height: 1.6; margin: 0; color: rgba(255,255,255,0.95);">${escapeHtml(scores.tier.serviceDesc)}</p>
                </div>

                <div style="margin-top: 36px; text-align: center; padding: 24px; background: #f7f4ea; border-radius: 8px;">
                    <p style="font-size: 16px; font-weight: 600; color: #1a3a2e; margin: 0 0 12px 0;">Ready to take the next step?</p>
                    <p style="font-size: 14px; color: #556b5e; margin: 0;">Schedule a free 30-minute consultation: <strong style="color: #ff6900;">ben@up-state-ai.com</strong> or visit <strong style="color: #ff6900;">up-state-ai.com</strong></p>
                </div>
            </div>
            <div class="pdf-footer">
                <div class="pdf-footer-left">Upstate AI | ben@up-state-ai.com | (315) 313-5998 | up-state-ai.com</div>
                <div class="pdf-footer-right">Page 3 of 4</div>
            </div>
        </div>

        <!-- PAGE 4: ABOUT -->
        <div class="pdf-page">
            <div style="padding: 50px 40px;">
                <h2 style="color: #1a3a2e; font-size: 32px; font-weight: 800; margin: 0 0 24px 0; letter-spacing: -0.02em;">ABOUT UPSTATE AI</h2>

                <p style="font-size: 15px; line-height: 1.8; color: #1a3a2e; margin: 0 0 28px 0;">
                    We help businesses in manufacturing, professional services, and logistics build practical AI systems that solve real problems. No hype, no generic advice. Just honest assessments, clear implementation plans, and hands-on support from people who understand both the technology and your industry.
                </p>

                <div style="background: #f7f4ea; padding: 24px; border-radius: 8px; margin-bottom: 32px; border-left: 4px solid #ff6900;">
                    <h3 style="font-size: 16px; font-weight: 700; color: #1a3a2e; margin: 0 0 12px 0;">Ben Nichols, Founder</h3>
                    <p style="font-size: 13px; line-height: 1.7; color: #556b5e; margin: 0;">
                        AI professor at Syracuse University and consultant to manufacturers, professional services firms, and technology companies. Built and deployed machine learning systems in production environments for over a decade.
                    </p>
                </div>

                <h3 style="color: #1a3a2e; font-size: 20px; font-weight: 700; margin: 0 0 20px 0;">Our Services</h3>
                ${buildServicesGrid()}

                <div style="margin-top: 36px; padding: 24px; background: #1a3a2e; color: white; border-radius: 8px; overflow: hidden;">
                    <div style="float: left; width: 65%;">
                        <h3 style="font-size: 18px; font-weight: 700; margin: 0 0 12px 0; color: white;">Let's Talk</h3>
                        <p style="font-size: 13px; margin: 0 0 16px 0; color: #f7f4ea; line-height: 1.6;">Book a free 30-minute consultation to discuss your AI readiness and next steps.</p>
                        <p style="font-size: 13px; margin: 0; color: #f7f4ea;"><strong>Email:</strong> ben@up-state-ai.com<br><strong>Phone:</strong> (315) 313-5998<br><strong>Web:</strong> up-state-ai.com</p>
                    </div>
                    <div style="float: right; width: 30%; text-align: right;">
                        <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGMAAABjAQMAAAC19SzWAAAABlBMVEUAAAD///+l2Z/dAAAAAnRSTlP//8i138cAAAAJcEhZcwAACxIAAAsSAdLdfvwAAADtSURBVDiNzdSxrcMgEAbgsyhSsgASa9B5JVggFgs8r0THGpa8AHQUyH/OylP8Gr9zkUi5iq8A/QcnCH+LvliF6D4anWiQVNFDs3PmhaRkPJkpU7igO/WLCuj6itC9W4Yj2am4v5BNOLo9FVfhmzhu8FTFcZCVE2lJ22hrQv3N8p9q6nQDso2SNmeBZYCFpDL2AQppjZKQVEx2oyVIqlhCVmhGFPc3Z9Kws6RCXaf9NSZJXPy8HLxK4h1+XGNWURJv4hkMeE3WufZpJU+qXpB3dm7P1IKmpn6cCaJ4rvfjV0ja57oZcoiSPv/3vEMPrTO48Li5pwoAAAAASUVORK5CYII=" alt="Scan to book" style="width: 120px; height: 120px; border-radius: 8px; background: white; padding: 8px;">
                    </div>
                </div>
            </div>
            <div class="pdf-footer">
                <div class="pdf-footer-left">Upstate AI | ben@up-state-ai.com | (315) 313-5998 | up-state-ai.com</div>
                <div class="pdf-footer-right">Page 4 of 4</div>
            </div>
        </div>
        `;

        document.body.appendChild(container);
        return container;
    }

    function escapeHtml(text) {
        var div = document.createElement('div');
        div.textContent = text || '';
        return div.innerHTML;
    }

    function buildDimensionBars(scores) {
        var html = '<div>';
        DIMENSIONS.forEach(function(dim) {
            var score = scores.dimensionScores[dim.key] || 0;
            var percentage = (score / 10) * 100;
            html += `
                <div>
                    <div style="overflow: hidden; margin-bottom: 8px;">
                        <div style="float: left; font-size: 14px; font-weight: 600; color: #1a3a2e;">${escapeHtml(dim.label)}</div>
                        <div style="float: right; font-size: 14px; font-weight: 700; color: #ff6900;">${score}/10</div>
                    </div>
                    <div style="background: #e0e0e0; height: 10px; border-radius: 5px; overflow: hidden;">
                        <div style="background: linear-gradient(90deg, #1a3a2e, #ff6900); height: 100%; width: ${percentage}%; border-radius: 5px;"></div>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        return html;
    }

    function buildActionsList(scores) {
        var actions = scores.tier.actions || [];
        var html = '<div>';
        actions.forEach(function(action, idx) {
            html += `
                <div style="margin-bottom: 20px; overflow: hidden;">
                    <div style="float: left; width: 32px; height: 32px; border-radius: 50%; background: #ff6900; color: white; text-align: center; line-height: 32px; font-weight: 800; font-size: 16px; margin-right: 16px;">${idx + 1}</div>
                    <div style="margin-left: 48px; padding-top: 4px;">
                        <p style="font-size: 15px; line-height: 1.6; color: #1a3a2e; margin: 0;">${escapeHtml(action)}</p>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        return html;
    }

    function buildServicesGrid() {
        var services = [
            { name: 'AI Workshop', desc: 'Half-day interactive session for leadership teams covering industry-specific use cases and hands-on opportunity scoring.' },
            { name: 'AI Audit', desc: 'Full operational analysis with data maturity evaluation and prioritized roadmap with ROI estimates.' },
            { name: 'AI Execution', desc: 'End-to-end project management from technical planning through vendor evaluation to deployment and training.' },
            { name: 'AI Advisory', desc: 'Monthly strategic check-ins, on-call guidance for AI decisions, and quarterly opportunity reviews.' }
        ];

        var html = '<table style="width: 100%; border-collapse: separate; border-spacing: 12px;">';
        for (var i = 0; i < services.length; i += 2) {
            html += '<tr>';
            for (var j = i; j < i + 2 && j < services.length; j++) {
                html += '<td style="width: 50%; background: #f7f4ea; padding: 18px; border-radius: 8px; vertical-align: top;">' +
                    '<div style="font-size: 15px; font-weight: 700; color: #1a3a2e; margin-bottom: 8px;">' + escapeHtml(services[j].name) + '</div>' +
                    '<div style="font-size: 12px; line-height: 1.6; color: #556b5e;">' + escapeHtml(services[j].desc) + '</div>' +
                    '</td>';
            }
            html += '</tr>';
        }
        html += '</table>';
        return html;
    }



    // ============================================
    // ACCORDION UI CONTROLLER
    // ============================================

    function initAccordion() {
        // Mark first section as active and expanded
        const firstPanel = document.querySelector('.accordion-panel[data-section="1"]');
        if (firstPanel) {
            firstPanel.classList.add('active');
            const content = firstPanel.querySelector('.accordion-content');
            if (content) content.classList.add('expanded');
        }

        // Add change listeners to all radio inputs
        document.querySelectorAll('input[type="radio"]').forEach(function(radio) {
            radio.addEventListener('change', function() {
                checkSectionCompletion(this);
            });
        });
    }

    function checkSectionCompletion(changedInput) {
        // Find which section this input belongs to
        const panel = changedInput.closest('.accordion-panel');
        if (!panel) return;

        const sectionNum = parseInt(panel.getAttribute('data-section'));

        // Check if all questions in this section are answered
        const allInputs = panel.querySelectorAll('input[type="radio"]');
        const questionNames = new Set();
        allInputs.forEach(function(input) {
            questionNames.add(input.name);
        });

        let allAnswered = true;
        questionNames.forEach(function(name) {
            const checked = panel.querySelector('input[name="' + name + '"]:checked');
            if (!checked) allAnswered = false;
        });

        if (allAnswered) {
            // Mark section as complete
            panel.classList.add('completed');
            panel.classList.remove('active');
            panel.setAttribute('data-complete', 'true');

            // Auto-expand next section
            const nextSection = sectionNum + 1;
            const nextPanel = document.querySelector('.accordion-panel[data-section="' + nextSection + '"]');
            if (nextPanel) {
                // Unlock the next section
                nextPanel.classList.remove('locked');

                // Expand the next section and scroll to it after the animation completes
                expandSection(nextSection, function() {
                    var headerOffset = 100;
                    var elementPosition = nextPanel.getBoundingClientRect().top + window.pageYOffset;
                    window.scrollTo({ top: elementPosition - headerOffset, behavior: 'smooth' });
                });
            }

            updateProgressBar();
        }
    }

    function expandSection(sectionNum, onComplete) {
        const panel = document.querySelector('.accordion-panel[data-section="' + sectionNum + '"]');
        if (!panel) return;

        let activePanel = document.querySelector('.accordion-panel.active');
        const transitionDuration = 500; // ms

        // First, collapse the currently active panel (if any)
        if (activePanel) {
            activePanel.classList.remove('active');
            activePanel.querySelector('.accordion-content').classList.remove('expanded');

            // Wait for the collapse animation to finish
            setTimeout(() => {
                expandNewSection();
            }, transitionDuration);
        } else {
            // If no panel is active, just expand the new one
            expandNewSection();
        }

        function expandNewSection() {
            panel.classList.add('active');
            const content = panel.querySelector('.accordion-content');
            if (content) {
                content.classList.add('expanded');
            }
            if (typeof onComplete === 'function') {
                // Wait for the expand animation to finish before calling the callback (e.g., scrolling)
                setTimeout(onComplete, transitionDuration);
            }
        }
    }

    function toggleAccordion(sectionNum) {
        const panel = document.querySelector('.accordion-panel[data-section="' + sectionNum + '"]');
        if (!panel) return;

        // Don't allow opening locked sections
        if (panel.classList.contains('locked')) return;

        const content = panel.querySelector('.accordion-content');
        if (!content) return;

        const isExpanded = content.classList.contains('expanded');

        if (isExpanded) {
            // Collapse
            panel.classList.remove('active');
            content.classList.remove('expanded');
        } else {
            // Expand (and collapse others)
            expandSection(sectionNum);
        }
    }

    function updateProgressBar() {
        const totalSections = document.querySelectorAll('.accordion-panel').length;
        const completedSections = document.querySelectorAll('.accordion-panel[data-complete="true"]').length;
        const progress = (completedSections / totalSections) * 100;

        const progressFill = document.getElementById('progressFill');
        const progressLabel = document.getElementById('progressLabel');

        if (progressFill) {
            progressFill.style.width = progress + '%';
        }

        if (progressLabel) {
            if (completedSections === totalSections) {
                progressLabel.textContent = 'Complete! Review and submit.';
            } else {
                progressLabel.textContent = 'Section ' + (completedSections + 1) + ' of ' + totalSections;
            }
        }
    }

    // Initialize accordion on load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAccordion);
    } else {
        initAccordion();
    }

})();
