# Finance Dashboard Backend

A production-grade REST API for finance data processing and access control, built with **Node.js**, **Express**, and **PostgreSQL**.

---

## Tech Stack

| Layer        | Choice                          |
|--------------|---------------------------------|
| Runtime      | Node.js 18+                     |
| Framework    | Express 4                       |
| Database     | PostgreSQL 14+                  |
| Auth         | JWT (jsonwebtoken) + bcryptjs   |
| Validation   | express-validator               |
| Security     | helmet, cors, express-rate-limit|

---

## Project Structure

```
finance-dashboard/
├── src/
│   ├── app.js                        # Entry point, middleware, route wiring
│   ├── config/
│   │   └── database.js               # pg Pool setup
│   ├── middleware/
│   │   ├── auth.js                   # JWT authentication
│   │   ├── rbac.js                   # Role-based access control
│   │   └── validate.js               # express-validator error formatter
│   ├── validators/
│   │   ├── auth.validators.js
│   │   ├── transaction.validators.js
│   │   └── user.validators.js
│   ├── services/                     # Business logic layer
│   │   ├── auth.service.js
│   │   ├── user.service.js
│   │   ├── transaction.service.js
│   │   └── dashboard.service.js
│   ├── controllers/                  # HTTP handlers (thin layer)
│   │   ├── auth.controller.js
│   │   ├── user.controller.js
│   │   ├── transaction.controller.js
│   │   └── dashboard.controller.js
│   └── routes/
│       ├── auth.routes.js
│       ├── user.routes.js
│       ├── transaction.routes.js
│       └── dashboard.routes.js
├── migrations/
│   ├── schema.sql                    # Full DB schema (idempotent)
│   └── migrate.js                   # Migration runner
├── seeds/
│   └── seed.js                      # Demo data seeder
├── tests/
│   └── test.sh                      # Full curl-based e2e test suite
├── .env.example
└── package.json
```

---

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+ running locally
- `jq` + `curl` (for running tests)

### 1. Clone & install
```bash
git clone <repo>
cd finance-dashboard
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env with your DB credentials
```

### 3. Create the database
```bash
psql -U postgres -c "CREATE DATABASE finance_dashboard;"
```

### 4. Run migrations + seed
```bash
npm run migrate   # Applies schema.sql
npm run seed      # Inserts demo users + 86 transactions
```

### 5. Start the server
```bash
npm start        # Production
npm run dev      # Development (nodemon)
```

### 6. Run tests
```bash
chmod +x tests/test.sh
./tests/test.sh
```

---

## Seed Credentials

| Role     | Email                | Password      |
|----------|----------------------|---------------|
| admin    | admin@finance.dev    | Admin@123     |
| analyst  | alice@finance.dev    | Analyst@123   |
| viewer   | bob@finance.dev      | Viewer@123    |
| analyst  | carol@finance.dev    | Analyst@123   |
| viewer   | dave@finance.dev (inactive) | Viewer@123 |

---

## Role Permission Matrix

| Action                        | viewer | analyst | admin |
|-------------------------------|:------:|:-------:|:-----:|
| Login / view own profile      | ✔      | ✔       | ✔     |
| View transactions             | ✔      | ✔       | ✔     |
| View dashboard / analytics    | ✔      | ✔       | ✔     |
| Create transactions           | ✗      | ✔       | ✔     |
| Update transactions           | ✗      | ✔       | ✔     |
| Delete transactions (soft)    | ✗      | ✗       | ✔     |
| Register new users            | ✗      | ✗       | ✔     |
| List all users                | ✗      | ✗       | ✔     |
| Change user role/status       | ✗      | ✗       | ✔     |
| Delete users                  | ✗      | ✗       | ✔     |

---

## API Reference

### Base URL
```
http://localhost:3000/api
```

All protected endpoints require:
```
Authorization: Bearer <token>
```

---

### Auth

| Method | Endpoint            | Auth   | Description              |
|--------|---------------------|--------|--------------------------|
| POST   | /auth/login         | None   | Login, returns JWT       |
| POST   | /auth/register      | Admin  | Create a new user        |
| GET    | /auth/me            | Any    | Get own profile          |

**POST /auth/login**
```json
{ "email": "admin@finance.dev", "password": "Admin@123" }
```
Response:
```json
{
  "success": true,
  "data": {
    "user": { "id": "...", "name": "Admin User", "role": "admin" },
    "token": "<jwt>"
  }
}
```

---

### Users

| Method | Endpoint       | Auth          | Description              |
|--------|----------------|---------------|--------------------------|
| GET    | /users         | Admin         | List all users           |
| GET    | /users/:id     | Admin or Self | Get user by ID           |
| PATCH  | /users/:id     | Admin or Self | Update user              |
| DELETE | /users/:id     | Admin         | Hard-delete user         |

