# ⚡ AffordIQ — Real-Time Affordability Engine

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/affordiq)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-06B6D4?logo=tailwindcss)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase)
![Vercel](https://img.shields.io/badge/Deployed-Vercel-000000?logo=vercel)

> **"Can I afford this purchase today without missing rent, bills, subscriptions, or savings goals?"**
>
> AffordIQ answers that question in real time — with a score, a verdict, and a clear explanation.

---

## 📸 Screenshots

| Landing | Dashboard | Affordability Check |
|---------|-----------|--------------------|
| Problem framing + CTA | Balance, bills, subscriptions | Instant SAFE / RISKY / NOT REC. verdict |

---

## 🎯 Problem Statement

Most people make spending decisions by glancing at their bank balance. But that number is dangerously misleading:

- Rent is due in 5 days — but the balance looks fine today
- Three subscriptions renew this week — forgotten
- The credit card minimum is due before payday
- There's no savings buffer left after a "harmless" purchase

**AffordIQ solves this** by computing your true *disposable balance* — what's actually safe to spend after every upcoming obligation is accounted for.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🟢 Affordability Checker | Instant SAFE / RISKY / NOT RECOMMENDED verdict |
| 📊 Affordability Score | 0–100 score with animated ring chart |
| 💡 Reason Codes | Plain-English explanation of the decision |
| 🗓️ Bill Tracker | Track every fixed expense with due dates |
| 🔁 Subscription Manager | Monitor recurring costs eating into cash flow |
| 📈 Insights Dashboard | Spending ratio, free cash flow, risk level |
| 📋 Check History | Full log of all past affordability checks |
| 📱 Mobile Responsive | Works on all screen sizes |
| 🌙 Dark FinTech UI | Professional dark-mode dashboard aesthetic |

---

## 🧠 Decision Engine Logic

```
Disposable Balance =
  Current Balance
  − Upcoming Bills (before next payday)
  − Monthly Subscriptions
  − Savings Goal
  − Safety Buffer

Score starts at 100, deductions applied:
  −20  Rent due within 7 days
  −10  Subscription load > $100/mo
  −25  Purchase exceeds free cash flow
  −30  Purchase breaks safety buffer
  −25  Projected balance goes negative

Score ≥ 70  →  SAFE
Score ≥ 40  →  RISKY
Score < 40  →  NOT RECOMMENDED
```

**Reason Codes returned:**
- `"Rent due soon"`
- `"Subscription load is high"`
- `"Purchase exceeds free cash flow"`
- `"Safety buffer will be broken"`
- `"Purchase may cause missed bill risk"`
- `"You are still safe after this purchase"`

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19 + TypeScript |
| Styling | Tailwind CSS v4 |
| Animation | Framer Motion |
| Routing | React Router v7 |
| Icons | Lucide React |
| Backend | Node.js Serverless (Vercel Functions) |
| Database | PostgreSQL via Supabase |
| Deployment | Vercel |
| Font | Plus Jakarta Sans (Google Fonts) |

---

## 🗄️ Database Schema

```sql
-- Core financial profile (one per user)
financial_profiles
  id, monthly_income, current_balance,
  savings_goal, safety_buffer, payday_date, created_at

-- Fixed monthly bills
bills
  id, name, amount, due_day, category, is_recurring, created_at

-- Recurring subscriptions
subscriptions
  id, name, amount, billing_cycle, category, created_at

-- Affordability check history
affordability_checks
  id, purchase_amount, category, merchant_name, purchase_date,
  decision, score, projected_balance, disposable_balance,
  reasons (jsonb), recommendation, created_at
```

---

## 📁 Project Structure

```
affordiq/
├── api/                        # Vercel serverless API routes
│   ├── _supabase.js            # Shared Supabase client
│   ├── profile.js              # GET/POST financial profile
│   ├── bills.js                # GET/POST/DELETE bills
│   ├── subscriptions.js        # GET/POST/DELETE subscriptions
│   ├── affordability.js        # POST check + GET history
│   └── insights.js             # GET analytics
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   └── Layout.tsx          # Sidebar + mobile nav
│   ├── lib/
│   │   └── supabase.ts         # Frontend Supabase client
│   ├── pages/
│   │   ├── Landing.tsx         # Marketing / hero page
│   │   ├── Dashboard.tsx       # Financial overview
│   │   ├── AffordabilityChecker.tsx  # Core feature
│   │   ├── Insights.tsx        # Analytics
│   │   ├── Profile.tsx         # Data entry / settings
│   │   ├── History.tsx         # Check log
│   │   └── NotFound.tsx        # 404
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── .env.example                # Environment variable template
├── .gitignore
├── vercel.json                 # Deployment config
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 💼 Business Impact

AffordIQ addresses a real gap in personal finance:

- **50%+ of North Americans** live paycheck to paycheck (CNBC, 2024)
- **Overdraft fees** cost US consumers $7.7B annually
- **Impulse purchases** are the #1 cause of budget failure
- Existing apps (Mint, YNAB) show history — AffordIQ answers **"right now"**

### Target Users
- Young professionals managing first apartments
- Students with tight monthly budgets
- Freelancers with variable income
- Anyone who has ever overdrafted

---

## 🔮 Future Improvements

| Feature | Description | Priority |
|---------|-------------|----------|
| 🏦 Bank Linking | Plaid sandbox integration for real-time balance | High |
| 🤖 AI Categorization | GPT-powered transaction categorization | High |
| 🔁 Bill Detection | Auto-detect recurring charges from transactions | Medium |
| 💳 Credit Optimization | Suggest optimal credit card usage | Medium |
| 📲 Push Alerts | SMS/email alerts before bills are due | Medium |
| 👤 Multi-user Auth | Full auth with per-user data isolation | High |
| 📱 Mobile App | React Native version | Low |
| 📊 Export | CSV/PDF export of spending reports | Low |
| 🌍 Multi-currency | Support USD, GBP, EUR, AUD | Low |

---

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

---

## 📄 License

MIT License — see [LICENSE](./LICENSE) for details.

---

## 👤 Author

Built as a portfolio project demonstrating full-stack product engineering skills:
- FinTech domain knowledge
- Real-time decision engine design
- REST API architecture
- Modern React patterns
- Production deployment

---

*AffordIQ — Spend with confidence, not just balance.*
