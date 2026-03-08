# System Architecture

## Overview
Ride Hailing Application built with modern technologies for scalability and maintainability.

## Tech Stack

### Frontend
- **Framework**: React 18.2.0
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Container**: Docker
- **Runtime**: Node.js 18

### Backend (To Be Implemented)
- **Language**: TypeScript
- **Runtime**: Node.js
- **Framework**: Express.js (planned)
- **Container**: Docker
- **Orchestration**: Kubernetes (planned)

### Database (To Be Implemented)
- **Primary**: PostgreSQL
- **Admin Tool**: Adminer

### Observability (To Be Implemented)
- **Monitoring**: New Relic

## System Architecture Diagram

### High-Level Architecture

```
┌─────────────────────────────────────────────────────┐
│         Browser / Client                            │
└──────────────────┬──────────────────────────────────┘
                   │ HTTP/HTTPS
                   ▼
┌──────────────────────────────────────────────────────┐
│         Frontend (React 18.2.0)                      │
│    - LocationSelector                               │
│    - RideRequest                                     │
│    - RideStatus                                      │
│    - Payment Component                               │
└──────────────────┬───────────────────────────────────┘
                   │ RESTful API (Axios)
                   ▼
┌──────────────────────────────────────────────────────┐
│    Backend API (TypeScript/Express.js)               │
│    Port: 8000                                        │
└──────────────────┬───────────────────────────────────┘
                   │
        ┌──────────┼──────────┬─────────────┐
        ▼          ▼          ▼             ▼
    ┌────────┐ ┌──────────┐ ┌──────┐ ┌──────────┐
    │ Rides  │ │ Drivers  │ │Trips │ │Payments  │
    │ Router │ │ Router   │ │Router│ │Router    │
    └────────┘ └──────────┘ └──────┘ └──────────┘
        │
        └──────────────────┬──────────────────┐
                           │                  │
                    ┌──────▼──────┐    ┌─────▼────────┐
                    │ LocationSvc │    │MatchingAlgo  │
                    │ (Nominatim) │    │(Driver Match)│
                    └──────┬──────┘    └─────┬────────┘
                           │                  │
                           └──────────┬───────┘
                                      │
                           ┌──────────▼──────────┐
                           │   PostgreSQL DB     │
                           │  (ride_hailing_db)  │
                           └─────────────────────┘
```

### Detailed Service Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                      EXPRESS API SERVER                          │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │               MIDDLEWARE LAYER                           │   │
│  │  - CORS  - Body Parser  - Request Logger  - Health Check│   │
│  └──────────────────────────────────────────────────────────┘   │
│                            │                                     │
│  ┌────────────────────────┼────────────────────────────────┐   │
│  │                        ▼                                │   │
│  │         ┌─────────────────────────────────┐             │   │
│  │         │  ROUTE HANDLERS / CONTROLLERS   │             │   │
│  │         │                                 │             │   │
│  │  ┌──────┴──────────────────────────────┐  │             │   │
│  │  │                                     │  │             │   │
│  │  ├─ /v1/rides       [POST, GET]       │  │             │   │
│  │  ├─ /v1/drivers     [GET]             │  │             │   │
│  │  ├─ /v1/trips       [GET, POST]       │  │             │   │
│  │  ├─ /v1/payments    [GET, POST]       │  │             │   │
│  │  └─ /v1/locations   [GET]             │  │             │   │
│  │                                       │  │             │   │
│  └─────────────────────────────────────┘  │             │   │
│                            │                                     │
│  ┌────────────────────────┼────────────────────────────────┐   │
│  │                        ▼                                │   │
│  │         ┌─────────────────────────────────┐             │   │
│  │         │    SERVICE LAYER                │             │   │
│  │         │                                 │             │   │
│  │  ┌──────┴──────────────────────────────┐  │             │   │
│  │  │                                     │  │             │   │
│  │  ├─ LocationService                   │  │             │   │
│  │  │  └─ searchLocations()               │  │             │   │
│  │  │                                     │  │             │   │
│  │  ├─ MatchingAlgorithm                 │  │             │   │
│  │  │  ├─ selectBestDriver()              │  │             │   │
│  │  │  └─ scoreDrivers()                  │  │             │   │
│  │  │                                     │  │             │   │
│  │  └─ DriverMatchingService              │  │             │   │
│  │     └─ matchDriverToRide()             │  │             │   │
│  │                                       │  │             │   │
│  └─────────────────────────────────────┘  │             │   │
│                            │                                     │
│  ┌────────────────────────┼────────────────────────────────┐   │
│  │                        ▼                                │   │
│  │         ┌─────────────────────────────────┐             │   │
│  │         │    DATA ACCESS LAYER            │             │   │
│  │         │  (Database Connection)          │             │   │
│  │         └─────────────────────────────────┘             │   │
│  │                                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                            │                                     │
└────────────────────────────┼─────────────────────────────────────┘
                             │
                             ▼
                   ┌──────────────────────┐
                   │  PostgreSQL Database │
                   │                      │
                   │  Tables:             │
                   │  - rides             │
                   │  - drivers           │
                   │  - trips             │
                   │  - payments          │
                   │  - driver_locations  │
                   │                      │
                   └──────────────────────┘
