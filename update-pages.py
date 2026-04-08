#!/usr/bin/env python3
"""Update cover page and add summary page"""

with open('script.js', 'r') as f:
    content = f.read()

# New cover page with user info
old_cover = '''    // PAGE 1: COVER WITH LOGO
    pagesHTML += `
    <div class="pdf-page" style="width: 816px; height: 1056px; background: #1a3a2e; color: white; text-align: center; position: relative; font-family: -apple-system, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; padding: 80px 40px 60px 40px;">
            <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAZAAAACWCAYAAADwkd5lAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAALEgAACxIB0t1+/AAAABx0RVh0U29mdHdhcmUAQWRvYmUgRmlyZXdvcmtzIENTNui8sowAAAAWdEVYdENyZWF0aW9uIFRpbWUAMDMvMTQvMTkVqX2nAAACE0lEQVR4nO3TQQ0AIAwEsYv+OycdXBBIIOvnQABgZu5dAADwjIEAgBgIAIiBxUAmV9Zv0/z0AAAAASUVORK5CYII=" alt="Upstate AI" style="width: 300px; margin-bottom: 40px;">
            <div style="width: 80px; height: 4px; background: #ff6900; margin: 30px auto;"></div>
            <h1 style="font-size: 38px; font-weight: 700; margin: 30px 0; color: #f7f4ea; letter-spacing: -0.02em;">Model Marshal Report</h1>
            <div style="font-size: 16px; color: rgba(247,244,234,0.8); margin: 40px 0; line-height: 1.6;">${escapeHtml(query)}</div>
            <div style="font-size: 14px; color: rgba(247,244,234,0.7); margin-top: 60px;">${date}</div>
        </div>
        <div style="position: absolute; bottom: 20px; left: 40px; right: 40px; font-size: 11px; color: rgba(247,244,234,0.8); border-top: 1px solid rgba(247,244,234,0.2); padding-top: 10px;">
            <div style="float: left;">Upstate AI | ben@up-state-ai.com | (315) 313-5998 | up-state-ai.com</div>
            <div style="float: right;">Page 1 of ${totalPages}</div>
            <div style="clear: both;"></div>
        </div>
    </div>`;'''

