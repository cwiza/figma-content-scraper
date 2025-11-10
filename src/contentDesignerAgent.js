const { AIProjectsClient } = require('@azure/ai-projects');
const { DefaultAzureCredential } = require('@azure/identity');

class ContentDesignerAgent {
  constructor(projectEndpoint, agentId) {
    this.projectEndpoint = projectEndpoint;
    this.agentId = agentId;
    this.client = null;
    this.threadId = null;
  }

  async initialize() {
    console.log('🤖 Initializing Content Designer Specialist Agent...');
    
    // Initialize client with Azure credentials
    const credential = new DefaultAzureCredential();
    this.client = new AIProjectsClient(this.projectEndpoint, credential);
    
    // Create a new thread for this session
    const thread = await this.client.agents.createThread();
    this.threadId = thread.id;
    
    console.log('✅ Agent initialized\n');
  }

  async reviewContent(content, fileName) {
    if (!this.client || !this.threadId) {
      await this.initialize();
    }

    console.log(`🔍 Sending ${content.length} items to Content Designer Specialist...\n`);

    // Prepare content summary for the agent
    const contentSummary = this.prepareContentSummary(content);
    
    // Create message with the content to review
    const message = await this.client.agents.createMessage(
      this.threadId,
      {
        role: 'user',
        content: `Please review this content from "${fileName}" and provide guidance:

${contentSummary}

Please analyze for:
1. 🔴 Honorifics (Mr., Mrs., Ms., Dr.) - flag these as violations
2. 🟡 Lorem ipsum or placeholder text - flag as violations
3. 🟠 Inconsistencies in tone, capitalization, or naming
4. 💡 UX writing best practices
5. ✏️ Suggested improvements

Provide color-coded feedback with specific recommendations.`
      }
    );

    // Run the agent
    const run = await this.client.agents.createRun(
      this.threadId,
      { assistantId: this.agentId }
    );

    // Wait for completion
    console.log('⏳ Agent is analyzing content...\n');
    const completedRun = await this.waitForCompletion(run.id);

    // Get the response
    const messages = await this.client.agents.listMessages(this.threadId);
    const agentResponse = messages.data
      .filter(msg => msg.role === 'assistant')
      .sort((a, b) => b.createdAt - a.createdAt)[0];

    return this.parseAgentResponse(agentResponse.content[0].text.value);
  }

  async waitForCompletion(runId) {
    let run = await this.client.agents.getRun(this.threadId, runId);
    
    while (run.status === 'queued' || run.status === 'in_progress') {
      await new Promise(resolve => setTimeout(resolve, 1000));
      run = await this.client.agents.getRun(this.threadId, runId);
      
      if (run.status === 'in_progress') {
        process.stdout.write('.');
      }
    }
    
    console.log('\n');

    if (run.status === 'failed') {
      throw new Error(`Agent run failed: ${run.lastError?.message}`);
    }

    return run;
  }

  prepareContentSummary(content) {
    // Group by category/type
    const summary = content.slice(0, 50).map(item => {
      const text = item.originalContent || item.content?.[0]?.value || '';
      const issues = [];
      
      // Pre-flag obvious issues
      if (/lorem ipsum/i.test(text)) issues.push('LOREM_IPSUM');
      if (/\b(Mr\.|Mrs\.|Ms\.|Dr\.)/i.test(text)) issues.push('HONORIFIC');
      
      return {
        id: item.id,
        location: item.selector || item.path || 'unknown',
        text: text.substring(0, 100),
        category: item.analysis?.category || item.tag || 'unknown',
        tone: item.analysis?.tone || 'unknown',
        preFlags: issues
      };
    });

    return JSON.stringify(summary, null, 2);
  }

  parseAgentResponse(response) {
    // Parse the agent's structured response
    const violations = [];
    const recommendations = [];
    
    // Extract color-coded issues (🔴 🟡 🟠)
    const lines = response.split('\n');
    
    lines.forEach(line => {
      if (line.includes('🔴')) {
        violations.push({ severity: 'high', type: 'honorific', message: line });
      } else if (line.includes('🟡')) {
        violations.push({ severity: 'medium', type: 'placeholder', message: line });
      } else if (line.includes('🟠')) {
        violations.push({ severity: 'low', type: 'inconsistency', message: line });
      } else if (line.includes('💡')) {
        recommendations.push(line.replace('💡', '').trim());
      }
    });

    return {
      fullResponse: response,
      violations,
      recommendations,
      summary: this.generateSummary(violations, recommendations)
    };
  }

  generateSummary(violations, recommendations) {
    const high = violations.filter(v => v.severity === 'high').length;
    const medium = violations.filter(v => v.severity === 'medium').length;
    const low = violations.filter(v => v.severity === 'low').length;

    return {
      totalViolations: violations.length,
      bySeverity: { high, medium, low },
      recommendationCount: recommendations.length
    };
  }

  async cleanup() {
    if (this.client && this.threadId) {
      await this.client.agents.deleteThread(this.threadId);
      console.log('🧹 Cleaned up agent session\n');
    }
  }
}

module.exports = ContentDesignerAgent;
