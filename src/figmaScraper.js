const axios = require('axios');

class FigmaScraper {
  constructor(accessToken) {
    this.accessToken = accessToken;
    this.baseUrl = 'https://api.figma.com/v1';
  }

  async scrapeFile(fileKey) {
    try {
      console.log('🔍 Fetching Figma file...');
      const response = await axios.get(`${this.baseUrl}/files/${fileKey}`, {
        headers: { 'X-Figma-Token': this.accessToken }
      });

      console.log('📄 Parsing content...');
      const content = this.extractContent(response.data.document);
      
      return {
        fileName: response.data.name,
        lastModified: response.data.lastModified,
        content: content,
        stats: this.generateStats(content)
      };
    } catch (error) {
      throw new Error(`Figma API Error: ${error.message}`);
    }
  }

  extractContent(node, path = [], allContent = []) {
    // Extract text content
    if (node.characters) {
      const contentItem = {
        id: node.id,
        name: node.name,
        type: node.type,
        path: path.join(' > '),
        content: [{
          type: 'text',
          value: node.characters,
          style: node.style
        }]
      };
      
      allContent.push(contentItem);
    }

    // Recursively process children
    if (node.children) {
      node.children.forEach(child => {
        this.extractContent(child, [...path, node.name], allContent);
      });
    }

    return allContent;
  }

  generateStats(content) {
    const stats = {
      totalItems: content.length,
      byType: {},
      uniqueStrings: new Set(),
      duplicates: []
    };

    content.forEach(item => {
      stats.byType[item.type] = (stats.byType[item.type] || 0) + 1;
      
      item.content.forEach(c => {
        if (c.type === 'text') {
          const text = c.value.trim();
          if (stats.uniqueStrings.has(text)) {
            stats.duplicates.push(text);
          }
          stats.uniqueStrings.add(text);
        }
      });
    });

    stats.uniqueStrings = stats.uniqueStrings.size;
    return stats;
  }
}

module.exports = FigmaScraper;
