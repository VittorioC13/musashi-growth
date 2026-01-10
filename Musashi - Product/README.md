# MUSASHI - Prediction Market Platform

A Kalshi-inspired prediction market for crypto events with real-time trading simulation and live price updates.

![Musashi Logo](frontend/public/katana-logo.svg)

## 🎯 Features

- **Real-time Price Updates** - Server-Sent Events (SSE) for live market data
- **Simulated Trading** - Bot traders create realistic market activity
- **Price Charts** - 7-day price history with dual YES/NO lines
- **Featured Markets** - Highlighting trending predictions
- **Order Book** - Full order matching engine
- **User Portfolio** - Track positions and P&L
- **Modern UI** - Kalshi-inspired dark theme design

## 🚀 Quick Start

### Prerequisites

- Node.js 16+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/YOUR_USERNAME/musashi.git
cd musashi
```

2. Install backend dependencies:
```bash
cd backend
npm install
```

3. Install frontend dependencies:
```bash
cd ../frontend
npm install
```

### Running Locally

1. Start the backend (port 3001):
```bash
cd backend
npm run dev
```

2. Start the frontend (port 5173):
```bash
cd frontend
npm run dev
```

3. Open http://localhost:5173 in your browser

## 📊 Test Accounts

Login with these pre-seeded accounts (password: `password123`):

| Email | Balance | Description |
|-------|---------|-------------|
| alice@test.com | $1000 | Has YES orders on BTC market |
| bob@test.com | $1000 | Has NO orders on BTC market |
| charlie@test.com | $1000 | Fresh account |

## 🏗️ Tech Stack

### Backend
- Node.js + Express
- SQLite (sql.js) - In-memory database
- JWT Authentication
- Server-Sent Events for real-time updates

### Frontend
- React 18
- Vite
- React Router
- Recharts (price charts)
- Custom SSE hook for live updates

## 🎨 Design

- Inspired by Kalshi's professional UI
- Dark theme with accent colors
- Responsive grid layout (4 columns)
- Featured market section with live chart
- Real-time price animations

## 📁 Project Structure

```
musashi/
├── backend/
│   ├── src/
│   │   ├── database.js          # SQLite setup
│   │   ├── index.js             # Express server
│   │   ├── routes/              # API endpoints
│   │   │   ├── auth.js
│   │   │   ├── markets.js
│   │   │   ├── orders.js
│   │   │   ├── portfolio.js
│   │   │   └── realtime.js      # SSE endpoint
│   │   ├── services/
│   │   │   ├── matchingEngine.js
│   │   │   └── simulationService.js  # Bot trading
│   │   └── middleware/
│   │       └── auth.js
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Navbar.jsx
    │   │   ├── OrderBook.jsx
    │   │   ├── TradeForm.jsx
    │   │   └── PriceChart.jsx   # Dual-line chart
    │   ├── pages/
    │   │   ├── Home.jsx          # Featured + grid layout
    │   │   ├── Market.jsx
    │   │   ├── Portfolio.jsx
    │   │   ├── Login.jsx
    │   │   └── Register.jsx
    │   ├── hooks/
    │   │   └── useRealtime.js    # SSE hook
    │   ├── context/
    │   │   └── AuthContext.jsx
    │   ├── App.jsx
    │   └── App.css
    └── package.json
```

## 🔄 How It Works

### Real-time Simulation
- Bot traders place orders every 3 seconds
- Prices move with random walk + mean reversion
- All trades are recorded in price history
- SSE broadcasts updates to all connected clients

### Price Discovery
- YES price + NO price = 100¢
- Order matching at compatible prices
- Last trade price becomes current market price
- Charts show both YES and NO price movements

### Trading
1. Login or create account
2. Browse markets on homepage
3. Click a market to see details + chart
4. Place YES or NO orders
5. Orders match when prices align
6. View positions in portfolio

## 🌐 Deployment

### Vercel (Frontend + Backend)
1. Connect GitHub repo to Vercel
2. Set root directory to `musashi`
3. Build settings:
   - Build Command: `cd frontend && npm install && npm run build`
   - Output Directory: `frontend/dist`
4. Add environment variables (if needed)

## 📝 License

MIT License - feel free to use for your own projects!

## 🙏 Credits

- Inspired by [Kalshi](https://kalshi.com)
- Built with ❤️ using React and Node.js
- Katana logo design
