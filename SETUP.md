# CoinGecko Dashboard - Setup Instructions

## Quick Start Guide

This guide will help you set up and run the CoinGecko Dashboard locally.

### Prerequisites

- **Python 3.9+** (for backend)
- **Node.js 18+** (for frontend)  
- **Conda** (recommended for Python environment)
- **Git** (for version control)

### 1. Backend Setup (Python FastAPI)

```bash
# Navigate to backend directory
cd backend

# Create and activate conda environment
conda env create -f environment.yml
conda activate coingecko-dashboard

# Verify installation
python --version  # Should show Python 3.9+
pip list | grep fastapi  # Should show FastAPI and dependencies

# Optional: Create .env file for configuration
cp .env.example .env
# Edit .env with your CoinGecko API key (optional)

# Start development server
uvicorn api.index:app --reload --host 0.0.0.0 --port 8000
```

The FastAPI backend will be available at:
- API: http://localhost:8000
- Interactive docs: http://localhost:8000/api/docs
- Alternative docs: http://localhost:8000/api/redoc

### 2. Frontend Setup (Next.js)

```bash
# Navigate to frontend directory (new terminal)
cd frontend

# Install dependencies
npm install

# Optional: Create environment file
cp .env.local.example .env.local
# Edit .env.local if needed (defaults should work for local development)

# Start development server
npm run dev
```

The Next.js frontend will be available at:
- Frontend: http://localhost:3000

### 3. Test the Application

1. **Backend Health Check:**
   ```bash
   curl http://localhost:8000/api/health
   ```

2. **Frontend Access:**
   - Open http://localhost:3000 in your browser
   - You should see the cryptocurrency dashboard
   - Try searching for coins, clicking on rows to see charts

3. **API Endpoints:**
   - Markets: http://localhost:8000/api/markets
   - Chart (Bitcoin): http://localhost:8000/api/coins/bitcoin/chart
   - Tickers (VANRY): http://localhost:8000/api/tickers/vanry

## Features Implemented

### Backend (FastAPI)
- ✅ **3 Main Endpoints:**
  - `/api/markets` - Cryptocurrency market data with pagination
  - `/api/coins/{id}/chart` - Historical price charts (1D, 7D, 30D, 90D, 1Y)
  - `/api/tickers/{id}` - Trading pairs data (optimized for VANRY/USDT)

- ✅ **Caching System:**
  - TTL-based in-memory caching with cachetools
  - Configurable cache TTL (30s markets, 60s charts, 30s tickers)
  - Vercel CDN cache headers for edge caching

- ✅ **Error Handling:**
  - Graceful handling of CoinGecko API errors
  - Rate limit detection and appropriate responses
  - Detailed error messages with proper HTTP status codes

- ✅ **Performance:**
  - Async HTTP client with connection pooling
  - Compressed responses
  - Efficient data serialization

### Frontend (Next.js)
- ✅ **Modern UI Components:**
  - shadcn/ui component library
  - Dark/Light theme toggle with next-themes
  - Responsive design with Tailwind CSS

- ✅ **Cryptocurrency Dashboard:**
  - Real-time market data table with sorting
  - Search and filter functionality
  - Price change indicators with color coding
  - Market cap, volume, and supply information

- ✅ **Interactive Charts:**
  - Price charts with Recharts
  - Multiple timeframes (1D, 7D, 30D, 90D, 1Y)
  - Responsive chart with tooltips
  - Price change percentage calculation

- ✅ **Data Management:**
  - TanStack Query for server state management
  - Automatic background refetching
  - Error handling with retry logic
  - Loading states and skeletons

- ✅ **Special VANRY Features:**
  - USDT trading pairs filtering
  - Volume-based sorting
  - Trust score prioritization

## Development Workflow

### Running Both Services

1. **Terminal 1 (Backend):**
   ```bash
   cd backend
   conda activate coingecko-dashboard
   uvicorn api.index:app --reload
   ```

2. **Terminal 2 (Frontend):**
   ```bash
   cd frontend
   npm run dev
   ```

### Code Quality

**Backend:**
```bash
# Format code
black api/ utils/

# Lint code  
flake8 api/ utils/

# Type checking
mypy api/ utils/
```

