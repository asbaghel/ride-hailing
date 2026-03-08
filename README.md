# Ride Hailing Application

A modern ride-hailing platform built with React, Node.js, TypeScript, and Docker.

## 🚀 Quick Start

### Using Docker Compose (Recommended)
```bash
docker-compose up --build
```

#### Services will be available at:
- **Frontend**: http://localhost:8089
- **Backend API**: http://localhost:8000
- **Database Admin (Adminer)**: http://localhost:8080
- **Health Check**: http://localhost:8000/health

### Local Development

#### Backend
```bash
cd backend
npm install
npm run dev
# API runs on http://localhost:8000
```

#### Frontend
```bash
cd frontend
npm install
npm start
# App runs on http://localhost:3000
```

## 📁 Project Structure

```
ride-hailing/
├── frontend/                 # React application
│   ├── src/                  # React components and styles
│   ├── public/               # Static assets
│   ├── Dockerfile            # Frontend Docker config
│   └── package.json          # Dependencies
├── backend/                  # TypeScript Node.js API
│   ├── src/
│   │   ├── index.ts          # Express server
│   │   ├── database/         # Database connection
│   │   ├── routes/           # API endpoints
│   │   └── types/            # TypeScript types
│   ├── Dockerfile            # Backend Docker config
│   └── package.json          # Dependencies
├── documentation/            # Project documentation
├── docker-compose.yml        # Docker orchestration
└── README.md                 # This file
```

## 📚 Documentation

For detailed information, see the [documentation folder](./documentation/):
- [Setup Instructions](./documentation/SETUP.md)
- [Frontend API Documentation](./documentation/API_DOCUMENTATION.md)
- [Backend API Documentation](./documentation/BACKEND_API.md)
- [System Architecture](./documentation/ARCHITECTURE.md)
- [Phase Completion Logs](./documentation/PHASE_1.md)

## 🛠 Tech Stack

### Frontend
- React 18.2.0
- React Router v6
- Axios
- Docker

### Backend
- Node.js 18
- TypeScript
- Express.js
- PostgreSQL 15
- Adminer (Database Admin)

### Database
- PostgreSQL 15 Alpine
- Connection Pooling
- Transaction Support

## ✨ Implemented Features

### Phase 1 ✅
- React application with React Router
- Beautiful, responsive home page
- Docker containerization for frontend
- Complete documentation structure

### Phase 2 ✅
- **Backend API with TypeScript and Express**
- **PostgreSQL Database with full schema**
- **Complete CRUD API Endpoints**:
  - POST /v1/rides - Create ride request
  - GET /v1/rides/:id - Get ride status
  - POST /v1/drivers/:id/location - Update driver location
  - POST /v1/drivers/:id/accept - Accept ride assignment
  - POST /v1/trips/:id/end - End trip with fare calculation
  - POST /v1/payments - Process payment
- **Database Features**:
  - Rides management
  - Driver tracking with location history
  - Trip management with automatic fare calculation
  - Payment processing
  - Database indexing for performance
- **Docker Services**:
  - PostgreSQL database
  - Adminer for database management
  - Backend API service
  - Frontend service
  - Proper service dependencies

## 🚦 Development Phases

### Phase 1 ✅ (Completed)
- React app initialization
- Basic home page with responsive design
- Docker setup for frontend
- Documentation framework

### Phase 2 ✅ (Completed)
- Backend API with TypeScript
- PostgreSQL database setup
- Complete CRUD operations
- Payment processing
- Full Docker integration
- Adminer database admin tool

### Phase 3 (Upcoming)
- Authentication & Authorization
- Real-time location tracking
- WebSocket integration
- Advanced ride matching algorithm
- Driver rating system

### Phase 4+ (Future)
- Mobile app
- Payment gateway integration
- Analytics dashboard
- Machine learning for pricing
- Multi-language support

## 📝 Environment Variables

### Backend (.env)
```
PORT=8000
NODE_ENV=development
DB_HOST=postgres
DB_PORT=5432
DB_NAME=ride_hailing_db
DB_USER=ride_user
DB_PASSWORD=ride_password
DB_POOL_MIN=2
DB_POOL_MAX=10
```

### Frontend (.env.local)
```
REACT_APP_API_URL=http://localhost:8000
```

## 🔧 Available Commands

### Backend
```bash
npm run dev      # Start development server with hot reload
npm run build    # Build TypeScript to JavaScript
npm start        # Start production server
npm run migration:run  # Run database migrations
```

### Frontend
```bash
npm start        # Start development server
npm run build    # Build for production
npm test         # Run tests
npm run eject    # Eject from create-react-app
```

### Docker
```bash
docker-compose up              # Start all services
docker-compose up --build      # Rebuild and start
docker-compose down            # Stop all services
docker-compose logs -f         # View logs
docker-compose logs backend    # View backend logs only
docker-compose logs postgres   # View database logs
```

## 💾 Database Management

### Adminer Interface
- URL: http://localhost:8080
- System: PostgreSQL
- Server: postgres
- Username: ride_user
- Password: ride_password
- Database: ride_hailing_db

### Direct PostgreSQL Access
```bash
docker-compose exec postgres psql -U ride_user -d ride_hailing_db
```

## 🐛 Troubleshooting

### Port Already in Use
Edit `docker-compose.yml` and change the port mapping

### Docker Build Fails
```bash
docker system prune
docker-compose up --build
```

### Database Connection Issues
```bash
# Check if postgres service is running
docker-compose logs postgres

# Verify database health
curl http://localhost:8000/health
```

### Dependencies Issues
```bash
# Backend
cd backend && rm -rf node_modules && npm install

# Frontend
cd frontend && rm -rf node_modules && npm install
```

## 📊 API Response Format

All API responses follow this structure:

### Success Response
```json
{
  "success": true,
  "data": {},
  "message": "Operation successful"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

## 🔐 Data Consistency

- **Transactions**: All multi-step operations use database transactions
- **Idempotency**: All APIs are designed to be idempotent
- **Connection Pooling**: Managed connection pool for performance
- **Concurrent Requests**: Proper locking mechanisms in place

## Demo

Loom link: https://www.loom.com/share/f778599efe134d53b0aff327c9b11a84

## 📧 Support

For questions or issues, refer to the documentation folder.

## 📄 License

© 2026 Ride Hailing Service
