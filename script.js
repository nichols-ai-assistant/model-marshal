function generateAssessmentPDF(lead, scores) {
    // Build HTML template
    var pdfContainer = buildPDFHTML(lead, scores);
    var companyName = (lead.company || lead.name || 'Assessment').replace(/[^a-zA-Z0-9]+/g, '_');

    // Create processing overlay
    var overlay = document.createElement('div');
    overlay.id = 'pdf-overlay';
    overlay.style.cssText = 'position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: #1a3a2e; z-index: 10000;';
    overlay.innerHTML = '<div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; color: white; font-family: -apple-system, sans-serif;">' +
        '<div style="width: 56px; height: 56px; border: 4px solid rgba(255,105,0,0.25); border-top-color: #ff6900; border-radius: 50%; animation: pdfspin 0.8s linear infinite; margin: 0 auto 28px;"></div>' +
        '<div style="font-size: 22px; font-weight: 700; margin-bottom: 10px; letter-spacing: -0.02em;">Generating Your Report</div>' +
        '<div style="font-size: 14px; color: rgba(247,244,234,0.6);">Preparing your assessment report...</div>' +
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

function buildPDFHTML(lead, scores) {
    var date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    // Create a temporary container in the DOM (hidden)
    var container = document.createElement('div');
    container.id = 'pdf-report';
    container.style.cssText = 'position: absolute; left: 0; top: 0; width: 816px; z-index: 9999;';

    container.innerHTML = `
    <div class='pdf-page'>
        <h1 style='text-align: center;'>AI Readiness Assessment Results</h1>
        <div style='margin: 0 auto;'>
            <p style='text-align:center; font-size: 20px;'>${lead.name}</p>
            <p style='text-align:center; font-size: 18px;'>${lead.company}</p>
            <p style='text-align:center; font-size: 16px;'>${date}</p>
        </div>
    </div>`;

    document.body.appendChild(container);
    return container;
}
