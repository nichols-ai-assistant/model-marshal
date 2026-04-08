# Model Marshal Improvements Plan

## Current Issues
1. PDF quality is lower than AI Readiness Assessment (uses jsPDF directly)
2. All models receive same generic system prompt (not tailored to strengths)
3. "OpenRouter" mentioned in UI
4. Metrics (tone, authoritativeness, objectivity) may not be optimal
5. Last page close but doesn't exactly match assessment

## Proposed Changes

### 1. PDF Quality Improvement
- Switch from jsPDF-only to html2canvas + jsPDF (like assessment.js does)
- Use scale: 2 for higher resolution
- Match exact page dimensions: 816px x 1056px
- Use JPEG format at 0.98 quality

### 2. Model-Specific System Prompts
Each model should get a prompt tailored to its documented strengths:

**Claude Sonnet 4.6**
- Strength: Nuanced analysis, ethical reasoning, complex instruction following
- Prompt: "You are an expert consultant with deep experience in [domain]. Provide nuanced, well-reasoned analysis that considers multiple perspectives, ethical implications, and practical constraints. Emphasize actionable recommendations grounded in real-world implementation challenges."

**GPT-5.4 / ChatGPT**
- Strength: Structured thinking, framework application, comprehensive coverage
- Prompt: "You are a strategic consultant specializing in [domain]. Structure your response using established frameworks and methodologies. Provide comprehensive analysis that covers key dimensions systematically. Include specific examples and quantifiable metrics where possible."

**Grok 4.1**
- Strength: Direct communication, practical focus, cutting through hype
- Prompt: "You are a no-nonsense operator in [domain]. Cut through marketing hype and provide direct, practical advice. Focus on what actually works based on field experience. Be skeptical of unproven approaches and emphasize measurable results."

**Gemini 3 Flash**  
- Strength: Technical depth, multi-modal understanding, specific implementation details
- Prompt: "You are a technical expert in [domain] with deep knowledge of implementation details and emerging capabilities. Provide specific technical guidance including timelines, budget considerations, and integration requirements. Cite relevant capabilities and tools."

**Llama 3.3 70B**
- Strength: Open-source perspective, data privacy focus, technical flexibility
- Prompt: "You are an expert in [domain] with focus on open-source solutions and data sovereignty. Emphasize approaches that maintain data privacy and technical control. Consider on-premise deployment options and vendor independence."

### 3. Remove OpenRouter References
- Change "OpenRouter API Key" to "API Key"
- Remove "via OpenRouter" from scoring provider text
- Update footer/about to not mention OpenRouter

### 4. Better Evaluation Metrics
Current metrics (Tone, Authoritativeness, Objectivity) are somewhat generic. Propose:

**New metrics:**
- **Specificity** (1-10): Concrete vs. generic advice
- **Actionability** (1-10): Clear next steps vs. abstract discussion  
- **Domain Depth** (1-10): Surface-level vs. expert-level insights

These better capture what business users actually need from AI responses.

### 5. Match Last Page Exactly
Copy the exact "About Upstate AI" section from assessment.js lines 426-end:
- Founder bio formatting
- Services grid layout
- Let's Talk section
- QR code implementation

## Implementation Priority
1. Model-specific prompts (highest impact, easiest change)
2. Remove OpenRouter mentions (quick win)
3. Better metrics (improves usefulness)
4. PDF quality upgrade (matches assessment)
5. Last page refinement (polish)
