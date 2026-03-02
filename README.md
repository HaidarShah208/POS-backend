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

## Deploying (e.g. Railway)

The app needs these **environment variables** set in your hosting dashboard (do not commit `.env`):

| Variable        | Required | Description |
|----------------|----------|-------------|
| `DATABASE_URL` | Yes      | PostgreSQL connection string (e.g. from Supabase) |
| `JWT_SECRET`   | Yes      | Secret key for JWT signing |
| `PORT`         | No       | Server port (Railway often sets this automatically) |
| `NODE_ENV`     | No       | `production` in production |
| `JWT_EXPIRES_IN` | No    | e.g. `7d` (default) |

**Railway:** Open your project → select the backend service → **Variables** tab → Add `DATABASE_URL` and `JWT_SECRET`. Redeploy after adding variables.

**Supabase:** Use the connection string from Project Settings → Database (URI, with your password). Use the **Connection pooling** URI if you use Supabase pooler.

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

**Products** (admin only for create/update/delete):
- `GET /api/products` – list products (query: `page`, `limit`, `search`, `categoryId`, `lowStockOnly`; paginated)
- `GET /api/products/:id` – get one product
- `POST /api/products` – create product (admin, body: categoryId, name, price, cost?, sku?, barcode?, image?, description?, status?, modifiers?)
- `PUT /api/products/:id` – update product (admin)
- `PATCH /api/products/:id` – partial update (admin)
- `DELETE /api/products/:id` – delete product (admin)
- Categories: `GET/POST /api/products/categories`, `GET/PATCH/DELETE /api/products/categories/:id`

**Inventory**:
- `GET /api/inventory` – list inventory for current user’s branch (auth; query: `page`, `limit`, `lowStockOnly`)
- `GET /api/inventory/branch/:branchId` – list inventory for a branch (auth)
- `POST /api/inventory/adjust` – adjust stock (admin; body: productId, branchId, type: "add"|"remove", quantity, reason)

**Orders** (status flow: pending → accepted → preparing → ready → completed | cancelled):
- `POST /api/orders` – create order (auth; body: items, orderType, paymentMethod, optional subtotal/tax/discount/grandTotal). Calculates totals, deducts inventory, assigns daily token number. Returns `{ orderId, tokenNumber }`.
- `GET /api/orders` – list orders (auth; query: `page`, `limit`, `branchId`, `status`, `dateFrom`, `dateTo`; paginated).
- `GET /api/orders/:id` – get order by id (auth).
- `PATCH /api/orders/:id/status` – update order status (auth; body: `status`). Valid transitions: pending→accepted|cancelled, accepted→preparing|cancelled, preparing→ready|cancelled, ready→completed|cancelled.
- `GET /api/orders/branch/:branchId` – list by branch (auth).
- `GET /api/orders/kitchen/:branchId` – kitchen orders (auth).
- `PATCH /api/orders/kitchen/status` – update kitchen status (auth; body: orderId, status).

Protected routes use header: `Authorization: Bearer <token>`.
