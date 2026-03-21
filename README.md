
```
inovitaz-app
├─ backend
│  ├─ .env
│  ├─ .env.example
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ scripts
│  │  └─ setup-db.js
│  ├─ server.js
│  ├─ sql
│  │  └─ schema.sql
│  ├─ src
│  │  ├─ config
│  │  │  └─ db.js
│  │  ├─ controllers
│  │  │  ├─ admin.controller.js
│  │  │  ├─ auth.controller.js
│  │  │  ├─ coupon.controller.js
│  │  │  ├─ order.controller.js
│  │  │  ├─ payment.controller.js
│  │  │  ├─ project.controller.js
│  │  │  ├─ review.controller.js
│  │  │  └─ wishlist.controller.js
│  │  ├─ middlewares
│  │  │  ├─ auth.middleware.js
│  │  │  ├─ authOptional.js
│  │  │  └─ error.middleware.js
│  │  ├─ models
│  │  │  ├─ payment.model.js
│  │  │  ├─ project.model.js
│  │  │  └─ user.model.js
│  │  ├─ routes
│  │  │  ├─ admin.routes.js
│  │  │  ├─ auth.routes.js
│  │  │  ├─ coupon.routes.js
│  │  │  ├─ order.routes.js
│  │  │  ├─ payment.routes.js
│  │  │  ├─ project.routes.js
│  │  │  ├─ review.routes.js
│  │  │  └─ wishlist.routes.js
│  │  ├─ services
│  │  │  └─ razorpay.js
│  │  └─ utils
│  │     ├─ jwt.js
│  │     └─ validator.js
│  └─ test-db.js
├─ frontend
│  ├─ .env
│  ├─ eslint.config.js
│  ├─ index.html
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ postcss.config.js
│  ├─ public
│  │  ├─ hero-iot.png
│  │  ├─ InovitaZ.png
│  │  ├─ n.png
│  │  └─ vite.svg
│  ├─ README.md
│  ├─ src
│  │  ├─ api
│  │  │  ├─ auth.js
│  │  │  ├─ axios.js
│  │  │  ├─ payments.js
│  │  │  └─ projects.js
│  │  ├─ App.css
│  │  ├─ App.jsx
│  │  ├─ assets
│  │  │  └─ react.svg
│  │  ├─ components
│  │  │  ├─ AdminRoute.jsx
│  │  │  ├─ BuyModal.jsx
│  │  │  ├─ Footer.jsx
│  │  │  ├─ LoadingSpinner.jsx
│  │  │  ├─ Navbar.jsx
│  │  │  ├─ PaymentModal.jsx
│  │  │  ├─ ProjectCard.jsx
│  │  │  ├─ ProtectedRoute.jsx
│  │  │  └─ ScrollToTop.jsx
│  │  ├─ context
│  │  │  └─ AuthContext.jsx
│  │  ├─ hooks
│  │  │  └─ useAuth.js
│  │  ├─ index.css
│  │  ├─ layout
│  │  │  └─ MainLayout.jsx
│  │  ├─ lib
│  │  │  └─ payments.js
│  │  ├─ main.jsx
│  │  └─ pages
│  │     ├─ About.jsx
│  │     ├─ AdminDashboard.jsx
│  │     ├─ Dashboard.jsx
│  │     ├─ Home.jsx
│  │     ├─ Login.jsx
│  │     ├─ NotFound.jsx
│  │     ├─ Privacy.jsx
│  │     ├─ ProjectDetails.jsx
│  │     ├─ Projects.jsx
│  │     ├─ Refund.jsx
│  │     ├─ Signup.jsx
│  │     ├─ Support.jsx
│  │     └─ Terms.jsx
│  ├─ tailwind.config.js
│  └─ vite.config.js
└─ README.md

```