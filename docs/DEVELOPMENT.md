# Development Guide

## Prerequisites

- **Python 3.9+** (for backend)
- **Node.js 18+** (for frontend)
- **Conda** (recommended for Python environment management)
- **Git** (for version control)

## Environment Setup

### Backend (Python/FastAPI)

1. **Create Conda Environment:**
```bash
cd backend
conda env create -f environment.yml
conda activate coingecko-dashboard
```

2. **Verify Installation:**
```bash
python --version  # Should be 3.9+
pip list  # Should show FastAPI, httpx, etc.
```

3. **Development Server:**
```bash
# From backend directory
uvicorn api.index:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`

### Frontend (Next.js)

1. **Install Dependencies:**
```bash
cd frontend
npm install
```

2. **Development Server:**
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

## Project Structure Deep Dive

### Backend Structure
```
backend/
├── api/
│   └── index.py           # Main FastAPI app with all endpoints
├── utils/
│   └── cache.py          # Caching utilities and decorators
├── environment.yml        # Conda environment specification
├── requirements.txt       # Python dependencies
└── .env.example          # Environment variables template
```

### Frontend Structure
```
frontend/
├── app/                   # Next.js App Router
│   ├── layout.tsx        # Root layout with providers
│   ├── page.tsx          # Main dashboard page
│   ├── globals.css       # Global styles
│   └── loading.tsx       # Loading UI
├── components/
│   ├── ui/               # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── dialog.tsx
│   │   └── ...
│   ├── CoinRow.tsx       # Individual coin display
│   ├── SearchAndFilters.tsx # Search/filter controls
│   ├── CoinChart.tsx     # Price chart component
│   └── ThemeToggle.tsx   # Dark/light mode toggle
├── lib/
│   ├── utils.ts          # Utility functions
│   ├── api.ts           # API client functions
│   └── types.ts         # TypeScript type definitions
├── hooks/
│   └── use-coins.ts     # Custom React hooks
└── styles/
    └── globals.css      # Additional global styles
```

## Development Workflow

### 1. Feature Development

1. **Create Feature Branch:**
```bash
git checkout -b feature/new-feature-name
```

2. **Backend Development:**
```bash
# Start backend dev server
cd backend
conda activate coingecko-dashboard
uvicorn api.index:app --reload
```

3. **Frontend Development:**
```bash
# Start frontend dev server (new terminal)
cd frontend
npm run dev
```

4. **Test Integration:**
- Backend API: `http://localhost:8000/docs` (FastAPI auto-docs)
- Frontend: `http://localhost:3000`

### 2. Code Quality

**Backend (Python):**
```bash
# Format code
black api/ utils/

# Lint code
flake8 api/ utils/

# Type checking
mypy api/ utils/
```

**Frontend (TypeScript):**
```bash
# Type checking
npm run type-check

# Lint
npm run lint

# Format
npm run format
```

### 3. Testing

**Backend Tests:**
```bash
# Run tests
pytest

# With coverage
pytest --cov=api --cov=utils
```

**Frontend Tests:**
```bash
# Run tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

## API Development

### Adding New Endpoints

1. **Define Endpoint in `api/index.py`:**
```python
@app.get("/api/new-endpoint")
@cache_response(ttl=60)  # Cache for 60 seconds
async def new_endpoint():
    # Implementation
    return {"data": "response"}
```

2. **Add Caching if Needed:**
```python
from utils.cache import cache_response, clear_cache

@cache_response(ttl=120, key_prefix="custom")
async def cached_endpoint():
    # Expensive operation
    pass
```

3. **Update Frontend API Client:**
```typescript
// lib/api.ts
export async function fetchNewEndpoint() {
  const response = await fetch('/api/new-endpoint');
  return response.json();
}
```

### CoinGecko API Integration

**Rate Limits:**
- Free tier: 10-50 calls/minute
- Respect rate limits with caching
- Handle rate limit errors gracefully

**Best Practices:**
```python
async with httpx.AsyncClient() as client:
    try:
        response = await client.get(
            "https://api.coingecko.com/api/v3/endpoint",
            timeout=10.0
        )
        response.raise_for_status()
        return response.json()
    except httpx.HTTPError as e:
        # Handle errors appropriately
        raise HTTPException(status_code=503, detail="API unavailable")
