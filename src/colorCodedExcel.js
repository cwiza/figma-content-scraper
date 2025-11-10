const ExcelJS = require('exceljs');

class ColorCodedExcel {
  constructor() {
    this.colors = {
      critical: 'FFFF6B6B',      // Red - honorifics, critical issues
      placeholder: 'FFFFD93D',   // Yellow - lorem ipsum, placeholders
      inconsistency: 'FFFF9F40',  // Orange - tone/capitalization issues
      longText: 'FF6BA3E8',      // Blue - text too long
      spelling: 'FFC77DFF',      // Purple - spelling errors
      needsReview: 'FFE0E0E0',   // Gray - needs human review
      approved: 'FF95E1D3'       // Green - good content (not currently used)
    };
  }

  async generateColorCodedExcel(analyzedContent, fileName) {
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const outputPath = `output/${fileName}_${timestamp}_color_coded.xlsx`;

    const workbook = new ExcelJS.Workbook();
    
    // Prepare data with issues detected
    const analyzedData = analyzedContent.map(item => {
      const contentText = this.extractContentText(item);
      const issues = this.detectIssues(item, contentText);
      const severity = this.determineSeverity(issues);
      const color = this.getColorForSeverity(severity);
      
      return {
        item,
        contentText,
        issues,
        severity,
        color,
        hasIssues: issues.length > 0
      };
    });

    // Sheet 1: Issues Summary (only items with problems)
    this.createIssuesSheet(workbook, analyzedData.filter(d => d.hasIssues));
    
    // Sheet 2: Full Content (all items)
    this.createFullContentSheet(workbook, analyzedData);
    
    // Sheet 3: Color Legend
    this.addLegendSheet(workbook);

    // Save file
    await workbook.xlsx.writeFile(outputPath);
    console.log(`✅ Color-coded Excel saved to: ${outputPath}`);
    
    const issueCount = analyzedData.filter(d => d.hasIssues).length;
    console.log(`   📊 ${issueCount} items with issues, ${analyzedData.length - issueCount} items clean\n`);
    
    return outputPath;
  }

