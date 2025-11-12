# Setting Up AI Foundry Content Designer Agent

## Step 1: Create Agent in AI Foundry

1. Go to [Azure AI Foundry](https://ai.azure.com)
2. Navigate to your project or create a new one
3. Go to **Agents** section
4. Click **+ Create Agent**

## Step 2: Configure Your Agent

**Agent Name:** `Content Designer Specialist`

**Instructions (System Prompt):**
```
You are a Content Designer Specialist expert who reviews UI content for quality and consistency.

Your role is to:
1. Flag violations with color-coded severity:
   - 🔴 HIGH: Honorifics (Mr., Mrs., Ms., Dr.) - these exclude users and should be removed
   - 🟡 MEDIUM: Lorem ipsum or placeholder text - needs real content
   - 🟠 LOW: Inconsistencies in tone, capitalization, naming patterns

2. Provide UX writing best practices:
   - Button text should be 1-3 words, action-oriented
   - Headings should be clear and scannable
   - Error messages should be helpful and specific
   - Placeholders should guide without patronizing

3. Suggest specific improvements with rationale

4. Check for:
   - Consistent tone across all content
   - Appropriate capitalization (sentence case vs title case)
   - Clear, concise language
   - Accessibility concerns (screen reader clarity)
   - Localization readiness (avoid idioms, cultural references)

Format your response with:
- Clear sections for violations and recommendations
- Use emojis for severity indicators
- Provide specific examples and rewrites
- Explain the "why" behind each recommendation
```

**Model:** GPT-4o or GPT-4

**Temperature:** 0.3 (for consistency)

## Step 3: Get Your Credentials

After creating the agent:

1. **Project Endpoint:**
   - Go to your AI Foundry project settings
   - Copy the endpoint URL (e.g., `https://your-project.cognitiveservices.azure.com/`)

2. **Agent ID:**
   - Go to your agent details
   - Copy the Agent ID (usually starts with `asst_`)

## Step 4: Update .env

Add to your `.env` file:

```bash
# AI Foundry Content Designer Agent
AI_FOUNDRY_PROJECT_ENDPOINT=https://your-project.cognitiveservices.azure.com/
AI_FOUNDRY_AGENT_ID=asst_your_agent_id
```

## Step 5: Authenticate

The agent uses `DefaultAzureCredential`, so you need to be logged in:

```bash
az login
```

Or set up a service principal for production use.

## Step 6: Test It

**Review HTML content:**
```bash
npm run review-agent test/sample.html
```

**Review Figma content:**
```bash
npm run review-agent YOUR_FIGMA_FILE_KEY
```

## What the Agent Does

The Content Designer Specialist will:
- ✅ Review all scraped content
- 🔍 Identify violations (honorifics, lorem ipsum, inconsistencies)
- 💡 Provide specific recommendations
- 📊 Generate a detailed report with severity levels
- 💾 Save results to JSON for tracking

## Example Output

```
📊 AGENT REVIEW RESULTS
========================

🎯 SUMMARY
Total Violations: 7
  🔴 High Severity: 3 (honorifics)
  🟡 Medium Severity: 2 (lorem ipsum)
  🟠 Low Severity: 2 (inconsistencies)
💡 Recommendations: 5

📝 DETAILED REVIEW
==================
🔴 HIGH SEVERITY VIOLATIONS:
- Row 8: "Contact Mr. Smith" - Remove honorific, use "Contact John Smith" or just "Contact us"
- Row 9: "Mrs. Johnson" - Use first and last name without honorific

🟡 MEDIUM SEVERITY:
- Row 7: Contains lorem ipsum placeholder - Replace with actual content
- Row 10: "Lorem ipsum dolor sit amet" - Write meaningful text

🟠 LOW SEVERITY:
- Inconsistent capitalization: "Feature 1" vs "Feature Two" vs "Third Feature"
- Button text too long: "Sign in with a different account" → "Use another account"

💡 RECOMMENDATIONS:
1. Standardize feature naming: Use either "Feature 1, 2, 3" or spell out all numbers
2. Keep button text action-focused and under 3 words
3. Replace all placeholder text with real content before launch
4. Use inclusive language - avoid gendered honorifics
5. Maintain consistent tone across all copy
```

## Workflow Integration

**Complete workflow:**
1. Scrape content: `npm start` (Figma) or `npm run scrape-html` (HTML)
2. Review with agent: `npm run review-agent [file]`
3. Edit CSV with corrections
4. Apply corrections: `npm run apply-html` (for HTML files)

## Troubleshooting

**"Authentication failed"**
- Run `az login` to authenticate
- Or set up service principal credentials

**"Agent not found"**
- Check your AI_FOUNDRY_AGENT_ID is correct
- Ensure the agent is deployed in your project

**"Project endpoint invalid"**
- Verify AI_FOUNDRY_PROJECT_ENDPOINT format
- Should end with `.cognitiveservices.azure.com/`

## Advanced: Customizing Agent Behavior

You can customize the agent's grounding instructions in AI Foundry to:
- Focus on specific brand voice guidelines
- Enforce design system rules
- Check against style guides
- Add domain-specific terminology checks
