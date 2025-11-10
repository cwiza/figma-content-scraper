require('dotenv').config();
const HtmlScraper = require('./htmlScraper');
const ContentAnalyzer = require('./contentAnalyzer');
const HtmlContentLibrary = require('./htmlContentLibrary');

async function scrapeHtml() {
  const htmlPath = process.argv[2];
  
  if (!htmlPath) {
    console.error('❌ Please provide an HTML file or directory path');
    console.log('Usage: node src/htmlScrapeAndAnalyze.js path/to/file.html');
    console.log('   or: node src/htmlScrapeAndAnalyze.js path/to/directory');
    process.exit(1);
  }

  try {
    console.log('🚀 Starting HTML Content Scraper\n');

    // Step 1: Scrape HTML
    const scraper = new HtmlScraper();
    const fs = require('fs');
    const isDirectory = fs.statSync(htmlPath).isDirectory();
    
    const result = isDirectory 
      ? await scraper.scrapeDirectory(htmlPath)
      : await scraper.scrapeFile(htmlPath);
    
    const { content, stats } = result;
    const fileName = result.fileName || result.directory.split('/').pop();

    // Step 2: Analyze with AI (optional - can be enabled)
    const shouldAnalyze = process.env.ANALYZE_HTML === 'true';
    
    let analyzedContent = content;
    if (shouldAnalyze && process.env.AZURE_OPENAI_ENDPOINT) {
      console.log('🤖 Analyzing content with AI...');
      const analyzer = new ContentAnalyzer(
        process.env.AZURE_OPENAI_ENDPOINT,
        process.env.AZURE_OPENAI_API_KEY,
        process.env.AZURE_OPENAI_DEPLOYMENT,
        process.env.AZURE_OPENAI_API_VERSION,
        process.env.AI_SYSTEM_PROMPT
      );

      // Analyze each item
      for (let i = 0; i < content.length; i++) {
        if (i % 10 === 0) {
          console.log(`   Progress: ${i}/${content.length}`);
        }

        const analysis = await analyzer.analyzeSingleItem({
          name: content[i].tag,
          type: 'TEXT',
          path: content[i].selector,
          content: [{ type: 'text', value: content[i].originalContent }]
        });

        if (analysis) {
          analyzedContent[i].analysis = {
            category: analysis.category,
            tone: analysis.tone,
            issues: []
          };

          // Check for issues
          const text = content[i].originalContent.toLowerCase();
          if (text.includes('lorem ipsum')) {
            analyzedContent[i].analysis.issues.push('Contains lorem ipsum');
          }
          if (/\b(mr\.|mrs\.|ms\.|dr\.)/i.test(content[i].originalContent)) {
            analyzedContent[i].analysis.issues.push('Contains honorific');
          }
        }

        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Step 3: Generate CSV for editing
    const library = new HtmlContentLibrary();
    await library.generateCSV(analyzedContent, fileName);
    await library.generateJSON(analyzedContent, stats, fileName);

    console.log('📊 CONTENT SUMMARY');
    console.log('==================');
    console.log(`Total Items: ${content.length}`);
    console.log(`\nContent Tags:`);
    Object.entries(stats.tags).forEach(([tag, count]) => {
      console.log(`  ${tag}: ${count}`);
    });

    console.log('\n✨ HTML scraping complete!');
    console.log('\n📝 Next steps:');
    console.log('1. Open the CSV file in Excel/Google Sheets');
    console.log('2. Add corrections in the "Corrected Content" column');
    console.log('3. Save the CSV');
    console.log('4. Run: node src/htmlApplyCorrections.js path/to/corrected.csv path/to/file.html');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

scrapeHtml();
