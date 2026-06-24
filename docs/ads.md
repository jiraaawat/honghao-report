# Ad Placement Design

This document lists recommended ad slots for `honghao-report`. All slots are gated behind `NEXT_PUBLIC_ADS_ENABLED="true"` and rendered by `components/ads/ad-slot.tsx`.

## Available formats

| Format     | Typical size | Use case                         |
| ---------- | ------------ | -------------------------------- |
| `banner`   | 728x90       | Top/bottom of content areas      |
| `leaderboard` | 728x90    | Hero slot below page header      |
| `card`     | 300x250      | Inside grids, sidebars           |
| `sidebar`  | 300x600      | Right-hand rail on desktop       |
| `inline`   | 320x50/468x60 | Between list rows or table rows  |

## Recommended placements

### 1. Dashboard
- **Leaderboard** below the date-range card and above the stat grid (`dashboard` page).
- **Card** inside the game/type breakdown area, or a **sidebar** if we later add a right rail.

### 2. Inventory
- **Leaderboard** below the stat cards and above the filter card.
- **Inline** between grid/list rows every N items (e.g., every 12 cards in grid view, every 8 rows in list view).
- **Card** as a fake inventory card in grid view when count is low.

### 3. Cards catalog (`/cards`)
- **Banner** below the search/filter bar.
- **Card** inserted into the catalog grid every N items (e.g., every 12 cards).

### 4. Reports
- **Leaderboard** between summary cards and charts.
- **Banner** between charts and the monthly-breakdown table.
- **Inline** inside the mobile transaction list every N rows.

### 5. Transactions / Grading
- **Banner** below page header.
- **Inline** between mobile list rows.

### 6. Auth pages (`/auth/signin`, `/auth/register`)
- Avoid ads on auth pages — poor UX and low RPM.

## Implementation example

```tsx
import { AdSlot } from '@/components/ads/ad-slot'

<AdSlot format="leaderboard" label="sponsor" />
```

## Notes
- Keep the first ad slot below the fold on mobile to avoid CLS and maintain app feel.
- Do not place ads over interactive controls or fixed nav/bottom bars.
- For production, replace the placeholder markup inside `AdSlot` with the actual ad network script (e.g., Google AdSense).
