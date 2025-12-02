# Backend Setup Guide

## Autonomous Personal Finance Agent - Backend

This guide will walk you through setting up and running the backend server.

---

## 📁 Project Structure

```
backend/
├── src/
│   ├── index.ts                      # Express app entry point
│   ├── routes/
│   │   └── transactions.ts           # Transaction routes
│   ├── services/
│   │   ├── categorizationService.ts  # Rule-based categorization
│   │   └── summaryService.ts         # Summary generation
│   ├── db/
│   │   └── prisma.ts                 # Prisma client instance
│   └── types/
│       └── transaction.ts            # TypeScript types
├── prisma/
│   └── schema.prisma                 # Database schema
├── package.json
├── tsconfig.json
└── .env.example
```

---

## 🚀 Getting Started

### 1. Install Dependencies

```bash
cd backend
npm install
```

This will install:
- **Express**: Web framework
- **Prisma**: ORM for database
- **CORS**: Cross-origin resource sharing
- **dotenv**: Environment variable management
- **TypeScript** and type definitions

### 2. Set Up Environment Variables

Create a `.env` file in the `backend` folder:

```bash
cp .env.example .env
```

Or manually create `.env` with:

```env
DATABASE_URL="file:./dev.db"
PORT=3001
```

### 3. Initialize the Database

Generate Prisma client and create the database:

```bash
npm run prisma:generate
npm run prisma:migrate
```

When prompted for a migration name, you can use: `init`

This will:
- Generate the Prisma Client
- Create a SQLite database file (`dev.db`)
- Apply the schema to the database

### 4. Start the Development Server

```bash
npm run dev
```

The server will start on `http://localhost:3001`

You should see:
```
🚀 Server running on http://localhost:3001
📊 Health check: http://localhost:3001/health
💰 Transactions API: http://localhost:3001/api/transactions
```

---

## 🧪 Testing the API

### 1. Health Check

```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-12-02T10:30:00.000Z"
}
```

### 2. Create a Transaction

```bash
curl -X POST http://localhost:3001/api/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123",
    "amount": 450.50,
    "description": "Dinner at Zomato",
    "source": "Credit Card",
    "date": "2024-12-01"
  }'
```

Note: The `category` field is optional. If not provided, it will be auto-categorized based on the description.

Expected response:
```json
{
  "message": "Transaction created successfully",
  "transaction": {
    "id": "uuid-here",
    "userId": "user-123",
    "amount": 450.50,
    "description": "Dinner at Zomato",
    "category": "Food",
    "source": "Credit Card",
    "date": "2024-12-01T00:00:00.000Z",
    "createdAt": "2024-12-02T10:30:00.000Z"
  }
}
```

### 3. Get All Transactions

```bash
curl http://localhost:3001/api/transactions
```

### 4. Get Transactions with Date Range

```bash
curl "http://localhost:3001/api/transactions?from=2024-12-01&to=2024-12-31"
```

### 5. Get Transactions by User

```bash
curl "http://localhost:3001/api/transactions?userId=user-123"
```

### 6. Get a Single Transaction

```bash
curl http://localhost:3001/api/transactions/{transaction-id}
```

### 7. Delete a Transaction

```bash
curl -X DELETE http://localhost:3001/api/transactions/{transaction-id}
```

---

## 📊 Auto-Categorization Rules

The temporary rule-based categorization service uses keywords to assign categories:

| Category | Keywords |
|----------|----------|
| **Food** | swiggy, zomato, restaurant, food, cafe, pizza, burger, dominos, kfc, mcdonald |
| **Transport** | uber, ola, ride, taxi, metro, bus, petrol, fuel |
| **Rent** | rent, landlord, house rent |
| **Bills** | electricity, mobile, wifi, internet, water, gas, phone bill, broadband |
| **Shopping** | amazon, flipkart, myntra, ajio, shopping, mall, store |
| **Entertainment** | netflix, prime, spotify, movie, cinema, theatre, hotstar |
| **Healthcare** | hospital, doctor, medicine, pharmacy, medical, health |
| **Groceries** | grocery, supermarket, market, vegetables, fruits |
| **Other** | Default category if no keywords match |

---

## 📝 Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `npm run dev` | Start development server | Runs with hot-reload |
| `npm run prisma:migrate` | Run database migrations | Creates/updates database schema |
| `npm run prisma:generate` | Generate Prisma client | Updates TypeScript types |

---

## 🗄️ Database Schema

```prisma
model Transaction {
  id          String   @id @default(uuid())
  userId      String
  amount      Float
  description String
  category    String
  source      String
  date        DateTime
  createdAt   DateTime @default(now())
}
```

---

## 🔧 Troubleshooting

### Port Already in Use

If port 3001 is already in use, change it in your `.env` file:

```env
PORT=3002
```

### Database Issues

To reset the database:

```bash
rm prisma/dev.db
npm run prisma:migrate
```

### Prisma Client Not Found

If you see "Cannot find module '@prisma/client'":

```bash
npm run prisma:generate
```

---

## 🚀 Next Steps

1. **Add Authentication**: Implement JWT or OAuth
2. **Add Summary Endpoints**: Expose weekly/monthly summary APIs
3. **Replace Categorization**: Integrate AI-based categorization
4. **Add Validation**: Use Zod or Joi for input validation
5. **Add Tests**: Write unit and integration tests
6. **Add Logging**: Implement Winston or Pino
7. **Database Migration**: Consider PostgreSQL for production

---

## 📚 Additional Resources

- [Express Documentation](https://expressjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

---

**Happy Coding! 🎉**