  createIssuesSheet(workbook, itemsWithIssues) {
    const worksheet = workbook.addWorksheet('⚠️ Issues Summary');

    // Simpler columns for issues view
    worksheet.columns = [
      { header: 'Severity', key: 'severity', width: 12 },
      { header: 'Content', key: 'content', width: 50 },
      { header: 'Issues', key: 'issues', width: 40 },
      { header: 'Category', key: 'category', width: 15 },
      { header: 'Location', key: 'path', width: 30 }
    ];

    // Style header row
    this.styleHeaderRow(worksheet.getRow(1));

    // Sort by severity (Critical > High > Medium > Low)
    const severityOrder = { 'Critical': 1, 'High': 2, 'Medium': 3, 'Low': 4 };
    const sortedItems = itemsWithIssues.sort((a, b) => {
      return (severityOrder[a.severity] || 99) - (severityOrder[b.severity] || 99);
    });

    // Add data rows with color coding
    sortedItems.forEach(data => {
      const { item, contentText, issues, severity, color } = data;
      
      const row = worksheet.addRow({
        severity: severity,
        content: contentText,
        issues: issues.join('; '),
        category: item.analysis?.category || '',
        path: item.path || item.name
      });

      // Apply background color to entire row
      if (color) {
        row.eachCell((cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: color }
          };
        });
      }

      // Bold severity column
      row.getCell('severity').font = { bold: true };
    });
  }

  createFullContentSheet(workbook, analyzedData) {
    const worksheet = workbook.addWorksheet('📋 Full Content');

    // Full columns for complete analysis
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 35 },
      { header: 'Name', key: 'name', width: 20 },
      { header: 'Type', key: 'type', width: 10 },
      { header: 'Path', key: 'path', width: 40 },
      { header: 'Content', key: 'content', width: 50 },
      { header: 'Category', key: 'category', width: 15 },
      { header: 'Tone', key: 'tone', width: 12 },
      { header: 'Purpose', key: 'purpose', width: 40 },
      { header: 'Issues', key: 'issues', width: 30 },
      { header: 'Severity', key: 'severity', width: 12 }
    ];

    // Style header row
    this.styleHeaderRow(worksheet.getRow(1));

    // Add data rows with color coding
    analyzedData.forEach(data => {
      const { item, contentText, issues, severity, color } = data;
      
      const row = worksheet.addRow({
        id: item.id,
        name: item.name,
        type: item.type,
        path: item.path,
        content: contentText,
        category: item.analysis?.category || '',
        tone: item.analysis?.tone || '',
        purpose: item.analysis?.purpose || '',
        issues: issues.join('; '),
        severity: severity
      });

      // Apply background color to entire row
      if (color) {
        row.eachCell((cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: color }
          };
        });
      }

      // Bold the issues column if there are issues
      if (issues.length > 0) {
        row.getCell('issues').font = { bold: true };
      }
    });
  }

  styleHeaderRow(headerRow) {
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4A90E2' }
    };
    headerRow.font = { color: { argb: 'FFFFFFFF' }, bold: true };
  }

  extractContentText(item) {
    if (Array.isArray(item.content)) {
      return item.content
        .filter(c => c.type === 'text')
        .map(c => c.value)
        .join(' ');
    }
    return item.content || '';
  }

  detectIssues(item, contentText) {
    const issues = [];
    const text = contentText.toLowerCase();

    // Check for honorifics
    if (/\b(mr\.|mrs\.|ms\.|dr\.|prof\.)/i.test(contentText)) {
      issues.push('Contains honorific');
    }

    // Check for lorem ipsum
    if (/lorem ipsum/i.test(text) || /dolor sit amet/i.test(text)) {
      issues.push('Lorem ipsum placeholder');
    }

    // Check for TODO/TBD
    if (/\b(todo|tbd|fixme|xxx)\b/i.test(text)) {
      issues.push('Placeholder text');
    }

    // Check button text length
    if (item.analysis?.category === 'button' && contentText.split(' ').length > 3) {
      issues.push('Button text too long (>3 words)');
    }

    // Check for inconsistent capitalization
    if (this.hasInconsistentCapitalization(contentText)) {
      issues.push('Inconsistent capitalization');
    }

    // Check for spelling (basic check)
    if (this.hasObviousSpellingError(contentText)) {
      issues.push('Possible spelling error');
    }

    // Tone inconsistency (if we have analysis)
    if (item.analysis?.tone === 'mixed') {
      issues.push('Inconsistent tone');
    }

    return issues;
  }

  hasInconsistentCapitalization(text) {
    // Check for mixed title case and sentence case issues
    const words = text.split(' ');
    if (words.length < 2) return false;

    // Check if it's mixing "Feature 1" with "Feature Two" style
    const hasNumbers = /\d/.test(text);
    const hasWrittenNumbers = /(one|two|three|four|five|six|seven|eight|nine|ten)/i.test(text);
    
    return hasNumbers && hasWrittenNumbers;
  }

  hasObviousSpellingError(text) {
    // Check for common typos
    const commonTypos = [
      /progrgess/i,  // progress
      /seperate/i,   // separate
      /recieve/i,    // receive
      /occured/i,    // occurred
      /untill/i,     // until
      /sucessful/i   // successful
    ];

    return commonTypos.some(pattern => pattern.test(text));
  }

  determineSeverity(issues) {
    if (issues.length === 0) return 'None';
    
    // Critical issues
    if (issues.some(i => i.includes('honorific'))) {
      return 'Critical';
    }

    // High priority
    if (issues.some(i => i.includes('Lorem ipsum') || i.includes('spelling'))) {
      return 'High';
    }

    // Medium priority
    if (issues.some(i => i.includes('Placeholder') || i.includes('too long'))) {
      return 'Medium';
    }

    // Low priority
    if (issues.some(i => i.includes('Inconsistent'))) {
      return 'Low';
    }

    return 'Low';
  }

  getColorForSeverity(severity) {
    switch (severity) {
      case 'Critical':
        return this.colors.critical;      // Red
      case 'High':
        return this.colors.placeholder;   // Yellow
      case 'Medium':
        return this.colors.longText;      // Blue
      case 'Low':
        return this.colors.inconsistency; // Orange
      case 'None':
        return null; // No color
      default:
        return this.colors.needsReview;   // Gray
    }
  }

  addLegendSheet(workbook) {
    const legend = workbook.addWorksheet('📖 Color Legend');

    legend.columns = [
      { header: 'Color', key: 'color', width: 15 },
      { header: 'Severity', key: 'severity', width: 15 },
      { header: 'Meaning', key: 'meaning', width: 50 }
    ];

    // Style header
    legend.getRow(1).font = { bold: true };

    const legendData = [
      { severity: 'Critical', meaning: 'Honorifics (Mr., Mrs., etc.) - Excludes users, must be removed', color: this.colors.critical },
      { severity: 'High', meaning: 'Lorem ipsum or spelling errors - Needs immediate attention', color: this.colors.placeholder },
      { severity: 'Medium', meaning: 'Placeholder text (TODO, TBD) or text too long', color: this.colors.longText },
      { severity: 'Low', meaning: 'Inconsistencies in tone, capitalization, or naming', color: this.colors.inconsistency },
      { severity: 'None', meaning: 'No issues detected - Good to go!', color: null }
    ];

    legendData.forEach(item => {
      const row = legend.addRow({
        color: item.severity,
        severity: item.severity,
        meaning: item.meaning
      });

      if (item.color) {
        row.eachCell((cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: item.color }
          };
        });
      }
      row.font = { bold: true };
    });

    // Add usage instructions
    legend.addRow({});
    legend.addRow({ color: 'INSTRUCTIONS', meaning: 'How to use this spreadsheet:' }).font = { bold: true, size: 12 };
    legend.addRow({ meaning: '📄 Sheet 1: Issues Summary - Shows only content with problems, sorted by severity' });
    legend.addRow({ meaning: '📄 Sheet 2: Full Content - Shows all scraped content with analysis' });
    legend.addRow({ meaning: '📄 Sheet 3: This legend with color coding guide' });
    legend.addRow({});
    legend.addRow({ meaning: '✅ Workflow:' }).font = { bold: true };
    legend.addRow({ meaning: '1. Start with "Issues Summary" sheet to focus on problems' });
    legend.addRow({ meaning: '2. Fix Critical (red) issues first - remove honorifics' });
    legend.addRow({ meaning: '3. Fix High (yellow) issues - correct spelling and remove lorem ipsum' });
    legend.addRow({ meaning: '4. Address Medium (blue) - replace placeholders, shorten long text' });
    legend.addRow({ meaning: '5. Review Low (orange) - fix inconsistencies' });
    legend.addRow({ meaning: '6. Use "Full Content" sheet for complete context if needed' });
  }
}module.exports = ColorCodedExcel;
