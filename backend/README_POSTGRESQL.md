# Backend Setup Guide (PostgreSQL)

## Autonomous Personal Finance Agent - Backend with PostgreSQL

This backend uses PostgreSQL with the `pg` (node-postgres) library instead of Prisma.

---

## 📁 Project Structure

```
backend/
├── src/
│   ├── index.ts                      # Express app entry point
│   ├── db/
│   │   ├── pool.ts                   # PostgreSQL connection pool
│   │   ├── migrate.ts                # Migration runner script
│   │   └── migrations/
│   │       └── 001_create_transactions.sql
│   ├── routes/
│   │   ├── transactions.ts           # Transaction CRUD routes
│   │   └── reports.ts                # Weekly summary routes
│   ├── services/
│   │   ├── transactionService.ts     # Transaction database operations
│   │   ├── summaryService.ts         # Summary generation logic
│   │   ├── categorizationService.ts  # Rule-based categorization
│   │   └── googleAdkClient.ts        # ADK placeholder
│   └── types/
│       └── transaction.ts            # TypeScript interfaces
├── package.json
├── tsconfig.json
└── .env.example
```

---

## 🚀 Getting Started

### 1. Prerequisites

Install PostgreSQL on your system:

**macOS (Homebrew):**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Windows:**
Download and install from [PostgreSQL official website](https://www.postgresql.org/download/windows/)

### 2. Create Database

```bash
# Access PostgreSQL
psql postgres

# Create database
CREATE DATABASE finance_agent;

# Create user (optional)
CREATE USER finance_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE finance_agent TO finance_user;

# Exit
\q
```

### 3. Install Dependencies

```bash
cd backend
npm install
```

This will install:
- **pg**: PostgreSQL client for Node.js
- **express**: Web framework
- **cors**: Cross-origin resource sharing
- **dotenv**: Environment variable management
- **TypeScript** and type definitions

### 4. Set Up Environment Variables

Create a `.env` file:

```bash
cp .env.example .env
```

Update `.env` with your PostgreSQL credentials:

```env
PGHOST=localhost
PGUSER=postgres
PGPASSWORD=your_password_here
PGDATABASE=finance_agent
PGPORT=5432

PORT=4000
```

### 5. Run Database Migrations

```bash
npm run migrate
```

You should see:

```
🚀 Starting database migrations...

Found 1 migration file(s):

📄 Running migration: 001_create_transactions.sql
✅ Successfully executed: 001_create_transactions.sql

🎉 All migrations completed successfully!
```

### 6. Start the Development Server

```bash
npm run dev
```

The server will start on `http://localhost:4000`

---

## 🧪 Testing the API

### 1. Health Check

```bash
curl http://localhost:4000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-12-02T10:30:00.000Z",
  "database": "PostgreSQL",
  "port": 4000
}
```

### 2. Create a Transaction

```bash
curl -X POST http://localhost:4000/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user-123",
    "amount": 450.50,
    "description": "Dinner at Zomato",
    "source": "Credit Card",
    "date": "2024-12-01"
  }'
```

### 3. Get Transactions

```bash
curl "http://localhost:4000/transactions?from=2024-12-01&to=2024-12-31"
```

### 4. Get Weekly Report

```bash
curl "http://localhost:4000/reports/weekly?weekStart=2024-12-01"
```

---

## 📊 Database Schema

```sql
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    source TEXT NOT NULL,
    date TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_category ON transactions(category);
```

---

## 📝 Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `npm run dev` | Start development server | Runs with hot-reload |
| `npm run migrate` | Run database migrations | Creates/updates database schema |
| `npm test` | Run tests | Executes Jest test suite |

---

## 🔄 Migration System

Migrations are SQL files in `src/db/migrations/` that run in alphabetical order.

### Creating a New Migration

1. Create a new file: `002_add_users_table.sql`
2. Write your SQL:
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
```
3. Run: `npm run migrate`

---

## 🗄️ PostgreSQL vs Prisma

**Key Differences:**

| Feature | Prisma | PostgreSQL (pg) |
|---------|--------|-----------------|
| Query Style | ORM (type-safe) | Raw SQL |
| Migrations | Prisma Migrate | SQL files |
| Type Safety | Generated types | Manual types |
| Flexibility | Limited | Full SQL power |
| Learning Curve | Easy | Moderate |

**Why PostgreSQL?**
- ✅ Full control over SQL queries
- ✅ Better performance for complex queries
- ✅ No ORM overhead
- ✅ Industry-standard skill
- ✅ More flexible for custom queries

---

## 🔧 Troubleshooting

### Connection Refused

If you see "Connection refused":
1. Check if PostgreSQL is running: `pg_ctl status`
2. Verify credentials in `.env`
3. Check if database exists: `psql -l`

### Permission Denied

```bash
# Grant permissions
psql finance_agent
GRANT ALL ON ALL TABLES IN SCHEMA public TO your_user;
```

### Port Already in Use

Change `PORT` in `.env` to a different port (e.g., 4001)

---

## 🚀 Production Considerations

1. **Connection Pooling**: Already configured with pg.Pool
2. **Environment Variables**: Never commit `.env` file
3. **Database Backups**: Set up regular backups
4. **SSL**: Enable SSL for production PostgreSQL
5. **Migrations**: Track migrations in version control
6. **Indexes**: Add indexes for frequently queried columns

---

## 📚 Additional Resources

- [node-postgres Documentation](https://node-postgres.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)

---

**Happy Coding! 🎉**