new_cover = '''    // PAGE 1: COVER WITH LOGO AND USER INFO
    pagesHTML += `
    <div class="pdf-page" style="width: 816px; height: 1056px; background: #1a3a2e; color: white; text-align: center; position: relative; font-family: -apple-system, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; padding: 60px 40px;">
            <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAZAAAACWCAYAAADwkd5lAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAALEgAACxIB0t1+/AAAABx0RVh0U29mdHdhcmUAQWRvYmUgRmlyZXdvcmtzIENTNui8sowAAAAWdEVYdENyZWF0aW9uIFRpbWUAMDMvMTQvMTkVqX2nAAACE0lEQVR4nO3TQQ0AIAwEsYv+OycdXBBIIOvnQABgZu5dAADwjIEAgBgIAIiBxUAmV9Zv0/z0AAAAASUVORK5CYII=" alt="Upstate AI" style="width: 280px; margin-bottom: 30px;">
            <div style="width: 80px; height: 4px; background: #ff6900; margin: 20px auto;"></div>
            <h1 style="font-size: 42px; font-weight: 700; margin: 20px 0; color: #f7f4ea; letter-spacing: -0.02em; line-height: 1.2;">Model Marshal<br>Report</h1>
            <div style="font-size: 14px; color: rgba(247,244,234,0.7); margin: 30px 0; text-align: left; max-width: 400px; margin-left: auto; margin-right: auto;">
                <div style="margin: 8px 0;"><strong>Name:</strong> ${escapeHtml(userInfo.name || 'Not provided')}</div>
                <div style="margin: 8px 0;"><strong>Company:</strong> ${escapeHtml(userInfo.company || 'Not provided')}</div>
                <div style="margin: 8px 0;"><strong>Email:</strong> ${escapeHtml(userInfo.email || 'Not provided')}</div>
                <div style="margin: 8px 0;"><strong>Domain:</strong> ${escapeHtml(userInfo.domain || 'Not provided')}</div>
                <div style="margin: 8px 0;"><strong>Title:</strong> ${escapeHtml(userInfo.title || 'Not provided')}</div>
            </div>
            <div style="font-size: 13px; color: rgba(247,244,234,0.6); margin-top: 40px;">${date}</div>
        </div>
        <div style="position: absolute; bottom: 20px; left: 40px; right: 40px; font-size: 11px; color: rgba(247,244,234,0.8); border-top: 1px solid rgba(247,244,234,0.2); padding-top: 10px;">
            <div style="float: left;">Upstate AI | ben@up-state-ai.com | (315) 313-5998 | up-state-ai.com</div>
            <div style="float: right;">Page 1 of ${totalPages}</div>
            <div style="clear: both;"></div>
        </div>
    </div>`;
    
    // PAGE 2: ANALYSIS SUMMARY
    pagesHTML += `
    <div class="pdf-page" style="width: 816px; height: 1056px; background: white; position: relative; font-family: -apple-system, sans-serif;">
        <div style="padding: 50px 40px;">
            <div style="background: #1a3a2e; color: white; padding: 15px 20px; margin: -50px -40px 30px -40px;">
                <h2 style="margin: 0; font-size: 24px; font-weight: 700;">Analysis Summary</h2>
            </div>
            
            <h3 style="color: #1a3a2e; font-size: 16px; font-weight: 700; margin: 0 0 10px 0;">Query</h3>
            <div style="background: #f7f4ea; padding: 15px; border-left: 4px solid #ff6900; border-radius: 4px; margin-bottom: 25px;">
                <p style="margin: 0; color: #2a2a2a; font-size: 13px; line-height: 1.6;">${escapeHtml(query)}</p>
            </div>
            
            <h3 style="color: #1a3a2e; font-size: 16px; font-weight: 700; margin: 25px 0 10px 0;">Model Descriptions</h3>
            <div style="font-size: 12px; line-height: 1.7; color: #2a2a2a; margin-bottom: 20px;">
                <p style="margin: 8px 0;"><strong>Claude Sonnet 4.6:</strong> Anthropic's latest model, excelling at nuanced analysis, following complex instructions, and producing well-structured outputs with strong reasoning capabilities.</p>
                <p style="margin: 8px 0;"><strong>GPT-5.4:</strong> OpenAI's flagship model with exceptional performance across diverse tasks, structured problem-solving, and comprehensive knowledge synthesis.</p>
                <p style="margin: 8px 0;"><strong>Grok-4-Fast:</strong> X.AI's model optimized for speed and directness, providing practical insights with minimal latency and straightforward communication style.</p>
                <p style="margin: 8px 0;"><strong>Gemini 3 Flash:</strong> Google's fast, efficient model balancing speed with quality, strong at technical analysis and detailed explanations.</p>
                <p style="margin: 8px 0;"><strong>Llama 3.3 70B:</strong> Meta's open-source model offering strong performance with transparency, privacy, and cost-effectiveness for on-premise deployments.</p>
            </div>
            
            <h3 style="color: #1a3a2e; font-size: 16px; font-weight: 700; margin: 25px 0 10px 0;">Scoring Methodology</h3>
            <div style="font-size: 12px; line-height: 1.7; color: #2a2a2a;">
                <p style="margin: 8px 0;"><strong>Specificity:</strong> Concrete details vs. generic statements. Higher scores indicate precise, measurable recommendations.</p>
                <p style="margin: 8px 0;"><strong>Actionability:</strong> Clear next steps and implementation guidance. Higher scores mean ready-to-execute advice.</p>
                <p style="margin: 8px 0;"><strong>Domain Depth:</strong> Expert-level insights and industry knowledge. Higher scores reflect specialized expertise.</p>
            </div>
        </div>
        <div style="position: absolute; bottom: 20px; left: 40px; right: 40px; font-size: 11px; color: #556b5e; border-top: 1px solid #e0e0e0; padding-top: 10px;">
            <div style="float: left;">Upstate AI | ben@up-state-ai.com | (315) 313-5998 | up-state-ai.com</div>
            <div style="float: right;">Page 2 of ${totalPages}</div>
            <div style="clear: both;"></div>
        </div>
    </div>`;'''

content = content.replace(old_cover, new_cover)

with open('script.js', 'w') as f:
    f.write(content)

print("✅ Updated cover page with user info and line break in title")
print("✅ Added page 2: Analysis Summary with model descriptions and methodology")
