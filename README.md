# personal-finance-agent
Autonomous Personal Finance Agent using Google ADK

## 🚀 Deployment

For complete deployment instructions covering database, backend, and frontend, see [DEPLOYMENT.md](./DEPLOYMENT.md).

### Quick Start

**Option 1: Docker Compose (Recommended for local/production)**
```bash
docker-compose up -d
docker-compose exec backend npm run migrate
```

**Option 2: Cloud Deployment**
- **Database**: Railway, Supabase, or Neon (managed PostgreSQL)
- **Backend**: Railway, Render, or Heroku
- **Frontend**: Vercel (recommended for Next.js)

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.
