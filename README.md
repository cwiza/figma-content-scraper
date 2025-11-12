# Figma Content Scraper

An AI-powered tool that extracts text content from Figma files and analyzes it using Azure OpenAI to provide insights on UX writing, tone consistency, and content patterns.

## What It Does

This tool:
1. **Extracts** all text strings from a Figma file via the Figma API
2. **Analyzes** each string with AI to determine:
   - Category (button, label, placeholder, heading, etc.)
   - Tone (formal, casual, friendly)
   - Purpose (what the text is meant to do)
   - UX patterns (design patterns used)
3. **Detects Issues** automatically:
   - Honorifics (Mr., Mrs., Dr., etc.)
   - Lorem ipsum and placeholder text
   - Spelling errors
   - Long button/navigation text (>3 words)
   - Plural inconsistencies (app vs apps, task vs tasks)
   - Capitalization issues
4. **Generates** color-coded reports:
   - **Excel workbook** with 3 sheets:
     - ⚠️ Issues Summary (problems only, sorted by severity)
     - 📋 Full Content (all text with complete analysis)
     - 📖 Color Legend (severity guide and workflow)
   - CSV and JSON formats for data processing
   - Corpus-level pattern analysis and UX recommendations

## Prerequisites

- **Node.js** 18+ installed
- **Figma account** with API access
- **Azure OpenAI** deployment (GPT-4 or GPT-4o recommended)

## Setup

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd figma-content-scraper
npm install
```

### 2. Get Your Figma Access Token

1. Log in to [Figma](https://figma.com)
2. Go to **Settings** → **Account** → **Personal Access Tokens**
3. Click **Generate new token**
4. Copy the token (starts with `figd_...`)

### 3. Get Your Azure OpenAI Credentials

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to your **Azure OpenAI resource**
3. Go to **Keys and Endpoint**
4. Copy:
   - **Endpoint** (e.g., `https://your-resource.cognitiveservices.azure.com/`)
   - **API Key**
5. Note your **Deployment Name** (e.g., `gpt-4o`, `gpt-4`)

### 4. Configure Environment Variables

Create a `.env` file in the project root:

```bash
# Figma API
FIGMA_ACCESS_TOKEN=figd_YOUR_TOKEN_HERE

# Azure OpenAI
AZURE_OPENAI_ENDPOINT=https://your-resource.cognitiveservices.azure.com/
AZURE_OPENAI_API_KEY=your_api_key_here
AZURE_OPENAI_DEPLOYMENT=gpt-4o
AZURE_OPENAI_API_VERSION=2025-01-01-preview

# Default Figma File (optional)
FIGMA_FILE_KEY=your_default_file_key

# AI Grounding Instructions (optional)
AI_SYSTEM_PROMPT=You are analyzing UI content for a [Your Product] application. Focus on consistency with [Your Design System] principles.
```

### 5. Get Your Figma File Key

From any Figma file URL:
```
https://figma.com/design/fb46HsIOMPb6yiiiFTbyGO/AI-testing
                              ^^^^^^^^^^^^^^^^^^^^
                              This is your file key
```

## Usage

### Basic Usage

Run with a specific Figma file:

```bash
npm start YOUR_FIGMA_FILE_KEY
```

Or use the default from `.env`:

```bash
npm start
```

### What Happens

The scraper will:
1. Fetch the Figma file structure
2. Extract all text content (only nodes with actual text)
3. Analyze each string with Azure OpenAI
4. Detect issues automatically (honorifics, long text, inconsistencies)
5. Generate timestamped output files in `output/`

### Output Files

Three files are created per run:

**Color-Coded Excel** (`output/[FileName]_[Timestamp]_color_coded.xlsx`):
- **Sheet 1: ⚠️ Issues Summary** - Only items with problems, sorted by severity
  - 🔴 Critical (red): Honorifics that must be removed
  - 🟡 High (yellow): Spelling errors, lorem ipsum
  - 🔵 Medium (blue): Placeholder text, long button/navigation text
  - 🟠 Low (orange): Capitalization and plural inconsistencies
- **Sheet 2: 📋 Full Content** - All scraped text with complete AI analysis
- **Sheet 3: 📖 Color Legend** - Severity guide and workflow instructions

**CSV Report** (`output/[FileName]_[Timestamp]_content_library.csv`):
```csv
ID,Name,Type,Path,Content,Category,Tone,Purpose
I1:3418...,Label,TEXT,Document > Page 1 > ...,Search resources...,placeholder,friendly,To guide users in searching...
```

**JSON Report** (`output/[FileName]_[Timestamp]_full_report.json`):
```json
{
  "metadata": { "fileName": "...", "totalItems": 104, ... },
  "statistics": { "categoryBreakdown": {...}, "toneDistribution": {...} },
  "patterns": { "commonPhrases": [...], "recommendations": [...] },
  "content": [ ... all analyzed items ... ]
}
```

## Customizing AI Analysis

### Grounding Instructions

Add custom instructions for the AI in `.env`:

```bash
# Brand voice guidelines
AI_SYSTEM_PROMPT=Analyze content for Acme Corp. Our brand voice is friendly, helpful, and conversational. Avoid jargon.

# Design system focus
AI_SYSTEM_PROMPT=Reference Material Design 3 guidelines. Check for consistency with Google's UX writing style guide.

# Accessibility focus
AI_SYSTEM_PROMPT=Prioritize WCAG AA compliance. Flag any text that may be unclear for screen readers or non-technical users.

# Multi-criteria
AI_SYSTEM_PROMPT=Analyze for: 1) Microsoft Fluent Design consistency, 2) Accessibility (WCAG AA), 3) Localization readiness
```

### Rate Limiting

