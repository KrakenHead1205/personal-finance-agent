import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import transactionsRouter from './routes/transactions';
import reportsRouter from './routes/reports';
import smsRouter from './routes/sms';
import analyticsRouter from './routes/analytics';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check route
app.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    database: 'PostgreSQL',
    port: PORT
  });
});

// API Routes
app.use('/transactions', transactionsRouter);
app.use('/reports', reportsRouter);
app.use('/sms', smsRouter);
app.use('/analytics', analyticsRouter);

// Root route
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Autonomous Personal Finance Agent API (PostgreSQL)',
    version: '2.0.0',
    database: 'PostgreSQL with pg library',
    endpoints: {
      health: '/health',
      transactions: '/transactions',
      reports: {
        weekly: 'GET /reports/weekly?weekStart=YYYY-MM-DD&userId=xxx',
        duplicates: 'GET /reports/duplicates?userId=xxx&days=30',
        recurring: 'GET /reports/recurring?userId=xxx&days=90',
      },
      analytics: {
        trends: 'GET /analytics/trends?category=Food&period=3&userId=xxx',
        categoryTrends: 'GET /analytics/category-trends?category=Food&period=3&userId=xxx',
      },
      sms: {
        webhook: 'POST /sms/webhook',
        parse: 'POST /sms/parse',
        test: 'GET /sms/test',
      },
    },
    features: {
      duplicateDetection: 'Automatic duplicate transaction detection',
      recurringTransactions: 'Recurring transaction pattern detection',
      aiInsights: 'AI-powered financial insights using Google Gemini',
    },
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`💰 Transactions API: http://localhost:${PORT}/transactions`);
  console.log(`📈 Reports API: http://localhost:${PORT}/reports`);
  console.log(`📊 Analytics API: http://localhost:${PORT}/analytics`);
  console.log(`📱 SMS Webhook: http://localhost:${PORT}/sms/webhook`);
  console.log(`🗄️  Database: PostgreSQL`);
});

export default app;
