# Figma Content Scraper

An AI-powered tool that scrapes content from Figma files, analyzes it with Azure OpenAI, and generates organized content libraries.

## Features

- 🔍 **Figma Scraping**: Extracts text content, components, and metadata from Figma files
- 🤖 **AI Analysis**: Uses Azure OpenAI to categorize and analyze UI content
- 📊 **Content Library Generation**: Creates CSV and JSON reports with analyzed content
- 🎯 **Pattern Detection**: Identifies common phrases, tone issues, and naming conventions

## Setup

### Prerequisites

- Node.js 18+ 
- Figma Access Token
- Azure OpenAI credentials

### Local Development

1. **Clone and install dependencies**:
   ```bash
   git clone <your-repo>
   cd figma-content-scraper
   npm install
   ```

2. **Configure environment variables**:
   
   Edit `.env` file with your credentials:
   ```env
   FIGMA_ACCESS_TOKEN=your_figma_token
   FIGMA_FILE_KEY=your_figma_file_key
   AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
   AZURE_OPENAI_API_KEY=your_api_key
   AZURE_OPENAI_DEPLOYMENT=content-analyzer
   AZURE_OPENAI_API_VERSION=2024-02-15-preview
   ```

3. **Run the scraper**:
   ```bash
   # Use file key from .env
   npm start
   
   # Or pass file key as argument
   npm start YOUR_FIGMA_FILE_KEY
   
   # Development mode with auto-reload
   npm run dev
   ```

## Azure Deployment

### Infrastructure Setup (Already Completed)

The following Azure resources have been created:
- Resource Group: `figma-scraper-rg`
- App Service Plan: `figma-plan` (B1 tier)
- Web App: `figma-content-scraper-app`
- URL: https://figma-content-scraper-app.azurewebsites.net

### GitHub Actions Setup

1. **Add Azure Publish Profile to GitHub Secrets**:
   - Go to your GitHub repository
   - Navigate to Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `AZURE_WEBAPP_PUBLISH_PROFILE`
   - Value: Copy the contents of `azure-publish-profile.xml`
   - Click "Add secret"

2. **Initialize Git and Push**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

3. **Automatic Deployment**:
   - Every push to the `main` branch will trigger automatic deployment to Azure
   - Monitor deployment status in the Actions tab

## Project Structure

```
figma-content-scraper/
├── src/
│   ├── index.js           # Main entry point
│   ├── figmaScraper.js    # Figma API integration
│   ├── contentAnalyzer.js # Azure OpenAI analysis
│   └── contentLibrary.js  # Report generation
├── output/                # Generated CSV and JSON files
├── .github/
│   └── workflows/
│       └── deploy.yml     # GitHub Actions deployment
├── .env                   # Environment variables (not committed)
├── .gitignore
└── package.json
```

## Output Files

The scraper generates two types of files in the `output/` directory:

1. **CSV File**: `{fileName}_content_library.csv`
   - Spreadsheet with all content items
   - Includes categories, tone, and purpose analysis

2. **JSON File**: `{fileName}_full_report.json`
   - Complete report with metadata
   - Statistics and pattern analysis
   - Detailed content structure

## Usage Example

```bash
# Run with Figma file key
npm start fb46HsIOMPb6yiiiFTbyGO

# Output:
# 🚀 Starting Figma Content Scraper Agent
# 🔍 Fetching Figma file...
# 📄 Parsing content...
# ✅ Scraped "My Design System"
#    Found 42 content items
# 🤖 Analyzing content with AI...
#    Progress: 40/42
# ✅ CSV saved to: output/My_Design_System_content_library.csv
# ✅ Full report saved to: output/My_Design_System_full_report.json
# ✨ Content scraping complete!
```

## Security Notes

- Never commit `.env` file or `azure-publish-profile.xml` to version control
- Store sensitive credentials in GitHub Secrets for CI/CD
- Azure OpenAI API keys should be rotated regularly

## Troubleshooting

**API Rate Limiting**: The scraper includes a 100ms delay between API calls. Adjust in `contentAnalyzer.js` if needed.

**Authentication Errors**: Verify your Figma token has access to the file and Azure OpenAI credentials are correct.

**Memory Issues**: For very large Figma files, consider processing in batches.

## License

ISC
