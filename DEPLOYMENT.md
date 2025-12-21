# Deployment Guide

This guide covers deploying the Personal Finance Agent project, including the database, backend, and frontend.

## Table of Contents

1. [Overview](#overview)
2. [Database Deployment](#database-deployment)
3. [Backend Deployment](#backend-deployment)
4. [Frontend Deployment](#frontend-deployment)
5. [Docker Deployment (All-in-One)](#docker-deployment-all-in-one)
6. [Environment Variables](#environment-variables)
7. [Post-Deployment Checklist](#post-deployment-checklist)

---

## Overview

The project consists of:
- **Database**: PostgreSQL
- **Backend**: Express.js API (TypeScript) running on port 4000
- **Frontend**: Next.js application

---

## Database Deployment

### Option 1: Managed PostgreSQL Services (Recommended)

#### A. Railway
1. Go to [Railway](https://railway.app)
2. Create a new project → Add PostgreSQL
3. Copy the connection string from the Variables tab
4. Use this in your backend `.env` file

#### B. Supabase
1. Go to [Supabase](https://supabase.com)
2. Create a new project
3. Go to Settings → Database
4. Copy the connection string (format: `postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres`)
5. Use this in your backend `.env` file

#### C. Neon
1. Go to [Neon](https://neon.tech)
2. Create a new project
3. Copy the connection string from the dashboard
4. Use this in your backend `.env` file

#### D. AWS RDS / Google Cloud SQL / Azure Database
- Follow your cloud provider's documentation to create a PostgreSQL instance
- Ensure it's accessible from your backend deployment location
- Use the provided connection string

### Option 2: Self-Hosted PostgreSQL

If deploying on a VPS (DigitalOcean, Linode, AWS EC2, etc.):

```bash
# Install PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Create database and user
sudo -u postgres psql
CREATE DATABASE finance_agent;
CREATE USER finance_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE finance_agent TO finance_user;
\q

# Configure PostgreSQL to accept connections
sudo nano /etc/postgresql/*/main/postgresql.conf
# Set: listen_addresses = '*'

sudo nano /etc/postgresql/*/main/pg_hba.conf
# Add: host all all 0.0.0.0/0 md5

# Restart PostgreSQL
sudo systemctl restart postgresql
```

**Security Note**: For production, restrict access using firewall rules and SSL connections.

---

## Backend Deployment

### Option 1: Railway (Recommended for Simplicity)

1. **Install Railway CLI**:
   ```bash
   npm i -g @railway/cli
   railway login
   ```

2. **Deploy**:
   ```bash
   cd backend
   railway init
   railway up
   ```

3. **Set Environment Variables**:
   ```bash
   railway variables set PGHOST=your_db_host
   railway variables set PGUSER=your_db_user
   railway variables set PGPASSWORD=your_db_password
   railway variables set PGDATABASE=finance_agent
   railway variables set PGPORT=5432
   railway variables set PORT=4000
   ```

4. **Run Migrations**:
   ```bash
   railway run npm run migrate
   ```

### Option 2: Render

1. **Create a new Web Service**:
   - Connect your GitHub repository
   - Root Directory: `backend`
   - Build Command: `npm install && npm run build` (if you add a build script)
   - Start Command: `npm start` (add to package.json)

2. **Add Environment Variables** in Render dashboard:
   ```
   PGHOST=your_db_host
   PGUSER=your_db_user
   PGPASSWORD=your_db_password
   PGDATABASE=finance_agent
   PGPORT=5432
   PORT=4000
   ```

3. **Update package.json** to add build and start scripts:
   ```json
   "scripts": {
     "build": "tsc",
     "start": "node dist/index.js",
     ...
   }
   ```

4. **Run Migrations**: Use Render's shell or add a post-deploy script

### Option 3: Heroku

1. **Install Heroku CLI**:
   ```bash
   brew install heroku/brew/heroku  # macOS
   heroku login
   ```

2. **Create App**:
   ```bash
   cd backend
   heroku create your-app-name
   ```

3. **Add PostgreSQL Add-on**:
   ```bash
   heroku addons:create heroku-postgresql:mini
   ```

4. **Set Environment Variables**:
   ```bash
   heroku config:set PORT=4000
   ```

5. **Deploy**:
   ```bash
   git push heroku main
   ```

6. **Run Migrations**:
   ```bash
   heroku run npm run migrate
   ```

### Option 4: AWS EC2 / DigitalOcean Droplet

1. **SSH into your server**:
   ```bash
   ssh user@your-server-ip
   ```

2. **Install Node.js**:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

3. **Clone and Setup**:
   ```bash
   git clone your-repo-url
   cd personal-finance-agent/backend
   npm install
   ```

4. **Install PM2** (process manager):
   ```bash
   sudo npm install -g pm2
   ```

5. **Create .env file**:
   ```bash
   nano .env
   # Add your environment variables
   ```

6. **Build and Start**:
   ```bash
   npm run build  # If you add a build script
   pm2 start dist/index.js --name finance-backend
   pm2 save
   pm2 startup  # To start on server reboot
   ```

7. **Setup Nginx** (reverse proxy):
   ```bash
   sudo apt install nginx
   sudo nano /etc/nginx/sites-available/finance-backend
   ```

   Add:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:4000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

   ```bash
   sudo ln -s /etc/nginx/sites-available/finance-backend /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

### Option 5: Google Cloud Run / AWS Lambda

For serverless deployment, you'll need to:
1. Containerize the backend (see Docker section)
2. Deploy the container to Cloud Run or Lambda
3. Configure environment variables
4. Set up database connection

---

## Frontend Deployment

### Option 1: Vercel (Recommended for Next.js)

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Deploy**:
   ```bash
   cd frontend
   vercel
   ```

3. **Set Environment Variables**:
   ```bash
   vercel env add NEXT_PUBLIC_API_URL
   # Enter your backend URL: https://your-backend.railway.app
   ```

4. **Or use Vercel Dashboard**:
   - Connect your GitHub repo
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Add `NEXT_PUBLIC_API_URL` environment variable

### Option 2: Netlify

1. **Connect GitHub repo** in Netlify dashboard
2. **Build Settings**:
   - Base directory: `frontend`
   - Build command: `npm run build`
   - Publish directory: `.next`

3. **Environment Variables**:
   - Add `NEXT_PUBLIC_API_URL` in Site settings → Environment variables

### Option 3: Render

1. **Create Static Site**:
   - Connect GitHub repo
   - Root Directory: `frontend`
   - Build Command: `npm install && npm run build`
   - Publish Directory: `.next`

2. **Environment Variables**:
   - Add `NEXT_PUBLIC_API_URL`

### Option 4: Self-Hosted (VPS)

1. **Build the application**:
   ```bash
   cd frontend
   npm install
   npm run build
   ```

2. **Install PM2**:
   ```bash
   npm install -g pm2
   ```

3. **Start with PM2**:
   ```bash
   pm2 start npm --name "finance-frontend" -- start
   pm2 save
   ```

4. **Setup Nginx**:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

---

## Docker Deployment (All-in-One)

This option allows you to deploy everything together using Docker Compose.

### 1. Create Dockerfile for Backend

Create `backend/Dockerfile`:
```dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build TypeScript
RUN npm install -g typescript ts-node
RUN tsc

# Expose port
EXPOSE 4000

# Start server
CMD ["node", "dist/index.js"]
```

### 2. Create Dockerfile for Frontend

Create `frontend/Dockerfile`:
```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build Next.js app
RUN npm run build

# Production image
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy built app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./

EXPOSE 3000

CMD ["npm", "start"]
```

### 3. Create docker-compose.yml

Create `docker-compose.yml` in the root:
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: finance_agent
      POSTGRES_USER: finance_user
      POSTGRES_PASSWORD: ${DB_PASSWORD:-changeme}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U finance_user"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "4000:4000"
    environment:
      PGHOST: postgres
      PGUSER: finance_user
      PGPASSWORD: ${DB_PASSWORD:-changeme}
      PGDATABASE: finance_agent
      PGPORT: 5432
      PORT: 4000
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - ./backend:/app
      - /app/node_modules

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:4000
    depends_on:
      - backend

volumes:
  postgres_data:
```

### 4. Create .dockerignore files

`backend/.dockerignore`:
```
node_modules
.env
*.log
dist
```

`frontend/.dockerignore`:
```
node_modules
.env
.next
*.log
```

### 5. Deploy with Docker Compose

```bash
# Build and start all services
docker-compose up -d

# Run migrations
docker-compose exec backend npm run migrate

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### 6. Deploy to Production (Docker)

For production deployment on a VPS:

```bash
# On your server
git clone your-repo
cd personal-finance-agent

# Create .env file with production values
nano .env

# Start services
docker-compose -f docker-compose.yml up -d

# Run migrations
docker-compose exec backend npm run migrate
```

---

## Environment Variables

### Backend (.env)

```env
# Database
PGHOST=your_postgres_host
PGUSER=your_postgres_user
PGPASSWORD=your_postgres_password
PGDATABASE=finance_agent
PGPORT=5432

# Server
PORT=4000

# Optional: Google ADK (if using)
GOOGLE_ADK_API_KEY=your_api_key
```

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=https://your-backend-url.com
```

**Note**: For Next.js, environment variables prefixed with `NEXT_PUBLIC_` are exposed to the browser.

---

## Post-Deployment Checklist

### Database
- [ ] Database is accessible from backend
- [ ] Migrations have been run successfully
- [ ] Database backups are configured
- [ ] SSL connection is enabled (for production)

### Backend
- [ ] Backend is accessible at the expected URL
- [ ] Health check endpoint (`/health`) returns 200
- [ ] CORS is configured correctly for frontend domain
- [ ] Environment variables are set correctly
- [ ] Logs are being monitored

### Frontend
- [ ] Frontend is accessible
- [ ] `NEXT_PUBLIC_API_URL` points to backend
- [ ] API calls from frontend are working
- [ ] No CORS errors in browser console

### Security
- [ ] Database credentials are secure (not in code)
- [ ] HTTPS is enabled (use Let's Encrypt for free SSL)
- [ ] API endpoints are protected if needed
- [ ] Rate limiting is configured (optional but recommended)

### Monitoring
- [ ] Set up error tracking (Sentry, LogRocket, etc.)
- [ ] Set up uptime monitoring (UptimeRobot, Pingdom, etc.)
- [ ] Configure logging aggregation

---

## Quick Start: Railway (Easiest Option)

### Database
1. Create Railway account → New Project → Add PostgreSQL
2. Copy connection string

### Backend
1. In Railway, Add Service → GitHub Repo → Select `backend` folder
2. Add environment variables (from PostgreSQL service)
3. Deploy
4. Run migrations: `railway run npm run migrate`

### Frontend
1. Deploy to Vercel
2. Set `NEXT_PUBLIC_API_URL` to your Railway backend URL

---

## Troubleshooting

### Backend can't connect to database
- Check firewall rules allow connections
- Verify credentials are correct
- Ensure database is accessible from backend's network

### Frontend can't reach backend
- Check CORS settings in backend
- Verify `NEXT_PUBLIC_API_URL` is correct
- Check browser console for errors

### Migration errors
- Ensure database exists
- Check user has proper permissions
- Verify connection string format

---

## Additional Resources

- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Express.js Production Best Practices](https://expressjs.com/en/advanced/best-practice-production.html)
- [PostgreSQL Production Checklist](https://wiki.postgresql.org/wiki/Production_Checklist)

---

**Need Help?** Check the project's README files or open an issue on GitHub.

