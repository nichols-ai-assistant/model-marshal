
// Adding event listener for form submission to prevent default behavior
const form = document.getElementById('queryForm');
form.addEventListener('submit', async function(e) {
    e.preventDefault(); // Prevent the default form submission

    const apiKey = document.getElementById('apiKey').value;
    console.log('API Key:', apiKey);
    const query = document.getElementById('query').value;
    console.log('Query:', query);

    if (!apiKey || !query) {
        status.innerHTML = 'Please enter both API key and query.';
        return;
    }

    status.innerHTML = 'Inferring system prompt...';

    // Assuming a function that handles the query:
    await generateAssessmentPDF(query);
});