```

## Frontend Development

### Component Development

**1. Use shadcn/ui Components:**
```bash
# Add new UI component
npx shadcn-ui@latest add card
npx shadcn-ui@latest add chart
```

**2. Create Custom Components:**
```typescript
// components/NewComponent.tsx
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface NewComponentProps {
  data: SomeType;
}

export function NewComponent({ data }: NewComponentProps) {
  return (
    <Card>
      <CardHeader>
        <h3>Title</h3>
      </CardHeader>
      <CardContent>
        {/* Component content */}
      </CardContent>
    </Card>
  );
}
```

### State Management

**Using TanStack Query:**
```typescript
// hooks/use-coins.ts
import { useQuery } from '@tanstack/react-query';
import { fetchMarkets } from '@/lib/api';

export function useCoins() {
  return useQuery({
    queryKey: ['coins'],
    queryFn: fetchMarkets,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // 1 minute
  });
}
```

### Styling Guidelines

**1. Use Tailwind Classes:**
```typescript
<div className="flex items-center justify-between p-4 border rounded-lg">
  <span className="text-sm font-medium">Label</span>
  <span className="text-lg font-bold text-green-600">Value</span>
</div>
```

**2. Custom CSS Variables:**
```css
/* globals.css */
:root {
  --chart-primary: 34 197 94;
  --chart-secondary: 239 68 68;
}
```

## Debugging

### Backend Debugging

**1. Enable Debug Logging:**
```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

**2. Use FastAPI Debug Mode:**
```bash
uvicorn api.index:app --reload --log-level debug
```

**3. Interactive Debugging:**
```python
import pdb; pdb.set_trace()  # Add breakpoint
```

### Frontend Debugging

**1. Browser DevTools:**
- Network tab for API calls
- Console for errors
- React DevTools for component state

**2. Next.js Debug Mode:**
```bash
NODE_OPTIONS='--inspect' npm run dev
```

**3. TanStack Query DevTools:**
```typescript
// Already included in development mode
// Check browser for React Query tab
```

## Performance Optimization

### Backend Performance

**1. Async/Await:**
```python
# Good: Non-blocking
async def fetch_data():
    async with httpx.AsyncClient() as client:
        response = await client.get(url)
        return response.json()

# Bad: Blocking
def fetch_data():
    response = requests.get(url)
    return response.json()
```

**2. Connection Pooling:**
```python
# Reuse HTTP client
client = httpx.AsyncClient()
# Use client for multiple requests
await client.aclose()  # Clean up
```

### Frontend Performance

**1. Code Splitting:**
```typescript
// Dynamic imports for large components
const CoinChart = dynamic(() => import('./CoinChart'), {
  loading: () => <div>Loading chart...</div>
});
```

**2. Image Optimization:**
```typescript
import Image from 'next/image';

<Image
  src={coin.image}
  alt={coin.name}
  width={32}
  height={32}
  className="rounded-full"
/>
```

## Environment Variables

### Backend (.env)
```bash
# Optional: CoinGecko Pro API key
COINGECKO_API_KEY=your_api_key_here

# Cache settings
CACHE_TTL_MARKETS=30
CACHE_TTL_CHARTS=60
CACHE_TTL_TICKERS=30
```

### Frontend (.env.local)
```bash
# API base URL
NEXT_PUBLIC_API_URL=http://localhost:8000

# Development settings
NODE_ENV=development
```

## Common Issues & Solutions

### Backend Issues

**1. CORS Errors:**
```python
# Ensure CORS is properly configured
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**2. Cache Not Working:**
```python
# Check cache key uniqueness
@cache_response(ttl=60, key_prefix="unique_prefix")
```

### Frontend Issues

**1. Hydration Errors:**
```typescript
// Use dynamic imports for client-only components
const ClientOnlyComponent = dynamic(() => import('./Component'), {
  ssr: false
});
```

**2. API Calls Failing:**
```typescript
// Check API URL in development
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
```

## Deployment Preparation

**1. Build Testing:**
```bash
# Backend
cd backend && python -m pytest

# Frontend
cd frontend && npm run build
```

**2. Environment Variables:**
- Set production environment variables
- Update CORS origins for production domain
- Configure caching headers appropriately

**3. Performance Testing:**
```bash
# Test API endpoints
curl -w "%{time_total}" http://localhost:8000/api/markets

# Test frontend build
cd frontend && npm run build && npm start
```
