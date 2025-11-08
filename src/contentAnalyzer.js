const { AzureOpenAI } = require('openai');

class ContentAnalyzer {
  constructor(endpoint, apiKey, deployment, apiVersion, systemPrompt = null) {
    this.client = new AzureOpenAI({
      endpoint,
      apiKey,
      apiVersion: apiVersion || '2024-02-15-preview'
    });
    this.deployment = deployment;
    this.systemPrompt = systemPrompt;
  }

  async analyzeSingleItem(item) {
    const prompt = `Analyze this UI content item and categorize it:

Name: ${item.name}
Type: ${item.type}
Path: ${item.path}
Content: ${JSON.stringify(item.content)}

Categorize as one of: button, heading, body-text, tooltip, empty-state, error-message, label, placeholder, navigation, or other.
Also identify: tone (formal/casual/friendly), purpose, and any UX patterns.

Respond in JSON format:
{
  "category": "...",
  "tone": "...",
  "purpose": "...",
  "patterns": ["..."]
}`;

    const messages = this.systemPrompt 
      ? [
          { role: 'system', content: this.systemPrompt },
          { role: 'user', content: prompt }
        ]
      : [{ role: 'user', content: prompt }];

    try {
      const response = await this.client.chat.completions.create({
        model: this.deployment,
        messages,
        temperature: 0.3,
        max_tokens: 500
      });

      let content = response.choices[0].message.content;
      // Remove markdown code blocks if present
      content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(content);
    } catch (error) {
      console.error(`Error analyzing item: ${error.message}`);
      return null;
    }
  }

  async analyzeContent(content) {
    console.log('🤖 Analyzing content with AI...');
    const analyzed = [];

    for (let i = 0; i < content.length; i++) {
      if (i % 10 === 0) {
        console.log(`   Progress: ${i}/${content.length}`);
      }

      const analysis = await this.analyzeSingleItem(content[i]);
      if (analysis) {
        analyzed.push({
          ...content[i],
          analysis
        });
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return analyzed;
  }

  async findPatterns(analyzedContent) {
    const allText = analyzedContent
      .flatMap(item => item.content)
      .filter(c => c.type === 'text')
      .map(c => c.value)
      .join('\n');

    const prompt = `Analyze these UI text strings and identify:
1. Common phrases or patterns
2. Tone consistency issues
3. Naming conventions
4. Potential improvements

Text strings:
${allText.slice(0, 4000)}

Provide actionable insights in JSON:
{
  "commonPhrases": ["..."],
  "toneIssues": ["..."],
  "namingPatterns": ["..."],
  "recommendations": ["..."]
}`;

    const messages = this.systemPrompt 
      ? [
          { role: 'system', content: this.systemPrompt },
          { role: 'user', content: prompt }
        ]
      : [{ role: 'user', content: prompt }];

    try {
      const response = await this.client.chat.completions.create({
        model: this.deployment,
        messages,
        temperature: 0.5,
        max_tokens: 1000
      });

      let content = response.choices[0].message.content;
      // Remove markdown code blocks if present
      content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(content);
    } catch (error) {
      console.error(`Error finding patterns: ${error.message}`);
      return null;
    }
  }
}

module.exports = ContentAnalyzer;
