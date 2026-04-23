# JKmall — Kenyan E-Commerce Platform

A full-stack e-commerce web application tailored for the Kenyan market with **M-Pesa payments** and **boda-boda delivery tracking**.

[![GitHub Repo](https://img.shields.io/badge/GitHub-josephkip/JKmall-green?logo=github)](https://github.com/josephkip/JKmall)

## 🚀 Features

### Customer Features
- Browse products by category with search & filters
- Shopping cart with persistent storage
- M-Pesa STK Push payment (Daraja API)
- Real-time delivery tracking on Leaflet maps
- Order history & status tracking

### Admin Features
- Dashboard with revenue stats & charts
- Product management (CRUD with image upload)
- Order management & status updates
- User management & role assignment
- Category management

### Delivery Tracking
- Live GPS location updates via WebSockets
- Leaflet map with rider & destination markers
- Real-time status notifications

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React (Vite), Axios, Socket.io-client |
| Maps | Leaflet.js (react-leaflet) |
| Backend | Node.js, Express |
| Database | PostgreSQL (Sequelize ORM) |
| Auth | JWT + bcrypt |
| Payments | Safaricom M-Pesa Daraja API |
| Real-time | Socket.io |
| Deployment | Render |

## 📦 Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Safaricom Daraja API credentials (sandbox)

### 1. Clone & Install
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure Environment
Edit `backend/.env` with your PostgreSQL and M-Pesa credentials.

### 3. Create Database & Seed
```sql
-- In psql:
CREATE DATABASE jkmall;
```

```bash
cd backend
npm run db:sync
```

### 4. Run
```powershell
# From project root
.\run_jkmall.ps1
```

Or manually:
```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend  
cd frontend && npm run dev
```

### 5. Access
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **Admin Panel**: http://localhost:5173/admin

### Login Credentials
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@jkmall.co.ke | admin123 |
| Rider | rider@jkmall.co.ke | rider123 |
| Customer | john@example.com | customer123 |

## 🚢 Deployment (Render)

1. Push to GitHub
2. Connect repo to Render
3. Use the `render.yaml` blueprint
4. Set M-Pesa env vars in Render dashboard
5. Run `npm run db:sync` in backend shell

## 📁 Project Structure

```
JKmall/
├── backend/
│   ├── src/
│   │   ├── config/         # DB, Multer
│   │   ├── controllers/    # Auth, Products, Orders, M-Pesa, Delivery, Admin
│   │   ├── middleware/      # JWT Auth, Error Handler
│   │   ├── models/          # Sequelize Models
│   │   ├── routes/          # Express Routes
│   │   ├── services/        # M-Pesa Service
│   │   └── index.js
│   └── uploads/
├── frontend/
│   └── src/
│       ├── components/      # Navbar, ProductCard
│       ├── context/         # Auth, Cart
│       ├── hooks/           # useSocket, useGeolocation
│       ├── pages/           # Home, Product, Cart, Checkout, Orders, Admin, Tracking
│       └── services/        # API, Socket
├── render.yaml
└── run_jkmall.ps1
```

## 📄 License
MIT
