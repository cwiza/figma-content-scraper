require('dotenv').config();
const FigmaScraper = require('./figmaScraper');
const ContentAnalyzer = require('./contentAnalyzer');
const ContentLibrary = require('./contentLibrary');
const ColorCodedExcel = require('./colorCodedExcel');

async function main() {
  // Get Figma file key from command line or use default
  const figmaFileKey = process.argv[2] || process.env.FIGMA_FILE_KEY;
  
  if (!figmaFileKey) {
    console.error('❌ Please provide a Figma file key');
    console.log('Usage: node src/index.js YOUR_FIGMA_FILE_KEY');
    console.log('Or set FIGMA_FILE_KEY in .env file');
    process.exit(1);
  }

  try {
    console.log('🚀 Starting Figma Content Scraper Agent\n');

    // Step 1: Scrape Figma
    const scraper = new FigmaScraper(process.env.FIGMA_ACCESS_TOKEN);
    const { fileName, content, stats } = await scraper.scrapeFile(figmaFileKey);
    
    console.log(`✅ Scraped "${fileName}"`);
    console.log(`   Found ${content.length} content items\n`);

    // Step 2: Analyze with AI
    const analyzer = new ContentAnalyzer(
      process.env.AZURE_OPENAI_ENDPOINT,
      process.env.AZURE_OPENAI_API_KEY,
      process.env.AZURE_OPENAI_DEPLOYMENT,
      process.env.AZURE_OPENAI_API_VERSION,
      process.env.AI_SYSTEM_PROMPT
    );
    
    const analyzedContent = await analyzer.analyzeContent(content);
    const patterns = await analyzer.findPatterns(analyzedContent);

    // Step 3: Generate Library
    const library = new ContentLibrary();
    await library.generateCSV(analyzedContent, fileName);
    await library.generateJSON(analyzedContent, patterns, stats, fileName);
    
    // Step 4: Generate Color-Coded Excel
    const excelGenerator = new ColorCodedExcel();
    await excelGenerator.generateColorCodedExcel(analyzedContent, fileName);
    
    library.generateSummary(stats, patterns);

    console.log('\n✨ Content scraping complete!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