**PATCH /users/:id** — Admin fields: `role`, `status`. Self fields: `name`, `password`.

---

### Transactions

| Method | Endpoint            | Auth             | Description              |
|--------|---------------------|------------------|--------------------------|
| POST   | /transactions       | Admin, Analyst   | Create transaction       |
| GET    | /transactions       | All              | List (paginated+filtered)|
| GET    | /transactions/:id   | All              | Get by ID                |
| PATCH  | /transactions/:id   | Admin, Analyst   | Partial update           |
| DELETE | /transactions/:id   | Admin            | Soft delete              |

**POST /transactions**
```json
{
  "amount": 50000,
  "type": "income",
  "category": "Consulting",
  "date": "2024-06-15",
  "notes": "Optional description"
}
```

**GET /transactions** — Query params:

| Param       | Type   | Description                         |
|-------------|--------|-------------------------------------|
| type        | string | income or expense                   |
| category    | string | partial match (ILIKE)               |
| start_date  | date   | YYYY-MM-DD                          |
| end_date    | date   | YYYY-MM-DD                          |
| page        | int    | default 1                           |
| limit       | int    | default 20, max 100                 |
| sort        | string | date (default), amount, created_at  |
| order       | string | asc or desc (default)               |

---

### Dashboard

| Method | Endpoint                      | Auth | Description                         |
|--------|-------------------------------|------|-------------------------------------|
| GET    | /dashboard                    | All  | Full combined payload               |
| GET    | /dashboard/summary            | All  | Income / expenses / net balance     |
| GET    | /dashboard/categories         | All  | Category-wise totals                |
| GET    | /dashboard/trends/monthly     | All  | Monthly income vs expenses          |
| GET    | /dashboard/trends/weekly      | All  | Weekly income vs expenses           |
| GET    | /dashboard/recent             | All  | Recent transactions (max 50)        |

**GET /dashboard/summary** response:
```json
{
  "success": true,
  "data": {
    "total_income": "420000.00",
    "total_expenses": "165000.00",
    "net_balance": "255000.00",
    "total_transactions": "86",
    "income_count": "34",
    "expense_count": "52"
  }
}
```

**GET /dashboard/trends/monthly?months=6** response:
```json
{
  "success": true,
  "data": [
    { "month": "2024-01", "income": "120000.00", "expenses": "45000.00", "net": "75000.00" },
    ...
  ]
}
```

Optional filters for `/dashboard` and `/dashboard/summary`:
- `start_date=YYYY-MM-DD`
- `end_date=YYYY-MM-DD`

---

## Error Response Format

All errors follow a consistent shape:

```json
{
  "success": false,
  "message": "Human-readable error message."
}
```

Validation errors (HTTP 422) include field-level details:
```json
{
  "success": false,
  "message": "Validation failed.",
  "errors": [
    { "field": "amount", "message": "Amount must be a positive number." },
    { "field": "date",   "message": "Date must be a valid ISO 8601 date." }
  ]
}
```

### HTTP Status Codes

| Code | Meaning                              |
|------|--------------------------------------|
| 200  | OK                                   |
| 201  | Created                              |
| 400  | Bad request (business rule violation)|
| 401  | Unauthenticated                      |
| 403  | Forbidden (wrong role)               |
| 404  | Not found                            |
| 409  | Conflict (duplicate)                 |
| 422  | Validation error                     |
| 429  | Rate limit exceeded                  |
| 500  | Internal server error                |

---

## Design Decisions & Assumptions

### Soft Delete
Transactions use `deleted_at` (soft delete) to preserve audit history. Hard-deleted records are excluded from all queries via `WHERE deleted_at IS NULL`. Users are hard-deleted since transactions reference them by FK.

### Parameterized Queries
All database queries use `pg` parameterized queries (`$1, $2, ...`) to prevent SQL injection. No ORM is used — SQL is explicit and readable.

### JWT Stateless Auth
Tokens are stateless JWTs. User status is checked on every request by fetching from DB, so deactivated users are blocked immediately without token blacklisting.

### Pagination
All list endpoints support `page` + `limit` pagination, returning `total`, `totalPages`, and the data array in the response envelope.

### Role Hierarchy
Roles are enforced at the route middleware level using two helpers:
- `authorize(...roles)` — exact role match
- `authorizeMinRole(minRole)` — role hierarchy (admin > analyst > viewer)

### Separation of Concerns
- **Routes** — declare HTTP method + path + middleware chain
- **Controllers** — parse request, call service, send response
- **Services** — all business logic and DB interaction
- **Validators** — input rules decoupled from controllers

### Rate Limiting
Default: 100 requests per 15-minute window per IP. Configurable via `.env`.
