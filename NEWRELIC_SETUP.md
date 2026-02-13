# New Relic Integration Setup Guide

## Overview
New Relic APM agent is now integrated into the ride-hailing backend to monitor:
- API response times and throughput
- Database query performance
- Error tracking and alerts
- Custom business metrics
- Infrastructure metrics (CPU, memory, disk)

## Quick Setup (5 minutes)

### 1. Create New Relic Account
- Go to https://newrelic.com/signup (free tier available)
- Sign up and create an account

### 2. Get Your License Key
1. Log into New Relic dashboard
2. Go to **Admin > API Keys** (or https://one.newrelic.com/admin-portal/api-keys/overview)
3. Copy your **INGEST - LICENSE** key

### 3. Set Environment Variable
Create a `.env` file in the project root:
```bash
# Copy from .env.example
cp .env.example .env

# Edit .env and add your license key
NEW_RELIC_LICENSE_KEY=your_actual_license_key_here
```

Or set directly in docker-compose override:
```bash
export NEW_RELIC_LICENSE_KEY="your_actual_license_key_here"
```

### 4. Restart Backend Container
```bash
docker-compose down
docker-compose up -d backend
```

### 5. Verify Connection
Check logs:
```bash
docker logs ride-hailing-backend
```

Look for: `✓ Connected to New Relic` or similar confirmation messages

## What Gets Monitored

### Automatically Collected
- ✅ HTTP request/response times
- ✅ API endpoint performance
- ✅ Database queries (PostgreSQL)
- ✅ Error rates and exceptions
- ✅ Memory and CPU usage
- ✅ Ride matching requests
- ✅ Driver acceptance latency
- ✅ Payment transactions

### Custom Metrics (Optional)
You can add custom metrics by using New Relic's API:

```javascript
// In RideStatus.js or other components
const newrelic = require('newrelic');

// Record custom metric
newrelic.recordMetric('Custom/RideCreated', 1);
newrelic.recordMetric('Custom/MatchingTime', duration_ms);
```

## Accessing Your Data

### View Metrics
1. Go to https://one.newrelic.com
2. Click **APM** in the left sidebar
3. Select your app: **ride-hailing-api**
4. Browse:
   - **Overview** - App health summary
   - **Transactions** - Slowest API endpoints
   - **Databases** - Query performance
   - **Errors** - Error traces and frequency

### Set Up Alerts
1. In New Relic UI → **Alerts**
2. Create alert policies for:
   - High error rate (> 5%)
   - Slow response time (> 1000ms)
   - CPU usage (> 80%)

## File Changes Made

```
backend/
├── package.json              (added: "newrelic": "^11.0.0")
├── src/index.ts              (added: require('newrelic') at top)
└── newrelic.js              (NEW: configuration file)

docker-compose.yml            (added: NEW_RELIC_LICENSE_KEY env vars)

.env.example                 (NEW: template with New Relic config)
```

## Troubleshooting

### License Key Not Set
If you see: `License key not set`, add to `.env`:
```
NEW_RELIC_LICENSE_KEY=your_key
```

### Agent Not Connecting
Check backend logs:
```bash
docker logs ride-hailing-backend | grep -i newrelic
```

### Disable New Relic (Optional)
Set in `.env`:
```
NEW_RELIC_LICENSE_KEY=
```
Agent will start in "NoOp" mode (no overhead, no monitoring)

## Free Tier Limits
- 100 GB ingest/month
- 1 month data retention
- 1 user account
- Full feature access

## Next Steps

1. ✅ Add license key to `.env`
2. ✅ Restart containers
3. ✅ Create some test rides to generate data
4. ✅ Wait 2-3 minutes for data to appear
5. ✅ Check New Relic dashboard for metrics
6. ✅ Set up alerts for critical thresholds

## Documentation
- New Relic Node.js Agent: https://docs.newrelic.com/docs/agents/nodejs-agent/
- API Keys: https://docs.newrelic.com/docs/apis/intro-apis/new-relic-api-keys/
- Browser Agent (optional): https://docs.newrelic.com/docs/browser/browser-monitoring/
