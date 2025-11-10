const fs = require('fs').promises;
const cheerio = require('cheerio');

class HtmlUpdater {
  constructor() {
    this.backupDir = 'output/backups';
  }

  async applyCorrections(htmlPath, corrections) {
    console.log(`🔄 Applying corrections to: ${htmlPath}`);
    
    // Create backup first
    await this.createBackup(htmlPath);
    
    // Load HTML
    const html = await fs.readFile(htmlPath, 'utf-8');
    const $ = cheerio.load(html);
    
    let appliedCount = 0;
    let skippedCount = 0;

    corrections.forEach(correction => {
      try {
        const { selector, originalContent, correctedContent } = correction;
        
        // Skip if no correction
        if (!correctedContent || correctedContent === originalContent) {
          skippedCount++;
          return;
        }

        // Find element
        const $el = $(selector);
        
        if ($el.length === 0) {
          console.log(`⚠️  Selector not found: ${selector}`);
          skippedCount++;
          return;
        }

        // Handle placeholder attributes
        if ($el.attr('placeholder')) {
          $el.attr('placeholder', correctedContent);
        } else {
          // Replace text content
          $el.text(correctedContent);
        }

        appliedCount++;
        console.log(`✓ Updated: "${originalContent}" → "${correctedContent}"`);
        
      } catch (error) {
        console.error(`❌ Error applying correction: ${error.message}`);
        skippedCount++;
      }
    });

    // Save updated HTML
    await fs.writeFile(htmlPath, $.html(), 'utf-8');
    
    console.log(`\n✅ Applied ${appliedCount} corrections, skipped ${skippedCount}\n`);
    
    return {
      applied: appliedCount,
      skipped: skippedCount,
      total: corrections.length
    };
  }

  async createBackup(htmlPath) {
    // Create backup directory
    await fs.mkdir(this.backupDir, { recursive: true });
    
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const backupPath = `${this.backupDir}/${timestamp}_${htmlPath.split('/').pop()}`;
    
    await fs.copyFile(htmlPath, backupPath);
    console.log(`💾 Backup created: ${backupPath}`);
  }

  async validateCorrections(corrections) {
    console.log('🔍 Validating corrections...');
    
    const issues = [];
    
    corrections.forEach((correction, index) => {
      const { selector, originalContent, correctedContent } = correction;
      
      // Check for required fields
      if (!selector) {
        issues.push(`Row ${index + 1}: Missing selector`);
      }
      if (!originalContent) {
        issues.push(`Row ${index + 1}: Missing original content`);
      }
      
      // Check for common mistakes
      if (correctedContent) {
        if (correctedContent.includes('lorem ipsum')) {
          issues.push(`Row ${index + 1}: Still contains "lorem ipsum"`);
        }
        if (/\b(Mr\.|Mrs\.|Ms\.|Dr\.)/i.test(correctedContent)) {
          issues.push(`Row ${index + 1}: Contains honorific (${correctedContent})`);
        }
      }
    });

    if (issues.length > 0) {
      console.log('⚠️  Validation issues found:');
      issues.forEach(issue => console.log(`   ${issue}`));
      return false;
    }

    console.log('✅ All corrections validated\n');
    return true;
  }
}

module.exports = HtmlUpdater;
