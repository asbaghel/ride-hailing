# Ride Hailing Application

A modern ride-hailing platform built with React, Node.js, TypeScript, and Docker.

## 🚀 Quick Start

### Using Docker (Recommended)
```bash
docker-compose up --build
```
Access the application at: **http://localhost:8089**

### Local Development
```bash
cd frontend
npm install
npm start
```
Access the application at: **http://localhost:3000**

## 📁 Project Structure

```
ride-hailing/
├── frontend/                 # React application
│   ├── src/                  # React components and styles
│   ├── public/               # Static assets
│   ├── Dockerfile            # Frontend Docker config
│   └── package.json          # Dependencies
├── backend/                  # Backend API (Phase 2)
├── documentation/            # Project documentation
├── docker-compose.yml        # Docker orchestration
└── README.md                 # This file
```

## 📚 Documentation

For detailed information, see the [documentation folder](./documentation/):
- [Setup Instructions](./documentation/SETUP.md)
- [API Documentation](./documentation/API_DOCUMENTATION.md)
- [System Architecture](./documentation/ARCHITECTURE.md)
- [Phase 1 Completion](./documentation/PHASE_1.md)

## 🛠 Tech Stack

### Frontend
- React 18.2.0
- React Router v6
- Axios
- Docker

### Backend (Planned)
- Node.js + TypeScript
- PostgreSQL
- Kubernetes
- New Relic

## ✨ Features (Phase 1)

- ✅ React application with React Router
- ✅ Beautiful, responsive home page
- ✅ Docker containerization
- ✅ Runs on port 8089
- ✅ Complete documentation structure

## 🚦 Development Phases

### Phase 1 ✅ (Current)
- React app initialization
- Basic home page
- Docker setup
- Documentation framework

### Phase 2 (Upcoming)
- Backend API with TypeScript
- PostgreSQL database
- Authentication system
- Ride management APIs

### Phase 3+ (Future)
- Driver management
- Real-time tracking
- Payment integration
- Mobile app

## 📝 Environment Variables

Create `.env.local` in the frontend directory:
```
REACT_APP_API_URL=http://localhost:8000
```

## 🔧 Available Commands

### Frontend
```bash
npm start      # Start development server
npm build      # Build for production
npm test       # Run tests
npm eject      # Eject from create-react-app
```

### Docker
```bash
docker-compose up              # Start services
docker-compose up --build      # Rebuild and start
docker-compose down            # Stop services
docker-compose logs -f         # View logs
```

## 🐛 Troubleshooting

### Port 8089 already in use
Edit `docker-compose.yml` and change the port mapping

### Docker build fails
```bash
docker system prune
docker-compose up --build
```

### Dependencies issues
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

## 📧 Support

For questions or issues, refer to the documentation folder.

## 📄 License

© 2026 Ride Hailing Service
