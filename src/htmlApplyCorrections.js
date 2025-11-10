require('dotenv').config();
const HtmlUpdater = require('./htmlUpdater');
const HtmlContentLibrary = require('./htmlContentLibrary');

async function applyCorrections() {
  const csvPath = process.argv[2];
  const htmlPath = process.argv[3];
  
  if (!csvPath || !htmlPath) {
    console.error('❌ Please provide both CSV and HTML file paths');
    console.log('Usage: node src/htmlApplyCorrections.js path/to/corrected.csv path/to/file.html');
    process.exit(1);
  }

  try {
    console.log('🚀 Applying HTML Corrections\n');

    // Step 1: Read corrections from CSV
    const library = new HtmlContentLibrary();
    const corrections = await library.readCorrectedCSV(csvPath);

    if (corrections.length === 0) {
      console.log('⚠️  No corrections found in CSV. Add content to "Corrected Content" column.');
      process.exit(0);
    }

    // Step 2: Validate corrections
    const updater = new HtmlUpdater();
    const isValid = await updater.validateCorrections(corrections);

    if (!isValid) {
      console.log('\n❌ Validation failed. Please fix issues and try again.');
      process.exit(1);
    }

    // Step 3: Apply corrections
    const result = await updater.applyCorrections(htmlPath, corrections);

    console.log('📊 RESULTS');
    console.log('==========');
    console.log(`✅ Applied: ${result.applied}`);
    console.log(`⏭️  Skipped: ${result.skipped}`);
    console.log(`📝 Total: ${result.total}`);

    console.log('\n✨ Corrections applied successfully!');
    console.log(`💾 Backup saved in: output/backups/`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

applyCorrections();
