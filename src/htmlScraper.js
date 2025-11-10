const fs = require('fs').promises;
const cheerio = require('cheerio');
const path = require('path');

class HtmlScraper {
  constructor() {
    this.textSelectors = [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'span', 'button', 'a',
      'label', 'input[placeholder]', 'textarea[placeholder]',
      'li', 'td', 'th', 'div[role="button"]'
    ];
  }

  async scrapeFile(htmlPath) {
    console.log(`🔍 Scraping HTML file: ${htmlPath}`);
    
    const html = await fs.readFile(htmlPath, 'utf-8');
    const $ = cheerio.load(html);
    const content = [];
    const fileName = path.basename(htmlPath);

    // Extract text content with selectors
    this.textSelectors.forEach(selector => {
      $(selector).each((index, element) => {
        const $el = $(element);
        let text = '';
        
        // Handle different element types
        if (selector.includes('[placeholder]')) {
          text = $el.attr('placeholder');
        } else {
          text = $el.text().trim();
        }

        if (text && text.length > 0) {
          // Generate a unique CSS selector for this element
          const cssPath = this.generateSelector($, element);
          
          content.push({
            id: `${fileName}_${content.length}`,
            selector: cssPath,
            tag: element.name,
            originalContent: text,
            attributes: {
              class: $el.attr('class') || '',
              id: $el.attr('id') || '',
              role: $el.attr('role') || ''
            }
          });
        }
      });
    });

    console.log(`✅ Found ${content.length} text elements\n`);
    
    return {
      fileName,
      filePath: htmlPath,
      content,
      stats: {
        totalItems: content.length,
        tags: this.countByTag(content)
      }
    };
  }

  async scrapeDirectory(dirPath) {
    console.log(`🔍 Scraping directory: ${dirPath}`);
    
    const files = await fs.readdir(dirPath);
    const htmlFiles = files.filter(f => f.endsWith('.html'));
    
    const allContent = [];
    
    for (const file of htmlFiles) {
      const filePath = path.join(dirPath, file);
      const result = await this.scrapeFile(filePath);
      allContent.push(...result.content);
    }

    return {
      directory: dirPath,
      filesScraped: htmlFiles.length,
      content: allContent,
      stats: {
        totalItems: allContent.length,
        tags: this.countByTag(allContent)
      }
    };
  }

  generateSelector($, element) {
    const $el = $(element);
    const parts = [];
    
    // Use ID if available (most specific)
    if ($el.attr('id')) {
      return `#${$el.attr('id')}`;
    }

    // Build path from element
    let current = element;
    while (current && current.name) {
      let selector = current.name;
      
      // Add class if exists
      const classes = $(current).attr('class');
      if (classes) {
        selector += `.${classes.split(' ').join('.')}`;
      }

      // Add nth-child if needed for uniqueness
      const siblings = $(current).parent().children(current.name);
      if (siblings.length > 1) {
        const index = siblings.index(current) + 1;
        selector += `:nth-child(${index})`;
      }

      parts.unshift(selector);
      
      // Stop at body or after 4 levels
      if (current.name === 'body' || parts.length >= 4) break;
      
      current = current.parent;
    }

    return parts.join(' > ');
  }

  countByTag(content) {
    const counts = {};
    content.forEach(item => {
      counts[item.tag] = (counts[item.tag] || 0) + 1;
    });
    return counts;
  }
}

module.exports = HtmlScraper;