The tool includes a 100ms delay between API calls. Adjust in `src/contentAnalyzer.js`:

```javascript
// Change this value (in milliseconds)
await new Promise(resolve => setTimeout(resolve, 100));
```

## Analyzing Results

### Review Issues in Excel

Open the color-coded Excel file and start with the **⚠️ Issues Summary** sheet:
1. Fix 🔴 Critical issues first (honorifics)
2. Address 🟡 High priority (spelling, lorem ipsum)
3. Handle 🔵 Medium issues (placeholders, long text)
4. Review 🟠 Low priority (inconsistencies)
5. Use **📋 Full Content** sheet for complete context

### Search for Specific Terms

```bash
# Case-insensitive search in CSV
grep -i "button" output/[filename].csv

# Count occurrences
grep -i "search" output/[filename].csv | wc -l
```

### Open in Spreadsheet

Open the CSV file in Excel, Google Sheets, or Numbers to:
- Sort by Category, Tone, or Purpose
- Filter for specific patterns
- Analyze tone consistency
- Identify content gaps

### Explore JSON for Patterns

The JSON file includes:
- `statistics` - Category and tone breakdown
- `patterns.commonPhrases` - Recurring text patterns
- `patterns.recommendations` - AI-generated UX suggestions
- `patterns.toneIssues` - Inconsistencies detected

## Project Structure

```
figma-content-scraper/
├── src/
│   ├── figmaScraper.js          # Fetches and extracts text from Figma
│   ├── contentAnalyzer.js       # AI analysis with Azure OpenAI
│   ├── contentLibrary.js        # Generates CSV/JSON reports
│   ├── colorCodedExcel.js       # Excel generation with issue detection
│   ├── htmlScraper.js           # HTML content extraction (optional)
│   ├── htmlUpdater.js           # Apply corrections to HTML (optional)
│   ├── contentDesignerAgent.js  # AI Foundry agent integration (optional)
│   └── index.js                 # Main orchestrator
├── output/                       # Generated reports (timestamped)
├── .env                          # Configuration (not committed)
├── .gitignore
├── package.json
└── README.md
```

## Troubleshooting

### "Error: 401 Unauthorized"

- Check your `FIGMA_ACCESS_TOKEN` is correct
- Ensure the token has access to the file (check sharing settings)

### "Error: Azure OpenAI authentication failed"

- Verify your `AZURE_OPENAI_ENDPOINT` uses the correct format:
  - ✅ `https://resource.cognitiveservices.azure.com/`
  - ❌ `https://resource.openai.azure.com/` (AI Foundry endpoint - different auth)
- Confirm `AZURE_OPENAI_API_KEY` is correct
- Check `AZURE_OPENAI_DEPLOYMENT` matches your deployment name exactly

### "No content found"

- The file might not contain any text nodes
- Try a different Figma file with visible text content

### Rate Limiting Errors

- Increase the delay in `contentAnalyzer.js`
- Check your Azure OpenAI quota and usage

## Advanced Usage

### Multiple File Analysis

Create a script to process multiple files:

```bash
#!/bin/bash
files=("file_key_1" "file_key_2" "file_key_3")
for file in "${files[@]}"; do
  npm start "$file"
done
```

### CI/CD Integration

Run as part of your design-to-code pipeline:

```yaml
# .github/workflows/analyze-figma.yml
name: Analyze Figma Content
on:
  schedule:
    - cron: '0 9 * * 1'  # Every Monday at 9am
jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm start
        env:
          FIGMA_ACCESS_TOKEN: ${{ secrets.FIGMA_TOKEN }}
          AZURE_OPENAI_API_KEY: ${{ secrets.AZURE_KEY }}
```

## HTML Content Scraping (Optional)

The feature branch also includes HTML scraping capabilities:

### Scrape HTML Files

```bash
npm run scrape-html path/to/your/file.html
```

This extracts text from HTML elements (headings, paragraphs, buttons, links) and generates a CSV with corrections column.

### Apply Corrections

1. Edit the CSV file and add corrections in the "Corrected Content" column
2. Apply changes back to HTML:

```bash
npm run apply-html path/to/corrections.csv path/to/file.html
```

The tool creates a backup before applying changes and validates all corrections.

## Features

✅ Extracts text-only content (no empty components)  
✅ AI-powered categorization and analysis  
✅ **Automatic issue detection:**
  - Honorifics (Mr., Mrs., Dr., etc.)
  - Lorem ipsum and placeholder text (TODO, TBD)
  - Spelling errors
  - Long button/navigation text (>3 words)
  - Plural inconsistencies (app/apps, task/tasks)
  - Capitalization issues  
✅ **Color-coded Excel with 3 sheets:**
  - Issues Summary (sorted by severity)
  - Full Content (complete analysis)
  - Color Legend (workflow guide)  
✅ Timestamped outputs (never overwrites previous runs)  
✅ Custom grounding instructions for domain-specific analysis  
✅ CSV and JSON export for data processing  
✅ Rate limiting for API protection  
✅ Progress tracking during analysis  
✅ **HTML scraping and correction workflow** (optional)  
✅ **AI Foundry agent integration** (optional)  

## Cost Considerations

- **Figma API**: Free for personal use
- **Azure OpenAI**: Charged per token
  - ~500-1000 tokens per text string analyzed
  - 104 strings ≈ 50K-100K tokens ≈ $0.50-$1.00 (GPT-4o pricing)

## Contributing

Issues and pull requests welcome! This tool is particularly useful for:
- UX writers auditing content
- Design teams ensuring consistency
- Accessibility teams checking clarity
- Localization teams preparing for translation

## License

MIT

---

**Built with:** Node.js, Figma API, Azure OpenAI, and ☕
