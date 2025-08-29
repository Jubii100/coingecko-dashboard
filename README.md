# CoinGecko Crypto Dashboard

A modern cryptocurrency dashboard built with Next.js and FastAPI, featuring real-time data from CoinGecko API.

## Project Overview

This is a Vercel-deployable Single Page Application (SPA) that displays cryptocurrency market data with interactive charts. The application consists of:

- **Frontend**: Next.js 14 with TypeScript, shadcn/ui, TanStack Query, and Recharts
- **Backend**: FastAPI with caching and CoinGecko API integration
- **Deployment**: Optimized for Vercel with CDN caching

## Features

- 📊 Real-time cryptocurrency market data
- 🔍 Search and filter functionality
- 📈 Interactive price charts with multiple timeframes
- 🌙 Dark/Light theme toggle
- ⚡ Optimized caching (TTL + CDN)
- 📱 Responsive design
- 🎯 Focus on VANRY/USDT pair with volume-based ticker filtering

## Architecture

### Frontend Stack
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type safety
- **shadcn/ui**: Modern UI components
- **TanStack Query**: Data fetching and caching
- **Recharts**: Chart visualization
- **Tailwind CSS**: Styling

### Backend Stack
- **FastAPI**: High-performance Python API
- **httpx**: Async HTTP client for CoinGecko API
- **cachetools**: TTL-based caching
- **Vercel**: Serverless deployment

### API Endpoints
- `GET /api/markets` - List of cryptocurrencies with market data
- `GET /api/coins/:id/chart` - Historical price data for charts
- `GET /api/tickers/:coin` - Trading pairs data (filtered for USDT pairs)

## Project Structure

```
SL2/
├── README.md
├── docs/                    # Documentation
│   ├── API.md              # API documentation
│   ├── DEPLOYMENT.md       # Deployment guide
│   └── DEVELOPMENT.md      # Development setup
├── backend/                # Python FastAPI backend
│   ├── environment.yml     # Conda environment
│   ├── requirements.txt    # Python dependencies
│   ├── api/
│   │   └── index.py       # Main FastAPI application
│   └── utils/
│       └── cache.py       # Caching utilities
├── frontend/               # Next.js frontend
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.js
│   ├── components.json     # shadcn/ui config
│   ├── app/               # Next.js App Router
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── components/        # React components
│   │   ├── ui/           # shadcn/ui components
│   │   ├── CoinRow.tsx
│   │   ├── SearchAndFilters.tsx
│   │   ├── CoinChart.tsx
│   │   └── ThemeToggle.tsx
│   └── lib/              # Utilities
│       ├── utils.ts
│       └── api.ts
└── vercel.json            # Vercel configuration
```

## Quick Start

### Backend Setup (Python)

1. Create and activate conda environment:
```bash
cd backend
conda env create -f environment.yml
conda activate coingecko-dashboard
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

### Frontend Setup (Node.js)

1. Install dependencies:
```bash
cd frontend
npm install
```

2. Run development server:
```bash
npm run dev
```

### Deployment

Deploy to Vercel with a single command:
```bash
vercel --prod
```

## Development

See [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) for detailed development instructions.

## API Documentation

See [docs/API.md](docs/API.md) for complete API documentation.

## Deployment Guide

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for deployment instructions and configuration.
