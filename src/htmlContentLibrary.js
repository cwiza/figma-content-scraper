const { createObjectCsvWriter } = require('csv-writer');
const csvParser = require('csv-parser');
const fs = require('fs');

class HtmlContentLibrary {
  async generateCSV(content, fileName) {
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const outputPath = `output/${fileName}_${timestamp}_html_content.csv`;

    const csvWriter = createObjectCsvWriter({
      path: outputPath,
      header: [
        { id: 'id', title: 'ID' },
        { id: 'selector', title: 'CSS Selector' },
        { id: 'tag', title: 'Tag' },
        { id: 'originalContent', title: 'Original Content' },
        { id: 'correctedContent', title: 'Corrected Content' },
        { id: 'category', title: 'Category' },
        { id: 'tone', title: 'Tone' },
        { id: 'issues', title: 'Issues' }
      ]
    });

    const records = content.map(item => ({
      id: item.id,
      selector: item.selector,
      tag: item.tag,
      originalContent: item.originalContent,
      correctedContent: '', // Empty for manual editing
      category: item.analysis?.category || '',
      tone: item.analysis?.tone || '',
      issues: item.analysis?.issues?.join('; ') || ''
    }));

    await csvWriter.writeRecords(records);
    console.log(`✅ CSV saved to: ${outputPath}`);
    
    return outputPath;
  }

  async readCorrectedCSV(csvPath) {
    console.log(`📖 Reading corrections from: ${csvPath}`);
    
    return new Promise((resolve, reject) => {
      const corrections = [];
      
      fs.createReadStream(csvPath)
        .pipe(csvParser())
        .on('data', (row) => {
          // Only include rows with corrections
          if (row['Corrected Content'] && row['Corrected Content'].trim()) {
            corrections.push({
              id: row['ID'],
              selector: row['CSS Selector'],
              tag: row['Tag'],
              originalContent: row['Original Content'],
              correctedContent: row['Corrected Content'],
              category: row['Category'],
              tone: row['Tone'],
              issues: row['Issues']
            });
          }
        })
        .on('end', () => {
          console.log(`✅ Found ${corrections.length} corrections\n`);
          resolve(corrections);
        })
        .on('error', reject);
    });
  }

  async generateJSON(content, stats, fileName) {
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const outputPath = `output/${fileName}_${timestamp}_html_report.json`;

    const report = {
      metadata: {
        fileName,
        scrapedAt: new Date().toISOString(),
        totalItems: content.length
      },
      statistics: stats,
      content
    };

    await fs.promises.writeFile(outputPath, JSON.stringify(report, null, 2));
    console.log(`✅ Full report saved to: ${outputPath}\n`);
    
    return outputPath;
  }
}

module.exports = HtmlContentLibrary;
