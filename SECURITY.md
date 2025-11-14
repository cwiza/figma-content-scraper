# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in this project, please report it responsibly:

1. **DO NOT** open a public issue
2. Email the maintainer directly or use GitHub's private vulnerability reporting
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

We will respond within 48 hours and work with you to address the issue.

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| main    | :white_check_mark: |
| < 1.0   | :x:                |

## Security Measures

### Credential Protection

This project uses environment variables to protect sensitive credentials:

- ✅ `.env` file in `.gitignore`
- ✅ `.env.example` template without real values
- ✅ No hardcoded API keys or tokens
- ✅ Environment variable validation

### Dependencies

We monitor dependencies for vulnerabilities:

```bash
# Check for vulnerabilities
npm audit

# Fix automatically when possible
npm audit fix
```

Run `npm audit` before each release and after updating dependencies.

### GitHub Security Features

Enable these in your fork:

1. **Secret Scanning** - Detects committed secrets
   - Settings → Code security and analysis → Secret scanning
2. **Push Protection** - Blocks commits with secrets
   - Settings → Code security and analysis → Push protection
3. **Dependabot Alerts** - Monitors dependency vulnerabilities
   - Settings → Code security and analysis → Dependabot alerts
4. **Code Scanning** - Automated security analysis
   - Settings → Code security and analysis → Code scanning

## Best Practices for Users

### Setting Up Securely

1. **Never commit `.env`**
   ```bash
   # Verify it's ignored
   git check-ignore .env
   # Should output: .env
   ```

2. **Use strong, unique credentials**
   - Generate fresh API tokens for this project
   - Don't reuse tokens from other projects
   - Rotate tokens every 90 days

3. **Protect your local environment**
   ```bash
   # Set restrictive permissions on .env
   chmod 600 .env
   ```

### If Credentials are Exposed

1. **Immediately revoke/rotate** the credential
   - Figma: Settings → Personal Access Tokens → Revoke
   - Azure: Keys and Endpoint → Regenerate key

2. **Remove from git history**
   ```bash
   # Don't just delete the file - it's in history!
   git filter-repo --path .env --invert-paths
   git push --force
   ```

3. **Update affected systems** with new credentials

4. **Monitor for abuse**
   - Check Azure OpenAI usage logs
   - Review Figma account activity

### Figma API Security

- Use tokens with minimum required permissions
- Don't share tokens across teams
- Audit token usage periodically
- Revoke unused tokens

### Azure OpenAI Security

- Use separate keys for dev/prod
- Enable Azure Key Vault for production
- Set up budget alerts to detect abuse
- Review usage logs regularly
- Use managed identities when possible

## Output File Security

Generated reports may contain:
- UI text from your designs
- Internal naming conventions
- Unreleased features

**Recommendations:**
- Don't commit `output/` files to public repos
- Add sensitive outputs to `.gitignore`
- Review files before sharing
- Use `.gitignore` patterns:
  ```
  output/*.csv
  output/*.json
  output/*.xlsx
  ```

## Third-Party Services

This project connects to:

1. **Figma API** - Design file access
   - Official API, HTTPS only
   - Token-based authentication
   - Rate limited

2. **Azure OpenAI** - Content analysis
   - Microsoft Azure platform
   - API key authentication
   - HTTPS only
   - Data not used for training

## Compliance

### Data Privacy

- No telemetry or analytics
- Data stays between Figma ↔ Your machine ↔ Azure OpenAI
- Azure OpenAI data is not used for model training (per Azure policy)
- You own all input and output data

### GDPR/Privacy

If your Figma files contain personal data:
- Review output files before sharing
- Don't commit outputs with personal information
- Follow your organization's data handling policies

## Security Checklist

Before making your fork public:

- [ ] `.env` is in `.gitignore`
- [ ] No secrets in commit history
- [ ] `.env.example` has no real values
- [ ] GitHub Secret Scanning enabled
- [ ] Push Protection enabled
- [ ] Dependabot alerts enabled
- [ ] `npm audit` shows no high/critical issues
- [ ] Output files reviewed (no sensitive data)
- [ ] README security section reviewed
- [ ] Team members understand security practices

## Updates

This security policy was last updated: November 14, 2025

Check back periodically for updates as the project evolves.

## Questions

For security questions that don't involve vulnerabilities, open a public issue or discussion.

Never include credentials, tokens, or sensitive data in issues or PRs.
