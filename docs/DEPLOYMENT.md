# Deployment Guide

## Overview

This application is optimized for deployment on Vercel, leveraging serverless functions for the FastAPI backend and static generation for the Next.js frontend.

## Vercel Deployment

### Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Vercel CLI**: Install globally
```bash
npm install -g vercel
```

### Quick Deployment

1. **Initialize Vercel Project:**
```bash
# From project root
vercel
```

2. **Follow CLI Prompts:**
- Link to existing project or create new
- Set project name
- Configure build settings

3. **Deploy:**
```bash
vercel --prod
```

### Manual Configuration

#### 1. Project Structure for Vercel

The project is structured to work with Vercel's conventions:

```
SL2/
├── api/                   # Python API (Vercel Functions)
│   └── index.py          # Main FastAPI app
├── frontend/             # Next.js app
│   ├── app/
│   ├── components/
│   └── package.json
├── vercel.json          # Vercel configuration
└── requirements.txt     # Python dependencies (root level)
```

#### 2. Vercel Configuration (`vercel.json`)

```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/index.py",
      "use": "@vercel/python",
      "config": {
        "maxLambdaSize": "15mb"
      }
    },
    {
      "src": "frontend/package.json",
      "use": "@vercel/next"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/index.py"
    },
    {
      "src": "/(.*)",
      "dest": "/frontend/$1"
    }
  ],
  "env": {
    "PYTHON_VERSION": "3.9"
  },
  "functions": {
    "api/index.py": {
      "maxDuration": 10
    }
  }
}
```

#### 3. Environment Variables

**Set via Vercel Dashboard or CLI:**

```bash
# Production environment variables
vercel env add COINGECKO_API_KEY production
vercel env add CACHE_TTL_MARKETS production
vercel env add CACHE_TTL_CHARTS production
vercel env add CACHE_TTL_TICKERS production
```

**Environment Variables:**
- `COINGECKO_API_KEY` (optional): CoinGecko Pro API key
- `CACHE_TTL_MARKETS`: Cache TTL for markets endpoint (default: 30)
- `CACHE_TTL_CHARTS`: Cache TTL for charts endpoint (default: 60)
- `CACHE_TTL_TICKERS`: Cache TTL for tickers endpoint (default: 30)

#### 4. Build Configuration

**Frontend (`frontend/next.config.js`):**
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    domains: ['assets.coingecko.com'],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
```

**Backend Dependencies (`requirements.txt`):**
```
fastapi==0.104.1
httpx==0.25.2
cachetools==5.3.2
uvicorn==0.24.0
```

## Alternative Deployment Options

### 1. Docker Deployment

**Dockerfile:**
```dockerfile
# Multi-stage build
FROM python:3.9-slim as backend

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY api/ ./api/

FROM node:18-alpine as frontend

WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

FROM python:3.9-slim as production

WORKDIR /app
COPY --from=backend /app .
COPY --from=frontend /app/.next ./frontend/.next
COPY --from=frontend /app/public ./frontend/public

EXPOSE 8000
CMD ["uvicorn", "api.index:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Docker Compose:**
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "8000:8000"
    environment:
      - COINGECKO_API_KEY=${COINGECKO_API_KEY}
    restart: unless-stopped
```

### 2. Railway Deployment

1. **Connect Repository:**
   - Link GitHub repository to Railway
   - Railway auto-detects Python + Node.js

2. **Environment Variables:**
   - Set in Railway dashboard
   - Same variables as Vercel setup

3. **Deploy:**
   - Automatic deployment on git push
   - Railway handles build process

### 3. Heroku Deployment

**Procfile:**
```
web: uvicorn api.index:app --host 0.0.0.0 --port $PORT
```

**runtime.txt:**
```
python-3.9.18
```

**heroku.yml:**
```yaml
build:
  docker:
    web: Dockerfile
```

## Performance Optimization

### 1. CDN Configuration

**Vercel Edge Caching:**
```python
# In FastAPI endpoints
@app.get("/api/markets")
async def get_markets():
    response = JSONResponse(content=data)
    response.headers["Cache-Control"] = "public, max-age=30, stale-while-revalidate=60"
    response.headers["Vercel-CDN-Cache-Control"] = "max-age=30, s-maxage=30"
    return response
```

### 2. Image Optimization

**Next.js Image Optimization:**
```typescript
// Automatic optimization for CoinGecko images
<Image
  src={coin.image}
  alt={coin.name}
  width={32}
  height={32}
  priority={index < 10} // Prioritize first 10 images
/>
```

### 3. Bundle Optimization

**Frontend Bundle Analysis:**
```bash
# Analyze bundle size
npm run build
npm run analyze
```

**Code Splitting:**
```typescript
// Dynamic imports for heavy components
const CoinChart = dynamic(() => import('./CoinChart'), {
  loading: () => <ChartSkeleton />,
});
```

## Monitoring & Analytics

### 1. Vercel Analytics

**Enable in `frontend/app/layout.tsx`:**
```typescript
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

### 2. Error Monitoring

**Sentry Integration:**
```bash
npm install @sentry/nextjs @sentry/python
```

**Frontend (`sentry.client.config.js`):**
```javascript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

**Backend:**
```python
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration

sentry_sdk.init(
    dsn=os.getenv("SENTRY_DSN"),
    integrations=[FastApiIntegration()],
    environment=os.getenv("ENVIRONMENT", "production"),
)
```

### 3. Performance Monitoring

**Web Vitals:**
```typescript
// app/layout.tsx
import { SpeedInsights } from '@vercel/speed-insights/next';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
```

## Security Configuration

### 1. CORS Setup

**Production CORS:**
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://your-domain.vercel.app",
        "https://your-custom-domain.com"
    ],
    allow_credentials=True,
    allow_methods=["GET"],
    allow_headers=["*"],
)
```

### 2. Security Headers

**Next.js Security Headers:**
```javascript
// next.config.js
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};
```

### 3. Rate Limiting

**API Rate Limiting:**
```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.get("/api/markets")
@limiter.limit("30/minute")
async def get_markets(request: Request):
    # Endpoint implementation
    pass
```

## Troubleshooting

### Common Deployment Issues

**1. Python Dependencies:**
```bash
# Ensure requirements.txt is in root directory
# Pin exact versions for reproducible builds
fastapi==0.104.1
httpx==0.25.2
```

**2. Build Timeouts:**
```json
// vercel.json
{
  "functions": {
    "api/index.py": {
      "maxDuration": 10
    }
  }
}
```

**3. Memory Issues:**
```json
// vercel.json
{
  "builds": [
    {
      "src": "api/index.py",
      "use": "@vercel/python",
      "config": {
        "maxLambdaSize": "15mb"
      }
    }
  ]
}
```

### Debugging Production Issues

**1. Vercel Function Logs:**
```bash
vercel logs --follow
```

**2. Edge Network Testing:**
```bash
# Test from different regions
curl -H "Accept-Encoding: gzip" https://your-app.vercel.app/api/markets
```

**3. Performance Testing:**
```bash
# Load testing
ab -n 100 -c 10 https://your-app.vercel.app/api/markets
```

## Post-Deployment Checklist

- [ ] Verify all API endpoints work
- [ ] Test frontend functionality
- [ ] Check caching headers
- [ ] Validate CORS configuration
- [ ] Monitor error rates
- [ ] Test from different geographic locations
- [ ] Verify environment variables
- [ ] Check build logs for warnings
- [ ] Test mobile responsiveness
- [ ] Validate accessibility features
