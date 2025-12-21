# Free Tier Deployment Guide

This guide focuses on the **best free tier options** for deploying your Personal Finance Agent project. All options listed here have generous free tiers that are perfect for personal projects and small applications.

---

## 🏆 Best Overall Free Tier Stack

**Recommended Combination:**
- **Database**: Supabase or Neon (PostgreSQL)
- **Backend**: Railway or Render
- **Frontend**: Vercel (perfect for Next.js)

This combination gives you:
- ✅ No credit card required (for most)
- ✅ Generous free limits
- ✅ Easy setup
- ✅ Production-ready infrastructure

---

## 📊 Database Options (PostgreSQL)

### 1. **Supabase** ⭐ (Best Overall)

**Free Tier:**
- 500 MB database storage
- 2 GB bandwidth
- Unlimited API requests
- Automatic backups
- SSL included

**Pros:**
- ✅ No credit card required
- ✅ Easy setup with dashboard
- ✅ Built-in connection pooling
- ✅ Real-time features (bonus)
- ✅ Great documentation

**Cons:**
- ⚠️ Database pauses after 1 week of inactivity (wakes on request)

**Setup:**
1. Go to [supabase.com](https://supabase.com)
2. Create account → New Project
3. Wait ~2 minutes for database to provision
4. Go to Settings → Database
5. Copy connection string: `postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres`

**Best for:** Most users - easiest setup, great free tier

---

### 2. **Neon** ⭐ (Best for Serverless)

**Free Tier:**
- 3 GB storage
- Unlimited projects
- Branching (database branching like Git!)
- Auto-suspend after 5 minutes of inactivity (auto-resumes)

**Pros:**
- ✅ No credit card required
- ✅ Modern serverless PostgreSQL
- ✅ Database branching feature
- ✅ More storage than Supabase
- ✅ Fast auto-resume

**Cons:**
- ⚠️ Slight delay on first request after auto-suspend (~1-2 seconds)

**Setup:**
1. Go to [neon.tech](https://neon.tech)
2. Sign up with GitHub
3. Create project
4. Copy connection string from dashboard

**Best for:** Serverless backends, development/testing

---

### 3. **Railway** (Database + Backend)

**Free Tier:**
- $5 credit/month (enough for small projects)
- PostgreSQL add-on available
- Simple pricing

**Pros:**
- ✅ Can deploy database + backend together
- ✅ Easy GitHub integration
- ✅ Good for full-stack deployment

**Cons:**
- ⚠️ Requires credit card (but won't charge if under $5)
- ⚠️ Credit expires monthly

**Best for:** Deploying everything in one place

---

### 4. **ElephantSQL** (Simple Option)

**Free Tier:**
- 20 MB storage (very limited)
- Shared instance

**Pros:**
- ✅ Simple setup
- ✅ No credit card

**Cons:**
- ⚠️ Very limited storage (20 MB)
- ⚠️ Shared resources

**Best for:** Testing only, not production

---

### 5. **Aiven** (Enterprise-Grade)

**Free Tier:**
- 1 month free trial
- $300 credit

**Pros:**
- ✅ Generous trial
- ✅ Enterprise features

**Cons:**
- ⚠️ Requires credit card
- ⚠️ Trial period only

**Best for:** Short-term projects or testing

---

## 🖥️ Backend Options (Node.js/Express)

### 1. **Railway** ⭐ (Best for Full-Stack)

**Free Tier:**
- $5 credit/month
- 500 hours of usage
- 100 GB bandwidth
- Auto-deploy from GitHub

**Pros:**
- ✅ No credit card required initially
- ✅ Deploy database + backend together
- ✅ Easy GitHub integration
- ✅ Built-in metrics
- ✅ Custom domains included

**Cons:**
- ⚠️ Credit expires monthly
- ⚠️ May need credit card for some features

**Setup:**
```bash
npm i -g @railway/cli
railway login
cd backend
railway init
railway up
```

**Best for:** Deploying everything together, simplicity

---

### 2. **Render** ⭐ (Best Free Tier)

**Free Tier:**
- 750 hours/month (enough for 24/7)
- 100 GB bandwidth
- Auto-deploy from GitHub
- SSL included
- Custom domains

**Pros:**
- ✅ No credit card required
- ✅ True free tier (doesn't expire)
- ✅ Auto-sleep after 15 min inactivity (wakes on request)
- ✅ Great for Next.js too
- ✅ Free SSL certificates

**Cons:**
- ⚠️ Cold start delay (~30 seconds after sleep)
- ⚠️ Shared resources on free tier

**Setup:**
1. Connect GitHub repo
2. Select "Web Service"
3. Root Directory: `backend`
4. Build: `npm install && npm run build`
5. Start: `npm start`

**Best for:** Long-term free hosting, production apps

---

### 3. **Fly.io** (Global Edge)

**Free Tier:**
- 3 shared-cpu VMs
- 3 GB persistent volumes
- 160 GB outbound data transfer

**Pros:**
- ✅ No credit card required
- ✅ Global edge deployment
- ✅ Docker-based
- ✅ Fast worldwide

**Cons:**
- ⚠️ More complex setup
- ⚠️ Need to manage Docker

**Best for:** Global apps, Docker users

---

### 4. **Heroku** (Classic, but Limited)

**Free Tier:**
- ❌ **No longer available** (discontinued in 2022)

**Note:** Heroku removed their free tier. Not recommended for new projects.

---

### 5. **Cyclic** (Serverless)

**Free Tier:**
- Unlimited requests
- Auto-scaling
- GitHub integration

**Pros:**
- ✅ True serverless
- ✅ No credit card
- ✅ Auto-scaling

**Cons:**
- ⚠️ Cold starts
- ⚠️ Less control

**Best for:** Serverless architecture

---

## 🎨 Frontend Options (Next.js)

### 1. **Vercel** ⭐ (Best for Next.js)

**Free Tier:**
- Unlimited personal projects
- 100 GB bandwidth/month
- Automatic HTTPS
- Global CDN
- Preview deployments
- Analytics included

**Pros:**
- ✅ Made by Next.js creators
- ✅ Zero configuration
- ✅ Instant deployments
- ✅ No credit card required
- ✅ Best Next.js integration
- ✅ Free custom domains

**Cons:**
- ⚠️ Function execution time limits (10 seconds on free tier)

**Setup:**
```bash
npm i -g vercel
cd frontend
vercel
```

**Best for:** Next.js apps (perfect match!)

---

### 2. **Netlify** ⭐ (Great Alternative)

**Free Tier:**
- 100 GB bandwidth/month
- 300 build minutes/month
- Automatic HTTPS
- Form handling
- Serverless functions

**Pros:**
- ✅ No credit card required
- ✅ Great DX (developer experience)
- ✅ Built-in CI/CD
- ✅ Free SSL

**Cons:**
- ⚠️ Build minutes limited (300/month)

**Best for:** Static sites, JAMstack apps

---

### 3. **Render** (Same as Backend)

**Free Tier:**
- 750 hours/month
- 100 GB bandwidth
- Auto-deploy from GitHub

**Pros:**
- ✅ Can host frontend + backend
- ✅ No credit card
- ✅ Free SSL

**Cons:**
- ⚠️ Cold starts after inactivity

**Best for:** Keeping everything on one platform

---

### 4. **Cloudflare Pages** (Fast & Free)

**Free Tier:**
- Unlimited requests
- Unlimited bandwidth
- Global CDN
- Automatic HTTPS

**Pros:**
- ✅ Truly unlimited
- ✅ Fastest CDN
- ✅ No credit card
- ✅ Great performance

**Cons:**
- ⚠️ Less Next.js-specific features than Vercel

**Best for:** Maximum performance, high traffic

---

## 💰 Cost Comparison

| Service | Database | Backend | Frontend | Credit Card | Best For |
|---------|----------|---------|----------|-------------|----------|
| **Supabase** | ✅ Free | ❌ | ❌ | ❌ No | Database |
| **Neon** | ✅ Free | ❌ | ❌ | ❌ No | Database |
| **Railway** | ✅ $5/mo | ✅ $5/mo | ✅ $5/mo | ⚠️ Maybe | All-in-one |
| **Render** | ❌ | ✅ Free | ✅ Free | ❌ No | Backend + Frontend |
| **Vercel** | ❌ | ❌ | ✅ Free | ❌ No | Frontend |
| **Netlify** | ❌ | ❌ | ✅ Free | ❌ No | Frontend |

---

## 🚀 Recommended Free Tier Stacks

### Stack 1: Maximum Free (No Credit Card) ⭐

```
Database:  Supabase or Neon
Backend:   Render
Frontend:  Vercel
```

**Total Cost:** $0/month  
**Credit Card:** Not required  
**Best for:** Personal projects, learning, small apps

---

### Stack 2: All-in-One (Railway)

```
Database:  Railway PostgreSQL
Backend:   Railway
Frontend:  Railway (or Vercel)
```

**Total Cost:** $0-5/month (usually free)  
**Credit Card:** May be required  
**Best for:** Simplicity, one platform

---

### Stack 3: Performance Optimized

```
Database:  Neon (serverless)
Backend:   Fly.io (edge)
Frontend:  Cloudflare Pages (CDN)
```

**Total Cost:** $0/month  
**Credit Card:** Not required  
**Best for:** Global apps, high performance

---

## 📝 Step-by-Step: Free Tier Deployment

### Option A: Supabase + Render + Vercel (Recommended)

#### 1. Database (Supabase)
```bash
# 1. Go to supabase.com and create account
# 2. Create new project
# 3. Wait for database to provision
# 4. Go to Settings → Database
# 5. Copy connection string
```

#### 2. Backend (Render)
```bash
# 1. Go to render.com
# 2. New → Web Service
# 3. Connect GitHub repo
# 4. Settings:
#    - Root Directory: backend
#    - Build Command: npm install && npm run build
#    - Start Command: npm start
# 5. Add Environment Variables:
#    - PGHOST=your-supabase-host
#    - PGUSER=postgres
#    - PGPASSWORD=your-password
#    - PGDATABASE=postgres
#    - PGPORT=5432
#    - PORT=4000
# 6. Deploy
# 7. Run migrations: Use Render Shell or add post-deploy script
```

#### 3. Frontend (Vercel)
```bash
# 1. Go to vercel.com
# 2. Import GitHub repository
# 3. Root Directory: frontend
# 4. Framework Preset: Next.js
# 5. Add Environment Variable:
#    - NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
# 6. Deploy
```

---

### Option B: Railway (All-in-One)

#### 1. Database + Backend (Railway)
```bash
# 1. Go to railway.app
# 2. New Project → Deploy from GitHub
# 3. Add PostgreSQL service
# 4. Add backend service (from GitHub)
# 5. Connect backend to PostgreSQL
# 6. Set environment variables (auto-configured)
# 7. Deploy
```

#### 2. Frontend (Vercel)
```bash
# Same as Option A, but use Railway backend URL
```

---

## ⚠️ Free Tier Limitations to Watch

### Database
- **Storage limits**: 500 MB (Supabase) to 3 GB (Neon)
- **Connection limits**: Usually 20-100 concurrent connections
- **Backup retention**: 7-30 days typically

### Backend
- **Cold starts**: 15-30 seconds after inactivity (Render, Railway)
- **Execution time**: 10-30 seconds max per request
- **Memory**: 512 MB - 1 GB typically
- **Bandwidth**: 100 GB/month usually

### Frontend
- **Build minutes**: 300-600/month
- **Bandwidth**: 100 GB/month
- **Function execution**: 10 seconds (Vercel)

---

## 🎯 Which Should You Choose?

### Choose **Supabase + Render + Vercel** if:
- ✅ You want maximum free tier
- ✅ No credit card required
- ✅ Best-in-class for each service
- ✅ Don't mind managing 3 services

### Choose **Railway** if:
- ✅ You want simplicity (one platform)
- ✅ Don't mind potential $5/month (usually free)
- ✅ Want database + backend together
- ✅ Prefer fewer services to manage

### Choose **Neon + Fly.io + Cloudflare** if:
- ✅ You need global performance
- ✅ Want serverless architecture
- ✅ Need edge deployment
- ✅ Don't mind more complex setup

---

## 🔄 Migration Between Services

All services use standard PostgreSQL and Node.js, so you can easily migrate:

1. **Database**: Export/import SQL dumps
2. **Backend**: Just change environment variables
3. **Frontend**: Update `NEXT_PUBLIC_API_URL` and redeploy

---

## 📚 Additional Resources

- [Supabase Pricing](https://supabase.com/pricing)
- [Neon Pricing](https://neon.tech/pricing)
- [Railway Pricing](https://railway.app/pricing)
- [Render Pricing](https://render.com/pricing)
- [Vercel Pricing](https://vercel.com/pricing)
- [Netlify Pricing](https://www.netlify.com/pricing/)

---

## ✅ Quick Start Checklist

- [ ] Choose your stack (recommended: Supabase + Render + Vercel)
- [ ] Set up database (Supabase or Neon)
- [ ] Deploy backend (Render or Railway)
- [ ] Run database migrations
- [ ] Deploy frontend (Vercel)
- [ ] Configure environment variables
- [ ] Test all endpoints
- [ ] Set up custom domain (optional)
- [ ] Configure monitoring (optional)

---

**Need help?** Check the main [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed setup instructions.

