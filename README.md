# honghao report

A developer-styled trading card inventory & profit tracking system built as a monorepo.

## Features

- User authentication (register / sign in)
- Card inventory management with categories:
  - Card types: Single, Bundle, PSA10, PSA9, Sealed Product
  - Games: Pokemon, OnePiece, Lorcana, ETC
- Buy / sell transaction logging with backdated entries
- **Card Grading workflow**:
  - Send in-stock cards to grading with grading cost
  - Grading cost is automatically included in monthly cost
  - Track grading status with "grading" badge
  - Cancel grading (removes cost from monthly cost)
  - Mark grading complete with grade & current value
- **Inventory page** with powerful filters:
  - Search by name / set code / card number
  - Filter by month/year
  - Filter by status: in stock / grading / sold out
  - Filter by card type and game
- Real-time profit & ROI calculations
- Monthly reports with Excel export
- Terminal / developer-inspired UI with monospace fonts

## Tech Stack

- **Frontend**: Next.js 16, React 19, Tailwind CSS v4
- **Backend**: Next.js API Routes
- **Database**: SQLite + Prisma ORM
- **Auth**: NextAuth.js v5 (Auth.js)
- **Monorepo**: pnpm workspaces + Turbo
- **Excel Export**: xlsx

## Project Structure

```
honghao-report/
├── apps/
│   └── web/                 # Next.js application
├── packages/
│   └── shared/              # Shared TypeScript types
├── docs/                    # Documentation
├── package.json
├── pnpm-workspace.yaml
└── turbo.json
```

## Getting Started

```bash
# Install dependencies
pnpm install

# Generate Prisma client
pnpm db:generate

# Run database migrations
pnpm db:migrate

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Pages

- `/dashboard` - Overview stats and shortcuts
- `/inventory` - Browse cards with filters (recommended as main view)
- `/grading` - Track cards being sent for grading
- `/grading/send` - Send a card to grading
- `/transactions` - Add/edit buy & sell transactions
- `/reports` - Monthly reports and Excel export

## Default Environment

Copy `apps/web/.env.example` to `apps/web/.env.local` and update values as needed:

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-change-this-in-production"
```

## Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build all packages
- `pnpm db:generate` - Generate Prisma client
- `pnpm db:migrate` - Run database migrations
- `pnpm db:studio` - Open Prisma Studio
