# honghao-report — Quick Manual

## 1. Sign up / Sign in

- Open `/auth/register` to create an account with email and password.
- Or use the login form at `/auth/signin`.
- Once authenticated you are redirected to `/dashboard`.

## 2. Add cards to your inventory

- Go to **Inventory** (`/inventory`).
- Click **add card**.
- Choose an existing card or create a new one with name, set code, card number, rarity, card type, game, condition, quantity and cost per unit.
- You can also browse the One Piece TCG catalog at **Cards** (`/cards`) and add cards directly from there.

## 3. Record transactions

- Go to **Transactions** (`/transactions`).
- Use **BUY** when you purchase cards.
- Use **SELL** when you sell cards — the app calculates profit based on average cost.
- You can edit or delete transactions from the list.

## 4. Track grading

- Go to **Grading** (`/grading`).
- Click **send card to grade** and select an in-stock card.
- Enter quantity, target grade and grading cost.
- When grading completes, mark it as complete so the cards return to inventory with the new status.

## 5. View reports

- Go to **Reports** (`/reports`).
- Filter by year/month.
- See total profit, total buy, total sell and overall ROI.
- View monthly charts and a detailed breakdown table.
- Click **export excel** to download a spreadsheet.

## 6. Reset portfolio (danger zone)

- At the bottom of `/reports` you can reset your entire portfolio.
- You must enter your password and type `RESET` to confirm. This action cannot be undone.
