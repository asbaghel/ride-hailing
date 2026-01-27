# Deployment & Architecture Guide

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Layer                            │
│                   (Web Browser)                              │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTP/HTTPS
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                   Frontend Service                           │
│                  (React 18.2.0)                              │
│              Container: ride-hailing-frontend                │
│                   Port: 8089                                 │
│                 Base URL: localhost:8089                     │
└─────────────────────────┬───────────────────────────────────┘
                          │ REST API Calls
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Layer                                 │
│          ┌──────────────────────────────────┐                │
│          │   Backend API Service            │                │
│          │   (Express + TypeScript)          │                │
│          │  Container: ride-hailing-backend │                │
│          │      Port: 8000                  │                │
│          │   Base URL: localhost:8000       │                │
│          └──────────────┬───────────────────┘                │
│                         │ SQL Queries
│                         ▼
└─────────────────────────┬───────────────────────────────────┘
                          │
          ┌───────────────┴───────────────┐
          │                               │
          ▼                               ▼
┌─────────────────────┐        ┌────────────────────┐
│  Database Service   │        │  Admin Interface   │
│  (PostgreSQL 15)    │        │  (Adminer)         │
│ Port: 5432          │        │  Port: 8080        │
│                     │        │                    │
│ Tables:             │        │ Database manage    │
│ - rides             │        │ Tools              │
│ - drivers           │        │                    │
│ - trips             │        │ URL: localhost:8080│
│ - payments          │        │                    │
│ - driver_locations  │        │                    │
└─────────────────────┘        └────────────────────┘
```

## Container Network Architecture

```
Docker Network: ride-hailing-network
├── postgres (PostgreSQL)
│   ├── Hostname: postgres
│   ├── Port: 5432
│   ├── Health Check: Enabled
│   └── Volume: postgres_data
├── adminer
│   ├── Hostname: adminer
│   ├── Port: 8080
│   ├── Depends On: postgres (healthy)
│   └── Purpose: Database Admin
├── backend
│   ├── Hostname: backend
│   ├── Port: 8000
│   ├── Depends On: postgres (healthy)
│   ├── Environment Variables:
│   │   ├── DB_HOST=postgres
│   │   ├── DB_PORT=5432
│   │   ├── DB_NAME=ride_hailing_db
│   │   ├── DB_USER=ride_user
│   │   └── DB_PASSWORD=ride_password
│   └── Health Endpoint: /health
└── frontend
    ├── Hostname: frontend
    ├── Port: 8089
    ├── Depends On: backend
    ├── Environment: REACT_APP_API_URL=http://localhost:8000
    └── Routes Requests: To backend service
```

## Data Flow Diagram

```
User Action (Frontend)
    │
    ▼
React Component
    │
    ▼
Axios HTTP Request
    │
    ▼
Backend Express Route Handler
    │
    ├─ Validate Input
    │
    ├─ Start Database Transaction
    │
    ├─ Execute SQL Query
    │
    ├─ PostgreSQL Database
    │   ├─ Validate Constraints
    │   ├─ Execute Operation
    │   └─ Return Result
    │
    ├─ Commit/Rollback Transaction
    │
    ├─ Format Response
    │
    ▼
JSON Response to Frontend
    │
    ▼
React State Update
    │
    ▼
UI Re-render
```

## Deployment Scenarios

### Development Environment
```
Setup:
  - Docker Compose for local development
  - PostgreSQL in Docker container
  - Adminer for database management
  - Backend in development mode (ts-node)
  - Frontend with hot reload

Start:
  docker-compose up --build

Services:
  - Frontend: http://localhost:8089
  - Backend: http://localhost:8000
  - Adminer: http://localhost:8080
```

### Staging Environment
```
Setup:
  - Docker Compose on staging server
  - PostgreSQL with backups
  - Adminer for monitoring
  - Backend compiled TypeScript
  - Frontend production build

Environment Variables:
  - NODE_ENV=staging
  - Separate database credentials
  - Different API endpoints if needed

Services:
  - Frontend: http://staging.example.com
  - Backend: http://api-staging.example.com
  - Adminer: http://admin-staging.example.com (restricted)
```

### Production Environment
```
Setup:
  - Kubernetes Cluster (k8s)
  - Managed PostgreSQL (AWS RDS recommended)
  - Docker images from registry
  - Separate secrets management
  - New Relic monitoring

Kubernetes Services:
  - Frontend Deployment
  - Backend Deployment
  - PostgreSQL External Service
  - Ingress Controller
  - Load Balancer

Security:
  - SSL/TLS certificates
  - Private database network
  - API authentication (JWT)
  - Rate limiting
  - CORS properly configured
```

## Service Dependencies

```
Startup Order (Docker Compose):
1. PostgreSQL
   - Wait for TCP on port 5432
   - Initialize database schema
   - Health check: pg_isready

2. Adminer
   - After PostgreSQL is healthy
   - Connects to PostgreSQL on startup

3. Backend API
   - After PostgreSQL is healthy
   - Initializes database tables
   - Starts listening on port 8000

4. Frontend
   - After Backend is running
   - Can make API calls to backend
```

## Environment Configuration

### Backend (.env)
```
# Server
PORT=8000
NODE_ENV=development

# Database
DB_HOST=postgres
DB_PORT=5432
DB_NAME=ride_hailing_db
DB_USER=ride_user
DB_PASSWORD=ride_password

# Connection Pool
DB_POOL_MIN=2
DB_POOL_MAX=10
```

### Frontend (.env.local)
```
# API Configuration
REACT_APP_API_URL=http://localhost:8000
```

### Docker Compose (.env for composition)
```
DB_USER=ride_user
DB_PASSWORD=ride_password
DB_NAME=ride_hailing_db
```

## Database Connection Pool

```
Configuration:
  Minimum Connections: 2
  Maximum Connections: 10
  Idle Timeout: 30s
  Connection Timeout: 2s

