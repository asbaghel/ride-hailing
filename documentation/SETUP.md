# Setup Instructions

## Prerequisites

- Node.js 18+
- Docker and Docker Compose
- Git

## Development Setup

### Clone the Repository
```bash
git clone <repository-url>
cd ride-hailing
```

### Option 1: Using Docker (Recommended)

1. **Build and run with Docker Compose**
   ```bash
   docker-compose up --build
   ```

2. **Access the application**
   - Frontend: http://localhost:8089

3. **View logs**
   ```bash
   docker-compose logs -f frontend
   ```

4. **Stop the application**
   ```bash
   docker-compose down
   ```

### Option 2: Local Development

#### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm start
   ```

4. **Access the application**
   - Frontend: http://localhost:3000

5. **Build for production**
   ```bash
   npm run build
   ```

## Environment Variables

Create a `.env.local` file in the frontend directory:

```
REACT_APP_API_URL=http://localhost:8000
```

## Available Scripts

### Frontend
- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run eject` - Eject from create-react-app

## Troubleshooting

### Port Already in Use
If port 8089 is already in use, modify the port in `docker-compose.yml`

### Docker Build Fails
- Clear Docker cache: `docker system prune`
- Rebuild: `docker-compose up --build`

### Dependencies Issue
```bash
# Clear npm cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Next Steps

1. Backend API development (Phase 2)
2. Database setup with PostgreSQL (Phase 2)
3. Authentication system (Phase 3)
4. Ride booking features (Phase 3+)
