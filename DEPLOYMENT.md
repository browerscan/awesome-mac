# Deployment Guide - Awesome Mac

This guide covers deploying the Awesome Mac application to production environments.

## Table of Contents

1. [Environment Variables](#environment-variables)
2. [Vercel Deployment](#vercel-deployment)
3. [Docker Deployment](#docker-deployment)
4. [PostgreSQL Setup](#postgresql-setup)
5. [Health Checks](#health-checks)
6. [Build Verification](#build-verification)
7. [Troubleshooting](#troubleshooting)

---

## Environment Variables

### Required Variables

Copy `.env.production.example` to `.env.production` and configure:

```bash
cp .env.production.example .env.production
```

| Variable              | Description                      | Example                                    |
| --------------------- | -------------------------------- | ------------------------------------------ |
| `PAYLOAD_SECRET`      | Encryption secret (min 32 chars) | Generate with `openssl rand -base64 48`    |
| `DATABASE_URI`        | Database connection string       | `file:./data/payload.db` or PostgreSQL URI |
| `NEXT_PUBLIC_APP_URL` | Production application URL       | `https://your-domain.com`                  |

### Optional Variables

| Variable                         | Description                    | Default                              |
| -------------------------------- | ------------------------------ | ------------------------------------ |
| `SYNC_API_KEY`                   | Key for data sync endpoint     | Generate with `openssl rand -hex 32` |
| `GITHUB_TOKEN`                   | GitHub PAT for API rate limits | `ghp_...`                            |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID`  | Google Analytics ID            | `G-XXXXXXXXXX`                       |
| `GA_MEASUREMENT_PROTOCOL_SECRET` | GA Measurement Protocol secret | -                                    |
| `NEXT_PUBLIC_SENTRY_DSN`         | Sentry error tracking DSN      | -                                    |

---

## Vercel Deployment

### Quick Deploy

1. **Push to GitHub**

   ```bash
   git add .
   git commit -m "Deploy to Vercel"
   git push origin master
   ```

2. **Import Project in Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository

3. **Configure Environment Variables**
   In Vercel project settings, add:

   ```
   PAYLOAD_SECRET=<your-secret>
   DATABASE_URI=file:./data/payload.db
   NEXT_PUBLIC_APP_URL=https://your-project.vercel.app
   ```

4. **Deploy**
   - Vercel will automatically deploy on push to `master`

### Advanced Vercel Configuration

Create `vercel.json` for custom settings:

```json
{
  "buildCommand": "npm run build:data && npm run build:web",
  "devCommand": "npm run dev",
  "installCommand": "npm ci",
  "framework": "nextjs",
  "regions": ["iad1"],
  "functions": {
    "api/**/*.ts": {
      "maxDuration": 30
    }
  }
}
```

### Vercel Postgres (Optional)

For better performance, use Vercel Postgres:

1. Create a Postgres database in Vercel
2. Add the `@payloadcms/db-postgres` package
3. Update `DATABASE_URI` with Vercel connection string

---

## Docker Deployment

### Build Docker Image

```bash
# Build with default SQLite
docker build -t awesome-mac .

# Build with PostgreSQL support
docker build \
  --build-arg DATABASE_URI=postgresql://user:pass@host:5432/awesome_mac \
  -t awesome-mac .
```

### Run with Docker

```bash
# Basic run
docker run -d \
  --name awesome-mac \
  -p 3000:3000 \
  -e PAYLOAD_SECRET=your-secret-here \
  -e NEXT_PUBLIC_APP_URL=http://localhost:3000 \
  awesome-mac
```

### Run with Docker Compose

```bash
# Start with SQLite (default)
docker-compose up -d

# Start with PostgreSQL
docker-compose --profile postgres up -d

# View logs
docker-compose logs -f awesome-mac

# Stop
docker-compose down
```

### Docker Compose Services

| Service       | Port | Description                    |
| ------------- | ---- | ------------------------------ |
| `awesome-mac` | 3000 | Main application               |
| `postgres`    | 5432 | PostgreSQL database (optional) |
| `pgadmin`     | 5050 | Database admin UI (optional)   |

---

## PostgreSQL Setup

### Using Docker Compose

```bash
# Start PostgreSQL services
docker-compose --profile postgres up -d

# Connection string for .env.production
DATABASE_URI=postgresql://awesomemac:awesomemac_password@localhost:5432/awesome_mac
```

### Using Managed PostgreSQL

For production, consider managed services:

- **Vercel Postgres**: Integrated with Vercel deployment
- **Neon**: Serverless PostgreSQL with branching
- **Supabase**: PostgreSQL with auth and storage
- **AWS RDS**: Fully managed PostgreSQL

### PayloadCMS PostgreSQL Adapter

Update `src/payload.config.ts` for PostgreSQL:

```typescript
import { postgresAdapter } from '@payloadcms/db-postgres';

// Replace sqliteAdapter with:
db: postgresAdapter({
  pool: {
    connectionString: process.env.DATABASE_URI,
  },
}),
```

---

## Health Checks

### Health Endpoint

The application provides a comprehensive health check endpoint:

```
GET /api/health
```

**Response Example:**

```json
{
  "status": "healthy",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "uptime": 3600,
  "version": "1.11.0",
  "checks": {
    "database": {
      "status": "pass",
      "message": "Database connection successful",
      "responseTime": 45
    },
    "dataFiles": {
      "status": "pass",
      "files": {
        "awesomeMacJson": true,
        "awesomeMacZhJson": true
      }
    },
    "dataSync": {
      "status": "pass",
      "totalCategories": 42,
      "totalApps": 1250,
      "lastSync": null
    },
    "memory": {
      "status": "pass",
      "used": "45.23 MB",
      "total": "128.00 MB",
      "percentage": 35
    }
  }
}
```

### Health Status Codes

| Status      | HTTP Code | Description                   |
| ----------- | --------- | ----------------------------- |
| `healthy`   | 200       | All checks passing            |
| `degraded`  | 200       | Some warnings but operational |
| `unhealthy` | 503       | Critical failures             |

### Monitoring Endpoints

Additional monitoring endpoints:

| Endpoint      | Purpose                         |
| ------------- | ------------------------------- |
| `/api/health` | Full health check               |
| `/api/search` | Search API (with rate limiting) |
| `/api/vitals` | Web Vitals tracking             |

---

## Build Verification

### Pre-Build Checklist

Before deploying, verify:

```bash
# 1. Type checking
npm run typecheck

# 2. Linting
npm run lint

# 3. Tests
npm run test -- --run

# 4. Build data
npm run build:data

# 5. Build web application
npm run build:web
```

### Post-Build Verification

After building, check:

```bash
# Verify data files exist
ls -la dist/awesome-mac.json
ls -la dist/awesome-mac.zh.json

# Verify Next.js build
ls -la .next/static

# Check data integrity
node -e "
const data = require('./dist/awesome-mac.json');
console.log('Items in AST:', data.length);
"
```

### Sitemap Generation

The sitemap is automatically generated at build time. Verify:

```bash
# Test sitemap generation (requires build)
curl http://localhost:3000/sitemap.xml
```

---

## Troubleshooting

### Build Issues

**Problem: "Cannot find module '@/lib/data'"**

```bash
# Clear cache and reinstall
rm -rf node_modules .next
npm install
npm run build:web
```

**Problem: "dist/awesome-mac.json not found"**

```bash
# Build data files first
npm run build:data
npm run build:web
```

### Runtime Issues

**Problem: Database connection errors**

```bash
# Check database file permissions
ls -la data/payload.db

# Recreate database directory
mkdir -p data
chmod 755 data
```

**Problem: Health check returns 503**

Check each component:

```bash
# Database health
curl http://localhost:3000/api/health

# Check logs
docker-compose logs awesome-mac
```

### Performance Issues

**Slow search responses**

- Verify search index caching is working
- Check rate limiting configuration
- Monitor memory usage with `/api/health`

---

## Production Checklist

- [ ] All environment variables configured
- [ ] `PAYLOAD_SECRET` is unique and at least 32 characters
- [ ] Database backup strategy in place
- [ ] Health checks configured
- [ ] Error tracking (Sentry) configured
- [ ] Analytics (GA4) configured
- [ ] CDN/proxy caching configured
- [ ] SSL/HTTPS enabled
- [ ] Rate limiting configured
- [ ] Monitoring/alerts configured
- [ ] Backup strategy for database
- [ ] Rollback procedure documented

---

## Additional Resources

- [Next.js Deployment Docs](https://nextjs.org/docs/deployment)
- [PayloadCMS Deployment](https://payloadcms.com/docs/deployment/overview)
- [Vercel Platform](https://vercel.com/docs)
- [Docker Documentation](https://docs.docker.com/)