**Frontend:**
```bash
# Type checking
npm run type-check

# Lint
npm run lint

# Format
npm run format
```

## Deployment

### Vercel (Recommended)

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Deploy:**
   ```bash
   # From project root
   vercel
   # Follow prompts to link/create project
   
   # Deploy to production
   vercel --prod
   ```

3. **Environment Variables:**
   Set these in Vercel dashboard:
   - `COINGECKO_API_KEY` (optional)
   - `CACHE_TTL_MARKETS=30`
   - `CACHE_TTL_CHARTS=60` 
   - `CACHE_TTL_TICKERS=30`

### Alternative Deployments

- **Docker:** Use the provided Dockerfile
- **Railway:** Auto-deploys from Git repository
- **Heroku:** Use Procfile for Python app

## Project Structure

```
SL2/
├── README.md                 # Main project documentation
├── SETUP.md                 # This setup guide
├── vercel.json              # Vercel deployment config
├── requirements.txt         # Python deps for Vercel
│
├── docs/                    # Detailed documentation
│   ├── API.md              # API documentation
│   ├── DEPLOYMENT.md       # Deployment guide
│   └── DEVELOPMENT.md      # Development guide
│
├── backend/                 # Python FastAPI backend
│   ├── environment.yml     # Conda environment
│   ├── requirements.txt    # Python dependencies
│   ├── .env.example       # Environment variables template
│   ├── api/
│   │   └── index.py       # Main FastAPI application
│   └── utils/
│       └── cache.py       # Caching utilities
│
└── frontend/               # Next.js frontend
    ├── package.json        # Node.js dependencies
    ├── next.config.js      # Next.js configuration
    ├── tailwind.config.js  # Tailwind CSS config
    ├── tsconfig.json       # TypeScript config
    ├── .env.local.example  # Frontend env template
    ├── app/               # Next.js App Router
    │   ├── layout.tsx     # Root layout
    │   ├── page.tsx       # Main dashboard
    │   ├── globals.css    # Global styles
    │   └── providers.tsx  # React providers
    ├── components/        # React components
    │   ├── ui/           # shadcn/ui components
    │   ├── CoinRow.tsx   # Coin table row
    │   ├── SearchAndFilters.tsx # Search/filter controls
    │   ├── CoinChart.tsx # Price chart component
    │   └── ThemeToggle.tsx # Dark/light toggle
    ├── lib/              # Utilities
    │   ├── utils.ts      # Helper functions
    │   ├── api.ts        # API client
    │   └── types.ts      # TypeScript types
    └── hooks/            # Custom React hooks
        └── use-coins.ts  # Data fetching hooks
```

## Troubleshooting

### Common Issues

1. **Port Already in Use:**
   ```bash
   # Kill process on port 8000
   lsof -ti:8000 | xargs kill -9
   
   # Or use different port
   uvicorn api.index:app --reload --port 8001
   ```

2. **CORS Errors:**
   - Ensure frontend URL is in CORS origins list
   - Check that API_URL in frontend matches backend URL

3. **Dependencies Issues:**
   ```bash
   # Backend: Recreate conda environment
   conda env remove -n coingecko-dashboard
   conda env create -f environment.yml
   
   # Frontend: Clear node_modules
   rm -rf node_modules package-lock.json
   npm install
   ```

4. **API Rate Limits:**
   - CoinGecko free tier has rate limits
   - Consider getting a Pro API key
   - Caching helps reduce API calls

### Performance Tips

1. **Backend:**
   - Monitor cache hit rates at `/api/admin/cache-stats`
   - Adjust TTL values based on usage patterns
   - Use CoinGecko Pro API for higher limits

2. **Frontend:**
   - Use React DevTools to monitor re-renders
   - Check Network tab for API call patterns
   - Monitor bundle size with `npm run analyze`

## Next Steps

1. **Enhancements:**
   - Add more chart types (candlestick, volume)
   - Implement portfolio tracking
   - Add price alerts
   - Include more market data

2. **Production:**
   - Set up monitoring (Sentry, LogRocket)
   - Add analytics (Vercel Analytics)
   - Implement rate limiting
   - Add comprehensive testing

3. **Scaling:**
   - Consider Redis for distributed caching
   - Implement database for user data
   - Add WebSocket for real-time updates
   - Optimize for mobile performance
