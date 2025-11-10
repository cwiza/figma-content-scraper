require('dotenv').config();
const FigmaScraper = require('./figmaScraper');
const HtmlScraper = require('./htmlScraper');
const ContentAnalyzer = require('./contentAnalyzer');
const ContentDesignerAgent = require('./contentDesignerAgent');
const fs = require('fs').promises;

async function reviewWithAgent() {
  const inputPath = process.argv[2];
  
  if (!inputPath) {
    console.error('❌ Please provide a file path');
    console.log('Usage: node src/reviewWithAgent.js path/to/file.html');
    console.log('   or: node src/reviewWithAgent.js FIGMA_FILE_KEY');
    process.exit(1);
  }

  // Check for required env vars
  if (!process.env.AI_FOUNDRY_PROJECT_ENDPOINT || !process.env.AI_FOUNDRY_AGENT_ID) {
    console.error('❌ Missing AI Foundry configuration in .env');
    console.log('Please add:');
    console.log('  AI_FOUNDRY_PROJECT_ENDPOINT=https://your-project.cognitiveservices.azure.com/');
    console.log('  AI_FOUNDRY_AGENT_ID=your_agent_id');
    process.exit(1);
  }

  try {
    console.log('🚀 Starting Content Review with AI Agent\n');

    let content = [];
    let fileName = '';

    // Determine if input is HTML file or Figma key
    if (inputPath.endsWith('.html') || inputPath.includes('/')) {
      // HTML file
      console.log('📄 Scraping HTML file...');
      const htmlScraper = new HtmlScraper();
      const result = await htmlScraper.scrapeFile(inputPath);
      content = result.content;
      fileName = result.fileName;
    } else {
      // Figma file key
      console.log('🎨 Scraping Figma file...');
      const figmaScraper = new FigmaScraper(process.env.FIGMA_ACCESS_TOKEN);
      const result = await figmaScraper.scrapeFile(inputPath);
      content = result.content;
      fileName = result.fileName;
    }

    console.log(`✅ Scraped ${content.length} items from "${fileName}"\n`);

    // Initialize Content Designer Agent
    const agent = new ContentDesignerAgent(
      process.env.AI_FOUNDRY_PROJECT_ENDPOINT,
      process.env.AI_FOUNDRY_AGENT_ID
    );

    // Get agent review
    const review = await agent.reviewContent(content, fileName);

    // Display results
    console.log('📊 AGENT REVIEW RESULTS');
    console.log('========================\n');
    
    console.log('🎯 SUMMARY');
    console.log(`Total Violations: ${review.summary.totalViolations}`);
    console.log(`  🔴 High Severity: ${review.summary.bySeverity.high}`);
    console.log(`  🟡 Medium Severity: ${review.summary.bySeverity.medium}`);
    console.log(`  🟠 Low Severity: ${review.summary.bySeverity.low}`);
    console.log(`💡 Recommendations: ${review.summary.recommendationCount}\n`);

    console.log('📝 DETAILED REVIEW');
    console.log('==================');
    console.log(review.fullResponse);
    console.log('\n');

    // Save report
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const reportPath = `output/${fileName}_${timestamp}_agent_review.json`;
    
    await fs.writeFile(reportPath, JSON.stringify({
      fileName,
      reviewedAt: new Date().toISOString(),
      itemsReviewed: content.length,
      review
    }, null, 2));

    console.log(`✅ Full review saved to: ${reportPath}\n`);

    // Cleanup
    await agent.cleanup();

    console.log('✨ Review complete!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

reviewWithAgent();
