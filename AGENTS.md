# Agent Guide: honghao-report

## Project Overview

This is a full-stack monorepo for tracking trading card buy/sell transactions, profit, ROI, Excel reports, and card grading workflow.

## Architecture

- Monorepo managed with `pnpm` workspaces and `turbo`
- Single Next.js app at `apps/web`
- Shared TypeScript types at `packages/shared`
- SQLite database via Prisma ORM; external One Piece TCG catalog via `TCGDB_URL` (raw SQL)
- NextAuth.js v5 with credentials provider

## Conventions

- Use TypeScript for all new code
- UI follows a dark terminal/developer aesthetic
- Prefer monospace fonts (`font-mono`) for UI text
- Use `cn()` utility from `lib/utils.ts` for class merging
- Use Prisma client from `lib/prisma.ts`
- API routes should check session with `auth()` from `@/auth`
- Use `useLanguage()` from `lib/i18n/provider` for all user-facing copy. Add new keys to `lib/i18n/dictionary.ts` with both `en` and `th` translations.

## Database

Schema location: `apps/web/prisma/schema.prisma`

Models:
- `User` / `Account` / `Session` / `VerificationToken` (NextAuth)
- `Card` - trading cards with `cardType`, `game`, and `status` fields
- `Transaction` - buy/sell records, grading costs use `isGradingCost: true`
- `CardInventory` - computed inventory & average cost per card
- `GradingRecord` - tracks cards sent for grading

Card categories:
- `cardType`: Single, Bundle, PSA10, PSA9, Sealed Product
- `game`: Pokemon, OnePiece, Lorcana, ETC

Card status:
- `in_stock`
- `grading`
- `sold_out`

After schema changes:
```bash
pnpm db:generate
pnpm db:migrate
```

## UI Components

Custom shadcn/ui-style components live in `apps/web/components/ui/`:
- `Button`, `Card`, `Input`, `Select`, `Badge`

Use `lucide-react` for icons.
- Use `framer-motion` for smooth page/card animations.
- Page transitions are wrapped in `PageTransition` (scroll-to-top + fade/slide animation).
- Navigation: top navbar shows the current page title; mobile uses a fixed bottom icon menu.
- Desktop has a thin fixed bottom social bar (`components/layout/social-bar.tsx`) for social media links.

## Environment

Local dev uses SQLite. Ensure `apps/web/.env.local` exists with `DATABASE_URL`, `NEXTAUTH_URL`, and `NEXTAUTH_SECRET`. Add `TCGDB_URL` to enable the `/cards` catalog browser. Social login uses Firebase Auth and is controlled by `NEXT_PUBLIC_ENABLE_SOCIAL_LOGIN`. Add `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID` for the client, and `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` (or `GOOGLE_APPLICATION_CREDENTIALS`) for server-side token verification. Linked provider info is stored in the `Account` table. Ads can be enabled with `NEXT_PUBLIC_ADS_ENABLED`; see `docs/ads.md` for placement recommendations.

## Pages

- `/dashboard` - Summary stats, game/type breakdown, recent transactions
- `/inventory` - Main card browser with search & filters
- `/cards` - Browse the external One Piece TCG catalog and add cards to inventory
- `/grading` - Track and manage cards being graded
- `/grading/send` - Send a card to grading
- `/transactions` - Add cards and record buy/sell transactions
- `/reports` - Monthly profit/ROI reports and Excel export