```

### Core Domain Models (Classes & Interfaces)

```
┌─────────────────────┬─────────────────────┬─────────────────────┐
│                     │                     │                     │
├─────────────────────┼─────────────────────┼─────────────────────┤
│   USER / RIDE       │      DRIVER         │       TRIP          │
├─────────────────────┼─────────────────────┼─────────────────────┤
│                     │                     │                     │
│ interface Ride:     │ interface Driver:   │ interface Trip:     │
│ -------             │ -------             │ -------             │
│ • id                │ • id                │ • id                │
│ • user_id           │ • name              │ • ride_id           │
│ • driver_id         │ • email             │ • driver_id         │
│ • pickup_location   │ • phone             │ • distance_km       │
│ • dropoff_location  │ • vehicle_number    │ • duration_minutes  │
│ • status            │ • vehicle_type      │ • fare              │
│ • estimated_fare    │ • status            │ • payment_method    │
│ • actual_fare       │ • current_location  │ • payment_status    │
│ • created_at        │ • rating            │ • created_at        │
│ • started_at        │ • total_rides       │ • updated_at        │
│ • ended_at          │ • cancellation_rate │                     │
│                     │ • idle_time_seconds │                     │
│                     │ • surge_zone_prior  │                     │
│                     │ • created_at        │                     │
│                     │                     │                     │
└─────────────────────┴─────────────────────┴─────────────────────┘
         │                     │                      │
         │                     │                      │
         └─────────┬───────────┴──────────┬───────────┘
                   │                      │
        ┌──────────▼──────────┐  ┌────────▼──────────┐
        │      LOCATION       │  │     PAYMENT      │
        ├─────────────────────┤  ├──────────────────┤
        │                     │  │                  │
        │ interface Location: │  │interface Payment:│
        │ -------             │  │-------           │
        │ • latitude          │  │ • id             │
        │ • longitude         │  │ • trip_id        │
        │ • address           │  │ • amount         │
        │                     │  │ • currency       │
        │ interface           │  │ • payment_method │
        │ DriverLocation:     │  │ • status         │
        │ -------             │  │ • transaction_id │
        │ • id                │  │ • created_at     │
        │ • driver_id         │  │ • updated_at     │
        │ • latitude          │  │                  │
        │ • longitude         │  │                  │
        │ • timestamp         │  │                  │
        │                     │  │                  │
        └─────────────────────┘  └──────────────────┘
```

### Service Dependencies & Request Flow

```
┌────────────────────────────────────────────────────────────┐
│                  REQUEST FLOW                              │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  Client Requests Ride                                      │
│        │                                                    │
│        ▼                                                    │
│  ┌─────────────────────────────────────────┐              │
│  │ POST /v1/rides                          │              │
│  │ (Create Ride Request)                   │              │
│  └────────────────┬────────────────────────┘              │
│                   │                                        │
│                   ▼                                        │
│  ┌─────────────────────────────────────────┐              │
│  │ RIDES ROUTE HANDLER                     │              │
│  │ - Validate input                        │              │
│  │ - Store ride in database                │              │
│  └────────────────┬────────────────────────┘              │
│                   │                                        │
│                   ▼                                        │
│  ┌─────────────────────────────────────────┐              │
│  │ MATCHING SERVICE                        │              │
│  │ matchDriverToRide()                     │              │
│  └────────────────┬────────────────────────┘              │
│                   │                                        │
│    ┌──────────────┴──────────────┐                        │
│    │                             │                        │
│    ▼                             ▼                        │
│ ┌──────────────┐  ┌──────────────────────┐               │
│ │ Query Online │  │MATCHING ALGORITHM    │               │
│ │ Drivers      │  │ scoreDrivers()       │               │
│ │              │  │ selectBestDriver()   │               │
│ └──────────────┘  └──────────────────────┘               │
│    │                             │                        │
│    └──────────────┬──────────────┘                        │
│                   │                                        │
│                   ▼                                        │
│  ┌─────────────────────────────────────────┐              │
│  │ Update Ride with Driver Assignment      │              │
│  └─────────────────────────────────────────┘              │
│                   │                                        │
│                   ▼                                        │
│  ┌─────────────────────────────────────────┐              │
│  │ Return Ride Status to Client            │              │
│  │ (with driver info)                      │              │
│  └─────────────────────────────────────────┘              │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
ride-hailing/
├── frontend/                 # React application
│   ├── src/
│   │   ├── pages/           # Page components
│   │   ├── styles/          # CSS files
│   │   ├── App.js           # Main app component
│   │   └── index.js         # Entry point
│   ├── public/              # Static assets
│   ├── Dockerfile           # Docker configuration
│   └── package.json         # Dependencies
├── backend/                 # Backend API (To be implemented)
├── documentation/           # Project documentation
└── docker-compose.yml       # Docker compose configuration
```

## Deployment Strategy

1. **Development**: Local Docker containers
2. **Staging**: Kubernetes cluster (planned)
3. **Production**: Kubernetes on AWS (planned)

## Key Design Principles

- **Modularity**: Separate frontend and backend
- **Scalability**: Containerized architecture ready for K8s
- **Maintainability**: Clear separation of concerns
- **Idempotency**: All APIs designed to be idempotent
- **Consistency**: Concurrent requests handled properly
