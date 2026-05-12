# ROADMAP — CryptoTracker

## Phase 1: Foundation & Market Discovery ✅
- [x] Base architecture with Next.js & TailwindCSS
- [x] Integration with CCXT and Native DEX APIs
- [x] Real-time data caching (DataCache V5)
- [x] Automated symbol normalization logic

## Phase 2: Spot Arbitrage Perfecting ✅
- [x] Dedicated Spot Service & Collector (14 exchanges)
- [x] **Three-Tier Confidence Model** (Verified/Estimated/Raw)
- [x] Fallback withdrawal fee configuration for 90+ assets
- [x] **Smart Depth Estimation** logic (volume-based liquidity proxy)
- [x] Professional UI with stats cards, confidence filters, and sound alerts
- [x] Net-profit calculation with trading and network fees
- [x] **Transfer Status Verification** (deposit/withdraw open status)
- [x] **Data Coverage Boost** (fixed quoteVolume & lowered limits)
- [x] **Network Synonym Matching** (BSC=BEP20, etc.)
- [x] **Column Toggle UI** (Customizable table visibility)
- [x] **Net Spread % & Net USD Columns** (Nominal and percentage profitability)
- [x] **Max Vol & Max Qty Columns** (Visibility of liquidity and trade scale)
- [x] **Lighter DEX Integration** (First order-book DEX on Arbitrum)
- [x] **Vertex Protocol Integration** (High-liquidity Arbitrum DEX)
- [ ] **Orderly Network Integration** (Omnichain DEX infrastructure)

## Phase 3: Futures & Funding Rates 🔄
- [x] Real-time funding rate matrix
- [x] Perpetual futures spread detection
- [ ] Basis trade (Spot-Futures) identification
- [ ] Funding arbitrage execution strategies

## Phase 4: Advanced Whale Tracking & Analytics ✅
- [x] **Smart Money Scanner**: Multi-chain filtering engine (ETH, BSC, ARB, SOL, etc.)
- [x] **100% Data Accuracy**: Realized PnL, WinRate, and ROI via Moralis Profitability
- [x] **Portfolio Analytics**: Token holdings, distribution charts, and 24h price changes
- [x] **Deterministic Demo Mode**: Seamless usage even without API keys
- [x] **Global Stats Dashboard**: Real-time aggregated ecosystem metrics
- [ ] **Telegram Bot Signals**: Real-time notifications for tracked wallet actions
- [ ] **Profitability Charts**: PnL-over-time visualization in whale profiles (Phase 6)

## Phase 5: Reporting & Export ✅
- [x] Detailed CSV/JSON export service
- [x] Pro-grade arbitrage breakdown reports
- [x] History of captured signals

## Phase 6: Scaling & Automation 🔄
- [ ] **Profitability Charts**: PnL-over-time visualization in whale profiles.
- [ ] **Redis Caching**: Performance optimization for high-traffic scenarios.
- [ ] **AI-driven Sentiment**: Auto-detecting institutional accumulation patterns.
