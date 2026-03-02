# Restaurant POS Backend

Node.js, Express, TypeScript, TypeORM, Supabase PostgreSQL, JWT auth.

## Setup

1. Copy `.env.example` to `.env` and set:
   - `DATABASE_URL`: Supabase PostgreSQL connection string (Settings → Database in Supabase)
   - `JWT_SECRET`: strong secret for JWT signing

2. Install and run migrations:

```bash
npm install
npm run migration:run
```

3. Start dev server:

```bash
npm run dev
```

Server runs at `http://localhost:4000`.

## Scripts

- `npm run dev` – development with nodemon + tsx
- `npm run build` – compile TypeScript to `dist/`
- `npm run start` – run compiled app
- `npm run migration:run` – run pending migrations
- `npm run migration:generate -- src/database/migrations/MigrationName` – generate migration (requires DB connection)
- `npm run lint` / `npm run format` – ESLint and Prettier

## API

- `POST /api/auth/register` – register (body: name, email, password, role, branchId)
- `POST /api/auth/login` – login (body: email, password) → `{ user, token }`
- `GET /api/branches` – list branches
- `GET /api/branches/:id` – get branch
- `POST /api/branches` – create branch (auth)
- `GET /api/products` – list products
- `GET /api/products/categories` – list categories
- `GET /api/orders/kitchen/:branchId` – kitchen orders (auth)
- `POST /api/orders` – place order (auth, body: items, subtotal, tax, discount, grandTotal, orderType, paymentMethod)

Protected routes use header: `Authorization: Bearer <token>`.