Benefits:
  - Reduces connection overhead
  - Improves response time
  - Handles concurrent requests
  - Graceful degradation
```

## API Request Flow

```
Client Request
    │
    ▼
Express Middleware
  ├─ CORS validation
  ├─ Body parsing
  └─ Logging
    │
    ▼
Route Handler
  ├─ Parameter validation
  ├─ Input sanitization
  └─ Business logic
    │
    ▼
Database Operation
  ├─ Connection pool
  ├─ Query execution
  ├─ Transaction handling
  └─ Result mapping
    │
    ▼
Response Formatting
  ├─ Success/Error check
  ├─ Data transformation
  └─ Status code selection
    │
    ▼
Client Response (JSON)
```

## Error Handling Strategy

```
Request Validation
  ├─ Missing fields → 400 Bad Request
  ├─ Invalid format → 400 Bad Request
  └─ Type mismatch → 400 Bad Request

Resource Operations
  ├─ Not found → 404 Not Found
  ├─ Already exists → 409 Conflict
  └─ Permission denied → 403 Forbidden

Database Operations
  ├─ Connection error → 503 Service Unavailable
  ├─ Query error → 500 Internal Server Error
  └─ Constraint violation → 400/409 (contextual)

Server Errors
  ├─ Unhandled exception → 500 Internal Server Error
  └─ Service unavailable → 503 Service Unavailable
```

## Database Backup Strategy

```
Development:
  - No automated backup needed
  - Data can be recreated

Staging:
  - Daily backups
  - Keep 7 days
  - Test restore process

Production:
  - Hourly backups
  - Keep 30 days
  - Geographic redundancy
  - Automated restore tests
  - Point-in-time recovery
```

## Monitoring & Health Checks

```
Health Endpoints:
  GET /health
    - Backend availability
    - Database connectivity
    - Response time
    - Overall status

Docker Health Checks:
  postgres:
    command: pg_isready
    interval: 10s
    timeout: 5s

  backend:
    implicit: depends_on postgres health

  frontend:
    implicit: connectivity to backend
```

## Scaling Considerations

### Horizontal Scaling
```
Current Bottleneck: Single Backend Instance

Solution:
  - Deploy multiple backend instances
  - Use load balancer (Nginx/HAProxy)
  - Sticky sessions for rate limiting
  - Shared PostgreSQL pool

Kubernetes:
  - Multiple Backend Pods
  - Service with load balancing
  - Horizontal Pod Autoscaling
  - Resource limits per pod
```

### Vertical Scaling
```
Current Setup:
  - Development: 2GB RAM total
  
Production Needs:
  - PostgreSQL: 4-8GB RAM
  - Backend Pool: 2-4GB RAM per instance
  - Frontend: 256-512MB RAM per instance
  - Adminer: 256MB RAM
```

### Database Optimization
```
Current Optimizations:
  - Connection pooling
  - Query indexes
  - JSONB for flexible data

Future Optimizations:
  - Read replicas for reporting
  - Cache layer (Redis)
  - Full-text search
  - Partitioning large tables
```

## Disaster Recovery

```
Recovery Objectives:
  RTO (Recovery Time): < 1 hour
  RPO (Recovery Point): < 1 hour

Backup Locations:
  - Local: 7 days
  - Remote: 30 days
  - Archive: 1 year

Restore Process:
  1. Stop current services
  2. Restore database
  3. Verify data integrity
  4. Start services
  5. Run health checks
  6. Monitor for issues
```

## Security Considerations

```
Network:
  - Services on private network
  - Firewall rules
  - SSL/TLS for external communication

Database:
  - User authentication required
  - Query logging for audit
  - Encrypted connections (in production)
  - Backup encryption

API:
  - Input validation (Phase 3)
  - Rate limiting (Phase 3)
  - Authentication/Authorization (Phase 3)
  - HTTPS in production
  - CORS configuration
```

## Performance Targets

```
API Response Times:
  CREATE operation: < 100ms
  READ operation: < 50ms
  UPDATE operation: < 100ms
  DELETE operation: < 100ms

Database Query:
  Simple SELECT: < 10ms
  JOIN query: < 50ms
  Complex query: < 100ms

Throughput:
  Development: 100 requests/min
  Production: 10,000+ requests/min (with scaling)
```

## Checklist for Production

```
Infrastructure:
  ☐ Use managed PostgreSQL (AWS RDS)
  ☐ Set up Kubernetes cluster
  ☐ Configure load balancer
  ☐ Set up monitoring (New Relic)
  ☐ Configure logging (CloudWatch/ELK)
  ☐ Set up CI/CD pipeline

Security:
  ☐ Generate API keys
  ☐ Set up JWT authentication
  ☐ Configure CORS properly
  ☐ Enable HTTPS/SSL
  ☐ Set up WAF
  ☐ Database encryption

Operations:
  ☐ Database backups automated
  ☐ Health checks configured
  ☐ Alerts set up
  ☐ Runbooks created
  ☐ On-call rotation
  ☐ Disaster recovery tested

Deployment:
  ☐ Docker images signed
  ☐ Helm charts created
  ☐ Environment variables configured
  ☐ Secrets management set up
  ☐ Blue-green deployment ready
  ☐ Rollback strategy defined
```

## Migration Path

```
Phase 2 → Phase 3 Migration:
  1. Refactor backend for authentication
  2. Add JWT token generation
  3. Implement user service
  4. Add driver verification
  5. Set up email service
  6. Implement WebSocket server
  7. Deploy without downtime

Step-by-step:
  - Parallel running of old/new
  - Gradual traffic shift
  - Monitoring and rollback ready
  - Database schema migration
```
