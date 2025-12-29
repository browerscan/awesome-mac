# Cloudflare Pages Deployment Guide

## Prerequisites

### 1. Fork the Repository

1. Visit: https://github.com/jaywcjlove/awesome-mac
2. Click **Fork** button (top right)
3. Select your account (`browerscan`) as destination

### 2. Create Cloudflare API Token

1. Visit: https://dash.cloudflare.com/profile/api-tokens
2. Click **Create Token**
3. Use **Edit Cloudflare Workers** template
4. Configure:
   - **Account**: Your Cloudflare account
   - **Zone**: `All zones` (or specific)
   - **Permissions**: `Account > Cloudflare Pages > Edit`
5. Copy the token (format: 40-character alphanumeric string)

### 3. Get Your Cloudflare Account ID

1. Visit: https://dash.cloudflare.com
2. Select your domain/account
3. Copy **Account ID** from right sidebar (format: 32-character hex string)

---

## GitHub Secrets Configuration

After forking, go to your repo: **Settings > Secrets and variables > Actions**

Add the following secrets:

| Secret Name             | Value           | Source                |
| ----------------------- | --------------- | --------------------- |
| `CLOUDFLARE_ACCOUNT_ID` | Your Account ID | Cloudflare Dashboard  |
| `CLOUDFLARE_API_TOKEN`  | Your API Token  | Cloudflare API Tokens |

Optional secrets:
| Secret Name | Value |
|-------------|-------|
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | `G-XXXXXXXXXX` |
| `GA_MEASUREMENT_ID` | Your GA Measurement ID |

---

## Initial Push to Your Fork

After forroring, run these commands:

```bash
# Navigate to your project
cd /Volumes/SSD/dev/new/awesome-mac

# Add your fork as remote (replace if needed)
git remote add myfork https://github.com/browerscan/awesome-mac.git

# Push to your fork's master branch
git push myfork master -u

# Or if you want to force push (be careful!)
# git push myfork master -f --no-verify
```

---

## Verify GitHub Actions Workflow

1. Visit: https://github.com/browerscan/awesome-mac/actions
2. You should see **Deploy to Cloudflare Pages** workflow
3. On push to `master`, deployment starts automatically

---

## Local Deployment with Wrangler

```bash
# Install wrangler globally
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Build for Cloudflare
npm run build:cloudflare

# Deploy manually
wrangler pages deploy .next --project-name=awesome-mac
```

---

## Environment Variables

Create `wrangler.toml` locally (NOT in git):

```toml
name = "awesome-mac"
compatibility_date = "2024-01-01"
pages_build_output_dir = ".next"

[build]
command = "npm run build:cloudflare"
cwd = "."

[env.production]
vars = { NODE_ENV = "production" }

[compatibility_flags]
nodejs_compat = true
```

Or use environment variable:

```bash
export CLOUDFLARE_ACCOUNT_ID="your-account-id"
wrangler pages deploy .next --project-name=awesome-mac
```

---

## Deployment URLs

After successful deployment:

- **Preview**: `https://awesome-mac.pages.dev`
- **Custom Domain**: Configure in Cloudflare Dashboard > Pages > Custom Domains

---

## Troubleshooting

### Build Fails

```bash
# Test build locally
npm run build:cloudflare
```

### Token Issues

- Verify token has **Cloudflare Pages > Edit** permission
- Regenerate token if expired

### Account ID Not Found

- Check `CLOUDFLARE_ACCOUNT_ID` secret in GitHub
- Should be 32-character hex string

---

## Security Notes

- ✅ `wrangler.toml` is in `.gitignore`
- ✅ Secrets stored in GitHub Secrets (not in code)
- ✅ No tokens exposed in workflow files
- ✅ Account ID from environment variable

---

## Clean Remote URL (Remove Token)

After initial setup, remove token from remote URL:

```bash
git remote set-url myfork https://github.com/browerscan/awesome-mac.git
```

Future pushes will use GitHub SSH key or credential helper.
