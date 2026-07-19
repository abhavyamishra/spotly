# Spotly Node.js Backend

## Overview
This backend uses:
- MongoDB for user accounts and auth
- Redis for room membership, chat streams, and geolocation
- JWT cookies for session auth
- WebSocket for real-time room chat

## Setup
1. Install dependencies:
```powershell
cd spotly/node-backend
npm install
```

2. Copy `.env.example` to `.env` and configure:
- `DATABASE_URL` for MongoDB
- `REDIS_URL` for Redis
- `JWT_SECRET` for cookie auth
- optional SMTP values for real OTP email delivery

3. Run the server:
```powershell
npm run dev
```

4. The API will be available at `http://localhost:3000`.

## Key endpoints
- `POST /api/auth/otp/request`
- `POST /api/auth/otp/verify`
- `POST /api/auth/login`
- `POST /api/auth/register`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /health`
- `GET /api/rooms`
- `POST /api/rooms/create` (requires `lat`, `lon`, and `radius_m`)
- `POST /api/rooms/join`
- `POST /api/rooms/location`
- `GET /api/rooms/nearby?lat=<lat>&lon=<lon>&radius_m=200`
- `GET /api/rooms/:roomName/messages`
- `POST /api/rooms/:roomName/messages`

Notes:
- If no nearby users are found, room creation is stopped by default.
- To create a pending room that will retry for nearby users, send `allowPending: true`.
- The backend also cleans stale offline locations from Redis automatically every minute.

## WebSocket
Connect to `ws://localhost:3000/ws/:roomName` with the auth cookie set.
