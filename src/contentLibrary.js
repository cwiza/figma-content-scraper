const fs = require('fs');
const path = require('path');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

class ContentLibrary {
  constructor(outputDir = './output') {
    this.outputDir = outputDir;
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
  }

  async generateCSV(analyzedContent, fileName) {
    const csvPath = path.join(this.outputDir, `${fileName}_content_library.csv`);
    
    const csvWriter = createCsvWriter({
      path: csvPath,
      header: [
        { id: 'id', title: 'ID' },
        { id: 'name', title: 'Name' },
        { id: 'type', title: 'Type' },
        { id: 'path', title: 'Path' },
        { id: 'content', title: 'Content' },
        { id: 'category', title: 'Category' },
        { id: 'tone', title: 'Tone' },
        { id: 'purpose', title: 'Purpose' }
      ]
    });

    const records = analyzedContent.map(item => ({
      id: item.id,
      name: item.name,
      type: item.type,
      path: item.path,
      content: item.content.map(c => c.value).join(' | '),
      category: item.analysis?.category || 'unknown',
      tone: item.analysis?.tone || 'unknown',
      purpose: item.analysis?.purpose || 'unknown'
    }));

    await csvWriter.writeRecords(records);
    console.log(`✅ CSV saved to: ${csvPath}`);
    return csvPath;
  }

  async generateJSON(analyzedContent, patterns, stats, fileName) {
    const jsonPath = path.join(this.outputDir, `${fileName}_full_report.json`);
    
    const report = {
      metadata: {
        fileName: fileName,
        generatedAt: new Date().toISOString(),
        totalItems: analyzedContent.length
      },
      statistics: stats,
      patterns: patterns,
      content: analyzedContent
    };

    fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
    console.log(`✅ Full report saved to: ${jsonPath}`);
    return jsonPath;
  }

  generateSummary(stats, patterns) {
    console.log('\n📊 CONTENT SUMMARY');
    console.log('==================');
    console.log(`Total Items: ${stats.totalItems}`);
    console.log(`Unique Strings: ${stats.uniqueStrings}`);
    console.log(`Duplicates Found: ${stats.duplicates.length}`);
    console.log('\nContent Types:');
    Object.entries(stats.byType).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });

    if (patterns) {
      console.log('\n🎯 KEY PATTERNS');
      console.log('================');
      console.log('Common Phrases:', patterns.commonPhrases?.slice(0, 5).join(', '));
      console.log('\n💡 Recommendations:', patterns.recommendations?.slice(0, 3).join('\n   - '));
    }
  }
}

module.exports = ContentLibrary;
