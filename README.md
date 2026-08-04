
```
inovitaz-app
├─ backend
│  ├─ .env
│  ├─ .env.example
│  ├─ jest.config.js
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
│  │  │  ├─ adminAudit.middleware.js
│  │  │  ├─ auth.middleware.js
│  │  │  ├─ authOptional.js
│  │  │  ├─ error.middleware.js
│  │  │  ├─ ownership.middleware.js
│  │  │  └─ validate.middleware.js
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
│  │     ├─ logger.js
│  │     ├─ signedUrl.js
│  │     ├─ validateEnv.js
│  │     ├─ validationSchemas.js
│  │     └─ validator.js
│  ├─ test-db.js
│  └─ tests
│     ├─ auth.test.js
│     ├─ order.test.js
│     ├─ payment.test.js
│     └─ webhook.test.js
├─ frontend
│  ├─ .env
│  ├─ .env.example
│  ├─ dist
│  │  ├─ assets
│  │  │  ├─ index-BvcCiRUE.js
│  │  │  └─ index-DifGwoAL.css
│  │  ├─ hero-iot.png
│  │  ├─ index.html
│  │  ├─ InovitaZ.png
│  │  ├─ n.png
│  │  └─ vite.svg
│  ├─ eslint.config.js
│  ├─ index.html
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ postcss.config.js
│  ├─ public
│  │  ├─ hero-iot.png
│  │  ├─ InovitaZ.png
│  │  ├─ maintenance.html
│  │  ├─ n.png
│  │  ├─ vite.svg
│  │  └─ _redirects
│  ├─ README.md
│  ├─ render-static.yaml
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
│  │  │  ├─ DownloadButton.jsx
│  │  │  ├─ ErrorBoundary.jsx
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
│  │  ├─ pages
│  │  │  ├─ About.jsx
│  │  │  ├─ AdminDashboard.jsx
│  │  │  ├─ Dashboard.jsx
│  │  │  ├─ Home.jsx
│  │  │  ├─ Login.jsx
│  │  │  ├─ NotFound.jsx
│  │  │  ├─ Privacy.jsx
│  │  │  ├─ ProjectDetails.jsx
│  │  │  ├─ Projects.jsx
│  │  │  ├─ Refund.jsx
│  │  │  ├─ Signup.jsx
│  │  │  ├─ Support.jsx
│  │  │  └─ Terms.jsx
│  │  └─ utils
│  │     └─ price.js
│  ├─ tailwind.config.js
│  ├─ test-results
│  │  └─ .last-run.json
│  ├─ tests
│  │  └─ home.spec.js
│  ├─ vercel.json
│  ├─ vite.config.js
│  └─ write_signup.js
├─ README.md
└─ render.yaml

```