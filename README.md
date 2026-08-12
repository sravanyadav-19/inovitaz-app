<div align="center">

# ⚡ InovitaZ

**A modern marketplace for premium IoT projects — browse, buy, and instantly download complete project kits.**

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](#)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=nodedotjs&logoColor=white)](#)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169E1?logo=postgresql&logoColor=white)](#)
[![Vite](https://img.shields.io/badge/Vite-Frontend-646CFF?logo=vite&logoColor=white)](#)
[![Razorpay](https://img.shields.io/badge/Payments-Razorpay-02042B?logo=razorpay&logoColor=white)](#)

🌐 **Live:** [inovitaz.vercel.app](https://inovitaz.vercel.app)

</div>

---

## 📖 About InovitaZ

**InovitaZ** is a full-stack platform where engineering students, hobbyists, and makers discover and purchase ready-to-build **IoT projects**. Every project ships as a complete kit — **full source code, circuit diagrams, component lists, and step-by-step guides** — delivered securely the moment payment is confirmed.

Built as a production-grade application with a modern React frontend, a hardened Node/Express API, and a PostgreSQL database, InovitaZ focuses on a smooth buying experience, secure digital delivery, and reliable payments.

---

## ✨ Features

### 🧑‍💻 For Makers
- **Secure account** — email-verified signup, login, and self-service password reset
- **Smart catalog** — search & filter by category, difficulty, price, and tech stack
- **Seamless checkout** — Razorpay payments with live coupon discounts
- **Secure downloads** — purchase-gated, time-limited, download-capped delivery
- **Verified reviews** — only genuine buyers can rate & review
- **Wishlist** — save projects to revisit later
- **Personal dashboard** — track your purchases and remaining downloads

### 🛠️ For Admins
- **Dashboard analytics** — users, projects, revenue, orders, and monthly trends
- **Project management** — create / update / remove listings
- **Coupon management** — create, activate/deactivate, and delete discount codes
- **User & order oversight** — full visibility into the platform

### 🔒 Security & Integrity
- **Server-authoritative pricing** — amounts and discounts are recomputed on the server; client values are never trusted
- **Timing-safe signature verification** for payments and signed download links
- **Security headers + strict CSP** (Helmet), **per-IP rate limiting**
- **bcrypt hashing**, JWT auth with **session invalidation** on password reset
- **Idempotent, signature-verified payment webhooks**

---

## 🛠️ Tech Stack

| Layer | Technologies |
|------|--------------|
| **Frontend** | React 18, Vite, React Router, Tailwind CSS, Axios, React Hot Toast |
| **Backend** | Node.js, Express, JWT, bcrypt |
| **Database** | PostgreSQL (Neon) |
| **Payments** | Razorpay |
| **Email** | Brevo (HTTP API) |
| **Hosting** | Vercel · Render · Neon |

---

## 🏗️ Architecture

```
┌────────────────┐      HTTPS       ┌──────────────────┐      ┌──────────────┐
│   React SPA    │ ───────────────▶ │   Express API    │ ───▶ │  PostgreSQL  │
│   (Vercel)     │ ◀─────────────── │   (Render)       │      │   (Neon)     │
└────────────────┘   JSON + JWT     └────────┬─────────┘      └──────────────┘
                                        │            │
                                        ▼            ▼
                                  Razorpay       Brevo API
                                 (payments)       (email)
```

---

## 📁 Project Structure

```
inovitaz-app/
├─ backend/                  # Express REST API
│  ├─ src/
│  │  ├─ config/             # PostgreSQL connection pool
│  │  ├─ controllers/        # auth, project, payment, coupon, order, review…
│  │  ├─ middlewares/        # auth, validation, ownership, admin audit
│  │  ├─ routes/             # REST route definitions
│  │  ├─ services/           # coupon logic, razorpay
│  │  └─ utils/              # email, jwt, logger, secureCompare
│  ├─ sql/schema.sql         # full database schema
│  └─ server.js              # app entrypoint
├─ frontend/                 # React + Vite SPA
│  └─ src/
│     ├─ api/                # axios API clients
│     ├─ components/         # Navbar, ProjectCard, modals, route guards
│     ├─ context/            # AuthContext
│     ├─ pages/              # Home, Projects, Auth, Dashboard, Admin…
│     └─ utils/              # price helpers, etc.
└─ README.md
```

---

## 🚀 Local Development

> Intended for the project team.

```bash
# 1) Backend
cd backend
cp .env.example .env         # fill in DB + JWT secrets
npm install
npm run setup-db             # create the database schema
npm run dev                  # API on http://localhost:4000

# 2) Frontend
cd ../frontend
cp .env.example .env
npm install
npm run dev                  # UI on http://localhost:5173
```

---

## 🔑 Environment Variables

**Backend (`backend/.env`)**
```
NODE_ENV=development
PORT=4000
FRONTEND_URL=http://localhost:5173

DB_HOST=...
DB_PORT=5432
DB_USER=...
DB_PASSWORD=...
DB_NAME=...

JWT_SECRET=...               # at least 32 characters
DOWNLOAD_SECRET=...

RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...

BREVO_API_KEY=...
SMTP_FROM="InovitaZ" 
```

**Frontend (`frontend/.env`)**
```
VITE_API_BASE_URL=http://localhost:4000/api
```

---

## 🌐 Deployment

| Component | Platform | Notes |
|-----------|----------|-------|
| Frontend | **Vercel** | Auto-deploys from `main` |
| Backend | **Render** | Web service |
| Database | **Neon** | Managed PostgreSQL |
| Email | **Brevo** | Sent via HTTP API (Render blocks outbound SMTP) |

> **Note:** Email is delivered through Brevo's HTTP API because cloud hosts like Render block outbound SMTP ports. Razorpay, Neon, and Brevo credentials are configured in each platform's environment — never committed to the repo.

---

## 🗺️ Roadmap

- [ ] Live Razorpay payments in production
- [ ] Custom domain with SPF / DKIM / DMARC (inbox delivery)
- [ ] SEO optimization (meta tags, sitemap, prerendering)
- [ ] Advanced search & project ratings
- [ ] Production monitoring & error tracking

---

## 📄 License & Ownership

© 2026 **InovitaZ**. All rights reserved.

This is a **proprietary project**. The source code is **not** licensed for copying, redistribution, modification, or commercial reuse without explicit written permission from the author. Unauthorized cloning or reuse of this codebase is prohibited.

---

<div align="center">

**Built with care for the maker community.** ⚡

</div>
