# Fixed-Price Indian Tech Gig Escrow Platform

A fixed-price tech gig marketplace tailored for the Indian developer ecosystem. Built with a Cartoon-Brutalism design paradigm, fixed-budget job escrow vaults, and zero exploitative bidding wars.

---

## 1. Architecture Overview

- **Frontend (`client/`):** React 18, Vite, Tailwind CSS v3, React Router DOM v6, Axios, GSAP, `@rive-app/react-canvas`, Lucide React.
  - **Aesthetic:** Cartoon-Brutalism (thick 4px solid borders `#0F0F0F`, hard drop shadows `4px 4px 0px #0F0F0F`, off-white `#FFFDF7` paper canvas, Finn Sky-Blue `#4CB8C4`, Jake Yellow `#FFD700`, Bubblegum Pink `#F781BE`, BMO Teal `#5BA4A4`).
  - **Motion:** GSAP micro-interactions and 60fps Rive BMO Escrow Vault state machine.
- **Backend (`server/`):** Node.js LTS + Express v4 adhering strictly to MVC separation (`routes/`, `controllers/`, `models/`, `middleware/`, `config/`, `utils/`).
  - **Security & Observability:** Helmet, CORS, Pino structured logging with request IDs, express-rate-limit, Zod request validation, and centralized Prisma error mapping.
- **Database (`Supabase PostgreSQL`):** Managed PostgreSQL via Prisma ORM strictly adhering to Third Normal Form (3NF) and enforcing `onDelete: Restrict` on all 7 entities.
- **Payments:** Razorpay UPI in Test Mode (`success@razorpay`) with cryptographic HMAC-SHA256 signature verification over raw request buffers.

---

## 2. 7-Entity 3NF Database Design

All entities strictly enforce Third Normal Form (3NF) and `onDelete: Restrict` foreign key integrity:

1. **`User` (`users`):** Stores credentials (`passwordHash`), roles (`CLIENT`, `FREELANCER`, `ADMIN`), profile data, skills array, verified URLs, and UPI ID.
2. **`Job` (`jobs`):** Fixed-budget client gig postings categorized strictly into tech domains (`FRONTEND`, `BACKEND`, `FULLSTACK`, `MOBILE`, `AI_ML`, `DEVOPS`). Indexed on `[status, category]`.
3. **`Proposal` (`proposals`):** Freelancer proposals competing purely on technical execution (`proposalNote`) and timeline (`estimatedDays`). Enforces `@@unique([jobId, freelancerId])`. No price bidding.
4. **`Escrow` (`escrows`):** One-to-one escrow vault (`@@unique([jobId])`) bound to `Job.budget` with statuses `PENDING`, `FUNDED`, `RELEASED`, `DISPUTED`.
5. **`Transaction` (`transactions`):** Immutable financial ledger logging deposits, payouts, and refunds with unique Razorpay order and payment IDs.
6. **`Submission` (`submissions`):** Milestone deliverables containing verified HTTPS delivery links, revision notes, and approval states.
7. **`Review` (`reviews`):** Mutual 2-way client and freelancer feedback ledger enforcing `@@unique([jobId, reviewerId])`.

---

## 3. Razorpay UPI Test Flow & Inviolable Security

```
1. Client Posts Job (Fixed Budget INR)
       │
2. Freelancer Submits Proposal (Technical approach & estimated days only)
       │
3. Client Accepts Proposal (Job locks to IN_PROGRESS, other proposals auto-rejected)
       │
4. Escrow Vault Initialized (amount = Job.budget directly from PostgreSQL)
       │
5. POST /api/escrow/:id/create-order (Server fetches escrow.amount, ignores client body)
       │
6. Razorpay UPI Test Checkout (vpa: success@razorpay)
       │
7. Webhook: POST /api/webhooks/razorpay
       ├── Parsed with express.raw({ type: 'application/json' }) BEFORE express.json()
       ├── Cryptographically verified via crypto.createHmac('sha256', SECRET)
       ├── Idempotent write via @unique razorpayPaymentId in atomic prisma.$transaction
       └── Escrow status updated to FUNDED
       │
8. Work Delivered -> Client Approves -> Escrow RELEASED -> Payout Triggered
```

---

## 4. Local Setup & Quickstart

### Prerequisites
- Node.js v20+ / v22 LTS
- PostgreSQL connection string (Supabase or local PostgreSQL)
- Razorpay Test Account API Keys

### Step 1: Clone and Configure Environment Files

**Backend:**
```bash
cd server
cp .env.example .env
# Fill in DATABASE_URL, DIRECT_URL, JWT_SECRET, RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET
```

**Frontend:**
```bash
cd client
cp .env.example .env
# VITE_API_URL is defaulted to http://localhost:5000/api
```

### Step 2: Install Dependencies & Setup Prisma

**Backend:**
```bash
cd server
npm install
npx prisma generate
npx prisma db push
```

**Frontend:**
```bash
cd client
npm install
```

### Step 3: Run Development Servers

**Backend:**
```bash
cd server
npm run dev
# Running on http://localhost:5000 (Health check: http://localhost:5000/health)
```

**Frontend:**
```bash
cd client
npm run dev
# Running on http://localhost:5173
```
